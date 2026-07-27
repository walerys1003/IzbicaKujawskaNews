// ============================================================================
// IZBICA24.PL v4 — MODELE TREŚCI
// Każdy typ materiału front-endu ma odwzorowanie w back-endzie (admin CRUD).
// ============================================================================

/** Typ materiału — decyduje, jakie pola pokazuje edytor w panelu admina */
export type ContentType =
  | 'article' // klasyczny artykuł tekstowy (opcjonalnie ze zdjęciami)
  | 'gallery' // galeria zdjęć (min. 2 zdjęcia)
  | 'video' // materiał wideo (embed lub plik z R2)
  | 'audio' // podcast / audycja / nagranie
  | 'live' // relacja na żywo (Na sygnale)
  | 'media-review' // wpis Przeglądu Mediów (link zewnętrzny + streszczenie)
  | 'announcement' // ogłoszenie (nekrolog, praca, nieruchomość, usługa)
  | 'event' // wydarzenie z kalendarza
  | 'infographic' // infografika

export type PublishStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived'

/** Blok treści — edytor w adminie buduje z tego artykuł */
export type ContentBlock =
  | { type: 'paragraph'; html: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'quote'; text: string; author?: string; role?: string }
  | { type: 'image'; src: string; alt: string; caption?: string; credit?: string }
  | { type: 'gallery'; galleryId: string }
  | { type: 'video'; src: string; poster?: string; caption?: string; duration?: string }
  | { type: 'audio'; src: string; title?: string; duration?: string }
  | { type: 'embed'; provider: 'youtube' | 'spotify' | 'facebook' | 'x'; url: string }
  | { type: 'file'; url: string; label: string; sizeLabel?: string; mime?: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'info'; variant: 'info' | 'warning' | 'success'; title?: string; html: string }

export interface MediaAsset {
  id: string
  kind: 'image' | 'video' | 'audio' | 'document'
  /** URL publiczny (R2 lub /static) */
  url: string
  /** Miniatura / poster */
  thumb?: string
  title: string
  alt?: string
  caption?: string
  credit?: string
  /** Sekundy dla audio/wideo */
  durationSec?: number
  width?: number
  height?: number
  sizeBytes?: number
  mime?: string
  uploadedAt: string
  uploadedBy?: string
  tags?: string[]
}

export interface Gallery {
  id: string
  slug: string
  title: string
  description?: string
  cover: string
  /** Kategoria galerii z taksonomii /multimedia/galerie/* */
  section?: string
  photos: Array<{ src: string; alt: string; caption?: string; credit?: string }>
  publishedAt: string
  eventDate?: string
}

export interface Author {
  slug: string
  name: string
  role: string
  avatar?: string
  bio?: string
  email?: string
}

/** Główny obiekt treści portalu */
export interface Article {
  id: string
  slug: string
  type: ContentType
  status: PublishStatus

  /** Slug kategorii głównej z taxonomy.ts */
  category: string
  /** Slug podkategorii (2. poziom) */
  subcategory?: string
  /** Slug 3. poziomu, np. parafie/blenna */
  subsubcategory?: string

  title: string
  /** Tytuł skrócony do kart i list */
  shortTitle?: string
  /** Zajawka serif — używana we wszystkich kartach szaty v4 */
  lede: string

  blocks: ContentBlock[]

  /** Zdjęcie główne */
  heroImage?: string
  heroAlt?: string
  heroCaption?: string
  heroCredit?: string

  author: Author
  publishedAt: string
  /** ISO — do sortowania */
  publishedAtISO: string
  updatedAt?: string
  readingMinutes: number
  views: number
  commentCount: number

  tags: string[]
  /** Tag sołectwa — wg specyfikacji sołectwa to tagi, nie podstrony */
  solectwo?: string

  /** Flagi ekspozycji na stronie głównej */
  featured?: boolean
  breaking?: boolean
  /** Znacznik AI wg wymogu stopki portalu */
  aiAssisted?: boolean

  // ── pola specyficzne dla typów ──
  /** type: 'live' — Na sygnale */
  incident?: {
    time: string
    dayLabel: string
    kind: string
    icon: string
    place: string
    source: string
    resolved?: boolean
  }
  /** type: 'media-review' */
  externalSource?: { name: string; url: string; badgeColor?: string }
  /** type: 'video' */
  video?: { src: string; poster: string; durationLabel: string; provider?: string }
  /** type: 'audio' */
  audio?: { src: string; durationLabel: string; episode?: number; series?: string; plays?: number }
  /** type: 'gallery' */
  galleryId?: string
  /** type: 'event' */
  event?: { startsAt: string; endsAt?: string; place: string; organizer?: string; free?: boolean }
  /** type: 'announcement' */
  announcement?: { price?: string; contact?: string; validUntil?: string; paid?: boolean }
}

/** Skrócona reprezentacja do kart i list */
export interface ArticleCard {
  slug: string
  url: string
  title: string
  lede: string
  image?: string
  category: string
  categoryLabel: string
  tagClass: string
  subcategoryLabel?: string
  author?: string
  publishedAt: string
  readingMinutes?: number
  views?: number
  commentCount?: number
  type: ContentType
}

export function toCard(a: Article, categoryLabel: string, tagClass: string, subLabel?: string): ArticleCard {
  return {
    slug: a.slug,
    url: articleUrl(a),
    title: a.title,
    lede: a.lede,
    image: a.heroImage,
    category: a.category,
    categoryLabel,
    tagClass,
    subcategoryLabel: subLabel,
    author: a.author.name,
    publishedAt: a.publishedAt,
    readingMinutes: a.readingMinutes,
    views: a.views,
    commentCount: a.commentCount,
    type: a.type,
  }
}

/** Kanoniczny URL materiału: /kategoria/podkategoria/slug */
export function articleUrl(a: Pick<Article, 'category' | 'subcategory' | 'slug'>): string {
  return a.subcategory
    ? `/${a.category}/${a.subcategory}/${a.slug}`
    : `/${a.category}/${a.slug}`
}

export function formatViews(n: number): string {
  return n.toLocaleString('pl-PL').replace(/,/g, ' ')
}

export function durationLabel(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
