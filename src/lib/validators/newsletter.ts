export interface NewsletterInput {
  email?: string
  consent?: boolean
  topics?: string[]
}

export interface ValidationResult<T> {
  ok: boolean
  data?: T
  errors: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateNewsletter = (input: NewsletterInput): ValidationResult<{ email: string; consent: true; topics: string[] }> => {
  const errors: string[] = []
  const email = String(input.email ?? '').trim().toLowerCase()
  const consent = input.consent === true
  const topics = Array.isArray(input.topics) ? input.topics.map((topic) => String(topic).trim()).filter(Boolean) : []

  if (!EMAIL_RE.test(email)) errors.push('invalid_email')
  if (!consent) errors.push('consent_required')

  return errors.length ? { ok: false, errors } : { ok: true, errors, data: { email, consent: true, topics } }
}
