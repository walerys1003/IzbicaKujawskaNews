/**
 * FAZA 1 / A7 — plik zachowany wyłącznie dla zgodności importów.
 *
 * Poprzednia implementacja trzymała licznik żądań w `new Map()`, czyli
 * w pamięci JEDNEJ instancji Workera. Na Cloudflare kolejne żądania tego
 * samego klienta trafiają do różnych izolatów, a izolat jest usypiany po
 * krótkiej bezczynności — licznik zerował się sam i praktycznie nigdy nie
 * dobijał do limitu. Atak słownikowy na logowanie przechodził swobodnie,
 * mimo że w kodzie „był rate limit”. Dodatkowo mapa rosła bez ograniczeń.
 *
 * Prawdziwa implementacja mieszka teraz w src/middleware/rate-limit.ts
 * i opiera się na RATE_LIMIT_KV — magazynie współdzielonym przez wszystkie
 * instancje.
 *
 * NIE dodawać tu logiki. Importować bezpośrednio z ../../../middleware/rate-limit.
 */

export {
  rateLimit as rateLimitConfigured,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  commentRateLimit,
  uploadRateLimit,
  aiRateLimit,
  newsletterRateLimit,
  contactRateLimit,
  searchRateLimit,
} from '../../../middleware/rate-limit'

import { rateLimit as configuredRateLimit } from '../../../middleware/rate-limit'

/**
 * Adapter dawnej sygnatury `rateLimit(limit, windowMs)`.
 * Pozostaje, aby ewentualne nieodnalezione wywołania nadal działały —
 * ale już z trwałym licznikiem w KV.
 *
 * @deprecated Używać profili z src/middleware/rate-limit.ts.
 */
export const rateLimit = (limit = 5, windowMs = 60_000) =>
  configuredRateLimit({ name: 'legacy', limit, windowMs })
