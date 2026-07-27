/**
 * FAZA 2 / F-panel — konwersja HTML edytora na bloki treści i z powrotem.
 *
 * PROBLEM
 * ───────
 * Edytor w panelu (TipTap) trzyma treść w ukrytym polu `<textarea name="content">`
 * jako HTML. Baza i widoki portalu operują natomiast na `ValidatedBlock[]` —
 * liście bloków rozróżnianych polem `type`. Do tej pory nie istniało nic, co
 * przekłada jedno na drugie, więc formularz artykułu miał `action="#"`: nie
 * dlatego, że brakowało trasy zapisu, ale dlatego, że nie było czego zapisać.
 *
 * DLACZEGO WŁASNY PARSER, A NIE BIBLIOTEKA
 * ────────────────────────────────────────
 * Kod działa w Cloudflare Workers: nie ma `DOMParser`, nie ma `jsdom`.
 * `HTMLRewriter` istnieje, ale jest strumieniowy i nie da się nim wygodnie
 * zbudować drzewa (a przy okazji działa tylko na `Response`). Dlatego jest tu
 * mały skaner znacznikowy — świadomie ograniczony do tego podzbioru HTML,
 * który faktycznie wychodzi z TipTapa.
 *
 * ZAŁOŻENIE BEZPIECZEŃSTWA
 * ────────────────────────
 * Ten plik NIE sanityzuje. Wynik konwersji przechodzi przez
 * `contentBlocksDraft` (schemat Zod), a sanityzacja siedzi wewnątrz schematu —
 * `articleHtml()` wywołuje `sanitizeHtml(profile: 'article')`. Gdyby parser
 * próbował czyścić samodzielnie, powstałyby dwa miejsca do pilnowania.
 * Dlatego funkcja `htmlToBlocks()` zwraca strukturę SUROWĄ, a jedyną drogą
 * do bazy jest `parseEditorHtml()`, która od razu waliduje.
 *
 * CZEGO PARSER NIE ROBI
 * ─────────────────────
 * Nie obsługuje bloków `gallery`, `file` i `audio` — nie mają one
 * reprezentacji w HTML edytora (galeria to identyfikator z biblioteki mediów,
 * nie znacznik). Wstawia się je przez osobny mechanizm i dlatego
 * `parseEditorHtml()` przyjmuje opcjonalną listę bloków dodatkowych.
 */

import { contentBlocksDraft, type ValidatedBlock } from '../validation/blocks'

// ─────────────────────────────────────────────────────────────────────────────
// Skaner znaczników
// ─────────────────────────────────────────────────────────────────────────────

/** Znaczniki puste — nie mają zamknięcia, więc nie szukamy pary. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

interface RawNode {
  tag: string
  /** Atrybuty w postaci małych liter → wartość. */
  attrs: Record<string, string>
  /** Zawartość wewnętrzna (HTML) — puste dla znaczników pustych. */
  inner: string
}

/**
 * Odczyt atrybutów z treści znacznika otwierającego.
 *
 * Obsługuje `a="b"`, `a='b'`, `a=b` oraz atrybuty bez wartości (`disabled`).
 * Nazwy sprowadzamy do małych liter, bo `SRC` i `src` to ten sam atrybut,
 * a porównanie wielkością liter zgubiłoby adres obrazka wklejonego z Worda.
 */
const parseAttrs = (source: string): Record<string, string> => {
  const attrs: Record<string, string> = {}
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const name = m[1].toLowerCase()
    attrs[name] = m[2] ?? m[3] ?? m[4] ?? ''
  }
  return attrs
}

/**
 * Znajduje pozycję znacznika zamykającego dla `tag`, licząc zagnieżdżenia.
 *
 * Naiwne `indexOf('</ul>')` psuło listy zagnieżdżone: `<ul><li><ul>…</ul></li></ul>`
 * kończyło się na pierwszym `</ul>`, czyli w środku, a resztę dokumentu
 * parser widział jako tekst z resztkami znaczników.
 *
 * @returns pozycja `<` znacznika zamykającego albo -1
 */
const findClose = (html: string, tag: string, from: number): number => {
  const open = new RegExp(`<${tag}(?=[\\s/>])`, 'gi')
  const close = new RegExp(`</${tag}\\s*>`, 'gi')
  let depth = 1
  let cursor = from

  for (;;) {
    open.lastIndex = cursor
    close.lastIndex = cursor
    const nextOpen = open.exec(html)
    const nextClose = close.exec(html)

    if (!nextClose) return -1
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1
      cursor = nextOpen.index + nextOpen[0].length
      continue
    }
    depth -= 1
    if (depth === 0) return nextClose.index
    cursor = nextClose.index + nextClose[0].length
  }
}

/**
 * Rozbija HTML na węzły najwyższego poziomu.
 *
 * Tekst leżący poza znacznikami zwracany jest jako pseudowęzeł o tagu
 * `#text`. Nie pomijamy go: wklejenie treści ze schowka często daje akapit
 * bez `<p>`, a ciche zgubienie pierwszego zdania artykułu byłoby błędem
 * trudnym do zauważenia w panelu.
 */
const scanNodes = (html: string): RawNode[] => {
  const nodes: RawNode[] = []
  let i = 0

  while (i < html.length) {
    const lt = html.indexOf('<', i)

    if (lt === -1) {
      const text = html.slice(i)
      if (text.trim()) nodes.push({ tag: '#text', attrs: {}, inner: text })
      break
    }

    if (lt > i) {
      const text = html.slice(i, lt)
      if (text.trim()) nodes.push({ tag: '#text', attrs: {}, inner: text })
    }

    // Komentarze i deklaracje pomijamy w całości.
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt)
      i = end === -1 ? html.length : end + 3
      continue
    }
    if (html.startsWith('<!', lt)) {
      const end = html.indexOf('>', lt)
      i = end === -1 ? html.length : end + 1
      continue
    }

    const gt = html.indexOf('>', lt)
    if (gt === -1) break

    const rawTag = html.slice(lt + 1, gt)
    // Sierocy znacznik zamykający — ignorujemy, zamiast przerywać parsowanie.
    if (rawTag.startsWith('/')) {
      i = gt + 1
      continue
    }

    const selfClosing = rawTag.endsWith('/')
    const body = selfClosing ? rawTag.slice(0, -1) : rawTag
    const space = body.search(/\s/)
    const tag = (space === -1 ? body : body.slice(0, space)).toLowerCase()
    const attrs = parseAttrs(space === -1 ? '' : body.slice(space))

    if (selfClosing || VOID_TAGS.has(tag)) {
      nodes.push({ tag, attrs, inner: '' })
      i = gt + 1
      continue
    }

    const close = findClose(html, tag, gt + 1)
    if (close === -1) {
      // Brak zamknięcia: traktujemy resztę dokumentu jako zawartość.
      nodes.push({ tag, attrs, inner: html.slice(gt + 1) })
      break
    }
    nodes.push({ tag, attrs, inner: html.slice(gt + 1, close) })
    i = html.indexOf('>', close)
    i = i === -1 ? html.length : i + 1
  }

  return nodes
}

// ─────────────────────────────────────────────────────────────────────────────
// Pomocnicze
// ─────────────────────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  laquo: '«', raquo: '»', bdquo: '„', rdquo: '”', ldquo: '“',
  hellip: '…', ndash: '–', mdash: '—', oacute: 'ó', sup2: '²', sup3: '³',
}

/** Zamiana encji na znaki — dla pól tekstowych (nagłówki, elementy listy). */
const decodeEntities = (text: string): string =>
  text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      const n = Number.parseInt(code.slice(2), 16)
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole
    }
    if (code.startsWith('#')) {
      const n = Number.parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole
    }
    return ENTITIES[code.toLowerCase()] ?? whole
  })

/** Tekst widoczny — bez znaczników, z pojedynczymi odstępami. */
const textOf = (html: string): string =>
  decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()

/** Czy blok HTML zawiera cokolwiek widocznego (poza `&nbsp;` i pustymi `<p>`). */
const hasContent = (html: string): boolean =>
  textOf(html).length > 0 || /<(img|iframe|hr|video|audio)\b/i.test(html)

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Rozpoznanie dostawcy osadzenia po adresie ramki.
 *
 * Zwracamy `null` dla domen nieobsługiwanych — schemat `embedBlock` ma
 * ZAMKNIĘTĄ listę dostawców i sprawdza, czy host do nich należy. Zamiast
 * przepuszczać blok, który schemat odrzuci komunikatem o domenie, wolimy
 * pominąć ramkę i zachować resztę artykułu.
 */
const embedProviderOf = (url: string): 'youtube' | 'spotify' | 'facebook' | 'x' | null => {
  let host: string
  try {
    host = new URL(url, 'https://izbica24.pl').hostname.toLowerCase()
  } catch {
    return null
  }
  if (/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(host)) return 'youtube'
  if (/(^|\.)spotify\.com$/.test(host)) return 'spotify'
  if (/(^|\.)(facebook\.com|fb\.watch)$/.test(host)) return 'facebook'
  if (/(^|\.)(x\.com|twitter\.com)$/.test(host)) return 'x'
  return null
}

/**
 * Adres ramki YouTube z `/embed/ID` przekładamy na postać `watch?v=ID`.
 * TipTap zapisuje `https://www.youtube.com/embed/ID`, a widok portalu
 * buduje ramkę sam z identyfikatora — trzymanie w bazie gotowej ramki
 * odbierałoby możliwość zmiany parametrów prywatności w jednym miejscu.
 */
const normalizeEmbedUrl = (url: string): string => {
  const m = /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,20})/.exec(url)
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : url
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML → bloki
// ─────────────────────────────────────────────────────────────────────────────

/** Blok surowy — przed walidacją schematem. */
type RawBlock = Record<string, unknown> & { type: string }

const listItems = (inner: string): string[] =>
  scanNodes(inner)
    .filter((node) => node.tag === 'li')
    .map((node) => textOf(node.inner))
    .filter((text) => text.length > 0)

/**
 * Cytat. TipTap zawija treść w `<blockquote><p>…</p></blockquote>`, a autora
 * redaktorzy dopisują najczęściej w ostatnim akapicie kursywą albo po
 * półpauzie. Rozpoznajemy oba zapisy, bo pole `author` renderuje się
 * inaczej niż treść i pomyłka byłaby widoczna na stronie.
 */
const quoteFrom = (inner: string): RawBlock => {
  const paragraphs = scanNodes(inner)
    .filter((node) => node.tag === 'p' || node.tag === '#text')
    .map((node) => textOf(node.tag === '#text' ? node.inner : node.inner))
    .filter((text) => text.length > 0)

  const all = paragraphs.length ? paragraphs : [textOf(inner)]
  const cite = scanNodes(inner).find((node) => node.tag === 'cite' || node.tag === 'footer')

  if (cite) {
    const author = textOf(cite.inner)
    const text = all.filter((p) => p !== author).join('\n\n') || all.join('\n\n')
    return { type: 'quote', text, author: author || undefined }
  }

  if (all.length > 1) {
    const last = all[all.length - 1]
    // Ostatni akapit uznajemy za podpis tylko wtedy, gdy jest krótki i
    // zaczyna się od myślnika — inaczej zabralibyśmy zdanie z treści cytatu.
    if (last.length <= 120 && /^[—–-]\s*\S/.test(last)) {
      return {
        type: 'quote',
        text: all.slice(0, -1).join('\n\n'),
        author: last.replace(/^[—–-]\s*/, ''),
      }
    }
  }

  return { type: 'quote', text: all.join('\n\n') }
}

/** Obraz z `<figure>` — podpis z `<figcaption>`, źródło z `data-credit`. */
const figureFrom = (node: RawNode): RawBlock | null => {
  const children = scanNodes(node.inner)
  const img = children.find((child) => child.tag === 'img')
  const caption = children.find((child) => child.tag === 'figcaption')
  const iframe = children.find((child) => child.tag === 'iframe')

  if (!img) {
    if (iframe?.attrs.src) {
      const provider = embedProviderOf(iframe.attrs.src)
      if (provider) return { type: 'embed', provider, url: normalizeEmbedUrl(iframe.attrs.src) }
    }
    return null
  }

  return {
    type: 'image',
    src: img.attrs.src ?? '',
    alt: img.attrs.alt ?? '',
    caption: caption ? textOf(caption.inner) || undefined : undefined,
    credit: img.attrs['data-credit'] || node.attrs['data-credit'] || undefined,
  }
}

/** Tabela — pierwszy wiersz z `<th>` staje się nagłówkiem. */
const tableFrom = (inner: string): RawBlock | null => {
  const rows: string[][] = []
  let head: string[] | null = null

  const collectRows = (html: string) => {
    for (const node of scanNodes(html)) {
      if (node.tag === 'thead' || node.tag === 'tbody' || node.tag === 'tfoot') {
        collectRows(node.inner)
        continue
      }
      if (node.tag !== 'tr') continue
      const cells = scanNodes(node.inner).filter((cell) => cell.tag === 'th' || cell.tag === 'td')
      if (!cells.length) continue
      const values = cells.map((cell) => textOf(cell.inner))
      const isHeader = cells.every((cell) => cell.tag === 'th')
      if (isHeader && head === null) head = values
      else rows.push(values)
    }
  }
  collectRows(inner)

  if (head === null) {
    if (!rows.length) return null
    // Tabela bez `<th>`: pierwszy wiersz awansuje na nagłówek. Bez tego
    // schemat odrzuciłby blok („tabela musi mieć co najmniej jedną kolumnę”),
    // a redaktor zobaczyłby błąd walidacji bez wskazówki, co poprawić.
    head = rows.shift() as string[]
  }

  const width = (head as string[]).length
  // Wiersze o innej szerokości schemat odrzuca. Dopełniamy je pustymi
  // komórkami, bo utrata całej tabeli z powodu jednej scalonej komórki
  // jest gorsza niż puste pole.
  const normalized = rows.map((row) =>
    row.length === width ? row : [...row.slice(0, width), ...Array(Math.max(0, width - row.length)).fill('')],
  )

  return { type: 'table', head, rows: normalized }
}

/**
 * Konwersja pojedynczego węzła. `null` oznacza „pomiń” — dotyczy pustych
 * akapitów, `<hr>`, `<br>` i znaczników, które nie mają odpowiednika
 * w modelu bloków.
 */
const nodeToBlock = (node: RawNode): RawBlock | RawBlock[] | null => {
  switch (node.tag) {
    case '#text': {
      const text = textOf(node.inner)
      return text ? { type: 'paragraph', html: escapeHtml(text) } : null
    }

    case 'p':
      // Akapit zawierający wyłącznie obraz to w istocie blok obrazu —
      // TipTap tak zapisuje wklejone zdjęcie.
      if (!textOf(node.inner) && /<img\b/i.test(node.inner)) {
        const img = scanNodes(node.inner).find((child) => child.tag === 'img')
        if (img) return { type: 'image', src: img.attrs.src ?? '', alt: img.attrs.alt ?? '' }
      }
      return hasContent(node.inner) ? { type: 'paragraph', html: node.inner.trim() } : null

    case 'h1':
      // Poziom 1 należy do tytułu artykułu. Nagłówek z treści degradujemy
      // do poziomu 2, zamiast go odrzucać — schemat dopuszcza tylko 2 i 3.
      return { type: 'heading', level: 2, text: textOf(node.inner) }
    case 'h2':
      return { type: 'heading', level: 2, text: textOf(node.inner) }
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return { type: 'heading', level: 3, text: textOf(node.inner) }

    case 'ul': {
      const items = listItems(node.inner)
      return items.length ? { type: 'list', items } : null
    }
    case 'ol': {
      const items = listItems(node.inner)
      return items.length ? { type: 'list', ordered: true, items } : null
    }

    case 'blockquote': {
      if (!hasContent(node.inner)) return null
      // Ramka informacyjna jest zapisywana jako `<blockquote data-variant>`,
      // bo TipTap nie ma dla niej własnego znacznika. Bez tego rozpoznania
      // każde przejście artykułu przez edytor zamieniało ramkę na cytat —
      // po trzech edycjach ostrzeżenie „uwaga na objazd" wyglądałoby jak
      // czyjaś wypowiedź.
      const variant = node.attrs['data-variant']
      if (variant === 'info' || variant === 'warning' || variant === 'success') {
        const children = scanNodes(node.inner)
        const strong = children.find(
          (child) => child.tag === 'p' && /^<\s*strong\b/i.test(child.inner.trim()),
        )
        const title = strong ? textOf(strong.inner) : undefined
        const rest = strong
          ? children.filter((child) => child !== strong).map((child) =>
              child.tag === '#text' ? child.inner : `<${child.tag}>${child.inner}</${child.tag}>`,
            ).join('')
          : node.inner
        return { type: 'info', variant, title, html: (rest.trim() || node.inner).trim() }
      }
      return quoteFrom(node.inner)
    }

    case 'figure':
      return figureFrom(node)

    case 'img':
      return node.attrs.src ? { type: 'image', src: node.attrs.src, alt: node.attrs.alt ?? '' } : null

    case 'table':
      return tableFrom(node.inner)

    case 'video':
      return node.attrs.src
        ? { type: 'video', src: node.attrs.src, poster: node.attrs.poster || undefined }
        : null

    case 'audio':
      return node.attrs.src ? { type: 'audio', src: node.attrs.src } : null

    case 'iframe': {
      if (!node.attrs.src) return null
      const provider = embedProviderOf(node.attrs.src)
      return provider ? { type: 'embed', provider, url: normalizeEmbedUrl(node.attrs.src) } : null
    }

    case 'pre': {
      // Blok kodu nie ma wariantu w modelu — zachowujemy treść jako akapit
      // w ramce informacyjnej, żeby nic nie zniknęło bez śladu.
      const code = textOf(node.inner)
      return code ? { type: 'info', variant: 'info', html: `<p>${escapeHtml(code)}</p>` } : null
    }

    case 'hr':
    case 'br':
      return null

    // Kontenery TipTapa i wklejone `<div>`/`<section>` — wchodzimy głębiej,
    // bo treść leży w środku, a sam kontener nie jest blokiem.
    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'span': {
      if (node.attrs['data-youtube-video'] !== undefined) {
        const iframe = scanNodes(node.inner).find((child) => child.tag === 'iframe')
        if (iframe?.attrs.src) {
          const provider = embedProviderOf(iframe.attrs.src)
          if (provider) return { type: 'embed', provider, url: normalizeEmbedUrl(iframe.attrs.src) }
        }
        return null
      }
      const inner = htmlToBlocks(node.inner)
      return inner.length ? inner : null
    }

    default:
      return hasContent(node.inner) ? { type: 'paragraph', html: node.inner.trim() } : null
  }
}

/**
 * HTML edytora → surowe bloki. Wynik NIE jest zwalidowany ani zsanityzowany —
 * do zapisu w bazie służy `parseEditorHtml()`.
 */
export const htmlToBlocks = (html: string): RawBlock[] => {
  if (!html || !html.trim()) return []
  const out: RawBlock[] = []
  for (const node of scanNodes(html)) {
    const block = nodeToBlock(node)
    if (!block) continue
    if (Array.isArray(block)) out.push(...block)
    else out.push(block)
  }
  return out
}

export interface ParseEditorResult {
  ok: boolean
  blocks: ValidatedBlock[]
  /** Błędy w postaci `blok 3 · pole text: komunikat` — gotowe do panelu. */
  errors: string[]
}

/**
 * Jedyna droga z HTML edytora do bazy: konwersja + walidacja schematem
 * (a więc i sanityzacja HTML wewnątrz bloków).
 *
 * @param extraBlocks bloki wstawione poza edytorem (galeria, plik, audio) —
 *   dołączane na koniec i walidowane razem z resztą.
 */
export const parseEditorHtml = (html: string, extraBlocks: unknown[] = []): ParseEditorResult => {
  const candidate = [...htmlToBlocks(html), ...extraBlocks]
  const parsed = contentBlocksDraft.safeParse(candidate)

  if (parsed.success) return { ok: true, blocks: parsed.data, errors: [] }

  const errors = parsed.error.issues.map((issue) => {
    const [index, ...rest] = issue.path
    const where = typeof index === 'number' ? `blok ${index + 1}` : 'treść'
    const field = rest.length ? ` · pole ${rest.join('.')}` : ''
    return `${where}${field}: ${issue.message}`
  })

  return { ok: false, blocks: [], errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloki → HTML (wczytanie artykułu do edytora)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Odwrotna zamiana — potrzebna przy edycji istniejącego artykułu.
 *
 * Bez niej formularz edycji pokazywałby zaślepkę („Treść robocza…”), a zapis
 * NADPISYWAŁBY prawdziwą treść tą zaślepką. To nie jest brak funkcji, to
 * cicha utrata artykułu przy pierwszym kliknięciu „Zapisz”.
 *
 * Bloki bez odpowiednika w HTML (`gallery`, `file`) zostają zapisane jako
 * znacznik `<div data-block="…">` z danymi w atrybucie, żeby przejście przez
 * edytor ich nie usuwało.
 */
export const blocksToHtml = (blocks: ValidatedBlock[]): string => {
  const parts: string[] = []

  for (const raw of blocks) {
    const block = raw as Record<string, unknown> & { type: string }
    switch (block.type) {
      case 'paragraph':
        parts.push(`<p>${String(block.html ?? '')}</p>`)
        break
      case 'heading':
        parts.push(`<h${block.level}>${escapeHtml(String(block.text ?? ''))}</h${block.level}>`)
        break
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul'
        const items = (block.items as string[] | undefined) ?? []
        parts.push(`<${tag}>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`)
        break
      }
      case 'quote': {
        const author = block.author ? `<cite>${escapeHtml(String(block.author))}</cite>` : ''
        const text = String(block.text ?? '')
          .split(/\n{2,}/)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join('')
        parts.push(`<blockquote>${text}${author}</blockquote>`)
        break
      }
      case 'image': {
        const credit = block.credit ? ` data-credit="${escapeHtml(String(block.credit))}"` : ''
        const img = `<img src="${escapeHtml(String(block.src ?? ''))}" alt="${escapeHtml(String(block.alt ?? ''))}"${credit} />`
        parts.push(
          block.caption
            ? `<figure>${img}<figcaption>${escapeHtml(String(block.caption))}</figcaption></figure>`
            : `<figure>${img}</figure>`,
        )
        break
      }
      case 'video':
        parts.push(
          `<video src="${escapeHtml(String(block.src ?? ''))}"${block.poster ? ` poster="${escapeHtml(String(block.poster))}"` : ''} controls></video>`,
        )
        break
      case 'audio':
        parts.push(`<audio src="${escapeHtml(String(block.src ?? ''))}" controls></audio>`)
        break
      case 'embed':
        parts.push(
          `<div data-youtube-video><iframe src="${escapeHtml(String(block.url ?? ''))}" data-provider="${escapeHtml(String(block.provider ?? ''))}"></iframe></div>`,
        )
        break
      case 'table': {
        const head = (block.head as string[] | undefined) ?? []
        const rows = (block.rows as string[][] | undefined) ?? []
        parts.push(
          `<table><thead><tr>${head.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>` +
            rows.map((r) => `<tr>${r.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('') +
            '</tbody></table>',
        )
        break
      }
      case 'info':
        parts.push(
          `<blockquote data-variant="${escapeHtml(String(block.variant ?? 'info'))}">${block.title ? `<p><strong>${escapeHtml(String(block.title))}</strong></p>` : ''}${String(block.html ?? '')}</blockquote>`,
        )
        break
      default:
        // `gallery`, `file` i wszystko, co dojdzie później — zachowane
        // w atrybucie, żeby edycja tekstu nie usuwała galerii.
        parts.push(`<div data-block="${escapeHtml(JSON.stringify(block))}"></div>`)
        break
    }
  }

  return parts.join('\n') || '<p></p>'
}

/**
 * Bloki zachowane w `data-block` wracają do modelu — wywoływane przed
 * `parseEditorHtml`, żeby galeria wstawiona kiedyś nie zniknęła po edycji
 * samego tekstu.
 */
export const extractPreservedBlocks = (html: string): { html: string; preserved: unknown[] } => {
  const preserved: unknown[] = []
  const cleaned = html.replace(/<div\s+data-block="([^"]*)"\s*>\s*<\/div>/gi, (_whole, encoded: string) => {
    try {
      preserved.push(JSON.parse(decodeEntities(encoded)))
    } catch {
      // Uszkodzony zapis pomijamy — lepiej stracić jeden blok niż cały zapis.
    }
    return ''
  })
  return { html: cleaned, preserved }
}
