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
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap" rel="stylesheet" />

        <link href="/static/style.css" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23faf9f6'/%3E%3Ctext x='50' y='70' font-family='Playfair Display,serif' font-size='65' font-weight='900' text-anchor='middle' fill='%230a0a0a'%3Ei%3C/text%3E%3Ccircle cx='50' cy='85' r='4' fill='%23c0392b'/%3E%3C/svg%3E" />
      </head>
      <body>
        {children}
        <script src="/static/app.js" defer></script>
      </body>
    </html>
  )
})
