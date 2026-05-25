import { jsxRenderer } from 'hono/jsx-renderer'
import { criticalCss } from './critical-css'

const asyncStylesheet = (href: string) => (
  <>
    <link rel="preload" href={href} as="style" />
    <link rel="stylesheet" href={href} media="print" onload="this.media='all'" />
    <noscript>
      <link rel="stylesheet" href={href} />
    </noscript>
  </>
)

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="pl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta
          name="description"
          content="izbica24.pl — Magazyn Gminy Izbica Kujawska. Wiadomości, samorząd, Kujawianka, kultura, historia, ludzie."
        />
        <meta name="theme-color" content="#0a2540" />
        <meta name="color-scheme" content="light" />
        <title>{title || 'izbica24.pl — Magazyn Gminy Izbica Kujawska'}</title>

        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//picsum.photos" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://picsum.photos" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        <style>{criticalCss}</style>
        {asyncStylesheet('/static/design-tokens.css')}
        {asyncStylesheet('/static/v3-base.css')}
        {asyncStylesheet('/static/v3-header.css')}
        {asyncStylesheet('/static/v3-hero.css')}
        {asyncStylesheet('/static/v3-modules.css')}
        {asyncStylesheet('/static/v3-modules-ext.css')}
        {asyncStylesheet('/static/v3-modules-ext2.css')}
        {asyncStylesheet('/static/v3-modules-ext3.css')}
        {asyncStylesheet('/static/v3-footer.css')}
        {asyncStylesheet('/static/v3-fix.css')}
        {asyncStylesheet('/static/article-v2.css')}

        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="application/rss+xml" title="izbica24.pl — RSS" href="/rss.xml" />

        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 90'%3E%3Cpath d='M40 88 C 22 86, 6 76, 4 56 L 4 12 C 4 8, 8 4, 12 4 L 68 4 C 72 4, 76 8, 76 12 L 76 56 C 74 76, 58 86, 40 88 Z' fill='%23c8a951'/%3E%3Cpath d='M40 84 C 24 82, 9 73, 8 56 L 8 14 C 8 11, 11 8, 14 8 L 66 8 C 69 8, 72 11, 72 14 L 72 56 C 71 73, 56 82, 40 84 Z' fill='%238b1d2a'/%3E%3Cpath d='M8 56 C 14 50, 22 48, 30 50 C 38 52, 42 54, 50 51 C 58 48, 66 50, 72 56 C 71 73, 56 82, 40 84 C 24 82, 9 73, 8 56 Z' fill='%232d5a3d'/%3E%3Crect x='36' y='18' width='8' height='34' fill='%231a1a1a'/%3E%3Crect x='26' y='28' width='28' height='7' fill='%231a1a1a'/%3E%3C/svg%3E"
        />
      </head>
      <body>
        {children}
        <script>
          {`if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/static/sw.js').catch(() => undefined)) }`}
        </script>
        <script src="/static/app.js" defer></script>
        <script src="/static/v3-app.js" defer></script>
        <script src="/static/vitals.js" defer></script>
        <script src="/static/js/search-autocomplete.js" defer></script>
        <script src="/static/js/infinite-scroll.js" defer></script>
        <script src="/static/js/lazy-img.js" defer></script>
        <script src="/static/js/dark-mode-toggle.js" defer></script>
        <script src="/static/js/share-buttons.js" defer></script>
        <script src="/static/js/comments-widget.js" defer></script>
        <script src="/static/js/video-player.js" defer></script>
        <script src="/static/js/cookie-consent.js" defer></script>
        <script src="/static/js/newsletter-form.js" defer></script>
        <script src="/static/js/mobile-menu.js" defer></script>
        <script src="/static/js/read-progress.js" defer></script>
        <script src="/static/js/text-to-speech.js" defer></script>
        <script src="/static/js/font-size-control.js" defer></script>
        <script src="/static/js/print-article.js" defer></script>
        <script src="/static/js/scroll-top.js" defer></script>
      </body>
    </html>
  )
})
