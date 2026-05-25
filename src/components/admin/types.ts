export type AdminRole = 'admin' | 'editor'

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
}

export type AdminComment = {
  id: string
  author: string
  articleTitle: string
  content: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: AdminRole
  status: 'active' | 'invited' | 'blocked'
}

export type MediaItem = {
  id: string
  title: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: string
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
