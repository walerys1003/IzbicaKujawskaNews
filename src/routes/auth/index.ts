import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'

import twoFactorEnable from './2fa-enable'
import twoFactorVerify from './2fa-verify'
import apiKeys from './api-keys'
import changePassword from './change-password'
import deleteAccount from './delete-account'
import login from './login'
import logout from './logout'
import magicLink from './magic-link'
import profile from './profile'
import refresh from './refresh'
import register from './register'
import resetPassword from './reset-password'
import sessions from './sessions'
import socialFacebook from './social-facebook'
import socialGoogle from './social-google'
import verifyEmail from './verify-email'

/**
 * Agregator modułu uwierzytelniania.
 *
 * Do tej pory katalog src/routes/auth/ zawierał 16 gotowych plików tras,
 * ale nie istniał żaden plik zbiorczy ani żadne `app.route()` w src/index.tsx.
 * Efekt: POST /api/v1/auth/login zwracał 404, mimo że kod obsługi istniał.
 *
 * Każdy plik składowy definiuje pełną ścieżkę względną (np. '/login'),
 * dlatego wszystkie montowane są na katalogu głównym tego routera.
 */
const auth = new Hono<AppEnv>()

// --- Rejestracja i logowanie ---
auth.route('/', register)          // POST   /register
auth.route('/', login)             // POST   /login          (rate limit 5/min)
auth.route('/', logout)            // POST   /logout         (wymaga tokenu)
auth.route('/', refresh)           // POST   /refresh
auth.route('/', magicLink)         // POST   /magic
auth.route('/', verifyEmail)       // GET    /verify/:token

// --- Hasła ---
auth.route('/', resetPassword)     // POST   /reset
auth.route('/', changePassword)    // POST   /change-password (wymaga tokenu)

// --- Uwierzytelnianie dwuskładnikowe ---
auth.route('/', twoFactorEnable)   // POST   /2fa/enable
auth.route('/', twoFactorVerify)   // POST   /2fa/verify

// --- Konto i sesje ---
auth.route('/', profile)           // GET,PUT /profile        (wymaga tokenu)
auth.route('/', sessions)          // GET    /sessions        (wymaga tokenu)
auth.route('/', deleteAccount)     // DELETE /account         (wymaga tokenu)
auth.route('/', apiKeys)           // GET,POST,DELETE /api-keys (rola author+)

// --- Logowanie przez dostawców zewnętrznych ---
auth.route('/', socialGoogle)      // GET    /social/google
auth.route('/', socialFacebook)    // GET    /social/facebook

/** Indeks modułu — pozwala zweryfikować montaż bez wywoływania tras chronionych. */
auth.get('/', (c) => c.json({
  module: 'auth',
  version: 'v1',
  endpoints: [
    { method: 'POST', path: '/api/v1/auth/register' },
    { method: 'POST', path: '/api/v1/auth/login', note: 'limit 5 prób / 60 s' },
    { method: 'POST', path: '/api/v1/auth/logout', auth: true },
    { method: 'POST', path: '/api/v1/auth/logout-all', auth: true, note: '?keepCurrent=1 zachowuje biezaca sesje' },
    { method: 'POST', path: '/api/v1/auth/refresh' },
    { method: 'POST', path: '/api/v1/auth/magic' },
    { method: 'GET', path: '/api/v1/auth/verify/:token' },
    { method: 'POST', path: '/api/v1/auth/reset' },
    { method: 'POST', path: '/api/v1/auth/change-password', auth: true },
    { method: 'POST', path: '/api/v1/auth/2fa/enable', auth: true },
    { method: 'POST', path: '/api/v1/auth/2fa/verify', auth: true },
    { method: 'POST', path: '/api/v1/auth/2fa/disable', auth: true, note: 'wymaga hasla' },
    { method: 'GET', path: '/api/v1/auth/profile', auth: true },
    { method: 'PUT', path: '/api/v1/auth/profile', auth: true },
    { method: 'GET', path: '/api/v1/auth/sessions', auth: true },
    { method: 'DELETE', path: '/api/v1/auth/sessions/:id', auth: true },
    { method: 'DELETE', path: '/api/v1/auth/account', auth: true, note: 'wymaga hasla + confirm' },
    { method: 'GET', path: '/api/v1/auth/api-keys', auth: true, permission: 'article:create' },
    { method: 'POST', path: '/api/v1/auth/api-keys', auth: true, permission: 'article:create' },
    { method: 'DELETE', path: '/api/v1/auth/api-keys/:id', auth: true, permission: 'article:create' },
    { method: 'GET', path: '/api/v1/auth/social/google' },
    { method: 'GET', path: '/api/v1/auth/social/facebook' },
  ],
}))

export default auth
