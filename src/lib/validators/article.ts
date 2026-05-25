import { slugify } from '../slugify'

export interface ArticleInput {
  title?: string
  slug?: string
  lede?: string
  body?: string[]
  category?: string
  tags?: string[]
}

export interface ValidationResult<T> {
  ok: boolean
  data?: T
  errors: string[]
}

export const validateArticle = (input: ArticleInput): ValidationResult<Required<ArticleInput>> => {
  const errors: string[] = []
  const title = String(input.title ?? '').trim()
  const lede = String(input.lede ?? '').trim()
  const body = Array.isArray(input.body) ? input.body.map((item) => String(item).trim()).filter(Boolean) : []
  const category = String(input.category ?? '').trim().toLowerCase()
  const slug = String(input.slug ?? slugify(title)).trim()
  const tags = Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).trim()).filter(Boolean) : []

  if (title.length < 8) errors.push('title_too_short')
  if (lede.length < 20) errors.push('lede_too_short')
  if (!body.length) errors.push('body_required')
  if (body.join(' ').length < 80) errors.push('body_too_short')
  if (!category) errors.push('category_required')
  if (!slug) errors.push('slug_required')

  return errors.length
    ? { ok: false, errors }
    : { ok: true, errors, data: { title, slug, lede, body, category, tags } }
}
