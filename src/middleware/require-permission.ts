/**
 * FAZA 1 / B3 — wymuszanie uprawnien na trasach zapisu.
 *
 * Poprzednie `requireRole(['author','editor','admin'])` sprawdzalo NAZWY rol
 * wypisane w kazdym pliku trasy osobno. Wady tego podejscia:
 *   • dodanie roli (np. moderator) wymagaloby przejrzenia wszystkich tras,
 *   • latwo bylo pominac role przy jednej trasie i stworzyc luke,
 *   • z listy rol nie wynikalo, JAKIE uprawnienie trasa faktycznie wymaga.
 *
 * Teraz trasa deklaruje UPRAWNIENIE, nie liste rol. Powiazanie uprawnien
 * z rolami zyje w jednym miejscu (src/lib/auth/roles.ts), wiec zmiana
 * macierzy dziala natychmiast na calym API.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { fail } from '../lib/http/envelope'
import { hasPermission, hasAnyPermission, toRole, type Permission, type Role } from '../lib/auth/roles'

/**
 * Tozsamosc ustawiana przez requireAuth. Pola sa wymagane, poniewaz
 * requireAuth ustawia kontekst dopiero po pomyslnej weryfikacji tokenu
 * ORAZ potwierdzeniu, ze sesja nadal istnieje — nigdy czesciowo. Gdyby byly
 * opcjonalne, kazde uzycie wymagaloby zbednego sprawdzania `?.`, co w kodzie
 * autoryzacji zacieralo by roznice miedzy „brak danych” a „brak uprawnien”.
 */
export interface AuthContext {
  sub: string
  email: string
  role: Role
  sessionId: string
}

/** Odczyt tozsamosci ustawionej przez requireAuth. */
export const getAuth = (c: { get: (key: never) => unknown }): AuthContext | undefined =>
  c.get('auth' as never) as AuthContext | undefined

/** Rola zalogowanego uzytkownika, znormalizowana do modelu 6 rol. */
export const getRole = (c: { get: (key: never) => unknown }): Role | undefined => {
  const auth = getAuth(c)
  return auth?.role ? toRole(auth.role) : undefined
}

/**
 * Wymaga konkretnego uprawnienia.
 *
 *   route.post('/', requireAuth, requirePermission('article:create'), handler)
 */
export const requirePermission = (permission: Permission) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const auth = getAuth(c as never)
    if (!auth?.sub) {
      return fail(c, 'unauthorized', 'Wymagane zalogowanie.')
    }

    const role = toRole(auth.role)
    if (!hasPermission(role, permission)) {
      console.warn(`[uprawnienia] Odmowa: ${auth.email ?? auth.sub} (rola ${role}) probowal ${permission} na ${c.req.path}`)
      return fail(c, 'forbidden', 'Twoja rola nie pozwala na wykonanie tej operacji.', {
        wymaganeUprawnienie: permission,
        twojaRola: role,
      })
    }

    await next()
  })

/** Wymaga co najmniej jednego z podanych uprawnien. */
export const requireAnyPermission = (permissions: Permission[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const auth = getAuth(c as never)
    if (!auth?.sub) return fail(c, 'unauthorized', 'Wymagane zalogowanie.')

    const role = toRole(auth.role)
    if (!hasAnyPermission(role, permissions)) {
      return fail(c, 'forbidden', 'Twoja rola nie pozwala na wykonanie tej operacji.', {
        wymaganeJednoZ: permissions,
        twojaRola: role,
      })
    }
    await next()
  })

/**
 * Uprawnienie zalezne od wlasnosci zasobu.
 *
 * Autor moze poprawiac WLASNY artykul, redaktor — dowolny. Zamiast
 * powtarzac te logike w kazdym handlerze, middleware sprawdza najpierw
 * uprawnienie „do dowolnego”, a gdy go brak — uprawnienie „do wlasnego”
 * i zgodnosc autora zasobu z zalogowanym uzytkownikiem.
 *
 * @param ownPermission  np. 'article:update:own'
 * @param anyPermission  np. 'article:update:any'
 * @param resolveOwnerId Funkcja zwracajaca identyfikator autora zasobu.
 */
export const requireOwnershipOr = (
  ownPermission: Permission,
  anyPermission: Permission,
  resolveOwnerId: (c: never) => Promise<string | number | null>,
) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const auth = getAuth(c as never)
    if (!auth?.sub) return fail(c, 'unauthorized', 'Wymagane zalogowanie.')

    const role = toRole(auth.role)

    // Uprawnienie do cudzych zasobow rozstrzyga sprawe bez odpytywania bazy.
    if (hasPermission(role, anyPermission)) return next()

    if (!hasPermission(role, ownPermission)) {
      return fail(c, 'forbidden', 'Twoja rola nie pozwala na wykonanie tej operacji.', {
        wymaganeUprawnienie: ownPermission,
        twojaRola: role,
      })
    }

    const ownerId = await resolveOwnerId(c as never)
    if (ownerId === null) {
      return fail(c, 'not_found', 'Nie znaleziono zasobu.')
    }

    if (String(ownerId) !== String(auth.sub)) {
      console.warn(`[uprawnienia] ${auth.email ?? auth.sub} probowal zmodyfikowac zasob uzytkownika ${ownerId}`)
      return fail(c, 'forbidden', 'Mozesz modyfikowac wylacznie wlasne materialy.')
    }

    await next()
  })
