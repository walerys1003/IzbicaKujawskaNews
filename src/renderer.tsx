import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="pl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="izbica24.pl — niezależny portal informacyjny Gminy Izbica Kujawska. Wiadomości, samorząd, Kujawianka, kultura, historia, ludzie." />
        <title>{title || 'izbica24.pl — Portal Gminy Izbica Kujawska'}</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />

        <link href="/static/style.css" rel="stylesheet" />
        <link href="/static/reuters.css" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ffffff'/%3E%3Ctext x='50' y='72' font-family='Inter,sans-serif' font-size='70' font-weight='700' text-anchor='middle' fill='%231a1a1a' letter-spacing='-3'%3Ei%3C/text%3E%3Crect x='32' y='84' width='36' height='4' fill='%23fa6400'/%3E%3C/svg%3E" />
      </head>
      <body>
        {children}
        <script src="/static/app.js" defer></script>
      </body>
    </html>
  )
})
