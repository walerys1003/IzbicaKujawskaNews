import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../types/env'

const HTML_TYPES = ['text/html', 'application/xhtml+xml']
const TEXT_TYPES = ['application/json', 'application/xml', 'text/plain', 'text/xml']
const IMAGE_EXTENSIONS = /\.(png|jpe?g)$/i

const addAttribute = (tag: string, name: string, value: string) => {
  if (new RegExp(`\\s${name}=`).test(tag)) return tag
  return tag.replace('<img', `<img ${name}="${value}"`)
}

const toPictureMarkup = (tag: string, src: string) => {
  if (!src.startsWith('/static/')) return tag
  if (!IMAGE_EXTENSIONS.test(src)) return tag

  const basePath = src.replace(/\.(png|jpe?g)$/i, '')
  return `<picture class="perf-picture"><source srcset="${basePath}.avif" type="image/avif"><source srcset="${basePath}.webp" type="image/webp">${tag}</picture>`
}

const optimizeImages = (html: string) =>
  html.replace(/<img\b[^>]*src="([^"]+)"[^>]*>/gi, (fullTag: string, src: string) => {
    let tag = addAttribute(fullTag, 'decoding', 'async')
    if (!/\sloading=/.test(tag)) tag = addAttribute(tag, 'loading', 'lazy')
    if (/loading="eager"/.test(tag) && !/\sfetchpriority=/.test(tag)) {
      tag = addAttribute(tag, 'fetchpriority', 'high')
    }
    return toPictureMarkup(tag, src)
  })

const minifyHtml = (html: string) =>
  html
    .replace(/<!--(?!\[if|\s*ko|\s*\/ko)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\n{2,}/g, '\n')
    .trim()

const hashText = (input: string) => {
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

const isTextResponse = (contentType: string) =>
  HTML_TYPES.some((type) => contentType.includes(type)) || TEXT_TYPES.some((type) => contentType.includes(type))

const applyCachePolicy = (
  path: string,
  method: string,
  headers: Headers,
  status: number,
  isPrivate: boolean,
) => {
  if (method !== 'GET') {
    headers.set('Cache-Control', 'no-store')
    return
  }

  // ── FAZA 1 / A3 — dwie reguły, których wcześniej brakowało ────────────
  //
  // 1. Odpowiedź błędna nigdy nie może trafić do cache publicznego.
  //    Wcześniej 401/403/404/503 dostawały `public, max-age=300`, więc
  //    CDN podawał ten sam błąd przez pięć minut także po naprawie
  //    usterki — awaria bazy trwająca sekundę „zamrażała” 503 na 5 minut.
  //
  // 2. Odpowiedź zależna od tożsamości (nagłówek Authorization, ciasteczko
  //    sesji, ustawiane Set-Cookie) nie może być `public`. W przeciwnym
  //    razie CDN mógłby podać profil jednego użytkownika drugiemu.
  if (status >= 400) {
    headers.set('Cache-Control', 'no-store')
    return
  }

  if (isPrivate) {
    headers.set('Cache-Control', 'private, no-store')
    return
  }

  if (path.startsWith('/api/')) {
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    return
  }

  if (path.endsWith('.xml') || path.endsWith('.txt') || path.endsWith('.json')) {
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300')
    return
  }

  headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60')
}

export const responsePerformanceMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const startedAt = Date.now()
  await next()

  const response = c.res
  if (!response) return

  const pathname = new URL(c.req.url).pathname
  const headers = new Headers(response.headers)

  // Odpowiedź uznajemy za zależną od tożsamości, gdy żądanie niosło
  // poświadczenia albo gdy odpowiedź ustawia ciasteczko.
  const isPrivate =
    Boolean(c.req.header('authorization')) ||
    Boolean(c.req.header('cookie')) ||
    headers.has('set-cookie')

  // Vary musi wymieniać nagłówki różnicujące treść, inaczej wspólny cache
  // pomiesza wariant zalogowany z anonimowym.
  headers.set('Vary', 'Accept-Encoding, Authorization, Cookie')
  headers.set('X-Response-Time', `${Date.now() - startedAt}ms`)
  applyCachePolicy(pathname, c.req.method, headers, response.status, isPrivate)

  const contentType = headers.get('content-type') ?? ''
  if (!isTextResponse(contentType)) {
    c.res = new Response(response.body, { status: response.status, headers })
    return
  }

  const sourceText = await response.text()
  const finalText = HTML_TYPES.some((type) => contentType.includes(type))
    ? minifyHtml(optimizeImages(sourceText))
    : sourceText

  headers.set('ETag', `W/"${hashText(finalText)}"`)
  c.res = new Response(finalText, { status: response.status, headers })
}
