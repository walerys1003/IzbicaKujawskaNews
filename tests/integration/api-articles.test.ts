import { describe, expect, it } from 'vitest'
import app from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'

const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }

describe('api articles', () => {
  it('lists articles', async () => {
    const response = await app.request('/api/v1/articles?limit=2', {}, env)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(2)
  })

  it('returns article detail', async () => {
    const response = await app.request('/api/v1/articles/remont-koscielnej-zakonczony', {}, env)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.slug).toBe('remont-koscielnej-zakonczony')
  })
})
