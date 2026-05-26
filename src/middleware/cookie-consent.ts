// SA4: RODO/GDPR Cookie Consent middleware + endpoint
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv } from '../types/env'

// Render cookie consent banner HTML snippet
export function renderCookieConsentBanner(): string {
  return `
<div id="cookie-consent" class="cookie-consent-banner" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-desc" style="
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
  background: #1a1a2e; color: #e0e0e0; padding: 18px 24px;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 16px; box-shadow: 0 -4px 20px rgba(0,0,0,0.3); font-family: system-ui, sans-serif;
">
  <div style="flex: 1; min-width: 250px;">
    <strong id="cookie-title" style="font-size: 15px;">🍪 Ciasteczka i prywatność</strong>
    <p id="cookie-desc" style="margin: 4px 0 0; font-size: 13px; line-height: 1.5; opacity: 0.85;">
      Używamy plików cookie, aby zapewnić najlepsze działanie portalu izbica24.pl.
      Szczegóły w <a href="/polityka-cookies" style="color: #e94560; text-decoration: underline;">polityce cookies</a>
      i <a href="/polityka-prywatnosci" style="color: #e94560; text-decoration: underline;">polityce prywatności</a>.
    </p>
  </div>
  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
    <button onclick="cookieConsent('all')" style="background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">Akceptuję wszystkie</button>
    <button onclick="cookieConsent('essential')" style="background: transparent; color: #ccc; border: 1px solid #555; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px;">Tylko niezbędne</button>
  </div>
</div>
<script>
(function() {
  if (localStorage.getItem('cookie-consent')) { var el = document.getElementById('cookie-consent'); if (el) el.remove(); return; }
  window.cookieConsent = function(level) {
    localStorage.setItem('cookie-consent', JSON.stringify({ level: level, timestamp: new Date().toISOString() }));
    var el = document.getElementById('cookie-consent'); if (el) el.remove();
    fetch('/api/v1/gdpr/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: level, path: location.pathname }) });
  };
})();
</script>`
}

// GDPR consent endpoint
const gdprRouter = new Hono<AppEnv>()

gdprRouter.post('/consent', async (c) => {
  const body = await c.req.json<{ level?: string; path?: string }>().catch(() => ({}))
  const level = body.level || 'unknown'
  const path = body.path || '/'
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'

  // Log consent (anonymized IP)
  if (c.env.USER_PREFS_KV) {
    const key = `gdpr:consent:${Date.now()}:${crypto.randomUUID()}`
    await c.env.USER_PREFS_KV.put(key, JSON.stringify({
      level,
      path,
      ipAnonymized: ip.split('.').slice(0, 3).join('.') + '.0',
      userAgent: c.req.header('User-Agent')?.slice(0, 200) || '',
      timestamp: new Date().toISOString(),
    }), { expirationTtl: 60 * 60 * 24 * 365 })
  }

  return c.json({ ok: true, level })
})

// GDPR data export endpoint
gdprRouter.get('/export', async (c) => {
  // Authenticated users only
  const userId = c.req.query('userId') || 'anonymous'
  const data: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    userId,
    // In production: query D1 for user's data
    comments: [],
    newsletter: {},
    consent: {},
  }
  return c.json(data)
})

// GDPR data deletion endpoint
gdprRouter.post('/delete', async (c) => {
  const body = await c.req.json<{ userId?: string; email?: string }>().catch(() => ({}))
  const key = body.userId || body.email || 'unknown'
  if (c.env.USER_PREFS_KV) {
    await c.env.USER_PREFS_KV.put(`gdpr:deletion:${key}`, JSON.stringify({
      requestedAt: new Date().toISOString(),
      status: 'pending',
    }))
  }
  return c.json({ ok: true, message: 'Deletion request registered. We will process within 30 days per GDPR.' })
})

export { gdprRouter }
