// SA4: Security headers middleware
import type { Context } from 'hono'
import type { AppEnv } from '../types/env'

export const securityHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next()

  const res = c.res

  // HSTS (HTTP Strict Transport Security)
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // CSP (Content-Security-Policy)
  res.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    // `https://*.cartocdn.com` — sprite podkładu mapy (PNG/JSON) na /mapa.
    "img-src 'self' data: blob: https://*.izbica24.pl https://*.r2.cloudflarestorage.com https://*.cloudflarestream.com https://*.cartocdn.com",
    "font-src 'self' https://fonts.gstatic.com",
    // FAZA 4 / I10 — MapLibre GL JS tworzy własny Web Worker do dekodowania
    // kafli wektorowych, i robi to z adresu blob:. Bez tego wpisu worker-src
    // dziedziczy po default-src 'self', przeglądarka odrzuca blob:
    // i konstruktor Map kończy wyjątkiem — mapa nie rysuje się wcale.
    "worker-src 'self' blob:",
    "media-src 'self' https://*.r2.cloudflarestorage.com https://*.cloudflarestream.com",
    // FAZA 3 / AI1 — usuniete `https://api.openai.com` i `https://api.anthropic.com`.
    //
    // Ten wpis nie mial zadnego dzialania, a byl mylacy. Zapytania do dostawcy
    // modeli ida z WORKERA (kod serwerowy), a CSP ogranicza wylacznie zapytania
    // wychodzace z PRZEGLADARKI — regula nigdy nie byla stosowana.
    //
    // Gorzej: jej obecnosc sugerowala, ze przegladarka moze rozmawiac
    // z dostawca bezposrednio. Taki uklad wymagalby wyslania klucza API do
    // przegladarki, gdzie kazdy czytelnik odczytalby go z zakladki „Siec”.
    // Klucz zostaje po stronie serwera, a panel rozmawia wylacznie
    // z `/api/v1/ai/*` pod wlasnym adresem — czyli 'self'.
    //
    // Dodatkowa korzysc: zmiana dostawcy (Groq, OpenRouter, wlasny adres)
    // nie wymaga juz ruszania naglowkow bezpieczenstwa.
    // FAZA 4 / I10 — dodane hosty podkładu mapy na /mapa:
    //   basemaps.cartocdn.com  — plik stylu (style.json)
    //   tiles.basemaps.cartocdn.com — kafle wektorowe, glify czcionek, sprite
    // MapLibre pobiera kafle przez fetch/XHR, więc rządzi tym connect-src,
    // a nie img-src. Przy samym 'self' strona zwracała 200, kontener mapy
    // powstawał, ale nie pojawiał się w nim ani jeden kafel.
    //
    // Lista jest domknięta świadomie: nie ma tu żadnego wildcardu w rodzaju
    // https: — dopisujemy dokładnie te hosty, które podkład realnie woła
    // (sprawdzone w style.json: glyphs, sprite, sources.carto.url).
    // Wildcard *.cartocdn.com jest tu konieczny, nie wygodny. Plik
    // tiles.json rozdziela ruch na CZTERY hosty — tiles-a, tiles-b, tiles-c
    // i tiles-d .basemaps.cartocdn.com (klasyczny sharding kafli). Styl
    // wczytywał się poprawnie, ale każdy kafel padał na „Failed to fetch”,
    // więc mapa pokazywała pustą, białą planszę ze znacznikami.
    // Nazwy hostów są ustalane przez CARTO w czasie działania i mogą się
    // zmienić bez naszej wiedzy, dlatego wyliczanie ich pojedynczo byłoby
    // kruche — ograniczamy się do jednej domeny dostawcy podkładu.
    "connect-src 'self' https://*.izbica24.pl https://*.cartocdn.com",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://www.facebook.com",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '))

  // X-Frame-Options (fallback dla starszych przeglądarek)
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // X-Content-Type-Options
  res.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy
  res.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'interest-cohort=()',
  ].join(', '))

  // X-XSS-Protection (legacy)
  res.headers.set('X-XSS-Protection', '1; mode=block')

  // X-DNS-Prefetch-Control
  res.headers.set('X-DNS-Prefetch-Control', 'on')

  // Cache-Control for static assets (handled by CF, but set safe defaults)
  if (!res.headers.has('Cache-Control')) {
    res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  }
}

// ════════════════════════════════════════════════════════════════════════════
// USUNIĘTO: corsHeaders (FAZA 1 / A7)
//
// Poprzednia implementacja odbijała dowolną wartość nagłówka Origin
// i jednocześnie ustawiała Access-Control-Allow-Credentials: true.
// To zestawienie całkowicie znosi ochronę CORS — obca witryna mogła
// odczytać odpowiedzi API z ciasteczkiem sesji zalogowanego redaktora.
//
// Zastąpione przez src/middleware/cors.ts (corsMiddleware) z zamkniętą
// listą dozwolonych domen. Nie przywracać tej funkcji.
// ════════════════════════════════════════════════════════════════════════════
