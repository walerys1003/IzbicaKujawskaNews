/**
 * FAZA 1 / A2 — uwierzytelnianie dwuskladnikowe (TOTP, RFC 6238).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANY BLAD — 2FA NIE DZIALALO Z ZADNA APLIKACJA AUTORYZUJACA
 * ══════════════════════════════════════════════════════════════════════════
 * Poprzednia implementacja (password-utils.ts) generowala sekret tak:
 *
 *     export const generateOtpSecret = () => randomToken(20)   // BASE64URL
 *
 * a nastepnie umieszczala go bez zmian w adresie otpauth://
 *
 *     otpauth://totp/izbica24:...?secret=PGBMrnu5S_hmGbfu1_jeIT3w4aM
 *
 * Standard otpauth (Key Uri Format) wymaga, aby parametr `secret` byl
 * zakodowany w BASE32 — alfabet A-Z oraz 2-7. Sekret base64url zawiera
 * male litery, cyfry 0/1/8/9 oraz znaki '-' i '_', ktore w base32 nie
 * istnieja. Google Authenticator, Aegis, 1Password i Authy albo odrzucaly
 * taki kod QR, albo dekodowaly go blednie.
 *
 * Drugi blad byl bardziej podstepny: funkcja `hotp` brala klucz HMAC jako
 *
 *     encoder.encode(secret)     // bajty ZNAKOW tekstu base64url
 *
 * czyli kod ASCII liter zapisu, a nie ODKODOWANE bajty sekretu. Serwer byl
 * wewnetrznie spojny (generowal i sprawdzal tak samo), wiec testy „wlasnym
 * kodem” przechodzily. Ale kazda zewnetrzna aplikacja dekoduje base32 do
 * bajtow i liczy HMAC z bajtow — otrzymywala inne cyfry. Uzytkownik, ktory
 * wlaczylby 2FA, ZOSTALBY ODCIETY OD WLASNEGO KONTA: aplikacja pokazywalaby
 * kody, ktorych serwer nigdy by nie przyjal.
 *
 * Ponizej sekret jest generowany jako bajty losowe i przedstawiany w base32,
 * a HMAC liczony z bajtow odkodowanych — zgodnie z RFC 4648 i RFC 6238.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Kodowanie bajtow do base32 (RFC 4648) bez wypelnienia znakiem '='. */
export const base32Encode = (bytes: Uint8Array): string => {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

/** Dekodowanie base32 do bajtow. Toleruje male litery, spacje i znaki '='. */
export const base32Decode = (input: string): Uint8Array => {
  const clean = String(input || '').toUpperCase().replace(/[=\s-]/g, '')
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) throw new Error(`Nieprawidlowy znak base32: ${char}`)
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(output)
}

/**
 * Nowy sekret 2FA: 20 losowych bajtow (160 bitow — dlugosc zalecana w RFC 4226
 * dla HMAC-SHA1) przedstawionych w base32. Daje 32 znaki alfabetu base32.
 */
export const generateTotpSecret = (): string =>
  base32Encode(crypto.getRandomValues(new Uint8Array(20)))

/** Jednorazowe hasło na podstawie licznika (HOTP, RFC 4226). */
const hotp = async (secretBase32: string, counter: number): Promise<string> => {
  const keyBytes = base32Decode(secretBase32)
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )

  // Licznik jako 8-bajtowa liczba big-endian. Uzywamy obu polowek, aby
  // implementacja pozostala poprawna po roku 2106 (przekroczenie 2^32).
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setUint32(0, Math.floor(counter / 2 ** 32))
  view.setUint32(4, counter % 2 ** 32)

  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer))
  const offset = signature[signature.length - 1] & 0x0f
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff)
  return String(binary % 1_000_000).padStart(6, '0')
}

export const TOTP_STEP_SECONDS = 30

/** Kod obowiazujacy w podanej chwili — przydatny w testach i diagnostyce. */
export const totpAt = (secretBase32: string, atMs = Date.now()) =>
  hotp(secretBase32, Math.floor(atMs / 1000 / TOTP_STEP_SECONDS))

/**
 * Sprawdzenie kodu z tolerancja +-1 okna (domyslnie +-30 s).
 *
 * Porownanie jest stalo-czasowe. Bez tego roznica czasu odpowiedzi przy
 * niezgodnosci na pierwszej cyfrze pozwalalaby odgadywac kod cyfra po cyfrze.
 */
export const verifyTotp = async (secretBase32: string, code: string, window = 1): Promise<boolean> => {
  const candidate = String(code || '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(candidate)) return false

  const current = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS)
  let matched = false
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = await hotp(secretBase32, current + offset)
    let diff = 0
    for (let i = 0; i < 6; i += 1) diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i)
    if (diff === 0) matched = true
  }
  return matched
}

/** Adres otpauth:// do wyswietlenia jako kod QR w panelu. */
export const otpauthUrl = (secretBase32: string, email: string, issuer = 'izbica24.pl') =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
  `?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${TOTP_STEP_SECONDS}`

/**
 * Kody zapasowe — jedyna droga powrotu, gdy uzytkownik straci telefon.
 * Poprzednia implementacja ich nie miala, co oznaczalo trwala utrate konta
 * przy zgubieniu urzadzenia.
 */
export const generateRecoveryCodes = (count = 8): string[] => {
  const codes: string[] = []
  for (let i = 0; i < count; i += 1) {
    const bytes = crypto.getRandomValues(new Uint8Array(5))
    const text = base32Encode(bytes).slice(0, 8)
    codes.push(`${text.slice(0, 4)}-${text.slice(4, 8)}`)
  }
  return codes
}
