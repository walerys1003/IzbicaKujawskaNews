// ============================================================================
// IZBICA24.PL v4 — RENDERER (head literalnie zgodny z szatą graficzną)
// ============================================================================

import { jsxRenderer } from 'hono/jsx-renderer'

export const rendererV4 = jsxRenderer(({ children, title, description, ogImage, canonical }) => {
  const pageTitle =
    (title as string) || 'Izbica24.pl — Niezależny portal informacyjny gminy Izbica Kujawska'
  const desc =
    (description as string) ||
    'Aktualne wiadomości z Izbicy Kujawskiej. Samorząd, Kujawianka, kultura, historia, sołectwa.'

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
        {canonical ? <link rel="canonical" href={canonical as string} /> : null}

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
      </body>
    </html>
  )
})
