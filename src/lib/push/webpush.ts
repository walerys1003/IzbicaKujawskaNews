/**
 * I8 — WARSTWA WYSYŁANIA WEB PUSH (VAPID + aes128gcm)
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CO BYŁO WCZEŚNIEJ I DLACZEGO TO BYŁO GROŹNE
 * ══════════════════════════════════════════════════════════════════════════
 * `src/routes/push/index.ts` miał funkcję `sendMessage`, która:
 *
 *     const delivered = recipients.length
 *     const saved = { ...message, delivered, sentAt: ..., status: 'sent' }
 *
 * czyli liczyła subskrybentów, zapisywała `status: 'sent'` i `delivered: N`
 * — NIE WYKONUJĄC ANI JEDNEGO ŻĄDANIA HTTP. Trasa `/send-test` była jeszcze
 * gorsza: wpisywała `delivered: 1` na sztywno.
 *
 * Skutek nie był „brakiem funkcji”, ale FAŁSZYWYM RAPORTEM: redaktor widział
 * w panelu „dostarczono 12”, podczas gdy dwanaście osób nie dostało nic.
 * Przy powiadomieniu typu `breaking` (ostrzeżenie dla mieszkańców) taki
 * komunikat jest gorszy niż brak powiadomień — bo wyklucza reakcję.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CO ROBI TEN MODUŁ
 * ══════════════════════════════════════════════════════════════════════════
 * Implementuje dwie warstwy wymagane przez przeglądarki:
 *
 *   1. RFC 8292 (VAPID) — podpis ES256 dowodzący, kto wysyła powiadomienie.
 *      Nagłówek `Authorization: vapid t=<JWT>, k=<klucz publiczny>`.
 *   2. RFC 8291 (Message Encryption) + RFC 8188 (aes128gcm) — treść jest
 *      szyfrowana kluczem subskrybenta. Serwer push (Google/Mozilla/Apple)
 *      NIE MOŻE odczytać treści; przekazuje nieprzejrzysty ładunek.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO NIE BIBLIOTEKA `web-push`
 * ══════════════════════════════════════════════════════════════════════════
 * Pakiet `web-push` z npm opiera się na modułach Node (`crypto`, `https`),
 * których w Cloudflare Workers nie ma. Tutaj wszystko idzie przez Web Crypto
 * (`crypto.subtle`), dostępne w Workers i w Node 18+ — ten sam kod działa
 * na produkcji i w testach.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * JAK TO JEST DOWIEDZIONE
 * ══════════════════════════════════════════════════════════════════════════
 * Kryptografii nie da się sprawdzić „na oko” — błędny szyfrogram wygląda
 * identycznie jak poprawny, a przeglądarka po cichu odrzuci powiadomienie.
 * Dlatego funkcje przyjmują opcjonalne `ziarnoTestowe` (efemeryczna para
 * kluczy + sól), co pozwala odtworzyć OFICJALNY WEKTOR TESTOWY z RFC 8291
 * §5 i porównać wszystkie wartości pośrednie (ecdh_secret, PRK_key, IKM,
 * PRK, CEK, NONCE) oraz gotowy ładunek bajt po bajcie.
 * Test: tests/unit/push/webpush.test.ts
 *
 * Bez tego wektora „wysyłka działa” byłoby kolejnym niesprawdzonym „✅”.
 */

// ══════════════════════════════════════════════════════════════════════════
// Kodowanie base64url — bez zależności, bo Buffer nie istnieje w Workers
// ══════════════════════════════════════════════════════════════════════════

export const doBase64Url = (bajty: Uint8Array): string => {
  let binarne = ''
  for (const bajt of bajty) binarne += String.fromCharCode(bajt)
  return btoa(binarne).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export const zBase64Url = (tekst: string): Uint8Array => {
  const znormalizowany = tekst.replace(/-/g, '+').replace(/_/g, '/')
  const dopelniony = znormalizowany + '='.repeat((4 - (znormalizowany.length % 4)) % 4)
  const binarne = atob(dopelniony)
  const bajty = new Uint8Array(binarne.length)
  for (let i = 0; i < binarne.length; i += 1) bajty[i] = binarne.charCodeAt(i)
  return bajty
}

const kodujTekst = (tekst: string) => new TextEncoder().encode(tekst)

const scal = (...czesci: Uint8Array[]): Uint8Array => {
  const dlugosc = czesci.reduce((suma, czesc) => suma + czesc.length, 0)
  const wynik = new Uint8Array(dlugosc)
  let przesuniecie = 0
  for (const czesc of czesci) {
    wynik.set(czesc, przesuniecie)
    przesuniecie += czesc.length
  }
  return wynik
}

// ══════════════════════════════════════════════════════════════════════════
// HKDF (RFC 5869) — rozbite na Extract i Expand
// ══════════════════════════════════════════════════════════════════════════
// Web Crypto ma gotowy `deriveBits` dla HKDF, ale RFC 8291 wymaga dostępu do
// WARTOŚCI POŚREDNIEJ (PRK_key), która jest następnie użyta jako materiał
// wejściowy do drugiego HKDF. Jednoprzebiegowe `deriveBits` tego nie
// udostępnia, dlatego Extract i Expand są tu rozdzielone — dokładnie tak,
// jak w wektorze testowym RFC.

/** HKDF-Extract: PRK = HMAC-SHA256(salt, IKM). */
const hkdfExtract = async (sol: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> => {
  const klucz = await crypto.subtle.importKey('raw', sol as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', klucz, ikm as BufferSource))
}

/**
 * HKDF-Expand dla długości <= 32 bajty (jeden blok).
 * Wszystkie wyprowadzenia w RFC 8291 mieszczą się w jednym bloku (32/16/12),
 * więc pętla po blokach jest zbędna — a jej brak usuwa klasę błędów
 * (nieprawidłowy licznik bloku daje poprawnie wyglądający, zły klucz).
 */
const hkdfExpand = async (prk: Uint8Array, info: Uint8Array, dlugosc: number): Promise<Uint8Array> => {
  if (dlugosc > 32) throw new Error('hkdfExpand: obsługiwana jest tylko długość do 32 bajtów.')
  const klucz = await crypto.subtle.importKey('raw', prk as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const blok = new Uint8Array(await crypto.subtle.sign('HMAC', klucz, scal(info, new Uint8Array([1])) as BufferSource))
  return blok.slice(0, dlugosc)
}

// ══════════════════════════════════════════════════════════════════════════
// Klucze P-256
// ══════════════════════════════════════════════════════════════════════════

const KRZYWA = { name: 'ECDH', namedCurve: 'P-256' } as const

/**
 * Import klucza publicznego w postaci nieskompresowanej (65 bajtów, 0x04 || X || Y).
 * Web Crypto nie przyjmuje 'raw' dla ECDH z `deriveBits` w każdej implementacji,
 * dlatego przechodzimy przez JWK — działa identycznie w Workers i w Node.
 */
const importujKluczPubliczny = async (surowy: Uint8Array): Promise<CryptoKey> => {
  if (surowy.length !== 65 || surowy[0] !== 0x04) {
    throw new Error(`Klucz publiczny P-256 musi mieć 65 bajtów i zaczynać się od 0x04 (otrzymano ${surowy.length}).`)
  }
  return crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: doBase64Url(surowy.slice(1, 33)),
      y: doBase64Url(surowy.slice(33, 65)),
      ext: true,
    },
    KRZYWA,
    true,
    [],
  )
}

const importujKluczPrywatnyEcdh = async (skalar: Uint8Array, publiczny: Uint8Array): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: doBase64Url(skalar),
      x: doBase64Url(publiczny.slice(1, 33)),
      y: doBase64Url(publiczny.slice(33, 65)),
      ext: true,
    },
    KRZYWA,
    false,
    ['deriveBits'],
  )

const eksportujKluczPubliczny = async (klucz: CryptoKey): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.exportKey('raw', klucz))

// ══════════════════════════════════════════════════════════════════════════
// Szyfrowanie ładunku (RFC 8291 + RFC 8188)
// ══════════════════════════════════════════════════════════════════════════

/** Rozmiar rekordu z RFC 8188. 4096 to wartość z wektora testowego RFC 8291. */
const ROZMIAR_REKORDU = 4096

export interface KluczeSubskrybenta {
  /** Klucz publiczny przeglądarki (base64url, 65 bajtów po dekodowaniu). */
  p256dh: string
  /** Sekret uwierzytelniający przeglądarki (base64url, 16 bajtów). */
  auth: string
}

/** Wyłącznie do testów — pozwala odtworzyć wektor RFC. Nigdy nie używać na produkcji. */
export interface ZiarnoTestowe {
  /** Prywatny skalar efemerycznej pary serwera (base64url). */
  kluczPrywatnySerwera: string
  /** Publiczny klucz efemerycznej pary serwera (base64url, 65 bajtów). */
  kluczPublicznySerwera: string
  /** Sól (base64url, 16 bajtów). */
  sol: string
}

export interface WartosciPosrednie {
  ecdhSecret: string
  prkKey: string
  ikm: string
  prk: string
  cek: string
  nonce: string
}

export interface ZaszyfrowanyLadunek {
  /** Gotowe ciało żądania: nagłówek aes128gcm || szyfrogram. */
  cialo: Uint8Array
  /** Wartości pośrednie — wyłącznie do weryfikacji wektorem testowym. */
  posrednie: WartosciPosrednie
}

/**
 * Szyfruje treść powiadomienia zgodnie z RFC 8291.
 *
 * Kolejność kroków jest narzucona przez RFC i KAŻDY z nich ma znaczenie —
 * pomyłka w `key_info` (kolejność kluczy ua/as!) daje poprawnie wyglądający
 * ładunek, który przeglądarka odrzuci bez żadnego komunikatu.
 */
export const zaszyfrujLadunek = async (
  tresc: string,
  klucze: KluczeSubskrybenta,
  ziarno?: ZiarnoTestowe,
): Promise<ZaszyfrowanyLadunek> => {
  const kluczPrzegladarki = zBase64Url(klucze.p256dh)
  const sekretAuth = zBase64Url(klucze.auth)

  // ── 1. Efemeryczna para kluczy serwera ────────────────────────────────
  // Nowa para na KAŻDE powiadomienie — to wymóg RFC 8291 §3.1. Ponowne
  // użycie pary przy tym samym subskrybencie pozwoliłoby powiązać wysyłki.
  let kluczPrywatnySerwera: CryptoKey
  let kluczPublicznySerweraSurowy: Uint8Array

  if (ziarno) {
    kluczPublicznySerweraSurowy = zBase64Url(ziarno.kluczPublicznySerwera)
    kluczPrywatnySerwera = await importujKluczPrywatnyEcdh(
      zBase64Url(ziarno.kluczPrywatnySerwera),
      kluczPublicznySerweraSurowy,
    )
  } else {
    const para = await crypto.subtle.generateKey(KRZYWA, true, ['deriveBits'])
    kluczPrywatnySerwera = para.privateKey
    kluczPublicznySerweraSurowy = await eksportujKluczPubliczny(para.publicKey)
  }

  const sol = ziarno ? zBase64Url(ziarno.sol) : crypto.getRandomValues(new Uint8Array(16))

  // ── 2. Wspólny sekret ECDH ────────────────────────────────────────────
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: await importujKluczPubliczny(kluczPrzegladarki) },
      kluczPrywatnySerwera,
      256,
    ),
  )

  // ── 3. Połączenie kluczy (RFC 8291 §3.3) ──────────────────────────────
  // PRK_key = HKDF-Extract(auth_secret, ecdh_secret)
  const prkKey = await hkdfExtract(sekretAuth, ecdhSecret)

  // key_info = "WebPush: info" || 0x00 || ua_public || as_public
  // KOLEJNOŚĆ: najpierw klucz PRZEGLĄDARKI, potem SERWERA. Odwrotna daje
  // inny IKM i cichą awarię po stronie odbiorcy.
  const keyInfo = scal(
    kodujTekst('WebPush: info'),
    new Uint8Array([0]),
    kluczPrzegladarki,
    kluczPublicznySerweraSurowy,
  )
  const ikm = await hkdfExpand(prkKey, keyInfo, 32)

  // ── 4. Klucz treści i nonce (RFC 8188 §2.2) ───────────────────────────
  const prk = await hkdfExtract(sol, ikm)
  const cek = await hkdfExpand(prk, scal(kodujTekst('Content-Encoding: aes128gcm'), new Uint8Array([0])), 16)
  const nonce = await hkdfExpand(prk, scal(kodujTekst('Content-Encoding: nonce'), new Uint8Array([0])), 12)

  // ── 5. Dopełnienie i szyfrowanie ──────────────────────────────────────
  // Ogranicznik dopełnienia 0x02 oznacza OSTATNI rekord. Wartość 0x01
  // (rekord nieostatni) sprawiłaby, że przeglądarka czeka na kolejny.
  const jawny = scal(kodujTekst(tresc), new Uint8Array([2]))
  const kluczAes = await crypto.subtle.importKey('raw', cek as BufferSource, { name: 'AES-GCM' }, false, ['encrypt'])
  const szyfrogram = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource, tagLength: 128 }, kluczAes, jawny as BufferSource),
  )

  // ── 6. Nagłówek aes128gcm: sól(16) || rs(4 BE) || idlen(1) || klucz(65) ─
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, ROZMIAR_REKORDU, false)
  const naglowek = scal(sol, rs, new Uint8Array([kluczPublicznySerweraSurowy.length]), kluczPublicznySerweraSurowy)

  return {
    cialo: scal(naglowek, szyfrogram),
    posrednie: {
      ecdhSecret: doBase64Url(ecdhSecret),
      prkKey: doBase64Url(prkKey),
      ikm: doBase64Url(ikm),
      prk: doBase64Url(prk),
      cek: doBase64Url(cek),
      nonce: doBase64Url(nonce),
    },
  }
}

// ══════════════════════════════════════════════════════════════════════════
// VAPID (RFC 8292) — podpis ES256
// ══════════════════════════════════════════════════════════════════════════

export interface KluczeVapid {
  /** Klucz publiczny (base64url, 65 bajtów nieskompresowanych). */
  publiczny: string
  /** Klucz prywatny — skalar (base64url, 32 bajty). */
  prywatny: string
  /**
   * Kontakt administratora: `mailto:` lub `https:`. Dostawcy (zwł. Google)
   * używają go, gdy trzeba zgłosić nadużycie; brak bywa powodem odrzucenia.
   */
  kontakt: string
}

/** Czas życia tokenu VAPID. RFC 8292 dopuszcza maksymalnie 24 h. */
const VAPID_TTL_SEKUND = 12 * 60 * 60

export const zbudujNaglowekVapid = async (
  adresEndpointu: string,
  klucze: KluczeVapid,
  terazSekundy = Math.floor(Date.now() / 1000),
): Promise<string> => {
  // `aud` to WYŁĄCZNIE origin endpointu, bez ścieżki. Pełny URL powoduje
  // odrzucenie tokenu przez FCM (401) — a błąd widać dopiero na produkcji.
  const origin = new URL(adresEndpointu).origin

  const naglowek = { typ: 'JWT', alg: 'ES256' }
  const ladunek = { aud: origin, exp: terazSekundy + VAPID_TTL_SEKUND, sub: klucze.kontakt }

  const czescPodpisywana = `${doBase64Url(kodujTekst(JSON.stringify(naglowek)))}.${doBase64Url(kodujTekst(JSON.stringify(ladunek)))}`

  const kluczPubliczny = zBase64Url(klucze.publiczny)
  const kluczDoPodpisu = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: doBase64Url(zBase64Url(klucze.prywatny)),
      x: doBase64Url(kluczPubliczny.slice(1, 33)),
      y: doBase64Url(kluczPubliczny.slice(33, 65)),
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )

  // Web Crypto zwraca podpis ECDSA jako surowe r||s (64 bajty) — dokładnie
  // ten format wymaga JWS. Format DER (z OpenSSL) trzeba by konwertować.
  const podpis = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kluczDoPodpisu, kodujTekst(czescPodpisywana) as BufferSource),
  )

  return `vapid t=${czescPodpisywana}.${doBase64Url(podpis)}, k=${klucze.publiczny}`
}

/** Generuje nową parę VAPID — do jednorazowego użycia przy konfiguracji środowiska. */
export const wygenerujKluczeVapid = async (): Promise<{ publiczny: string; prywatny: string }> => {
  const para = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const publiczny = new Uint8Array(await crypto.subtle.exportKey('raw', para.publicKey))
  const jwk = await crypto.subtle.exportKey('jwk', para.privateKey)
  return { publiczny: doBase64Url(publiczny), prywatny: String(jwk.d) }
}

// ══════════════════════════════════════════════════════════════════════════
// Wysyłka
// ══════════════════════════════════════════════════════════════════════════

export type PowodNiepowodzenia =
  | 'wygasla_subskrypcja'
  | 'odrzucone_uwierzytelnienie'
  | 'zbyt_duzy_ladunek'
  | 'limit_dostawcy'
  | 'blad_dostawcy'
  | 'blad_sieci'
  | 'blad_szyfrowania'

export interface WynikWysylki {
  dostarczone: boolean
  status?: number
  /** `true`, gdy subskrypcja jest trwale nieważna (404/410) i należy ją usunąć. */
  doUsuniecia: boolean
  powod?: PowodNiepowodzenia
  komunikat?: string
}

export interface DaneSubskrypcji {
  endpoint: string
  keys: KluczeSubskrybenta
}

/**
 * Wysyła JEDNO powiadomienie do JEDNEGO subskrybenta.
 *
 * Zwraca wynik zamiast rzucać wyjątkiem, bo wołający wysyła do wielu
 * odbiorców i awaria jednego nie może przerwać pozostałych — ani, co
 * ważniejsze, zostać policzona jako sukces.
 */
export const wyslijPowiadomienie = async (
  subskrypcja: DaneSubskrypcji,
  tresc: string,
  kluczeVapid: KluczeVapid,
  opcje: { ttlSekund?: number; pilnosc?: 'very-low' | 'low' | 'normal' | 'high' } = {},
): Promise<WynikWysylki> => {
  if (!subskrypcja.keys?.p256dh || !subskrypcja.keys?.auth) {
    return {
      dostarczone: false,
      doUsuniecia: true,
      powod: 'blad_szyfrowania',
      komunikat: 'Subskrypcja bez kluczy p256dh/auth — nie da się zaszyfrować treści.',
    }
  }

  let cialo: Uint8Array
  let autoryzacja: string
  try {
    cialo = (await zaszyfrujLadunek(tresc, subskrypcja.keys)).cialo
    autoryzacja = await zbudujNaglowekVapid(subskrypcja.endpoint, kluczeVapid)
  } catch (blad) {
    return {
      dostarczone: false,
      doUsuniecia: false,
      powod: 'blad_szyfrowania',
      komunikat: blad instanceof Error ? blad.message : String(blad),
    }
  }

  // Limit ładunku to 4096 bajtów PO zaszyfrowaniu. Sprawdzamy przed wysyłką,
  // bo dostawca odrzuci żądanie kodem 413 dopiero po transferze.
  if (cialo.length > ROZMIAR_REKORDU) {
    return {
      dostarczone: false,
      doUsuniecia: false,
      powod: 'zbyt_duzy_ladunek',
      komunikat: `Zaszyfrowany ładunek ma ${cialo.length} bajtów, limit to ${ROZMIAR_REKORDU}.`,
    }
  }

  let odpowiedz: Response
  try {
    odpowiedz = await fetch(subskrypcja.endpoint, {
      method: 'POST',
      headers: {
        Authorization: autoryzacja,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: String(opcje.ttlSekund ?? 2419200),
        Urgency: opcje.pilnosc ?? 'normal',
      },
      body: cialo as BodyInit,
    })
  } catch (blad) {
    return {
      dostarczone: false,
      doUsuniecia: false,
      powod: 'blad_sieci',
      komunikat: blad instanceof Error ? blad.message : String(blad),
    }
  }

  // 201 to typowa odpowiedź sukcesu; niektórzy dostawcy zwracają 200 lub 202.
  if (odpowiedz.ok) return { dostarczone: true, status: odpowiedz.status, doUsuniecia: false }

  // 404/410 = subskrypcja trwale nieważna (użytkownik odwołał zgodę lub
  // usunął przeglądarkę). MUSI zostać usunięta, inaczej lista subskrybentów
  // rośnie o martwe wpisy, a każda wysyłka marnuje na nie żądanie.
  if (odpowiedz.status === 404 || odpowiedz.status === 410) {
    return {
      dostarczone: false,
      status: odpowiedz.status,
      doUsuniecia: true,
      powod: 'wygasla_subskrypcja',
      komunikat: 'Subskrypcja nieważna — usuwana z listy.',
    }
  }

  const trescBledu = await odpowiedz.text().catch(() => '')
  const powod: PowodNiepowodzenia =
    odpowiedz.status === 401 || odpowiedz.status === 403
      ? 'odrzucone_uwierzytelnienie'
      : odpowiedz.status === 413
        ? 'zbyt_duzy_ladunek'
        : odpowiedz.status === 429
          ? 'limit_dostawcy'
          : 'blad_dostawcy'

  return {
    dostarczone: false,
    status: odpowiedz.status,
    doUsuniecia: false,
    powod,
    komunikat: trescBledu.slice(0, 300) || `Dostawca odrzucił żądanie (HTTP ${odpowiedz.status}).`,
  }
}

/** Odczyt kluczy VAPID ze środowiska. Zwraca `null`, gdy konfiguracja jest niepełna. */
export const kluczeVapidZeSrodowiska = (env: {
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string
}): KluczeVapid | null => {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null
  return {
    publiczny: env.VAPID_PUBLIC_KEY,
    prywatny: env.VAPID_PRIVATE_KEY,
    kontakt: env.VAPID_SUBJECT || 'mailto:kontakt@izbica24.pl',
  }
}
