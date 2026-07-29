// ============================================================================
// IZBICA24.PL v4 — RENDERER (head literalnie zgodny z szatą graficzną)
// ============================================================================

import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
// Etap I12 — baner zgody na analitykę. Musi być w rendererze, a nie
// w Shell: Shell nie jest używany na wszystkich stronach (panel redakcji,
// strony błędów), a obowiązek uzyskania zgody dotyczy każdej odsłony.
import { ZgodaCookies } from './components/ZgodaCookies'
import { buildCanonicalUrl, buildOrganizationJsonLd } from '../seo'

export const rendererV4 = jsxRenderer(({ children, title, description, ogImage, canonical, jsonLd, headLinks }) => {
  /**
   * Token analityki czytamy z kontekstu żądania, nie z propsów.
   *
   * Alternatywą byłoby przekazywanie go przez `c.render(..., { token })`
   * w każdej z ponad dwudziestu tras — jedno pominięcie oznaczałoby
   * podstronę bez pomiaru albo, co gorsza, bez banera przy działającym
   * pomiarze. Kontekst żądania jest tu jedynym źródłem, więc nie da się
   * o nim zapomnieć.
   */
  const ctx = useRequestContext()
  const tokenAnalityki = (ctx?.env as { CF_ANALYTICS_TOKEN?: string } | undefined)
    ?.CF_ANALYTICS_TOKEN
  const pageTitle =
    (title as string) || 'Izbica24.pl — Niezależny portal informacyjny gminy Izbica Kujawska'
  const desc =
    (description as string) ||
    'Aktualne wiadomości z Izbicy Kujawskiej. Samorząd, Kujawianka, kultura, historia, sołectwa.'

  /**
   * F5 / SEO — adres kanoniczny wyliczany z kontekstu żądania.
   *
   * Slot `<link rel="canonical">` istniał tu już wcześniej, ale zależał od
   * propsa `canonical` przekazywanego przez trasę. Żadna z 22 tras go nie
   * przekazywała, więc audyt zmierzył zero wystąpień w wygenerowanym HTML —
   * mechanizm był obecny w kodzie i nieobecny na stronie.
   *
   * Dlatego domyślną wartość liczymy TUTAJ ze ścieżki żądania, tak jak
   * token analityki dwie linijki wyżej i z tego samego powodu: przy 22
   * trasach każde rozwiązanie wymagające pamiętania o dopisaniu propsa
   * kończy się brakami. Trasa może nadal podać `canonical` jawnie i wtedy
   * jej wartość ma pierwszeństwo — to potrzebne np. przy stronicowaniu,
   * gdzie /wiadomosci?strona=2 ma wskazywać na /wiadomosci.
   *
   * `buildCanonicalUrl` (src/seo.ts, przetestowane w tests/unit/seo/) obcina
   * parametry zapytania i normalizuje ukośnik końcowy — bez tego /szukaj?q=x
   * i /szukaj byłyby dla wyszukiwarki dwoma adresami o tej samej treści,
   * a parametry utm_* mnożyłyby duplikaty.
   */
  const sciezka = ctx?.req?.path ?? '/'
  const adresKanoniczny = (canonical as string) || buildCanonicalUrl(sciezka)

  /**
   * JSON-LD. Dane organizacji dokładamy na KAŻDEJ podstronie, bo Google
   * czyta je z dowolnego adresu i nie ma pewności, którą stronę zindeksuje
   * pierwszą. Trasa może dołożyć własny obiekt (NewsArticle na artykule,
   * BreadcrumbList w kategorii) — wtedy w dokumencie znajdą się oba, co jest
   * zgodne ze specyfikacją schema.org i zalecane przez Google.
   *
   * `JSON.stringify` z filtrem `undefined` — pola opcjonalne (np.
   * dateModified przy artykule bez aktualizacji) nie mogą wyjść jako
   * "dateModified": null, bo walidator Google traktuje null jako błąd typu.
   */
  const dodatkoweJsonLd = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []
  const wszystkieJsonLd = [buildOrganizationJsonLd(), ...dodatkoweJsonLd]

  return (
    <html lang="pl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <meta name="description" content={desc} />
        <meta name="theme-color" content="#d6121a" />

        {/* Open Graph / Twitter */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Izbica24.pl" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:locale" content="pl_PL" />
        {ogImage ? <meta property="og:image" content={ogImage as string} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:url" content={adresKanoniczny} />
        <link rel="canonical" href={adresKanoniczny} />
        {/*
          Paginacja — link rel="next"/"prev". Wskazują odpowiedź Google na
          kolejne/poprzednie strony serii (page=2, page=3, …). Trasowany
          renderer dostaje `headLinks` z routera; tutaj tylko mapujemy je
          na tagi. Pusta tablica oznacza „brak paginacji" — nic nie renderujemy.
        */}
        {Array.isArray(headLinks) && headLinks.length > 0
          ? (headLinks as Array<{ rel: string; href: string }>).map((l) => (
              <link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} />
            ))
          : null}

        {/* Fonty — literalnie jak w szacie */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Barlow:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />

        {/* Szata graficzna — CSS 1:1 z index.html + rozszerzenia podstron */}
        <link rel="stylesheet" href="/static/v4/izbica-v4.css" />
        <link rel="stylesheet" href="/static/v4/izbica-v4-ext.css" />

        <link rel="alternate" type="application/rss+xml" title="Izbica24.pl — RSS" href="/rss.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230a0a0a'/%3E%3Ctext x='16' y='23' font-family='Arial Narrow,sans-serif' font-size='19' font-weight='900' fill='%23d6121a' text-anchor='middle'%3E24%3C/text%3E%3C/svg%3E"
        />
        {/* F5 — dane strukturalne. Każdy obiekt w osobnym <script>, bo
            pojedynczy blok z tablicą jest wprawdzie dopuszczalny, ale
            narzędzie testowe Google raportuje wtedy błędy zbiorczo, bez
            wskazania, który obiekt jest wadliwy. */}
        {wszystkieJsonLd.map((obiekt, i) => (
          <script
            key={i}
            type="application/ld+json"
            /* eslint-disable-next-line react/no-danger */
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(obiekt, (_k, v) => (v === undefined ? undefined : v)).replace(
                /</g,
                '\\u003c',
              ),
            }}
          />
        ))}
      </head>
      <body>
        {children}
        <script src="/static/v4/izbica-v4.js" defer></script>
        {/*
          Etap I5 — pogoda w pasku górnym. Osobny plik (~2 kB) zamiast
          dopisku do izbica-v4.js: pasek jest pierwszym elementem strony,
          więc im wcześniej się uzupełni, tym mniejszy przeskok układu.
        */}
        <script src="/static/v4/izbica-v4-pogoda.js" defer></script>
        {/*
          Etap I10 — mapa gminy. Skrypt jest ładowany na każdej podstronie,
          ale waży ~3 kB i natychmiast kończy działanie, gdy w dokumencie
          nie ma kontenera #mapa-gminy. Ciężka biblioteka MapLibre (~250 kB)
          jest dokładana dopiero wtedy, gdy kontener istnieje — czyli
          wyłącznie na /mapa. Dzięki temu strona główna i artykuły nie
          płacą za mapę, której czytelnik nie otworzył (etap F4).
        */}
        <script src="/static/v4/izbica-v4-mapa.js" defer></script>
        {/*
          Etap I12 — zgoda na analitykę.

          Baner stoi na końcu <body>, a skrypt analityczny NIE jest tu
          w ogóle obecny: wstrzykuje go dopiero izbica-v4-zgoda.js po
          kliknięciu „Zgadzam się". Gdyby beacon.min.js stał w <head>
          (typowe wdrożenie), pomiar odbywałby się przed zgodą i zgoda
          byłaby pozorna.
        */}
        <ZgodaCookies token={tokenAnalityki} />
        <script src="/static/v4/izbica-v4-zgoda.js" defer></script>
        {/*
          Etap I8 — powiadomienia push.

          Rejestracja celowo wskazuje /sw.js, NIE /static/sw.js. Zakres
          Service Workera wynika z katalogu, z którego pobrano skrypt, a
          nagłówka Service-Worker-Allowed nie ustawiamy nigdzie w projekcie
          (sprawdzone greppem 2026-07-28). Worker z /static/ nie kontrolowałby
          adresów /, /artykul/... ani /mapa — jego handler `fetch` nigdy nie
          dostawałby zdarzenia, więc cała warstwa offline byłaby martwa.
          Dokładnie taki stan zastałem w v3 rendererze.

          Rejestruję po zdarzeniu `load`, żeby pobranie i instalacja workera
          nie konkurowały o pasmo z zasobami widocznej części strony (LCP).
        */}
        {/*
          UWAGA — dlaczego dangerouslySetInnerHTML, a nie <script>{'...'}</script>.

          Zmierzone 2026-07-28: Hono JSX traktuje dziecko elementu <script>
          jak zwykły tekst i escapuje apostrofy do &#39;. Wewnątrz <script>
          przeglądarka NIE dekoduje encji HTML (to element typu raw text),
          więc do silnika JS trafiał literalny ciąg &#39;serviceWorker&#39;
          i skrypt kończył się SyntaxError. Ten sam wzorzec stał w
          src/renderer.tsx od początku projektu — rejestracja Service Workera
          nigdy w tym portalu nie zadziałała. Audyt raportował ją jako
          „gotową", bo obecność <script> w kodzie źródłowym sprawdzono
          wzrokowo, a nie przez uruchomienie.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}",
          }}
        />
        <script src="/static/push-client.js" defer></script>
      </body>
    </html>
  )
})
