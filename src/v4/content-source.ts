// ============================================================================
// IZBICA24.PL v4 — ZRODLO TRESCI PUBLICZNEJ (D1)
//
// Powod istnienia tego pliku (etap D4):
// Panel redakcyjny zapisuje artykuly do D1, a strony publiczne czytaly ze
// statycznej tablicy ARTICLES_V4. Byly to dwa rozlaczne systemy — artykul
// opublikowany w panelu zwracal 404 na portalu. Ten modul jest jedynym
// miejscem, ktore tlumaczy wiersze D1 na model `Article` szaty v4.
//
// DLACZEGO MIGAWKA, A NIE ASYNCHRONICZNE AKCESORY
// Wszystkie 15 funkcji dostepowych (byCategory, latest, mostRead…) jest
// wywolywanych bezposrednio w cialach komponentow JSX — hono/jsx renderuje
// synchronicznie, wiec zamiana ich na `async` wymusilaby przepisanie strony
// glownej, Layoutu i Misc na model "najpierw pobierz dane, potem renderuj".
// Zamiast tego jedno zapytanie na zadanie laduje pelna migawke tresci, a
// akcesory filtruja ja w pamieci — tak jak wczesniej filtrowaly tablice.
//
// Skala to dopuszcza: portal gminy 5 400 mieszkancow ma dziesiatki, nie
// dziesiatki tysiecy artykulow. Gdy zbior przekroczy kilka tysiecy wierszy,
// ten modul trzeba zamienic na zapytania z LIMIT — ale wtedy i tak trzeba
// bedzie przepisac komponenty, wiec nie ma sensu placic tej ceny teraz.
//
// DLACZEGO NIE CACHE NA POZIOMIE MODULU
// Instancja Workera obsluguje wiele zadan. Cache w zmiennej modulu
// pokazywalby redaktorowi stara tresc po publikacji przez nieokreslony czas
// (dopoki izolat zyje) i to niespojnie miedzy izolatami — czyli "odswiezam i
// raz widze artykul, raz nie". Migawka zyje tyle, co jedno zadanie.
// ============================================================================

import type { Context } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Article, Author, ContentBlock, ContentType, Gallery, PublishStatus } from './content-types'
import { findCategory, findSubcategory } from './taxonomy'

// Autor zapasowy definiowany lokalnie, a NIE importowany z content-db.
// content-db importuje `snapshot()` z tego pliku, wiec import w druga strone
// utworzylby cykl — a przy pakowaniu bundlem stala z modulu ocenianego pozniej
// bylaby w chwili uzycia `undefined`, co wysadzaloby render kazdej karty.
const REDAKCJA: Author = {
  slug: 'redakcja',
  name: 'Redakcja izbica24.pl',
  role: 'Zespół redakcyjny',
  email: 'redakcja@izbica24.pl',
}

// ─────────────────────────────────────────────────────── KSZTALT WIERSZY D1

interface ArticleRow {
  id: number
  slug: string
  title: string
  short_title: string | null
  lead: string | null
  content_type: string | null
  category_slug: string | null
  subcategory_slug: string | null
  subsubcategory_slug: string | null
  hero_image_r2_key: string | null
  hero_alt: string | null
  hero_caption: string | null
  hero_credit: string | null
  solectwo_slug: string | null
  status: string
  published_at: string | null
  updated_at: string | null
  created_at: string | null
  view_count: number | null
  comment_count: number | null
  reading_minutes: number | null
  featured: number | null
  breaking: number | null
  ai_assisted: number | null
  type_data_json: string | null
  author_name: string | null
  author_email: string | null
  author_role: string | null
  author_bio: string | null
  author_avatar: string | null
  tag_list: string | null
}

interface BlockRow {
  article_id: number
  position: number
  block_type: string
  payload_json: string
}

// ───────────────────────────────────────────────────────────── MIGAWKA

export interface ContentSnapshot {
  articles: Article[]
  bySlug: Map<string, Article>
  galleries: Gallery[]
  /**
   * Slugi juz wykorzystane przez slot() w tym zadaniu — zapobiega pokazaniu
   * tego samego materialu w dwoch kaflach strony glownej. Zbior MUSI byc
   * tworzony na zadanie: gdyby zyl w zmiennej modulu, narastalby przy kazdym
   * odsloniu, az wszystkie artykuly bylyby "uzyte" i slot zwracalby undefined
   * — czyli 500 po kilkudziesieciu wejsciach na strone glowna.
   */
  used: Set<string>
}

/** Funkcja, nie stala: wspoldzielony obiekt oznaczalby wspoldzielony `used`. */
const emptySnapshot = (): ContentSnapshot => ({
  articles: [],
  bySlug: new Map(),
  galleries: [],
  used: new Set(),
})

/**
 * Kontekst zadania. AsyncLocalStorage, a nie zmienna modulu, bo Worker
 * przetwarza zadania wspolbieznie — zmienna globalna mieszalaby migawki
 * miedzy czytelnikami.
 */
const store = new AsyncLocalStorage<ContentSnapshot>()

export const runWithSnapshot = <T>(snapshot: ContentSnapshot, fn: () => T): T => store.run(snapshot, fn)

/**
 * Migawka biezacego zadania. Gdy jej nie ma (np. trasa nie przeszla przez
 * middleware), zwracamy pusty zbior zamiast rzucac wyjatkiem — brak jednej
 * sekcji na stronie jest znosny, biale 500 dla calego portalu nie jest.
 */
export const snapshot = (): ContentSnapshot => store.getStore() ?? emptySnapshot()

// ────────────────────────────────────────────── TLUMACZENIE WIERSZ → MODEL

const MIESIACE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

/**
 * '2026-05-23 10:00:00' → '23 maja 2026, 10:00'
 * Recznie, bez `new Date()`, bo Worker pracuje w UTC i konstruktor przesunalby
 * godzine publikacji o dwie godziny wzgledem tego, co redaktor wpisal.
 */
const formatPl = (value: string | null): string => {
  if (!value) return ''
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return value
  const [, y, mo, d, h, mi] = m
  const monthName = MIESIACE[Number.parseInt(mo, 10) - 1] ?? mo
  return `${Number.parseInt(d, 10)} ${monthName} ${y}, ${h}:${mi}`
}

/** '2026-05-23 10:00:00' → '2026-05-23T10:00:00+02:00' dla atrybutu datetime */
const toIso = (value: string | null): string => {
  if (!value) return ''
  const normalized = value.replace(' ', 'T')
  return /[+Z]/.test(normalized) ? normalized : `${normalized}+02:00`
}

/**
 * Klucz R2 → URL publiczny. Sciezki i pelne adresy przepuszczamy bez zmian,
 * zeby materialy z szaty (/static/img/v4/…) dzialaly obok wgranych plikow.
 */
const mediaUrl = (key: string | null): string | undefined => {
  if (!key) return undefined
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/')) return key
  return `/media/${key}`
}

const CONTENT_TYPES: ContentType[] = [
  'article', 'gallery', 'video', 'audio', 'live',
  'media-review', 'announcement', 'event', 'infographic',
]

/**
 * Baza dopuszcza wlasne typy tresci (nekrolog, praca, nieruchomosc,
 * wydarzenie) — szata v4 zna wezszy zbior. Mapujemy je na najblizszy typ
 * ekspozycji, zeby ogloszenie nie renderowalo sie jako pusty artykul.
 */
const TYPE_ALIASES: Record<string, ContentType> = {
  nekrolog: 'announcement',
  praca: 'announcement',
  nieruchomosc: 'announcement',
  usluga: 'announcement',
  ogloszenie: 'announcement',
  wydarzenie: 'event',
  relacja: 'live',
  galeria: 'gallery',
  wideo: 'video',
  podcast: 'audio',
  infografika: 'infographic',
}

const toContentType = (value: string | null): ContentType => {
  if (!value) return 'article'
  if (CONTENT_TYPES.includes(value as ContentType)) return value as ContentType
  return TYPE_ALIASES[value] ?? 'article'
}

// ─────────────────────────────────────────── UZGODNIENIE TAKSONOMII Z BAZA

/**
 * Baza ma 21 kategorii uzywanych przez artykuly, a taksonomia szaty v4 zna
 * 11 kategorii glownych. To nie jest blad zadnej ze stron — baza dzieli
 * tresc drobniej (inwestycje, komunikaty, nekrologi, praca…), szata grupuje
 * ja w mniej zakladek menu.
 *
 * Uzgodnienie MUSI nastapic tutaj, u zrodla, a nie w komponentach: `articleUrl`
 * buduje adres z pola `category`, a router rejestruje trasy tylko dla
 * kategorii z taksonomii. Kategoria nieznana szacie dawalaby linki prowadzace
 * w 404 oraz `findCategory() === undefined`, czyli 500 przy pierwszym uzyciu
 * `cat.tagClass`.
 *
 * Drobniejszy podzial z bazy nie ginie — zapisujemy go jako podkategorie.
 */
const CATEGORY_MAP: Record<string, { category: string; subcategory?: string }> = {
  wiadomosci: { category: 'wiadomosci' },
  komunikaty: { category: 'wiadomosci', subcategory: 'komunikaty' },
  inwestycje: { category: 'wiadomosci', subcategory: 'inwestycje' },
  edukacja: { category: 'wiadomosci', subcategory: 'edukacja' },
  zdrowie: { category: 'wiadomosci', subcategory: 'zdrowie' },
  spoleczne: { category: 'wiadomosci', subcategory: 'spoleczne' },
  srodowisko: { category: 'wiadomosci', subcategory: 'srodowisko' },
  rolnictwo: { category: 'wiadomosci', subcategory: 'rolnictwo' },
  samorzad: { category: 'samorzad' },
  rada: { category: 'samorzad', subcategory: 'rada' },
  solectwa: { category: 'samorzad', subcategory: 'solectwa' },
  'na-sygnale': { category: 'na-sygnale' },
  kultura: { category: 'kultura' },
  kalendarz: { category: 'kultura', subcategory: 'kalendarz' },
  historia: { category: 'historia' },
  ludzie: { category: 'ludzie' },
  sport: { category: 'kujawianka' },
  kujawianka: { category: 'kujawianka' },
  multimedia: { category: 'multimedia' },
  'przeglad-mediow': { category: 'przeglad-mediow' },
  zycie: { category: 'zycie-codzienne' },
  'zycie-codzienne': { category: 'zycie-codzienne' },
  ogloszenia: { category: 'ogloszenia' },
  nekrologi: { category: 'ogloszenia', subcategory: 'nekrologi' },
  praca: { category: 'ogloszenia', subcategory: 'praca' },
  nieruchomosci: { category: 'ogloszenia', subcategory: 'nieruchomosci' },
  uslugi: { category: 'ogloszenia', subcategory: 'uslugi' },
}

/**
 * Zwraca kategorie i podkategorie w slowniku szaty.
 *
 * Podkategoria jest sprawdzana wzgledem taksonomii, bo `articleUrl` buduje z
 * niej adres `/kategoria/podkategoria/slug`, a router rejestruje takie trasy
 * tylko dla par obecnych w CATEGORIES. Podkategoria z bazy nieznana szacie
 * dawalaby link prowadzacy w 404 — lepiej pokazac artykul pod adresem
 * `/kategoria/slug`, ktory na pewno istnieje.
 */
const resolveTaxonomy = (
  categorySlug: string | null,
  subcategorySlug: string | null,
): { category: string; subcategory?: string } => {
  const mapped = CATEGORY_MAP[categorySlug ?? ''] ?? { category: 'wiadomosci' }
  const known = findCategory(mapped.category)
  const category = known ? mapped.category : 'wiadomosci'

  const candidate = subcategorySlug ?? mapped.subcategory
  const valid =
    candidate && findSubcategory(category, candidate) ? candidate : mapped.subcategory

  return {
    category,
    subcategory: valid && findSubcategory(category, valid) ? valid : undefined,
  }
}

const STATUSES: PublishStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived']
const toStatus = (value: string): PublishStatus =>
  STATUSES.includes(value as PublishStatus) ? (value as PublishStatus) : 'draft'

const authorFrom = (row: ArticleRow): Author => {
  if (!row.author_name) return REDAKCJA
  const slug = row.author_email?.split('@')[0] ?? 'redakcja'
  return {
    slug,
    name: row.author_name,
    role: row.author_role ? roleLabel(row.author_role) : 'Zespół redakcyjny',
    email: row.author_email ?? undefined,
    bio: row.author_bio ?? undefined,
    avatar: mediaUrl(row.author_avatar),
  }
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator portalu',
  editor: 'Redaktor naczelny',
  author: 'Redaktor',
  moderator: 'Moderator',
  contributor: 'Współpracownik',
  viewer: 'Redakcja izbica24.pl',
}
const roleLabel = (role: string): string => ROLE_LABELS[role] ?? 'Redakcja izbica24.pl'

/** Bloki z bazy sa juz zwalidowane przy zapisie (parseEditorHtml), wiec
 *  jedyne realne ryzyko to uszkodzony JSON — taki blok pomijamy. */
const blocksFrom = (rows: BlockRow[]): ContentBlock[] => {
  const out: ContentBlock[] = []
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.payload_json) as ContentBlock
      if (parsed && typeof parsed === 'object' && 'type' in parsed) out.push(parsed)
    } catch {
      console.warn(`[content-source] Uszkodzony blok ${row.block_type} @ ${row.article_id}:${row.position}`)
    }
  }
  return out
}

const parseTypeData = (json: string | null): Record<string, unknown> => {
  if (!json) return {}
  try {
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const toArticle = (row: ArticleRow, blocks: ContentBlock[]): Article => {
  const typeData = parseTypeData(row.type_data_json)
  const when = row.published_at ?? row.created_at
  const taxonomy = resolveTaxonomy(row.category_slug, row.subcategory_slug)

  const article: Article = {
    id: String(row.id),
    slug: row.slug,
    type: toContentType(row.content_type),
    status: toStatus(row.status),
    category: taxonomy.category,
    subcategory: taxonomy.subcategory,
    subsubcategory: row.subsubcategory_slug ?? undefined,
    title: row.title,
    shortTitle: row.short_title ?? undefined,
    lede: row.lead ?? '',
    blocks,
    heroImage: mediaUrl(row.hero_image_r2_key),
    heroAlt: row.hero_alt ?? undefined,
    heroCaption: row.hero_caption ?? undefined,
    heroCredit: row.hero_credit ?? undefined,
    author: authorFrom(row),
    publishedAt: formatPl(when),
    publishedAtISO: toIso(when),
    updatedAt: row.updated_at ? formatPl(row.updated_at) : undefined,
    readingMinutes: row.reading_minutes ?? 1,
    views: row.view_count ?? 0,
    commentCount: row.comment_count ?? 0,
    tags: row.tag_list ? row.tag_list.split('\u001f').filter(Boolean) : [],
    solectwo: row.solectwo_slug ?? undefined,
    featured: row.featured === 1,
    breaking: row.breaking === 1,
    aiAssisted: row.ai_assisted === 1,
  }

  // Pola typow zapisane w type_data_json — przepisujemy tylko te, ktore
  // szata potrafi wyswietlic, zeby przypadkowa zawartosc nie trafila do JSX.
  if (typeData.incident) article.incident = typeData.incident as Article['incident']
  if (typeData.externalSource) article.externalSource = typeData.externalSource as Article['externalSource']
  if (typeData.video) article.video = typeData.video as Article['video']
  if (typeData.audio) article.audio = typeData.audio as Article['audio']
  if (typeData.event) article.event = typeData.event as Article['event']
  if (typeData.announcement) article.announcement = typeData.announcement as Article['announcement']
  if (typeof typeData.galleryId === 'string') article.galleryId = typeData.galleryId

  return article
}

// ──────────────────────────────────────────────────────────── POBRANIE

const ARTICLES_SQL = `
  SELECT a.id, a.slug, a.title, a.short_title, a.lead, a.content_type,
         c.slug AS category_slug, a.subcategory_slug, a.subsubcategory_slug,
         a.hero_image_r2_key, a.hero_alt, a.hero_caption, a.hero_credit,
         a.solectwo_slug, a.status, a.published_at, a.updated_at, a.created_at,
         a.view_count, a.comment_count, a.reading_minutes,
         a.featured, a.breaking, a.ai_assisted, a.type_data_json,
         u.name AS author_name, u.email AS author_email, u.role AS author_role,
         u.bio AS author_bio, u.avatar AS author_avatar,
         (SELECT group_concat(t.name, char(31))
            FROM article_tags at JOIN tags t ON t.id = at.tag_id
           WHERE at.article_id = a.id) AS tag_list
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    LEFT JOIN users u ON u.id = a.author_id
   WHERE a.status = 'published'
     AND a.deleted_at IS NULL
     AND a.archived_at IS NULL
     AND (a.published_at IS NULL OR a.published_at <= datetime('now'))
   ORDER BY COALESCE(a.published_at, a.created_at) DESC
   LIMIT 500
`

const BLOCKS_SQL = `
  SELECT b.article_id, b.position, b.block_type, b.payload_json
    FROM article_blocks b
    JOIN articles a ON a.id = b.article_id
   WHERE a.status = 'published'
     AND a.deleted_at IS NULL
     AND a.archived_at IS NULL
   ORDER BY b.article_id, b.position
`

/**
 * Buduje migawke tresci. Dwa zapytania zamiast N+1: artykuly i wszystkie ich
 * bloki naraz, potem zszycie w pamieci. Przy kilkuset artykulach to jest
 * tansze niz jedno zapytanie na artykul, a limit 500 chroni przed sytuacja,
 * w ktorej rozrost archiwum wysadza budzet CPU Workera.
 */
export const loadSnapshot = async (c: Context): Promise<ContentSnapshot> => {
  const db = (c.env as { DB?: D1Database } | undefined)?.DB
  if (!db) {
    console.warn('[content-source] Brak wiazania DB — portal bez tresci z bazy.')
    return emptySnapshot()
  }

  try {
    const [articlesResult, blocksResult] = await db.batch([
      db.prepare(ARTICLES_SQL),
      db.prepare(BLOCKS_SQL),
    ])

    const rows = (articlesResult.results ?? []) as unknown as ArticleRow[]
    const blockRows = (blocksResult.results ?? []) as unknown as BlockRow[]

    const blocksByArticle = new Map<number, BlockRow[]>()
    for (const row of blockRows) {
      const list = blocksByArticle.get(row.article_id)
      if (list) list.push(row)
      else blocksByArticle.set(row.article_id, [row])
    }

    const articles = rows.map((row) => toArticle(row, blocksFrom(blocksByArticle.get(row.id) ?? [])))
    const bySlug = new Map(articles.map((a) => [a.slug, a]))

    return { articles, bySlug, galleries: [], used: new Set() }
  } catch (error) {
    // Awaria bazy nie moze oznaczac bialej strony — portal pokaze pusta
    // sekcje, a blad trafi do logow.
    console.error('[content-source] Nie udalo sie wczytac tresci z D1:', error)
    return emptySnapshot()
  }
}

/** Pojedynczy artykul poza migawka — dla podgladu szkicu z panelu. */
export const loadArticleBySlug = async (c: Context, slug: string): Promise<Article | null> => {
  const db = (c.env as { DB?: D1Database } | undefined)?.DB
  if (!db) return null

  try {
    const row = (await db
      .prepare(ARTICLES_SQL.replace("WHERE a.status = 'published'", 'WHERE a.slug = ?').replace(/LIMIT 500/, 'LIMIT 1'))
      .bind(slug)
      .first()) as ArticleRow | null
    if (!row) return null

    const blocks = await db
      .prepare('SELECT article_id, position, block_type, payload_json FROM article_blocks WHERE article_id = ? ORDER BY position')
      .bind(row.id)
      .all<BlockRow>()

    return toArticle(row, blocksFrom(blocks.results ?? []))
  } catch (error) {
    console.error('[content-source] Podglad artykulu nieudany:', error)
    return null
  }
}
