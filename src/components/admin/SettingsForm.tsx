import type { FC } from 'hono/jsx'

/**
 * Ustawienia redakcji.
 *
 * Poprzednia wersja miała wartości wpisane na stałe („Izbica24”,
 * „redakcja@izbica24.local”), formularz bez `method` i bez `action` oraz
 * pola bez atrybutu `name`. Kliknięcie „Zapisz ustawienia” wysyłało żądanie
 * GET na tę samą stronę bez żadnych danych — wyglądało jak zapis, który
 * przy odświeżeniu „nie zadziałał”.
 *
 * Klucze odpowiadają wierszom tabeli `settings` (klucz → wartość).
 */
export const SettingsForm: FC<{ values?: Record<string, string>; readOnly?: boolean }> = ({
  values = {},
  readOnly = false,
}) => (
  <form class="admin-panel admin-form-stack" method="post" action="/admin/settings">
    <h2>Ustawienia redakcji</h2>

    <label>
      <span>Nazwa portalu</span>
      <input class="admin-input" type="text" name="site.name" value={values['site.name'] ?? 'Izbica24'} disabled={readOnly} maxlength={120} />
    </label>

    <label>
      <span>E-mail redakcji</span>
      <input class="admin-input" type="email" name="site.email" value={values['site.email'] ?? 'redakcja@izbica24.pl'} disabled={readOnly} maxlength={200} />
    </label>

    <label>
      <span>Domyślna rola nowych kont</span>
      <select class="admin-select" name="users.default_role" disabled={readOnly}>
        {['author', 'contributor', 'editor', 'moderator', 'viewer'].map(role => (
          <option value={role} selected={(values['users.default_role'] ?? 'author') === role}>{role}</option>
        ))}
      </select>
      <span class="admin-hint">
        Nowe konto nie powinno domyślnie móc publikować. „author” tworzy szkice i wysyła je do recenzji.
      </span>
    </label>

    <label>
      <span>Tryb moderacji komentarzy</span>
      <select class="admin-select" name="comments.mode" disabled={readOnly}>
        <option value="pre" selected={(values['comments.mode'] ?? 'pre') === 'pre'}>Premoderacja — komentarz widoczny po zatwierdzeniu</option>
        <option value="post" selected={values['comments.mode'] === 'post'}>Postmoderacja — komentarz widoczny od razu</option>
      </select>
    </label>

    <label>
      <span>Stopka newslettera</span>
      <textarea class="admin-textarea" name="newsletter.footer" disabled={readOnly} maxlength={1000}>
        {values['newsletter.footer'] ?? 'Najważniejsze z gminy Izbica Kujawska, raz w tygodniu.'}
      </textarea>
    </label>

    {readOnly ? (
      <p class="admin-empty">Twoja rola pozwala tylko na podgląd ustawień.</p>
    ) : (
      <div><button type="submit" class="admin-button">Zapisz ustawienia</button></div>
    )}
  </form>
)
