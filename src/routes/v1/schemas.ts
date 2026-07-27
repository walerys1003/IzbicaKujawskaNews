/**
 * FAZA 2 / B5 — rejestr schematow walidacji jako dokumentacja API.
 *
 * Dotychczas jedynym sposobem sprawdzenia, jakich pol oczekuje endpoint,
 * bylo przeczytanie kodu trasy. Integrator (np. autor przeplywu n8n
 * wsypujacego zgloszenia z formularza) nie mial zadnego kontraktu i uczyl
 * sie ksztaltu zadania metoda prob i bledow HTTP 400.
 *
 * Ta trasa wystawia rejestr wprost z warstwy walidacji — nie z osobnego
 * pliku dokumentacji. Roznica jest zasadnicza: dokumentacja pisana rownolegle
 * do kodu rozjezdza sie z nim w ciagu tygodni. Tutaj zmiana schematu
 * natychmiast zmienia odpowiedz, bo zrodlem jest ten sam obiekt Zod,
 * ktorego uzywa handler.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { ok, fail } from '../../lib/http/envelope'
import { validationManifest, SCHEMA_REGISTRY, registryProblems } from '../../lib/validation'
import { BLOCK_TYPES } from '../../lib/validation/blocks'
import { errorCatalogList } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

route.get('/', (c) => {
  const manifest = validationManifest()
  return ok(c, {
    ...manifest,
    typyBlokow: BLOCK_TYPES,
    katalogBledow: errorCatalogList(),
    /**
     * Wynik samokontroli rejestru. Niepusta lista oznacza, ze rejestr
     * rozjechal sie z faktycznymi schematami — lepiej, zeby bylo to widoczne
     * na wierzchu niz odkryte przez integratora.
     */
    problemyRejestru: registryProblems(),
  })
})

route.get('/:endpoint{.*}', (c) => {
  const needle = decodeURIComponent(c.req.param('endpoint'))
  const matches = SCHEMA_REGISTRY.filter(
    (e) => e.endpoint === needle || e.endpoint.includes(needle) || e.schema === needle,
  )
  if (!matches.length) {
    return fail(c, 'not_found', `Nie ma schematu dla „${needle}”.`, {
      podpowiedz: 'Pelna lista: GET /api/v1/schemas',
    })
  }
  return ok(c, matches, { total: matches.length })
})

export default route
