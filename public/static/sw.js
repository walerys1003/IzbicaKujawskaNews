const VERSION = 'izbica24-v4'
const STATIC_CACHE = `${VERSION}-static`
const HTML_CACHE = `${VERSION}-html`
const STATIC_EXTENSIONS = /\.(?:css|js|png|jpg|jpeg|webp|avif|svg|woff2?)$/i

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll([
          '/',
          '/static/design-tokens.css',
          '/static/v3-base.css',
          '/static/v3-header.css',
          '/static/v3-hero.css',
          '/static/v3-modules.css',
          '/static/v3-fix.css',
        ])
      )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
      })
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(HTML_CACHE).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  )
})
