import { describe, expect, it } from 'vitest'
import app from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'
import { fixtureNewsletter } from '../fixtures/seed-data'

const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }

describe('api newsletter', () => {
  it('accepts newsletter signup', async () => {
    const response = await app.request('/api/v1/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fixtureNewsletter),
    }, env)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('pending_confirmation')
  })

  it('rejects invalid email', async () => {
    const response = await app.request('/api/v1/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'x', consent: true }),
    }, env)
    expect(response.status).toBe(400)
  })
})
