/*
  ==========================================================================
  ETAP I8 — DECYZJA O MAGAZYNIE: KV JEST JEDYNYM ŹRÓDŁEM PRAWDY
  ==========================================================================

  Stan zastany (zmierzony 2026-07-28): migracja 0036_push_notifications.sql
  tworzy tabele push_subscribers / push_preferences / push_messages, ale
  ŻADNA trasa w tym pliku nie wykonuje na nich zapytania — cała warstwa
  używa NOTIFICATIONS_KV. Grep po `env.DB` w src/routes/push/ nie zwraca
  ani jednego trafienia. Tabele stały puste od wdrożenia migracji.

  To był realny problem, nie kosmetyczny: dwa równoległe magazyny, z których
  jeden jest deklarowany w schemacie, a drugi faktycznie działa, gwarantują,
  że przy pierwszej próbie raportu z D1 panel pokaże zero subskrybentów przy
  tysiącu realnych.

  WYBRANO KV. Uzasadnienie oparte na charakterystyce dostępu, nie preferencji:

  1. Dostęp jest wyłącznie po kluczu i po prefiksie. Cała logika sprowadza
     się do „daj mi tego subskrybenta" i „daj mi wszystkich aktywnych".
     Nie ma tu ani jednego JOIN-a, agregatu ani zapytania po zakresie dat.
     Relacyjność D1 nie miałaby czego obsłużyć.

  2. Zapis przy wysyłce jest punktowy i częsty. Odpowiedź 410 od dostawcy
     wymaga usunięcia JEDNEJ subskrypcji. W KV to jedno `delete`. W D1
     każde takie usunięcie to zapytanie do bazy o jednym regionie zapisu,
     a przy wysyłce do tysiąca odbiorców takich operacji jest tyle, ile
     martwych subskrypcji.

  3. Czytanie listy odbiorców zdarza się rzadko (moment wysyłki), a czytanie
     pojedynczej subskrypcji — przy każdym wejściu czytelnika na stronę.
     KV jest replikowane do wszystkich lokalizacji brzegowych, D1 ma jeden
     region zapisu i replikę czytającą.

  ZNANE OGRANICZENIE, ŚWIADOMIE PRZYJĘTE
  --------------------------------------
  listByPrefix() w src/lib/runtime-kv.ts ma `limit: 500` i NIE obsługuje
  kursora — sprawdzone w kodzie, nie założone. Powyżej 500 subskrybentów
  wysyłka po cichu pominie nadwyżkę i nikt tego nie zauważy, bo `delivered`
  będzie zgodne z liczbą PODJĘTYCH prób. Portal gminy o ~2,8 tys.
  subskrybentach newslettera realnie ten próg przekroczy.

  Dlatego trasa /send-broadcast raportuje `attempted` obok `delivered`
  i ostrzega, gdy lista dobiła do limitu (patrz OSTRZEZENIE_LIMIT_KV).
  Stronicowanie listByPrefix jest osobnym zadaniem — wymaga zmiany
  sygnatury używanej przez inne moduły (newsletter, analytics), więc nie
  wchodzi w zakres I8. Do tego czasu limit jest widoczny w odpowiedzi API,
  a nie ukryty.

  Tabele D1 z migracji 0036 pozostają nieużywane. NIE usuwam ich migracją
  wycofującą, bo to nie jest bezpieczne bez wglądu w stan produkcji —
  wymaga potwierdzenia, że są puste na środowisku produkcyjnym.
  ==========================================================================
*/
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv, Bindings } from '../../types/env'
import { requireAuth } from '../auth/middleware/require-auth'
import type { AuthJwtPayload } from '../auth/helpers/password-utils'
import { deleteJson, getJson, listByPrefix, putJson, upsertCollectionItem } from '../../lib/runtime-kv'
import { kluczeVapidZeSrodowiska, wyslijPowiadomienie, type PowodNiepowodzenia } from '../../lib/push/webpush'

/*
  Limit odpowiada `limit: 500` w listByPrefix (src/lib/runtime-kv.ts).
  Trzymam go tutaj jako stałą, żeby ostrzeżenie w API nie rozjechało się
  z faktycznym zachowaniem warstwy KV przy zmianie tamtej wartości.
*/
const LIMIT_LISTY_KV = 500

/** Wynik wysyłki do jednego subskrybenta — z jego identyfikatorem. */
interface WynikSubskrybenta {
  subscriberId: string
  dostarczone: boolean
  status?: number
  doUsuniecia: boolean
  powod?: PowodNiepowodzenia
  komunikat?: string
}

export interface PushSubscriptionRecord {
  id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  userId?: string
  categories: string[]
  segments: string[]
  locale: string
  device: string
  status: 'active' | 'unsubscribed'
  createdAt: string
  updatedAt: string
}

export interface PushPreferenceRecord {
  id: string
  userId: string
  categories: string[]
  breakingOnly: boolean
  quietHours?: { from: string; to: string }
  updatedAt: string
}

export interface PushMessageRecord {
  id: string
  kind: 'broadcast' | 'segment' | 'test' | 'breaking' | 'scheduled'
  title: string
  body: string
  url?: string
  segment?: string
  category?: string
  scheduledFor?: string
  sentAt?: string
  /**
   * I8 — doszedł stan 'failed'. Wcześniej istniały tylko 'queued' | 'sent' |
   * 'cancelled', więc nieudana wysyłka NIE MIAŁA JAK zostać zapisana i
   * kończyła się jako 'sent'. Brak stanu w typie był tu pierwotną przyczyną
   * fałszywego raportu, nie sama funkcja wysyłająca.
   */
  status: 'queued' | 'sent' | 'cancelled' | 'failed'
  /** Liczba POTWIERDZEŃ od dostawcy (2xx), nie liczba adresatów. */
  delivered: number
  opened: number
  clicked: number
  createdAt: string
  createdBy?: string
  /** Liczba subskrybentów, do których podjęto próbę wysyłki. */
  attempted?: number
  /** Liczba nieudanych wysyłek. */
  failed?: number
  /** Liczba subskrypcji usuniętych jako nieważne (404/410). */
  removedSubscribers?: number
  /** Zestawienie powodów niepowodzeń: powód → liczba wystąpień. */
  failureReasons?: Record<string, number>
  /** Powód całkowitego niepowodzenia (np. brak konfiguracji VAPID). */
  failureReason?: string
  failureDetail?: string
  /**
   * true, gdy lista subskrybentów dobiła do limitu listByPrefix (500) i część
   * odbiorców NIE została uwzględniona. Bez tego pola „dostarczono 500/500"
   * wyglądałoby na pełny sukces przy tysiącach pominiętych osób.
   */
  listaUcieta?: boolean
}

const route = new Hono<AppEnv>()

const subscriberKey = (id: string) => `push:subscriber:${id}`
const preferenceKey = (userId: string) => `push:preference:${userId}`
const messageKey = (id: string) => `push:message:${id}`

const jsonError = (message: string, status = 400) => new Response(JSON.stringify({ error: message }), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
})

const normalizeList = (value: unknown): string[] => Array.isArray(value)
  ? value.map((item) => String(item).trim()).filter(Boolean)
  : []

const inferDevice = (userAgent: string) => {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  if (/mobi|android/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

const getAuth = (c: Context<AppEnv>) => c.get('auth') as AuthJwtPayload | undefined

const ensureAdmin = (c: Context<AppEnv>) => {
  const auth = getAuth(c)
  if (!auth) return jsonError('missing_bearer_token', 401)
  if (!['admin', 'editor'].includes(auth.role)) return jsonError('forbidden', 403)
  return null
}

const listSubscribers = async (env: Bindings) => (await listByPrefix<PushSubscriptionRecord>(env, 'NOTIFICATIONS_KV', 'push:subscriber:'))
  .map((item) => item.value)
  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

const listMessages = async (env: Bindings) => (await listByPrefix<PushMessageRecord>(env, 'NOTIFICATIONS_KV', 'push:message:'))
  .map((item) => item.value)
  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

const matchRecipient = (subscriber: PushSubscriptionRecord, message: Pick<PushMessageRecord, 'kind' | 'segment' | 'category'>) => {
  if (subscriber.status !== 'active') return false
  if (message.kind === 'broadcast') return true
  if (message.kind === 'test') return true
  if (message.kind === 'segment') {
    return Boolean(message.segment && (subscriber.segments.includes(message.segment) || subscriber.categories.includes(message.segment)))
  }
  if (message.kind === 'breaking') return true
  if (message.kind === 'scheduled') {
    if (!message.segment && !message.category) return true
    return Boolean(message.segment && subscriber.segments.includes(message.segment)) || Boolean(message.category && subscriber.categories.includes(message.category))
  }
  return false
}

/**
 * I8 — REALNA WYSYŁKA WEB PUSH
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CO BYŁO TU WCZEŚNIEJ
 * ══════════════════════════════════════════════════════════════════════════
 *     const delivered = recipients.length
 *     const saved = { ...message, delivered, sentAt: ..., status: 'sent' }
 *
 * Funkcja LICZYŁA subskrybentów i zapisywała `status:'sent'`, `delivered:N`
 * — nie wykonując ANI JEDNEGO żądania HTTP. Redaktor widział w panelu
 * „dostarczono 12”, a dwanaście osób nie dostawało nic. Przy powiadomieniu
 * `breaking` (ostrzeżenie dla mieszkańców) taki komunikat jest gorszy niż
 * brak powiadomień — wyklucza reakcję, bo redakcja uważa sprawę za zamkniętą.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CO ROBI TERAZ
 * ══════════════════════════════════════════════════════════════════════════
 * Dla każdego dopasowanego subskrybenta wykonuje prawdziwe żądanie do serwera
 * push (RFC 8291 + 8292, patrz src/lib/push/webpush.ts). `delivered` to liczba
 * odpowiedzi 2xx OD DOSTAWCY, a nie liczba adresatów na liście.
 *
 * TRZY REGUŁY, KTÓRE MUSZĄ TU OBOWIĄZYWAĆ:
 *
 *   1. Brak kluczy VAPID → `status:'failed'`, `delivered:0` i jawny powód.
 *      NIE 'sent'. Środowisko bez sekretów nie może udawać, że wysłało.
 *   2. `delivered` liczy wyłącznie potwierdzenia dostawcy. Odmowa (401),
 *      limit (429) czy awaria sieci są zapisywane jako niepowodzenia.
 *   3. Subskrypcje odrzucone kodem 404/410 są USUWANE. Bez tego lista
 *      martwych wpisów rośnie w nieskończoność, a każda kolejna wysyłka
 *      marnuje na nie żądanie i zaniża statystyki.
 *
 * Uwaga o zasięgu: „dostarczone” oznacza „przyjęte przez serwer push”, nie
 * „wyświetlone użytkownikowi”. Tego drugiego nadawca nie może wiedzieć —
 * i dlatego pola `opened`/`clicked` są zliczane osobno, ze zdarzeń z SW.
 */
const sendMessage = async (env: Bindings, message: PushMessageRecord) => {
  const subscribers = await listSubscribers(env)
  const recipients = subscribers.filter((subscriber) => matchRecipient(subscriber, message))

  /*
    Wykrycie ucięcia listy przez limit KV. Gdy listSubscribers zwróci
    dokładnie LIMIT_LISTY_KV pozycji, jest praktycznie pewne, że dalsze
    subskrypcje istnieją, ale nie zostały pobrane — listByPrefix nie
    obsługuje kursora. Bez tego ostrzeżenia panel pokazałby „dostarczono
    500/500" i wyglądałoby to na pełny sukces, gdy 2 300 osób nie dostało
    nic. Zgłaszam to jawnie, zamiast udawać, że problem nie istnieje.
  */
  const listaUcieta = subscribers.length >= LIMIT_LISTY_KV
  if (listaUcieta) {
    console.error(
      `[push] OSTRZEZENIE_LIMIT_KV: pobrano ${subscribers.length} subskrypcji, ` +
        `czyli dokładnie limit listByPrefix. Subskrypcje powyżej tego progu NIE ` +
        `otrzymają wiadomości ${message.id}. Wymagane stronicowanie listByPrefix.`,
    )
  }

  const kluczeVapid = kluczeVapidZeSrodowiska(env)

  // ── Brak konfiguracji: zapisujemy porażkę, nie sukces ─────────────────
  if (!kluczeVapid) {
    const saved: PushMessageRecord = {
      ...message,
      delivered: 0,
      status: 'failed',
      sentAt: new Date().toISOString(),
      failureReason: 'brak_konfiguracji_vapid',
      failureDetail: 'Brak VAPID_PUBLIC_KEY lub VAPID_PRIVATE_KEY — powiadomienia nie zostały wysłane.',
      attempted: recipients.length,
      listaUcieta: listaUcieta || undefined,
    }
    await putJson(env, 'NOTIFICATIONS_KV', messageKey(message.id), saved)
    console.error('[push] Wysyłka przerwana: brak kluczy VAPID w środowisku.')
    return { saved, recipients, wyniki: [] as WynikSubskrybenta[] }
  }

  const tresc = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url || '/',
    messageId: message.id,
  })

  // Wysyłka równoległa, ale w partiach — Workers ma limit jednoczesnych
  // połączeń wychodzących (6 na żądanie w planie darmowym), a `Promise.all`
  // po tysiącu subskrybentów kończyłby się odrzuceniem części połączeń,
  // raportowanym potem jako awaria sieci.
  const ROZMIAR_PARTII = 5
  const wyniki: WynikSubskrybenta[] = []

  for (let i = 0; i < recipients.length; i += ROZMIAR_PARTII) {
    const partia = recipients.slice(i, i + ROZMIAR_PARTII)
    const wynikiPartii = await Promise.all(
      partia.map(async (subscriber) => {
        const wynik = await wyslijPowiadomienie(
          { endpoint: subscriber.endpoint, keys: subscriber.keys },
          tresc,
          kluczeVapid,
          { pilnosc: message.kind === 'breaking' ? 'high' : 'normal' },
        )
        return { subscriberId: subscriber.id, ...wynik }
      }),
    )
    wyniki.push(...wynikiPartii)
  }

  // ── Usunięcie trwale nieważnych subskrypcji ───────────────────────────
  const doUsuniecia = wyniki.filter((w) => w.doUsuniecia).map((w) => w.subscriberId)
  for (const id of doUsuniecia) {
    await deleteJson(env, 'NOTIFICATIONS_KV', subscriberKey(id))
  }

  const delivered = wyniki.filter((w) => w.dostarczone).length
  const nieudane = wyniki.length - delivered

  // Zestawienie powodów niepowodzeń — redakcja musi wiedzieć, CZY to jej
  // problem (zły klucz, za duża treść) czy dostawcy (limit, awaria).
  const powody = wyniki
    .filter((w) => !w.dostarczone)
    .reduce<Record<string, number>>((acc, w) => {
      const powod = w.powod ?? 'nieznany'
      acc[powod] = (acc[powod] ?? 0) + 1
      return acc
    }, {})

  const saved: PushMessageRecord = {
    ...message,
    delivered,
    attempted: recipients.length,
    failed: nieudane,
    removedSubscribers: doUsuniecia.length,
    failureReasons: Object.keys(powody).length ? powody : undefined,
    listaUcieta: listaUcieta || undefined,
    sentAt: new Date().toISOString(),
    // 'sent' tylko wtedy, gdy cokolwiek faktycznie doszło. Zero dostarczeń
    // przy niepustej liście adresatów to porażka, nie wysłana wiadomość.
    status: delivered > 0 ? 'sent' : recipients.length === 0 ? 'sent' : 'failed',
  }

  await putJson(env, 'NOTIFICATIONS_KV', messageKey(message.id), saved)

  if (nieudane > 0) {
    console.warn(`[push] ${message.id}: dostarczono ${delivered}/${recipients.length}, powody:`, powody)
  }

  return { saved, recipients, wyniki }
}

export const processScheduledPushMessages = async (env: Bindings) => {
  const now = Date.now()
  const messages = await listMessages(env)
  const due = messages.filter((message) => message.status === 'queued' && message.scheduledFor && Date.parse(message.scheduledFor) <= now)
  await Promise.all(due.map((message) => sendMessage(env, message)))
  return { processed: due.length }
}

route.use('/send-broadcast', requireAuth)
route.use('/send-segment', requireAuth)
route.use('/send-test', requireAuth)
route.use('/subscribers', requireAuth)
route.use('/subscribers/*', requireAuth)
route.use('/breaking', requireAuth)
route.use('/history', requireAuth)
route.use('/stats', requireAuth)
route.use('/schedule', requireAuth)
route.use('/preferences', requireAuth)
route.use('/preferences/*', requireAuth)

// Klucz publiczny VAPID musi pochodzić wyłącznie ze środowiska.
// Poprzednio zwracany był tu zahardkodowany placeholder, który przeglądarka
// przyjmowała jako prawidłowy klucz — subskrypcje powstawały, ale żadne
// powiadomienie nie mogło zostać podpisane (brak klucza prywatnego).
// Teraz brak konfiguracji jest zgłaszany jawnie jako 503.
route.get('/vapid-public-key', (c) => {
  const publicKey = c.env.VAPID_PUBLIC_KEY
  if (!publicKey) {
    return c.json({
      error: 'push_not_configured',
      message: 'Powiadomienia push nie są skonfigurowane na tym środowisku (brak VAPID_PUBLIC_KEY).',
    }, 503)
  }
  return c.json({ publicKey })
})

route.post('/subscribe', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.endpoint !== 'string') return c.json({ error: 'invalid_subscription' }, 400)

  const auth = getAuth(c)
  const now = new Date().toISOString()
  const subscription: PushSubscriptionRecord = {
    id: typeof body.id === 'string' && body.id ? body.id : crypto.randomUUID(),
    endpoint: body.endpoint,
    keys: {
      p256dh: String((body as { keys?: Record<string, unknown> }).keys?.p256dh ?? ''),
      auth: String((body as { keys?: Record<string, unknown> }).keys?.auth ?? ''),
    },
    userId: auth?.sub || (typeof body.userId === 'string' ? body.userId : undefined),
    categories: normalizeList(body.categories),
    segments: normalizeList(body.segments),
    locale: typeof body.locale === 'string' ? body.locale : 'pl-PL',
    device: typeof body.device === 'string' ? body.device : inferDevice(c.req.header('User-Agent') || ''),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }

  await upsertCollectionItem(c.env, 'NOTIFICATIONS_KV', 'push:subscriber:', subscription)
  return c.json({ ok: true, subscriber: subscription }, 201)
})

route.post('/unsubscribe', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return c.json({ error: 'missing_id' }, 400)
  const existing = await getJson<PushSubscriptionRecord>(c.env, 'NOTIFICATIONS_KV', subscriberKey(id))
  if (!existing) return c.json({ error: 'subscriber_not_found' }, 404)
  const updated = { ...existing, status: 'unsubscribed' as const, updatedAt: new Date().toISOString() }
  await putJson(c.env, 'NOTIFICATIONS_KV', subscriberKey(id), updated)
  return c.json({ ok: true, subscriber: updated })
})

route.post('/send-broadcast', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string') return c.json({ error: 'missing_fields' }, 400)

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'broadcast',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }

  const result = await sendMessage(c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length })
})

route.post('/send-segment', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string' || typeof body.segment !== 'string') {
    return c.json({ error: 'missing_fields' }, 400)
  }

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'segment',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    segment: body.segment,
    category: typeof body.category === 'string' ? body.category : undefined,
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }

  const result = await sendMessage(c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length })
})

route.post('/send-test', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const auth = getAuth(c)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const subscriptionId = typeof body?.subscriptionId === 'string' ? body.subscriptionId : ''
  const subscribers = await listSubscribers(c.env)
  const subscriber = subscriptionId
    ? subscribers.find((item) => item.id === subscriptionId)
    : subscribers.find((item) => item.userId === auth?.sub)
  if (!subscriber) return c.json({ error: 'subscriber_not_found' }, 404)

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'test',
    title: typeof body?.title === 'string' ? body.title : 'Test powiadomienia izbica24.pl',
    body: typeof body?.body === 'string' ? body.body : 'To jest test Web Push z panelu redakcyjnego.',
    url: typeof body?.url === 'string' ? body.url : '/',
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: auth?.sub,
  }

  // I8 — wcześniej stało tu `delivered: 1` NA SZTYWNO, bez żadnego żądania.
  // Test powiadomień był więc bezużyteczny: zawsze „udawał się”, także gdy
  // klucze VAPID były błędne lub subskrypcja martwa. To trasa, na której
  // redakcja sprawdza konfigurację — fałszywy sukces właśnie tutaj kosztuje
  // najwięcej, bo utwierdza w przekonaniu, że wysyłka działa.
  const kluczeVapid = kluczeVapidZeSrodowiska(c.env)
  if (!kluczeVapid) {
    return c.json({
      error: 'push_not_configured',
      message: 'Brak VAPID_PUBLIC_KEY lub VAPID_PRIVATE_KEY — nie można wysłać powiadomienia testowego.',
    }, 503)
  }

  const wynik = await wyslijPowiadomienie(
    { endpoint: subscriber.endpoint, keys: subscriber.keys },
    JSON.stringify({ title: message.title, body: message.body, url: message.url || '/', messageId: message.id }),
    kluczeVapid,
  )

  if (wynik.doUsuniecia) {
    await deleteJson(c.env, 'NOTIFICATIONS_KV', subscriberKey(subscriber.id))
  }

  const saved: PushMessageRecord = {
    ...message,
    delivered: wynik.dostarczone ? 1 : 0,
    attempted: 1,
    failed: wynik.dostarczone ? 0 : 1,
    removedSubscribers: wynik.doUsuniecia ? 1 : 0,
    sentAt: new Date().toISOString(),
    status: wynik.dostarczone ? 'sent' : 'failed',
    failureReason: wynik.dostarczone ? undefined : wynik.powod,
    failureDetail: wynik.dostarczone ? undefined : wynik.komunikat,
  }
  await putJson(c.env, 'NOTIFICATIONS_KV', messageKey(saved.id), saved)

  // Kod HTTP odzwierciedla rzeczywisty wynik — 200 przy niepowodzeniu kazałby
  // panelowi pokazać sukces niezależnie od treści odpowiedzi.
  return c.json(
    {
      ok: wynik.dostarczone,
      message: saved,
      recipient: subscriber.id,
      dostawca: { status: wynik.status, powod: wynik.powod, komunikat: wynik.komunikat },
    },
    wynik.dostarczone ? 200 : 502,
  )
})

route.get('/subscribers', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = await listSubscribers(c.env)
  return c.json({ total: items.length, items })
})

route.get('/subscribers/:id', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const item = await getJson<PushSubscriptionRecord>(c.env, 'NOTIFICATIONS_KV', subscriberKey(c.req.param('id')))
  if (!item) return c.json({ error: 'subscriber_not_found' }, 404)
  return c.json(item)
})

route.delete('/subscribers/:id', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  await deleteJson(c.env, 'NOTIFICATIONS_KV', subscriberKey(c.req.param('id')))
  return c.json({ ok: true, removed: c.req.param('id') })
})

route.post('/preferences', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const preference: PushPreferenceRecord = {
    id: auth.sub,
    userId: auth.sub,
    categories: normalizeList(body?.categories),
    breakingOnly: Boolean(body?.breakingOnly),
    quietHours: typeof body?.quietHours === 'object' && body?.quietHours
      ? {
          from: String((body.quietHours as Record<string, unknown>).from ?? '22:00'),
          to: String((body.quietHours as Record<string, unknown>).to ?? '07:00'),
        }
      : undefined,
    updatedAt: new Date().toISOString(),
  }
  await putJson(c.env, 'USER_PREFS_KV', preferenceKey(auth.sub), preference)
  return c.json({ ok: true, preference })
})

route.get('/preferences/:userId', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  const requestedUserId = c.req.param('userId')
  if (auth.sub !== requestedUserId && !['admin', 'editor'].includes(auth.role)) return c.json({ error: 'forbidden' }, 403)
  const preference = await getJson<PushPreferenceRecord>(c.env, 'USER_PREFS_KV', preferenceKey(requestedUserId))
  return c.json(preference ?? { id: requestedUserId, userId: requestedUserId, categories: [], breakingOnly: false, updatedAt: null })
})

route.post('/breaking', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string') return c.json({ error: 'missing_fields' }, 400)

  const messages = await listMessages(c.env)
  const today = new Date().toISOString().slice(0, 10)
  const breakingCount = messages.filter((message) => message.kind === 'breaking' && message.createdAt.startsWith(today)).length
  if (breakingCount >= 5) return c.json({ error: 'breaking_daily_limit_reached', limit: 5 }, 429)

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'breaking',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    category: typeof body.category === 'string' ? body.category : undefined,
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }
  const result = await sendMessage(c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length, dailyCount: breakingCount + 1 })
})

route.get('/history', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = await listMessages(c.env)
  return c.json({ total: items.length, items })
})

route.get('/stats', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const messages = await listMessages(c.env)
  const totals = messages.reduce((acc, message) => {
    acc.delivered += message.delivered
    acc.opened += message.opened
    acc.clicked += message.clicked
    return acc
  }, { delivered: 0, opened: 0, clicked: 0 })
  return c.json({
    totalMessages: messages.length,
    delivered: totals.delivered,
    opened: totals.opened,
    clicked: totals.clicked,
    openRate: totals.delivered ? Number((totals.opened / totals.delivered).toFixed(4)) : 0,
    ctr: totals.delivered ? Number((totals.clicked / totals.delivered).toFixed(4)) : 0,
  })
})

route.post('/schedule', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string' || typeof body.scheduledFor !== 'string') {
    return c.json({ error: 'missing_fields' }, 400)
  }
  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'scheduled',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    segment: typeof body.segment === 'string' ? body.segment : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
    scheduledFor: body.scheduledFor,
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }
  await putJson(c.env, 'NOTIFICATIONS_KV', messageKey(message.id), message)
  return c.json({ ok: true, message })
})

export default route
