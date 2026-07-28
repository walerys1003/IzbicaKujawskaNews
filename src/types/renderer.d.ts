/**
 * Deklaracja propsów renderera JSX (hono/jsx-renderer).
 *
 * Bez tego rozszerzenia `c.render(tresc, { title })` jest dla kompilatora
 * wywołaniem z nadmiarowym argumentem — stąd 33 błędy TS2554 („Expected 1
 * arguments, but got 2") w router.tsx, info-routes.tsx i index.tsx, oraz
 * 5 błędów TS2339 w v4/renderer.tsx (destrukturyzacja `title`, `description`…
 * z propsów, których typ nie znał). Kod DZIAŁAŁ w runtime — hono przekazuje
 * drugi argument do renderera — ale całe wywołania były poza kontrolą typów.
 *
 * Pola są sumą propsów obu rendererów (v3: title; v4: title, description,
 * ogImage, canonical, jsonLd) i wszystkie opcjonalne, bo każda trasa podaje
 * tylko te, które chce nadpisać.
 */
import 'hono'

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: {
        title?: string
        description?: string
        ogImage?: string
        canonical?: string
        jsonLd?: unknown
      },
    ): Response | Promise<Response>
  }
}
