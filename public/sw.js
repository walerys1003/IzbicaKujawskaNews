self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : { title: 'izbica24.pl', body: 'Nowe powiadomienie', url: '/' }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'izbica24.pl', {
      body: payload.body || 'Nowe powiadomienie',
      icon: '/static/img/logo.svg',
      badge: '/static/img/logo.svg',
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(self.clients.openWindow(targetUrl))
})
