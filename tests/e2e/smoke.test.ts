// SA10: Expanded E2E smoke tests
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

test.describe('Smoke Tests — izbica24.pl', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('static pages return 200', async ({ page }) => {
    const pages = ['/kontakt', '/redakcja', '/reklama', '/regulamin', '/polityka-prywatnosci', '/polityka-cookies']
    for (const path of pages) {
      const response = await page.goto(`${BASE_URL}${path}`)
      expect(response?.status(), `Page ${path} should return 200`).toBe(200)
    }
  })

  test('article page loads', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/wiadomosci`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('search page loads', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/szukaj?q=test`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('API health endpoint returns JSON', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/health`)
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('ok', true)
  })

  test('sitemap.xml returns valid XML', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`)
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain('<?xml')
  })

  test('robots.txt exists', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`)
    expect(response.status()).toBe(200)
  })

  test('RSS feed returns XML', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/rss.xml`)
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain('<rss')
  })

  test('404 page returns 404', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/this-page-does-not-exist-404`)
    expect(response?.status()).toBe(404)
  })

  test('shared pages are accessible', async ({ page }) => {
    const sharedPages = ['/dla-prasy', '/kariera', '/dostepnosc']
    for (const path of sharedPages) {
      const response = await page.goto(`${BASE_URL}${path}`)
      expect(response?.status(), `Page ${path}`).toBeLessThan(500)
    }
  })
})
