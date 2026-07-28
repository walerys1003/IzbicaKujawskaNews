import type { D1DatabaseLike, D1PreparedStatementLike } from '../../src/types/env'

interface QueryLogEntry { sql: string; params: unknown[] }

type QueryHandler = (params: unknown[]) => unknown

/**
 * A9 — DANE DOMYŚLNE MOCKA
 *
 * Poprzednia wersja mocka zwracała pustą tablicę na każde zapytanie, którego
 * nie zarejestrowano jawnie przez `.on()`. Skutek: cztery testy integracyjne
 * padały, a audyt zapisał to jako „niedopasowany MockD1Database (zwraca
 * 404/400 zamiast danych)”.
 *
 * Pomiar pokazał jednak DWIE odrębne przyczyny, nie jedną:
 *
 *   1. Mock nie miał żadnych wierszy, więc `GET /api/v1/articles` zwracał
 *      200 z pustą listą (nie 404!), a `GET /articles/:slug` — 404, bo
 *      `getBySlug` nie dostawał wiersza. To wina mocka i naprawiamy ją tutaj.
 *
 *   2. Testy sprawdzały `body.items` i `body.accessToken` na najwyższym
 *      poziomie odpowiedzi, podczas gdy trasy przeszły na koperty
 *      `ok(c, data)` → `{ ok, data, meta, requestId }`. Nawet mock z danymi
 *      nie naprawiłby `expect(body.items).toHaveLength(2)`, bo pole `items`
 *      nie istnieje w tym kontrakcie. To wina testów i poprawiamy ją w nich.
 *
 * Rozróżnienie ma znaczenie: gdybyśmy „naprawili” testy przez dopasowanie
 * mocka do starego kształtu odpowiedzi, testy zaczęłyby chronić kontrakt,
 * którego API już nie ma — czyli dawałyby zieloną kontrolkę przy realnie
 * zepsutym API.
 *
 * Wiersze poniżej mają kolumny zgodne ze schematem z migracji (nazwy w
 * konwencji snake_case, `featured`/`breaking` jako 0/1, daty w formacie
 * SQLite `YYYY-MM-DD HH:MM:SS`), bo trasy czytają je wprost — np.
 * `a.featured === 1`, `Date.parse(published_at.replace(' ','T') + 'Z')`.
 * Wartość `true` zamiast `1` przeszłaby przez mock i wywróciła się dopiero
 * w mapowaniu na odpowiedź.
 */

const TERAZ = '2026-01-15 10:00:00'

const WIERSZ_ARTYKULU = {
  id: 1,
  slug: 'remont-koscielnej-zakonczony',
  title: 'Remont ulicy Kościelnej zakończony przed terminem',
  short_title: 'Remont Kościelnej',
  lead: 'Prace na ulicy Kościelnej zakończyły się dwa tygodnie przed planowanym terminem.',
  content_type: 'article',
  status: 'published',
  category_id: 1,
  category_slug: 'wiadomosci',
  category_name: 'Wiadomości',
  subcategory_slug: 'inwestycje',
  subsubcategory_slug: null,
  hero_image_r2_key: '/static/img/v4/01-hero-ulica-koscielna.jpg',
  hero_alt: 'Wyremontowana ulica Kościelna',
  solectwo_slug: null,
  featured: 1,
  breaking: 0,
  view_count: 120,
  comment_count: 3,
  reading_minutes: 4,
  ai_assisted: 0,
  author_id: 1,
  author_name: 'Anna Kowalska',
  author_email: 'anna@izbica24.pl',
  published_at: '2026-01-10 08:00:00',
  scheduled_at: null,
  updated_at: TERAZ,
  created_at: '2026-01-09 12:00:00',
  deleted_at: null,
  locked_by: null,
  locked_at: null,
  meta_title: null,
  meta_description: null,
  canonical_url: null,
}

const DRUGI_ARTYKUL = {
  ...WIERSZ_ARTYKULU,
  id: 2,
  slug: 'sesja-rady-gminy-styczen',
  title: 'Sesja Rady Gminy — budżet na 2026 rok przyjęty',
  short_title: 'Sesja Rady Gminy',
  lead: 'Radni przyjęli budżet gminy na rok 2026 przy dwóch głosach wstrzymujących.',
  subcategory_slug: 'samorzad',
  featured: 0,
  view_count: 88,
  comment_count: 1,
}

// Kolumny zgodne z `USER_COLUMNS` w src/lib/auth/store.ts:174 — `mapUser`
// czyta każdą z nich wprost (np. `row.email_verified === 1`), więc brak
// kolumny dawał `undefined` i cichą zmianę semantyki (konto niezweryfikowane).
const WIERSZ_UZYTKOWNIKA = {
  id: 1,
  email: 'anna@izbica24.pl',
  name: 'Anna Kowalska',
  role: 'editor',
  password_hash: 'pbkdf2$210000$sol$niepoprawny-skrot-do-testow',
  avatar: null as string | null,
  bio: null as string | null,
  email_verified: 1,
  two_factor_enabled: 0,
  two_factor_secret: null as string | null,
  pending_two_factor_secret: null as string | null,
  failed_login_attempts: 0,
  locked_until: null as string | null,
  last_login: null as string | null,
  status: 'active',
  email_verified_at: TERAZ,
  created_at: TERAZ,
  updated_at: TERAZ,
  deleted_at: null,
}

/**
 * Sesja użytkownika — bez niej NIE DA SIĘ przetestować żadnej trasy chronionej
 * przez `src/middleware/require-auth`.
 *
 * To middleware sprawdza nie tylko podpis tokenu, ale też czy sesja nadal
 * istnieje w `user_sessions` (dzięki temu „Wyloguj” działa natychmiast).
 * Atrapa nie znała tej tabeli, więc `getSession()` zwracało `null` i nawet
 * poprawnie podpisany token redaktora dawał 401 „Sesja została zakończona”.
 *
 * Skutek dla testów: każdy test trasy administracyjnej, który dostawał 401,
 * wyglądał na „poprawnie zabezpieczoną trasę”, choć w rzeczywistości
 * potwierdzał tylko lukę atrapy. Dokładnie ten fałszywy sygnał pozwolił
 * zaakceptować tautologię `expect(status === 200 || status === 500)`.
 *
 * `expires_at` jest ustawione w przyszłość, bo zapytanie filtruje
 * `expires_at > CURRENT_TIMESTAMP` i `revoked_at IS NULL`.
 */
const WIERSZ_SESJI = {
  id: 'sesja-testowa',
  user_id: 1,
  refresh_token_hash: 'skrot-nieistotny-dla-testow',
  user_agent: 'vitest',
  ip_hash: null as string | null,
  created_at: TERAZ,
  last_seen_at: TERAZ,
  expires_at: '2099-12-31 23:59:59',
  revoked_at: null as string | null,
}

/**
 * Komentarze — kolumny wg migracji 0002 (`comments`), 0017 (`deleted_at`)
 * i 0049 (`moderated_by`, `moderated_at`, `moderation_reason`, `edited_by`,
 * `edited_at`, `spam_score`, `spam_reasons_json`, `profanity_hits`,
 * `report_count`).
 *
 * Atrapa musiała je poznać, bo reguła `if (sql.includes('from comments'))
 * return []` sprawiała, że KAŻDY komentarz był „nieznaleziony”: kolejka
 * moderacji zwracała pustą listę, a `POST /:id/moderate` — 404. Test napisany
 * na takiej atrapie mógł sprawdzić wyłącznie ścieżki odmowy (401/403/404)
 * i nigdy nie dotknąłby zapisu `moderated_by`, czyli dokładnie tego defektu,
 * który naprawiliśmy w poprzednim kroku.
 */
const WIERSZ_KOMENTARZA = {
  id: 501,
  article_id: 1,
  user_id: null as number | null,
  author_name: 'Marek Nowak',
  author_email: 'marek@example.com',
  content: 'Dobrze, że remont się skończył przed terminem.',
  status: 'pending',
  parent_id: null as number | null,
  created_at: TERAZ,
  updated_at: TERAZ,
  ip_hash: 'skrot-ip-marka',
  deleted_at: null as string | null,
  moderated_by: null as number | null,
  moderated_at: null as string | null,
  moderation_reason: null as string | null,
  edited_by: null as number | null,
  edited_at: null as string | null,
  spam_score: 0,
  spam_reasons_json: null as string | null,
  profanity_hits: 0,
  report_count: 0,
}

const DRUGI_KOMENTARZ = {
  ...WIERSZ_KOMENTARZA,
  id: 502,
  author_name: 'Katarzyna Wójcik',
  author_email: 'katarzyna@example.com',
  content: 'A kiedy będzie remont ulicy Polnej?',
  status: 'approved',
  ip_hash: 'skrot-ip-katarzyny',
  report_count: 1,
}

/**
 * Minimalny interpreter `UPDATE` dla tabeli `comments`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO NIE WYSTARCZY `return []`
 * ══════════════════════════════════════════════════════════════════════════
 * Wcześniej atrapa przyjmowała każdy UPDATE i nie robiła nic. Skutek: test
 * mógł stwierdzić tylko, że trasa odpowiedziała 200 — nie mógł stwierdzić,
 * CO trafiło do bazy. Defekt `moderated_by = NULL` (moderacja bez śladu,
 * kto ją wykonał) przechodziłby przez taki test bez zająknięcia, bo status
 * odpowiedzi jest identyczny w obu wersjach kodu.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * GRANICE TEJ IMPLEMENTACJI — świadome i wypisane
 * ══════════════════════════════════════════════════════════════════════════
 * To NIE jest silnik SQL. Rozpoznaje wyłącznie trzy postacie przypisania,
 * których faktycznie używa `src/routes/v1/comments-moderation.ts`:
 *
 *   kolumna = ?N                     → wartość parametru
 *   kolumna = CURRENT_TIMESTAMP      → znacznik czasu
 *   kolumna = COALESCE(?N, kolumna)  → wartość tylko gdy parametr niepusty
 *
 * Konstrukcji `CASE WHEN … END` (`edited_by`, warunkowe zdjęcie `approved`
 * po trzecim zgłoszeniu) NIE interpretuje — te kolumny pozostają bez zmian.
 * Test, który chciałby je sprawdzić, MUSI to zrobić na prawdziwym D1
 * (`wrangler d1 execute --local`), a nie tutaj; inaczej potwierdzi milczenie
 * atrapy, nie zachowanie aplikacji.
 */
const BEZ_ZMIANY = Symbol('bez-zmiany')

const zastosujUpdateKomentarzy = (
  sql: string,
  params: unknown[],
  komentarze: Array<Record<string, unknown>>,
): void => {
  const czesc = /^update comments set (.+?) where (.+)$/.exec(sql)
  if (!czesc) return
  const [, setPart, wherePart] = czesc

  const param = (n: number): unknown => params[n - 1]

  // Które wiersze — `where id = ?N` albo `where id in (?a, ?b, …)`.
  const cele = new Set<number>()
  const poId = /\bid = \?(\d+)/.exec(wherePart)
  const poLiscie = /\bid in \(([^)]*)\)/.exec(wherePart)
  if (poId) {
    const wartosc = Number(param(Number(poId[1])))
    if (Number.isFinite(wartosc)) cele.add(wartosc)
  } else if (poLiscie) {
    for (const znak of poLiscie[1].split(',')) {
      const n = /\?(\d+)/.exec(znak.trim())
      if (!n) continue
      const wartosc = Number(param(Number(n[1])))
      if (Number.isFinite(wartosc)) cele.add(wartosc)
    }
  }
  if (cele.size === 0) return

  // `deleted_at IS NULL` w klauzuli WHERE — trasa nie moderuje wpisów już
  // usuniętych, a atrapa musi to honorować, inaczej test „usunięty komentarz
  // jest nieosiągalny” przechodziłby fałszywie.
  const tylkoZywe = wherePart.includes('deleted_at is null')

  const zmiany: Array<[string, unknown]> = []
  for (const fragment of setPart.split(/,(?![^(]*\))/)) {
    const tekst = fragment.trim()
    let dopasowanie = /^(\w+) = \?(\d+)$/.exec(tekst)
    if (dopasowanie) {
      zmiany.push([dopasowanie[1], param(Number(dopasowanie[2]))])
      continue
    }
    dopasowanie = /^(\w+) = current_timestamp$/.exec(tekst)
    if (dopasowanie) {
      zmiany.push([dopasowanie[1], TERAZ])
      continue
    }
    dopasowanie = /^(\w+) = coalesce\(\?(\d+), \w+\)$/.exec(tekst)
    if (dopasowanie) {
      const wartosc = param(Number(dopasowanie[2]))
      zmiany.push([dopasowanie[1], wartosc === null || wartosc === undefined ? BEZ_ZMIANY : wartosc])
      continue
    }
    dopasowanie = /^(\w+) = \1 \+ 1$/.exec(tekst)
    if (dopasowanie) {
      zmiany.push([dopasowanie[1], BEZ_ZMIANY])
      // Inkrementacja liczona per wiersz poniżej — wartość zależy od stanu.
      zmiany.push([`__inkrementuj:${dopasowanie[1]}`, true])
      continue
    }
    // Nierozpoznana konstrukcja (CASE WHEN …) — świadomie pomijana.
  }

  for (const wiersz of komentarze) {
    if (!cele.has(Number(wiersz.id))) continue
    if (tylkoZywe && wiersz.deleted_at !== null) continue
    for (const [kolumna, wartosc] of zmiany) {
      if (kolumna.startsWith('__inkrementuj:')) {
        const nazwa = kolumna.slice('__inkrementuj:'.length)
        wiersz[nazwa] = Number(wiersz[nazwa] ?? 0) + 1
        continue
      }
      if (wartosc === BEZ_ZMIANY) continue
      wiersz[kolumna] = wartosc
    }
  }
}

class MockStatement implements D1PreparedStatementLike {
  private params: unknown[] = []

  constructor(private readonly sql: string, private readonly handlers: Map<string, QueryHandler>, private readonly log: QueryLogEntry[], private readonly stan: MockD1Database) {}

  bind(...values: unknown[]): D1PreparedStatementLike {
    this.params = values
    return this
  }

  async first<T = unknown>(): Promise<T | null> {
    const result = await this.resolve()
    return (Array.isArray(result) ? result[0] ?? null : result) as T | null
  }

  async run<T = unknown>(): Promise<T> {
    await this.resolve()
    // D1 zwraca `meta.last_row_id` po INSERT — trasy rejestracji i komentarzy
    // czytają tę wartość, by zwrócić identyfikator utworzonego zasobu.
    //
    // UWAGA: identyfikator MUSI być tym samym, pod którym `domyslne()` zapisało
    // wiersz. Wcześniej wołaliśmy tu `kolejneId()` po raz drugi, więc INSERT
    // zapisywał konto pod id 100, a odpowiedź podawała 101 — `getUserById(101)`
    // nie znajdował nic i rejestracja kończyła się 500.
    const id = this.stan.ostatnieId ?? this.stan.kolejneId()
    this.stan.ostatnieId = undefined
    return { success: true, meta: { last_row_id: id, changes: 1, duration: 0 } } as T
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    const result = await this.resolve()
    return { results: Array.isArray(result) ? result as T[] : result ? [result as T] : [] }
  }

  async raw<T = unknown>(): Promise<T[]> {
    const result = await this.resolve()
    return Array.isArray(result) ? result as T[] : result ? [result as T] : []
  }

  private async resolve() {
    this.log.push({ sql: this.sql, params: this.params })
    const normalized = this.sql.toLowerCase().replace(/\s+/g, ' ').trim()

    // Ręcznie zarejestrowane reguły mają pierwszeństwo — test może nadpisać
    // dowolne zachowanie domyślne przez `.on('fragment sql', handler)`.
    for (const [needle, handler] of this.handlers.entries()) {
      if (normalized.includes(needle)) return handler(this.params)
    }

    return this.domyslne(normalized)
  }

  /**
   * Odpowiedzi domyślne dobierane po fragmencie SQL. Kolejność sprawdzeń jest
   * istotna: `count(*)` musi wyprzedzić ogólne `from articles`, inaczej
   * zapytanie zliczające dostałoby wiersze zamiast liczby.
   */
  private domyslne(sql: string): unknown {
    // ── ZAPISY ──────────────────────────────────────────────────────────
    // `createUser` (src/lib/auth/store.ts:204) robi INSERT, a potem CZYTA
    // konto po `meta.last_row_id`. Mock, który przyjmował INSERT bez zapisania
    // wiersza, przechodził przez zapis i wywracał się na odczycie:
    //   Error: Konto zostalo zapisane, ale nie udalo sie go odczytac.
    // → POST /api/v1/auth/register kończył się 500, choć trasa była poprawna.
    // Wniosek: mock musi mieć pamięć zapisów, inaczej testuje tylko odczyty
    // i każdą ścieżkę „zapisz i odczytaj” raportuje jako awarię aplikacji.
    if (sql.startsWith('insert into users')) {
      // Kolejność parametrów z store.ts: email, password_hash, name, role,
      // email_verified, email_verified_at.
      const [email, passwordHash, name, role, emailVerified] = this.params
      const id = this.stan.kolejneId()
      this.stan.uzytkownicy.push({
        ...WIERSZ_UZYTKOWNIKA,
        id,
        email: String(email),
        name: String(name ?? 'Bez nazwy'),
        role: String(role ?? 'viewer'),
        password_hash: String(passwordHash ?? ''),
        email_verified: Number(emailVerified ?? 0),
        two_factor_enabled: 0,
        two_factor_secret: null,
        pending_two_factor_secret: null,
        failed_login_attempts: 0,
        locked_until: null,
        last_login: null,
        avatar: null,
        bio: null,
      })
      this.stan.ostatnieId = id
      return []
    }
    // UPDATE na komentarzach interpretujemy, bo tylko wtedy test może sprawdzić
    // CO trafiło do bazy (np. `moderated_by`), a nie jedynie status odpowiedzi.
    if (sql.startsWith('update comments set')) {
      zastosujUpdateKomentarzy(sql, this.params, this.stan.komentarze)
      return []
    }
    if (sql.startsWith('insert into') || sql.startsWith('update ') || sql.startsWith('delete from')) {
      return []
    }

    // ── zdrowie / introspekcja ──────────────────────────────────────────
    if (sql.includes('select 1 as ok')) return { ok: 1 }
    if (sql.includes('sqlite_master')) {
      return [{ name: 'articles', sql: 'CREATE TABLE articles (id TEXT PRIMARY KEY)' }]
    }

    // ── liczniki ────────────────────────────────────────────────────────
    if (sql.includes('count(*) as n') && sql.includes('from articles')) {
      return { n: this.stan.artykuly.length }
    }
    /**
     * `GROUP BY` zwraca ZBIÓR wierszy, nie jeden wiersz.
     *
     * Wcześniej ta reguła oddawała `{ n: 0 }` także dla zapytań grupujących,
     * więc kolejka moderacji budowała `Object.fromEntries([[undefined, 0]])`
     * i odpowiadała `"counts":{"undefined":0}` — klucz `undefined` jako nazwa
     * statusu. Wygląda to jak defekt trasy, a jest artefaktem atrapy: kod
     * czyta `r.status`, którego w sztucznym wierszu nie było.
     *
     * Rozróżnienie ma znaczenie, bo test napisany pod tamto zachowanie
     * utrwaliłby oczekiwanie `counts: { undefined: 0 }` i chronił artefakt
     * zamiast kontraktu.
     */
    if (sql.includes('count(*)') && sql.includes('group by')) return []
    if (sql.includes('count(*)')) return { n: 0, 'count(*)': 0 }

    // ── artykuły ────────────────────────────────────────────────────────
    if (sql.includes('from articles')) {
      // Zapytanie po slugu: zwracamy dopasowany wiersz albo nic. Bez tego
      // filtru mock potwierdzałby istnienie KAŻDEGO sluga, więc test
      // „rejects unknown article” przechodziłby fałszywie.
      const slug = this.params.find((p) => typeof p === 'string' && /^[a-z0-9-]+$/.test(p))
      if (sql.includes('a.slug = ?') || sql.includes('slug = ?')) {
        return this.stan.artykuly.filter((a) => a.slug === slug)
      }
      if (sql.includes('where id = ?') || sql.includes('a.id = ?')) {
        const id = this.params.find((p) => typeof p === 'number')
        return this.stan.artykuly.filter((a) => a.id === id)
      }
      // Lista — honorujemy LIMIT/OFFSET, bo testy sprawdzają długość strony.
      const liczby = this.params.filter((p): p is number => typeof p === 'number')
      const limit = liczby.length >= 2 ? liczby[liczby.length - 2] : liczby[0] ?? this.stan.artykuly.length
      const offset = liczby.length >= 2 ? liczby[liczby.length - 1] : 0
      return this.stan.artykuly.slice(offset, offset + limit)
    }

    // ── sesje ───────────────────────────────────────────────────────────
    // Musi być sprawdzane PRZED `from users`: zapytanie o sesję zawiera
    // JOIN-y i nazwy kolumn, które mogłyby trafić w inną regułę.
    if (sql.includes('user_sessions')) {
      const id = this.params.find((p) => typeof p === 'string')
      return this.stan.sesje.filter((s) => s.id === id)
    }

    // ── użytkownicy ─────────────────────────────────────────────────────
    if (sql.includes('from users')) {
      const email = this.params.find((p) => typeof p === 'string' && p.includes('@'))
      if (email) return this.stan.uzytkownicy.filter((u) => u.email === email)
      const id = this.params.find((p) => typeof p === 'number')
      if (id !== undefined) return this.stan.uzytkownicy.filter((u) => u.id === id)
      return this.stan.uzytkownicy
    }

    // ── bloki treści, tagi, komentarze ──────────────────────────────────
    if (sql.includes('article_blocks')) {
      return [{ article_id: 1, position: 0, block_type: 'paragraph', payload_json: JSON.stringify({ text: 'Treść akapitu.' }) }]
    }
    if (sql.includes('from tags') || sql.includes('article_tags')) {
      return [{ article_id: 1, slug: 'inwestycje', name: 'Inwestycje' }]
    }
    // ── komentarze ──────────────────────────────────────────────────────
    // Filtrujemy po id / statusie / artykule, bo atrapa zwracająca wszystko
    // potwierdzałaby istnienie KAŻDEGO komentarza (test „nie znaleziono”
    // przechodziłby fałszywie), a zwracająca `[]` — żadnego (test nie
    // dotknąłby ścieżki zapisu `moderated_by`).
    if (sql.includes('from comments')) {
      const zywe = this.stan.komentarze.filter((k) => k.deleted_at === null)
      if (sql.includes('parent_id = ?')) {
        const rodzic = this.params.find((p) => typeof p === 'number')
        return zywe.filter((k) => k.parent_id === rodzic)
      }
      if (sql.includes('id in (')) {
        const idki = this.params.filter((p): p is number => typeof p === 'number')
        return zywe.filter((k) => idki.includes(Number(k.id)))
      }
      if (sql.includes('cm.id = ?') || sql.includes('where id = ?')) {
        const id = this.params.find((p) => typeof p === 'number')
        return zywe.filter((k) => Number(k.id) === id)
      }
      const status = this.params.find(
        (p): p is string => typeof p === 'string' && ['pending', 'approved', 'rejected', 'spam'].includes(p),
      )
      return status ? zywe.filter((k) => k.status === status) : zywe
    }
    if (sql.includes('from categories')) {
      return [{ id: 1, slug: 'wiadomosci', name: 'Wiadomości' }]
    }

    return []
  }
}

export class MockD1Database implements D1DatabaseLike {
  public readonly log: QueryLogEntry[] = []
  private readonly handlers = new Map<string, QueryHandler>()
  private nastepneId = 100
  /** Id ostatnio wstawionego wiersza — czytane przez `run()` jako `last_row_id`. */
  public ostatnieId: number | undefined

  /** Dane domyślne. Test może je podmienić przed wywołaniem żądania. */
  public artykuly: Array<Record<string, unknown> & { id: number; slug: string }> = [
    { ...WIERSZ_ARTYKULU },
    { ...DRUGI_ARTYKUL },
  ]
  public uzytkownicy: Array<Record<string, unknown> & { id: number; email: string }> = [
    { ...WIERSZ_UZYTKOWNIKA },
  ]

  /** Aktywne sesje. Test może je wyczyścić, by sprawdzić skutek wylogowania. */
  public sesje: Array<Record<string, unknown> & { id: string }> = [{ ...WIERSZ_SESJI }]

  /**
   * Komentarze. Test czyta je PO żądaniu, by sprawdzić, co trasa zapisała
   * (np. czy `moderated_by` dostało numeryczny identyfikator moderatora).
   */
  public komentarze: Array<Record<string, unknown> & { id: number }> = [
    { ...WIERSZ_KOMENTARZA },
    { ...DRUGI_KOMENTARZ },
  ]

  kolejneId(): number {
    return this.nastepneId++
  }

  on(queryNeedle: string, handler: QueryHandler) {
    this.handlers.set(queryNeedle.toLowerCase(), handler)
    return this
  }

  /** Ustawia bazę bez artykułów — do testów ścieżek „nie znaleziono”. */
  bezArtykulow() {
    this.artykuly = []
    return this
  }

  prepare(query: string): D1PreparedStatementLike {
    return new MockStatement(query, this.handlers, this.log, this)
  }

  async batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<T[]> {
    const results: T[] = []
    for (const statement of statements) results.push(await statement.run<T>())
    return results
  }

  async exec(_query: string): Promise<unknown> {
    return { success: true }
  }
}
