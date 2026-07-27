import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

/**
 * Przekazanie handlera `scheduled()` do finalnego bundla.
 *
 * Plugin @hono/vite-build generuje własny moduł wejściowy: tworzy opakowującą
 * aplikację `mainApp`, przekierowuje do niej wszystkie żądania i kończy
 * instrukcją `export default mainApp`. Eksport domyślny z src/index.tsx jest
 * przy tym używany wyłącznie do obsługi żądań HTTP (`app.fetch`), więc
 * zdefiniowany obok niego `scheduled` nie trafiał do dist/_worker.js.
 * Efekt: Cloudflare przy każdym wywołaniu crona zgłaszał
 * „Handler does not export a scheduled() function".
 *
 * Poniższy hook zastępuje domyślną instrukcję eksportu obiektem, który
 * obok `fetch` przekazuje także `scheduled` — wyszukiwany w zaimportowanych
 * modułach (zmienna `modules` jest w zasięgu generowanego pliku wejściowego).
 */
const exportFetchAndScheduled = (appName: string) => `
const scheduledHandler = async (event, env, ctx) => {
  for (const [, mod] of Object.entries(modules)) {
    if (mod && typeof mod.scheduled === 'function') {
      return mod.scheduled(event, env, ctx)
    }
  }
  console.warn('[cron] Żaden moduł nie eksportuje scheduled() — pomijam', event?.cron)
}

export default {
  fetch: ${appName}.fetch,
  scheduled: scheduledHandler,
}
`

export default defineConfig({
  plugins: [
    build({
      entryContentDefaultExportHook: exportFetchAndScheduled,
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
