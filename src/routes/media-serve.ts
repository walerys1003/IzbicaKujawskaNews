/**
 * Publiczne wystawianie zasobow z R2 — /media/:key
 *
 * POWOD ISTNIENIA: warstwa uploadu (A5) zapisuje pliki do R2 i buduje adresy
 * postaci `/media/media/images/uuid-nazwa.jpg`, ale ZADNA trasa ich nie
 * obslugiwala. Kazde wgrane zdjecie zwracalo 404 — redaktor widzialby
 * potwierdzenie zapisu i pusta ramke w artykule.
 *
 * Dlaczego nie wystawic bucketu R2 bezposrednio przez domene publiczna:
 *   • zmiana bucketu uniewaznia kazdy zapisany w bazie adres,
 *   • brak kontroli nad naglowkami (Cache-Control, Content-Disposition),
 *   • brak mozliwosci ukrycia zasobow z artykulow nieopublikowanych,
 *   • adres ujawnia nazwe konta Cloudflare.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../types/env'

const route = new Hono<AppEnv>()

/**
 * Kolejnosc szukania bucketow. Klucz zawiera prefiks (`media/images/...`),
 * ale prefiks nie mowi jednoznacznie o bindingu — zasob moze byc przeniesiony.
 * Sprawdzamy zatem bucket sugerowany przez prefiks, potem pozostale.
 */
/**
 * Nazwy wiazan R2 zadeklarowanych w `Bindings`.
 *
 * Poprzednio lista `KOLEJNOSC` byla zamknieta przez `as never`, a odczyt szedl
 * przez `(c.env as Record<string, unknown>)[nazwa]`. Oba zabiegi razem
 * wylaczaly kontrole nazw wiazan: literowka `R2_PODCAST_AUDIOO` kompilowalaby
 * sie bez sladu, a jej skutkiem byloby ciche pominiecie bucketa w petli —
 * czyli 404 na plikach, ktore w R2 sa. Blad bez komunikatu, w trasie
 * serwujacej wszystkie zdjecia i wideo portalu.
 *
 * `Extract<..., 'R2_${string}'>` bierze nazwy wprost z `Bindings`, wiec
 * literowka jest teraz bledem kompilacji, a `satisfies` pilnuje tego bez
 * poszerzania typu do `string[]`.
 */
type NazwaBucketaMediow = Extract<keyof AppEnv['Bindings'], `R2_${string}`>

const KOLEJNOSC = [
  'R2_ARTICLES_IMAGES',
  'R2_ARTICLES_VIDEOS',
  'R2_PODCAST_AUDIO',
  'R2_USER_UPLOADS',
] as const satisfies readonly NazwaBucketaMediow[]

const bindingDlaPrefiksu = (key: string): readonly NazwaBucketaMediow[] => {
  const najpierw = (b: NazwaBucketaMediow): NazwaBucketaMediow[] => [b, ...KOLEJNOSC.filter((x) => x !== b)]
  if (key.startsWith('media/images/')) return najpierw('R2_ARTICLES_IMAGES')
  if (key.startsWith('media/videos/')) return najpierw('R2_ARTICLES_VIDEOS')
  if (key.startsWith('media/audio/')) return najpierw('R2_PODCAST_AUDIO')
  return KOLEJNOSC
}

interface R2ObjectLike {
  body: ReadableStream | null
  size: number
  etag: string
  httpEtag: string
  uploaded: Date
  httpMetadata?: { contentType?: string; cacheControl?: string }
  customMetadata?: Record<string, string>
  writeHttpMetadata?: (headers: Headers) => void
  arrayBuffer: () => Promise<ArrayBuffer>
}

interface R2BucketRuntime {
  get: (key: string, options?: unknown) => Promise<R2ObjectLike | null>
  head: (key: string) => Promise<R2ObjectLike | null>
}

const MIME_PO_ROZSZERZENIU: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  pdf: 'application/pdf',
}

const zgadnijMime = (key: string) => {
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  return MIME_PO_ROZSZERZENIU[ext] ?? 'application/octet-stream'
}

/**
 * Parsowanie naglowka Range. Bez obslugi zakresow przegladarka nie potrafi
 * przewijac wideo ani odtwarzac podcastu od wybranego miejsca — pobiera caly
 * plik za kazdym razem, co przy nagraniu sesji rady (900 MB) jest niemozliwe.
 */
const parseRange = (header: string, size: number): { start: number; end: number } | null => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null
  const [, rawStart, rawEnd] = match
  if (rawStart === '' && rawEnd === '') return null
  if (rawStart === '') {
    // suffix range: ostatnie N bajtow
    const length = Number.parseInt(rawEnd, 10)
    if (!Number.isFinite(length) || length <= 0) return null
    return { start: Math.max(0, size - length), end: size - 1 }
  }
  const start = Number.parseInt(rawStart, 10)
  const end = rawEnd === '' ? size - 1 : Number.parseInt(rawEnd, 10)
  if (!Number.isFinite(start) || start < 0 || start >= size) return null
  return { start, end: Math.min(end, size - 1) }
}

route.get('/media/*', async (c) => {
  // `c.req.path` daje '/media/media/images/uuid-plik.jpg'; klucz to reszta.
  const raw = c.req.path.replace(/^\/media\//, '')
  let key: string
  try {
    key = decodeURIComponent(raw)
  } catch {
    return c.text('Nieprawidłowy adres zasobu.', 400)
  }

  // Przejscie w gore drzewa katalogow jest w R2 nieszkodliwe (klucze sa
  // plaskie), ale odrzucamy je, zeby nie tworzyc mylacych wpisow w logach.
  if (!key || key.includes('..')) return c.text('Nieprawidłowy klucz zasobu.', 400)

  const range = c.req.header('range')
  const ifNoneMatch = c.req.header('if-none-match')

  for (const bindingName of bindingDlaPrefiksu(key)) {
    const bucket = c.env[bindingName] as R2BucketRuntime | undefined
    if (!bucket || typeof bucket.get !== 'function') continue

    // ETag sprawdzany przez head() przed pobraniem ciala — przy trafieniu
    // w pamieci przegladarki oszczedza caly transfer.
    if (ifNoneMatch) {
      const meta = await bucket.head(key).catch(() => null)
      if (meta && (meta.httpEtag === ifNoneMatch || meta.etag === ifNoneMatch.replace(/"/g, ''))) {
        return new Response(null, {
          status: 304,
          headers: { etag: meta.httpEtag, 'cache-control': 'public, max-age=31536000, immutable' },
        })
      }
    }

    let object: R2ObjectLike | null = null
    if (range) {
      const meta = await bucket.head(key).catch(() => null)
      if (!meta) continue
      const parsed = parseRange(range, meta.size)
      if (!parsed) {
        return new Response(null, {
          status: 416,
          headers: { 'content-range': `bytes */${meta.size}`, 'accept-ranges': 'bytes' },
        })
      }
      object = await bucket
        .get(key, { range: { offset: parsed.start, length: parsed.end - parsed.start + 1 } })
        .catch(() => null)
      if (!object?.body) continue

      const contentType = object.httpMetadata?.contentType ?? zgadnijMime(key)
      return new Response(object.body, {
        status: 206,
        headers: {
          'content-type': contentType,
          'content-length': String(parsed.end - parsed.start + 1),
          'content-range': `bytes ${parsed.start}-${parsed.end}/${meta.size}`,
          'accept-ranges': 'bytes',
          etag: object.httpEtag,
          'cache-control': 'public, max-age=31536000, immutable',
          'x-content-type-options': 'nosniff',
        },
      })
    }

    object = await bucket.get(key).catch(() => null)
    if (!object?.body) continue

    const contentType = object.httpMetadata?.contentType ?? zgadnijMime(key)

    const headers = new Headers({
      'content-type': contentType,
      'content-length': String(object.size),
      etag: object.httpEtag,
      // Klucz zawiera UUID, wiec tresc pod danym adresem nigdy sie nie zmienia.
      // Stad immutable i rok — kazde inne ustawienie tylko obciaza serwer.
      'cache-control': 'public, max-age=31536000, immutable',
      'accept-ranges': 'bytes',
      // Bez nosniff przegladarka moze potraktowac plik jako HTML i wykonac
      // zawarty w nim skrypt — z naszej domeny, czyli z dostepem do ciasteczek.
      'x-content-type-options': 'nosniff',
      'x-media-bucket': String(bindingName),
    })

    // SVG i PDF wyswietlane w ramce dokumentu moga wykonac skrypt lub
    // przejac kontekst strony. Wymuszamy pobranie zamiast podgladu.
    if (contentType === 'image/svg+xml' || contentType === 'application/pdf') {
      const nazwa = key.split('/').pop() ?? 'plik'
      headers.set('content-disposition', `attachment; filename="${nazwa.replace(/[^\w.\-]/g, '_')}"`)
      headers.set('content-security-policy', "default-src 'none'; sandbox")
    }

    return new Response(object.body, { status: 200, headers })
  }

  // Brak zasobu w zadnym bucketcie. Komunikat mowi, co sprawdzic — 404 bez
  // tresci zmusza do zgadywania, czy problem jest w kluczu, czy w konfiguracji.
  const skonfigurowane = KOLEJNOSC.filter((b) => !!c.env[b])
  return c.json(
    {
      error: 'media_not_found',
      key,
      message:
        skonfigurowane.length === 0
          ? 'Żaden bucket R2 nie jest podłączony — sprawdź sekcję r2_buckets w wrangler.jsonc.'
          : 'Nie znaleziono zasobu w podłączonych bucketach.',
      sprawdzoneBuckety: skonfigurowane.map(String),
    },
    404,
  )
})

/** HEAD dla tego samego zasobu — odtwarzacze wideo pytaja o rozmiar przed pobraniem. */
route.on('HEAD', '/media/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ''))
  if (!key || key.includes('..')) return new Response(null, { status: 400 })

  for (const bindingName of bindingDlaPrefiksu(key)) {
    const bucket = c.env[bindingName] as R2BucketRuntime | undefined
    if (!bucket || typeof bucket.head !== 'function') continue
    const meta = await bucket.head(key).catch(() => null)
    if (!meta) continue
    return new Response(null, {
      status: 200,
      headers: {
        'content-type': meta.httpMetadata?.contentType ?? zgadnijMime(key),
        'content-length': String(meta.size),
        etag: meta.httpEtag,
        'accept-ranges': 'bytes',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    })
  }
  return new Response(null, { status: 404 })
})

export default route
