import { expect, test } from '@playwright/test'
import { ARTICLES, findArticle, searchArticles } from '../../src/data-articles'
import { buildCanonicalUrl, buildArticleJsonLd } from '../../src/seo'

test('smoke: homepage', async () => {
  expect(ARTICLES.length).toBeGreaterThan(5)
  expect(ARTICLES[0].title).toContain('Kościelnej')
  expect(buildCanonicalUrl('/')).toBe('https://izbica24.pl/')
})

test('smoke: article page', async () => {
  const article = findArticle('remont-koscielnej-zakonczony')
  expect(article?.title).toContain('Kościelnej')
  expect(buildArticleJsonLd(article!).headline).toContain('Kościelnej')
})

test('smoke: search page', async () => {
  const results = searchArticles('sesja')
  expect(results.length).toBeGreaterThan(0)
  expect(results[0].title.toLowerCase()).toContain('sesja')
})
