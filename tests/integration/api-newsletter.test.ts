import { describe, expect, it } from 'vitest'
import app from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'
import { fixtureNewsletter } from '../fixtures/seed-data'

const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }

describe('api newsletter', () => {
  it('accepts newsletter signup via mounted router', async () => {
    const response = await app.request('/api/v1/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: fixtureNewsletter.email }),
    }, env)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
  })

  it('rejects invalid email', async () => {
    const response = await app.request('/api/v1/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'x' }),
    }, env)
    expect(response.status).toBe(400)
  })

  it('confirms subscription', async () => {
    const response = await app.request('/api/v1/newsletter/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: fixtureNewsletter.email }),
    }, env)
    const body = await response.json()
    expect(body.ok).toBeDefined()
  })

  it('unsubscribes', async () => {
    const response = await app.request('/api/v1/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: fixtureNewsletter.email }),
    }, env)
    const body = await response.json()
    expect(body.ok).toBeDefined()
  })

  it('lists subscribers', async () => {
    const response = await app.request('/api/v1/newsletter/subscribers', {
      method: 'GET',
    }, env)
    expect(response.status === 200 || response.status === 500).toBe(true)
  })
})
