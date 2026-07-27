/**
 * Role panelu.
 *
 * Wcześniej typ miał dwie wartości ('admin' | 'editor'), a tabela `users`
 * dopuszcza sześć (migracja 0047). Autor i moderator mają dostęp do panelu
 * — do własnych szkiców i do kolejki komentarzy — więc zawężony typ zmuszałby
 * do rzutowania przy każdym przekazaniu roli z sesji do widoku.
 */
export type AdminRole = 'admin' | 'editor' | 'author' | 'moderator' | 'contributor' | 'viewer'

export type AdminNavItem = {
  href: string
  label: string
  icon?: string
  count?: number | string
}

export type DashboardStat = {
  label: string
  value: string | number
  delta?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}

export type ArticleStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived'

export type AdminArticle = {
  id: string
  title: string
  slug: string
  category: string
  author: string
  updatedAt: string
  status: ArticleStatus
  views: number
  comments: number
  /** Znacznik czasu do kontroli równoczesnej edycji (B4). */
  expectedUpdatedAt?: string
  lead?: string
  solectwo?: string | null
  aiAssisted?: boolean
  heroImage?: string | null
  heroAlt?: string | null
  /** Treść w HTML — do wczytania w edytorze. */
  contentHtml?: string
  tags?: string[]
  seoTitle?: string | null
  seoDescription?: string | null
}

export type AdminComment = {
  id: string
  author: string
  articleTitle: string
  content: string
  createdAt: string
  /**
   * Statusy zgodne z ograniczeniem CHECK w tabeli `comments`.
   * 'flagged' nie istnieje w bazie — zgłoszony komentarz to `pending`
   * z `report_count > 0`, dlatego dochodzi 'spam', a nie 'flagged'.
   */
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  articleId?: string
  articleSlug?: string | null
  spamScore?: number
  reportCount?: number
  profanityHits?: number
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: AdminRole
  status: 'active' | 'invited' | 'blocked'
  lastLogin?: string | null
  articleCount?: number
}

export type MediaItem = {
  id: string
  title: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: string
  alt?: string | null
  credit?: string | null
}

export type ObituaryItem = {
  id: string
  name: string
  dates: string
  photo?: string
  notice: string
}

export type JobOfferItem = {
  id: string
  title: string
  company: string
  salary: string
  photo?: string
}

export type RealEstateItem = {
  id: string
  title: string
  price: string
  photo?: string
}

export type EventItem = {
  id: string
  title: string
  date: string
  location: string
  category: string
}

export type NewsletterItem = {
  id: string
  subject: string
  audience: string
  scheduledAt: string
  status: 'draft' | 'scheduled' | 'sent'
}
