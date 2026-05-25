import { describe, expect, it } from 'vitest'
import app from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'

const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }

describe('api auth', () => {
  it('registers and logs in user', async () => {
    const email = `user-${Date.now()}@example.com`
    const register = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'super-bezpieczne-haslo', name: 'Test User' }),
    }, env)
    expect(register.status).toBe(201)

    const login = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'super-bezpieczne-haslo' }),
    }, env)
    const body = await login.json()
    expect(login.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.accessToken).toBeTruthy()
  })
})
