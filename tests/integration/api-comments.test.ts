import { describe, expect, it } from 'vitest'
import app from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'
import { fixtureComment } from '../fixtures/seed-data'

const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }

describe('api comments', () => {
  it('accepts article comment', async () => {
    const response = await app.request('/api/v1/articles/remont-koscielnej-zakonczony/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fixtureComment),
    }, env)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.status).toBe('pending_moderation')
  })

  it('rejects unknown article', async () => {
    const response = await app.request('/api/v1/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...fixtureComment, articleSlug: 'nie-ma' }),
    }, env)
    expect(response.status).toBe(404)
  })
})
