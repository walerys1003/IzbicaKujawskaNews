/*
  izbica24.pl — jeden Service Worker dla całej witryny.

  DLACZEGO TEN PLIK LEŻY W KATALOGU GŁÓWNYM, A NIE W /static/
  ------------------------------------------------------------
  Zakres (scope) Service Workera domyślnie odpowiada katalogowi, z którego
  pobrano skrypt. Poprzedni stan repozytorium wyglądał tak:

    public/static/sw.js  → zakres /static/  — miał cache + handler fetch
    public/sw.js         → zakres /         — miał handler push, bez cache

  src/renderer.tsx rejestrował /static/sw.js. Skutek zmierzony 2026-07-28:
  Service Worker o zakresie /static/ NIE kontroluje stron o adresach /,
  /artykul/..., /mapa itd. — a więc jego handler `fetch` nigdy nie dostawał
  żadnego zdarzenia nawigacyjnego. Precache w `install` wykonywał się i od
  razu stawał się martwym balastem: warstwa offline była zbudowana, wdrożona
  i całkowicie nieaktywna. Nagłówek `Service-Worker-Allowed` (jedyny sposób
  poszerzenia zakresu poza katalog skryptu) nie występował nigdzie w repo,
  co potwierdziłem greppem — nie było więc obejścia.

  Równolegle public/static/push-client.js rejestrował /sw.js, czyli DRUGI
  Service Worker. Przy odwiedzeniu strony powstawały dwie niezależne
  rejestracje o różnych zakresach: jedna umiała powiadomienia, druga
  cache — i żadna nie umiała obu rzeczy naraz.

  Rozwiązanie: jeden plik w katalogu głównym (zakres /), który obsługuje
  jedno i drugie. /static/sw.js zostaje jako skrypt migracyjny, który
  wyrejestrowuje sam siebie u czytelników mających starą rejestrację.

  CO JEST CACHOWANE
  -----------------
  Lista precache zawiera zasoby, które FAKTYCZNIE ładuje aktywny renderer
  v4 (sprawdzone przez `curl` strony głównej). Poprzednia wersja wpisywała
  pliki v3-*.css, których v4 w ogóle nie używa — pobierała je i trzymała
  w cache bez powodu.
*/

const WERSJA = 'izbica24-v5'
const CACHE_ZASOBOW = `${WERSJA}-zasoby`
const CACHE_HTML = `${WERSJA}-html`

/* Zasoby renderera v4 — zmierzone na żywo, nie przepisane z pamięci. */
const PRECACHE = [
  '/',
  '/static/v4/izbica-v4.css',
  '/static/v4/izbica-v4-ext.css',
  '/static/v4/izbica-v4.js',
  '/static/design-tokens.css',
]

const ROZSZERZENIA_ZASOBOW = /\.(?:css|js|png|jpg|jpeg|webp|avif|svg|woff2?)$/i

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_ZASOBOW)
      /*
        addAll() jest atomowe: jeśli JEDEN zasób zwróci 404, cała instalacja
        się wywala i Service Worker nigdy się nie aktywuje. Dlatego dokładam
        pliki pojedynczo i toleruję pojedyncze braki — literówka w nazwie
        pliku nie może wyłączyć całej warstwy offline.
      */
      .then((cache) => Promise.all(PRECACHE.map((adres) => cache.add(adres).catch(() => undefined))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((klucze) => Promise.all(klucze.filter((klucz) => !klucz.startsWith(WERSJA)).map((klucz) => caches.delete(klucz))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const zadanie = event.request
  if (zadanie.method !== 'GET') return

  const adres = new URL(zadanie.url)
  if (adres.origin !== self.location.origin) return

  /*
    Żądania do API nigdy nie idą przez cache. Bez tego wyjątku panel
    redakcyjny pokazywałby nieaktualne liczby dostarczeń, a /api/push/*
    zwracałoby odpowiedzi z poprzedniej sesji.
  */
  if (adres.pathname.startsWith('/api/')) return

  if (ROZSZERZENIA_ZASOBOW.test(adres.pathname)) {
    event.respondWith(
      caches.match(zadanie).then((zapisane) => {
        if (zapisane) return zapisane
        return fetch(zadanie).then((odpowiedz) => {
          if (odpowiedz.ok) {
            const kopia = odpowiedz.clone()
            caches.open(CACHE_ZASOBOW).then((cache) => cache.put(zadanie, kopia))
          }
          return odpowiedz
        })
      })
    )
    return
  }

  /* Dokumenty HTML: najpierw sieć, cache jako zapas przy braku łączności. */
  event.respondWith(
    fetch(zadanie)
      .then((odpowiedz) => {
        if (odpowiedz.ok) {
          const kopia = odpowiedz.clone()
          caches.open(CACHE_HTML).then((cache) => cache.put(zadanie, kopia))
        }
        return odpowiedz
      })
      .catch(() => caches.match(zadanie).then((zapisane) => zapisane || caches.match('/')))
  )
})

self.addEventListener('push', (event) => {
  /*
    Ładunek jest szyfrowany aes128gcm (RFC 8291) i odszyfrowuje go
    przeglądarka — tu dostajemy już czysty JSON z src/lib/push/webpush.ts.
    event.data.json() rzuca wyjątkiem przy ładunku, który nie jest JSON-em
    (np. testowa wysyłka z konsoli dostawcy), więc parsuję defensywnie:
    powiadomienie musi się pokazać nawet wtedy.
  */
  let ladunek = {}
  try {
    ladunek = event.data ? event.data.json() : {}
  } catch (blad) {
    ladunek = { body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(
    self.registration.showNotification(ladunek.title || 'izbica24.pl', {
      body: ladunek.body || 'Nowe powiadomienie z portalu.',
      icon: ladunek.icon || '/static/img/logo.svg',
      badge: '/static/img/logo.svg',
      /*
        tag = grupowanie. Bez niego dwadzieścia wysyłek daje dwadzieścia
        osobnych powiadomień na ekranie blokady telefonu.
      */
      tag: ladunek.tag || 'izbica24',
      data: { url: ladunek.url || '/', messageId: ladunek.messageId || null },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const cel = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((okna) => {
      /*
        Jeśli portal jest już otwarty w jakiejś karcie, przełączam na nią
        i nawiguję. openWindow() bez tego sprawdzenia otwierałby kolejną
        kartę przy każdym kliknięciu powiadomienia.
      */
      for (const okno of okna) {
        if (new URL(okno.url).origin === self.location.origin && 'focus' in okno) {
          okno.navigate?.(cel)
          return okno.focus()
        }
      }
      return self.clients.openWindow(cel)
    })
  )
})

/*
  Przeglądarka może unieważnić subskrypcję bez udziału użytkownika
  (rotacja kluczy, czyszczenie danych). Wtedy dostajemy to zdarzenie
  i trzeba zapisać nową subskrypcję — inaczej czytelnik po cichu
  przestaje dostawać powiadomienia, a panel dalej liczy go jako aktywnego.
*/
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const stara = event.oldSubscription || (await self.registration.pushManager.getSubscription())
      const odp = await fetch('/api/push/vapid-public-key')
      if (!odp.ok) return
      const { publicKey } = await odp.json()

      const dopelnione = `${publicKey}${'='.repeat((4 - (publicKey.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
      const binarne = atob(dopelnione)
      const bajty = new Uint8Array(binarne.length)
      for (let i = 0; i < binarne.length; i += 1) bajty[i] = binarne.charCodeAt(i)

      const nowa = event.newSubscription || (await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: bajty,
      }))

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: nowa.endpoint,
          keys: nowa.toJSON().keys || {},
          poprzedniEndpoint: stara ? stara.endpoint : undefined,
          categories: ['wiadomosci'],
          segments: ['homepage'],
          locale: 'pl-PL',
        }),
      })
    })()
  )
})
