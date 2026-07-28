/**
 * FAZA 2 / D9 — dziennik czynnosci redakcyjnych (audit_log).
 *
 * Problem, ktory to rozwiazuje: do tej pory tabela `audit_log` istniala,
 * ale NIC do niej nie pisalo. Gdyby artykul zniknal z portalu albo zmienil
 * tresc, redakcja nie miala z czego odtworzyc, kto to zrobil i kiedy.
 * Przy portalu informacyjnym — gdzie sprostowanie z art. 31a prawa prasowego
 * moze zalezec od tego, jak brzmiala tresc w konkretnym dniu — brak takiego
 * zapisu jest realnym ryzykiem, nie tylko niedogodnoscia.
 *
 * Zasady przyjete w tym module:
 *
 * 1. Zapis dziennika NIGDY nie wywraca operacji glownej. Jesli wstawienie
 *    wiersza do `audit_log` sie nie uda, logujemy to na konsole i idziemy
 *    dalej. Odwrotna decyzja (blad dziennika = blad zadania) oznaczalaby,
 *    ze awaria logowania blokuje publikacje — a to gorsze niz luka w logu.
 *
 * 2. Piszemy `outcome`: 'ok' | 'denied' | 'error'. Zapisujemy takze PROBY
 *    nieudane. Dziennik, w ktorym widac tylko udane operacje, nie pokazuje
 *    najciekawszej rzeczy — kto probowal zrobic coś, do czego nie ma prawa.
 *
 * 3. Adresu IP nie zapisujemy w postaci jawnej, tylko jako skrot z sola
 *    (`ip_hash`). To dane osobowe w rozumieniu RODO; do wykrycia
 *    „ten sam autor” skrot wystarcza, a wyciek bazy nie ujawnia adresow.
 *
 * 4. `before_json` / `after_json` sa PRZYCINANE. Snapshot calego artykulu
 *    z 300 blokami moglby miec setki kilobajtow; przy kazdym autozapisie
 *    urosloby to do gigabajtow. Do dziennika trafia diff pol skalarnych,
 *    pelne wersje tresci zyja w `article_versions`.
 */

import type { Context } from 'hono'
import { getRequestId } from './http/envelope'
import { getAuth } from '../middleware/require-permission'
import { clientIp as wspolnyClientIp } from './privacy/ip-anonymize'

/** Maksymalny rozmiar pojedynczego pola JSON w dzienniku (znaki). */
const MAX_JSON_CHARS = 4000

export type AuditOutcome = 'ok' | 'denied' | 'error'

export interface AuditEntry {
  /** Czynnosc w formie `zasob.operacja`, np. `article.publish`. */
  action: string
  /** Nazwa encji, ktorej dotyczy zapis, np. `articles`. */
  entity: string
  /** Identyfikator encji. TEXT, bo nie wszystkie encje maja klucz liczbowy. */
  entityId?: string | number | null
  outcome?: AuditOutcome
  /** Stan przed zmiana — tylko pola skalarne, bez blokow tresci. */
  before?: Record<string, unknown> | null
  /** Stan po zmianie. */
  after?: Record<string, unknown> | null
  /** Krotki opis czytelny dla czlowieka, np. „powrot do wersji 4”. */
  note?: string
}

interface D1Like {
  prepare(query: string): {
    bind(...values: unknown[]): { run(): Promise<unknown> }
  }
}

const clip = (value: Record<string, unknown> | null | undefined): string | null => {
  if (!value) return null
  try {
    const text = JSON.stringify(value)
    if (text.length <= MAX_JSON_CHARS) return text
    return JSON.stringify({
      _przycieto: true,
      _oryginalnyRozmiar: text.length,
      _fragment: text.slice(0, MAX_JSON_CHARS - 120),
    })
  } catch {
    return JSON.stringify({ _blad: 'nie udalo sie zserializowac stanu' })
  }
}

/**
 * FAZA 4 / I12 — skrot adresu IP przeniesiony do lib/privacy/ip-anonymize.
 *
 * Ten plik mial wlasna implementacje `hashIp`, a rownolegle istnialy jeszcze
 * dwie inne (auth/store.ts, v1/comments.ts) — trzy kopie tej samej operacji,
 * z czego dwie z sola zapisana na stale w kodzie zrodlowym. Teraz jest jedna
 * implementacja, ktora dodatkowo preferuje dedykowany sekret IP_HASH_SALT,
 * a JWT_SECRET traktuje tylko jako zapas.
 *
 * Reeksportujemy pod tymi samymi nazwami, zeby nie zmieniac wywolan.
 */
export { hashIp } from './privacy/ip-anonymize'

/** Adres klienta widziany przez Cloudflare (opakowanie na wspolny helper). */
export const clientIp = (c: Context): string | undefined =>
  wspolnyClientIp((nazwa) => c.req.header(nazwa))

/**
 * Zapis pojedynczego wpisu. Wywolanie jest „fire and forget” w sensie
 * odpornosci na blad, ale swiadomie NIE jest asynchroniczne bez await:
 * w Workerach praca po zwrocie odpowiedzi jest ucinana, wiec niezaczekany
 * zapis mogl by nigdy nie trafic do bazy.
 */
export const audit = async (c: Context, entry: AuditEntry): Promise<void> => {
  const db = c.env?.DB as D1Like | undefined
  if (!db) return

  try {
    const auth = getAuth(c)
    // Sol z IP_HASH_SALT, awaryjnie z JWT_SECRET. Poprzednio bylo tu
    // `?? 'izbica24-audit'` — sol zapisana w kodzie, czyli brak soli:
    // majac skrot i te stala mozna odtworzyc adres slownikiem (IPv4 to
    // tylko 4,3 mld wartosci). Teraz brak sekretu daje null i nie zapisujemy
    // nic, zamiast zapisywac dana osobowa pod pozorem jej ochrony.
    const ipHash = await hashIp(clientIp(c), c.env as never)

    await db
      .prepare(
        `INSERT INTO audit_log
           (user_id, action, entity, entity_id, diff, ip_hash,
            actor_email, actor_role, request_id, outcome, user_agent,
            before_json, after_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        auth?.sub ? Number(auth.sub) || null : null,
        entry.action,
        entry.entity,
        entry.entityId === undefined || entry.entityId === null ? null : String(entry.entityId),
        entry.note ?? null,
        ipHash,
        auth?.email ?? null,
        auth?.role ?? null,
        getRequestId(c),
        entry.outcome ?? 'ok',
        c.req.header('user-agent')?.slice(0, 300) ?? null,
        clip(entry.before),
        clip(entry.after),
      )
      .run()
  } catch (error) {
    // Celowo tylko log. Patrz zasada 1 w komentarzu naglownym.
    console.error('[audyt] Nie udalo sie zapisac wpisu:', entry.action, error)
  }
}

/** Skrot dla odmowy dostepu — najczestszy przypadek `outcome: 'denied'`. */
export const auditDenied = (c: Context, action: string, entity: string, entityId?: string | number, note?: string) =>
  audit(c, { action, entity, entityId, outcome: 'denied', note })

/** Skrot dla bledu wykonania. */
export const auditError = (c: Context, action: string, entity: string, entityId?: string | number, note?: string) =>
  audit(c, { action, entity, entityId, outcome: 'error', note })

/**
 * Roznica dwoch plaskich obiektow — do `before_json`/`after_json`.
 * Zwraca tylko pola, ktore sie zmienily. Bez tego kazdy autozapis
 * wpisywalby do dziennika komplet 40 pol, w tym 39 identycznych.
 */
export const diffFields = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown>; changed: string[] } => {
  const changed: string[] = []
  const b: Record<string, unknown> = {}
  const a: Record<string, unknown> = {}

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const bv = before[key]
    const av = after[key]
    if (av === undefined) continue
    if (JSON.stringify(bv ?? null) === JSON.stringify(av ?? null)) continue
    changed.push(key)
    b[key] = bv ?? null
    a[key] = av ?? null
  }

  return { before: b, after: a, changed }
}
