// SA2: Newsletter router — mounted at /api/v1/newsletter
import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { createNewsletterRepo } from '../../repository'
// Etap I9 — ochrona formularzy zapisu na newsletter.
import { turnstileGuard } from '../../middleware/turnstile'
import { requireAuth } from '../../middleware/require-auth'
import { requirePermission } from '../../middleware/require-permission'
import { createEmailProvider, emailSkonfigurowany } from '../../lib/email/provider'

const route = new Hono<AppEnv>()

/**
 * Sprawdzenie adresu. Poprzednio warunkiem bylo `email.includes('@')`, ktory
 * przepuszcza '@', 'a@' i '@b' — adresy niemozliwe do dostarczenia. Kazdy taki
 * zapis to wiersz w bazie i jedna nieudana proba wysylki, ktora u dostawcy
 * poczty liczy sie jako odbicie i obniza reputacje domeny.
 */
const POPRAWNY_EMAIL = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/

/**
 * Etap I9 — dlaczego chronione są wszystkie trzy adresy, nie tylko `/subscribe`.
 *
 * `/subscribe` bez ochrony pozwala zapisać dowolny cudzy adres e-mail —
 * skrypt zgłasza tysiąc adresów, każdy dostaje od nas wiadomość
 * potwierdzającą, której nie zamawiał. To my zostajemy uznani za nadawcę
 * spamu i to nasza domena traci reputację u dostawców poczty.
 *
 * `/unsubscribe` bez ochrony pozwala wypisać cudzy adres — ktoś odcina
 * mieszkańca od powiadomień gminy bez jego wiedzy.
 *
 * `/confirm` bez ochrony pozwala zgadywać tokeny potwierdzeń masowo.
 */
/**
 * ODPOWIEDŹ „confirmation_sent” BYŁA NIEPRAWDZIWA.
 *
 * Pomiar przed poprawka:
 *   POST /api/v1/newsletter/subscribe {"email":"test@example.com"}
 *     -> 200 {"ok":true,"message":"confirmation_sent"}
 *   SELECT email, token IS NULL FROM newsletters
 *     -> test@example.com | 1        (token NIE zostal wygenerowany)
 *
 * Trasa nie wywolywala ZADNEJ funkcji wysylki — modul `src/lib/email/provider.ts`
 * nie byl importowany w tym pliku ani nigdzie indziej. Mieszkaniec dostawal
 * komunikat „wyslalismy potwierdzenie” i czekal na list, ktory nie mial zostac
 * nadany. Subskrypcja zostawala na zawsze w stanie 'pending', czyli nie
 * otrzymywal tez zadnego biuletynu.
 *
 * Teraz komunikat opisuje stan faktyczny:
 *   'confirmation_sent'      — list poszedl do dostawcy poczty
 *   'email_not_configured'   — brak RESEND_API_KEY, list NIE poszedl (503)
 *   'send_failed'            — dostawca odrzucil wysylke (502)
 * Zamiast oglaszac sukces, ktorego nie ma, zwracamy blad — inaczej awaria
 * poczty jest niewidoczna dla obslugi portalu.
 */
route.post('/subscribe', turnstileGuard({ action: 'newsletter-subscribe' }), async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}) as { email?: string })
  const email = body.email?.trim().toLowerCase()
  if (!email || !POPRAWNY_EMAIL.test(email)) return c.json({ ok: false, message: 'invalid_email' }, 400)

  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.subscribe(email)
  if (!result.ok || !result.token) return c.json(result, 409)

  const link = `${c.env.SITE_URL || 'https://izbica24.pl'}/newsletter/potwierdzenie?token=${result.token}`

  // Brak konfiguracji poczty zglaszamy JAWNIE. Cichy powrot do atrapy
  // sprawilby, ze wdrozenie bez klucza wyglada na dzialajace, a zapisy
  // mieszkancow zostaja w 'pending' bez sladu przyczyny.
  //
  // WYJATEK — srodowisko developerskie: zwracamy 200 z komunikatem, ktory
  // NIE udaje wysylki ('confirmation_link_dev'), oraz z linkiem potwierdzenia,
  // zeby caly przeplyw double opt-in dalo sie przetestowac lokalnie bez
  // klucza Resend. Na produkcji (ENVIRONMENT != development) nadal 503.
  if (!emailSkonfigurowany(c.env)) {
    if (c.env.ENVIRONMENT === 'development') {
      console.log('[DEV NEWSLETTER] Link potwierdzenia (nie wyslano e-maila):', link)
      return c.json({ ok: true, message: 'confirmation_link_dev', confirmUrl: link })
    }
    return c.json({ ok: false, message: 'email_not_configured' }, 503)
  }
  const wyslane = await createEmailProvider(c.env).send({
    to: email,
    subject: 'Potwierdz zapis na biuletyn izbica24.pl',
    text: `Aby potwierdzic zapis na biuletyn, otworz odnosnik:\n\n${link}\n\n`
      + 'Jesli to nie Ty zamawiales biuletyn, zignoruj te wiadomosc — bez '
      + 'potwierdzenia nie wysylamy zadnych informacji.',
    html: `<p>Aby potwierdzic zapis na biuletyn <strong>izbica24.pl</strong>, otworz odnosnik:</p>`
      + `<p><a href="${link}">Potwierdzam zapis na biuletyn</a></p>`
      + `<p style="color:#555;font-size:13px">Jesli to nie Ty zamawiales biuletyn, zignoruj te wiadomosc — bez potwierdzenia nie wysylamy zadnych informacji.</p>`,
  })
  if (!wyslane.ok) return c.json({ ok: false, message: 'send_failed' }, 502)

  return c.json({ ok: true, message: 'confirmation_sent' })
})

/**
 * Potwierdzenie na TOKEN, nie na adres e-mail.
 *
 * Wersja poprzednia przyjmowala `{"email":"..."}` i potwierdzala subskrypcje
 * kazdemu, kto zna adres mieszkanca. Zgoda potwierdzona przez osobe trzecia
 * nie jest zgoda (RODO art. 7 — trzeba umiec ja wykazac), a mechanizm
 * podwojnego potwierdzenia stawal sie pozorny.
 */
route.post('/confirm', turnstileGuard({ action: 'newsletter-confirm' }), async (c) => {
  const body = await c.req.json<{ token?: string }>().catch(() => ({}) as { token?: string })
  const token = body.token?.trim()
  if (!token) return c.json({ ok: false, message: 'invalid_token' }, 400)
  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.confirm(token)
  // 404, bo token nieznany lub juz zuzyty. Nie rozrozniamy tych przypadkow w
  // komunikacie, zeby odpowiedz nie potwierdzala istnienia adresu w bazie.
  return c.json(result, result.ok ? 200 : 404)
})

route.post('/unsubscribe', turnstileGuard({ action: 'newsletter-unsubscribe' }), async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({} as { email?: string }))
  const email = body.email?.trim().toLowerCase()
  if (!email) return c.json({ error: 'invalid_email' }, 400)
  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.unsubscribe(email)
  return c.json(result)
})

/**
 * WYCIEK DANYCH OSOBOWYCH — ten adres nie miał żadnej ochrony.
 *
 * Pomiar (`GET /api/v1/newsletter/subscribers` bez nagłówka Authorization)
 * zwracał `200 {"total":0,"items":[]}`, czyli trasa działała i odpowiadała
 * każdemu. Na produkcji z realnymi danymi to pełna lista adresów e-mail
 * mieszkańców gminy wraz ze statusem subskrypcji — wydana anonimowo, jednym
 * żądaniem HTTP, bez logowania i bez śladu w rejestrze dostępu.
 *
 * Skutki: naruszenie ochrony danych osobowych (RODO) oraz gotowa lista
 * odbiorców do spamu i phishingu podszywającego się pod gminę.
 *
 * Defekt nie został wcześniej wychwycony, bo jedyny test tego adresu brzmiał
 * `expect(response.status === 200 || response.status === 500).toBe(true)` —
 * warunek prawdziwy dla obu możliwych wyników, więc nie mógł paść. Test
 * przechodził i przy otwartym, i przy zepsutym adresie.
 *
 * Pozostałe trasy tego routera są publiczne celowo (mieszkaniec zapisuje się
 * bez konta) i chroni je `turnstileGuard`. Tutaj chodzi o CZYTANIE zbioru,
 * więc wymagane jest zalogowanie i uprawnienie.
 */
route.get('/subscribers', requireAuth, requirePermission('newsletter:read'), async (c) => {
  const repo = createNewsletterRepo(c.env.DB!)
  const items = await repo.getSubscribers()
  return c.json({ total: items.length, items })
})

export default route
