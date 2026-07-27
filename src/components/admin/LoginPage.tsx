import type { FC } from 'hono/jsx'

/**
 * FAZA 2 / F-panel — strona logowania panelu redakcyjnego.
 *
 * Dlaczego osobny szablon, a nie `AdminLayout`: uklad panelu zawiera pasek
 * boczny z odnosnikami do sekcji chronionych i informacje o roli uzytkownika.
 * Pokazanie ich osobie niezalogowanej ujawnialoby strukture panelu i sugerowalo
 * dostep, ktorego nie ma.
 *
 * Formularz dziala BEZ JavaScriptu — zwykly POST na `/admin/login`. Redaktor
 * z zablokowanymi skryptami albo na slabym laczu nadal sie zaloguje. Blad
 * logowania wraca jako przeladowanie strony z komunikatem, nie jako cichy brak
 * reakcji przycisku.
 */

export type LoginPageProps = {
  /** Komunikat bledu do pokazania nad formularzem. */
  error?: string | null
  /** Adres, na ktory wrocic po zalogowaniu (np. gdy sesja wygasla w edytorze). */
  next?: string
  /** Ostatnio wpisany adres e-mail — zeby nie trzeba bylo go wpisywac ponownie. */
  email?: string
  /** Konto wymaga kodu 2FA — pokazujemy dodatkowe pole. */
  needsTwoFactor?: boolean
}

export const LoginPage: FC<LoginPageProps> = ({ error, next, email, needsTwoFactor }) => (
  <html lang="pl">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Logowanie · Panel redakcyjny · Izbica24</title>
      <link rel="stylesheet" href="/static/design-tokens.css" />
      <link rel="stylesheet" href="/static/admin.css" />
      {/* Panel nie jest tresci publiczna — nie chcemy go w wynikach wyszukiwania. */}
      <meta name="robots" content="noindex, nofollow" />
    </head>
    <body class="admin-shell admin-login-shell">
      <main class="admin-login-wrap">
        <section class="admin-login-card" aria-labelledby="login-title">
          <header class="admin-login-head">
            <p class="admin-login-brand">Izbica<span>24</span></p>
            <h1 id="login-title">Panel redakcyjny</h1>
            <p class="admin-login-sub">Zaloguj się kontem redakcyjnym portalu.</p>
          </header>

          {error && (
            <p class="admin-login-error" role="alert">
              {error}
            </p>
          )}

          <form method="post" action="/admin/login" class="admin-login-form">
            {next && <input type="hidden" name="next" value={next} />}

            <label class="admin-login-field">
              <span>Adres e-mail</span>
              <input
                class="admin-input"
                type="email"
                name="email"
                value={email || ''}
                autocomplete="username"
                required
                autofocus
                placeholder="redaktor@izbica24.pl"
              />
            </label>

            <label class="admin-login-field">
              <span>Hasło</span>
              <input
                class="admin-input"
                type="password"
                name="password"
                autocomplete="current-password"
                required
                placeholder="••••••••"
              />
            </label>

            {needsTwoFactor && (
              <label class="admin-login-field">
                <span>Kod z aplikacji uwierzytelniającej</span>
                <input
                  class="admin-input"
                  type="text"
                  name="code"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  pattern="[0-9]*"
                  maxlength={8}
                  placeholder="123456"
                />
              </label>
            )}

            <button type="submit" class="admin-button is-primary admin-login-submit">
              Zaloguj się
            </button>
          </form>

          <footer class="admin-login-foot">
            <p>
              Dostęp mają wyłącznie konta z rolą redakcyjną. Problem z logowaniem zgłoś
              administratorowi portalu.
            </p>
            <a href="/">← Wróć na portal</a>
          </footer>
        </section>
      </main>
    </body>
  </html>
)
