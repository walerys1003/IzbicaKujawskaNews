export interface CommentInput {
  name?: string
  email?: string
  text?: string
  consent?: boolean
}

export interface ValidationResult<T> {
  ok: boolean
  data?: T
  errors: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateComment = (input: CommentInput): ValidationResult<Required<CommentInput>> => {
  const errors: string[] = []
  const name = String(input.name ?? '').trim()
  const email = String(input.email ?? '').trim().toLowerCase()
  const text = String(input.text ?? '').trim()
  const consent = input.consent === true

  if (name.length < 2) errors.push('invalid_name')
  if (!EMAIL_RE.test(email)) errors.push('invalid_email')
  if (text.length < 10 || text.length > 2_000) errors.push('invalid_text_length')
  if (!consent) errors.push('consent_required')

  return errors.length ? { ok: false, errors } : { ok: true, errors, data: { name, email, text, consent } }
}
