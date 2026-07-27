/**
 * FAZA 4 / I12 — anonimizacja adresów IP (RODO, zasada minimalizacji).
 *
 * ── Dlaczego ten plik został przepisany ──────────────────────────────────
 *
 * Wcześniej zawierał jedną funkcję `anonymizeIp`, która NIE BYŁA WYWOŁYWANA
 * w żadnym miejscu projektu (sprawdzone grepem po całym `src/`). Równolegle
 * w kodzie istniały TRZY niezależne, różne implementacje skrótu IP:
 *
 *   • src/lib/audit.ts          — SHA-256 z solą z JWT_SECRET, 32 znaki
 *   • src/lib/auth/store.ts     — SHA-256 z solą stałą 'izbica24:', 32 znaki
 *   • src/routes/v1/comments.ts — SHA-256 z solą stałą 'izbica24:', 32 znaki
 *
 * Trzy kopie tej samej operacji to trzy miejsca, w których trzeba pamiętać
 * o poprawce — i rzeczywiście dwie z nich używały soli zapisanej na stałe
 * w kodzie źródłowym, co jest równoznaczne z brakiem soli: kod jest w
 * publicznym repozytorium, a adresów IPv4 jest tylko 4,3 mld, więc mając
 * skrót i znaną sól odtworzenie adresu to kwestia minut na zwykłym laptopie.
 * Skrót bez tajnej soli nie chroni więc niczego — daje tylko złudzenie
 * ochrony, co w dokumentacji RODO jest gorsze od jawnego zapisu, bo prowadzi
 * do błędnej oceny ryzyka.
 *
 * Dodatkowo znalazły się dwa miejsca zapisujące adres BEZ jakiejkolwiek
 * anonimizacji (naprawione osobno):
 *   • error_log.ip                  — pełny adres w bazie
 *   • gdpr:consent:* w USER_PREFS_KV — obcięcie ostatniego oktetu wykonane
 *     „w miejscu”, i to błędne dla IPv6 (adres IPv6 nie ma kropek, więc
 *     `ip.split('.').slice(0,3).join('.') + '.0'` dawało cały adres IPv6
 *     z przyklejonym „.0” — czyli anonimizacja nie działała wcale)
 *
 * ── Dwie różne operacje, nie jedna ───────────────────────────────────────
 *
 * Mieszanie ich jest częstym błędem, więc rozdzielamy je jawnie:
 *
 *  1. `anonymizeIp` — SKRACANIE. Zeruje ostatni oktet IPv4 / końcówkę IPv6.
 *     Wynik jest nadal czytelny dla człowieka i pozwala ocenić „skąd”
 *     (operator, region), ale nie wskazuje urządzenia. Stosujemy tam, gdzie
 *     dane mają służyć do diagnostyki oglądanej przez człowieka
 *     (dziennik błędów) — administrator widzi „192.0.2.0”, co wystarcza,
 *     by odróżnić awarię jednego łącza od globalnej.
 *
 *  2. `hashIp` — SKRÓT z tajną solą. Wynik jest nieczytelny, ale STAŁY dla
 *     tego samego adresu, więc pozwala wykryć, że dziesięć obraźliwych
 *     komentarzy pochodzi z jednego źródła, i nałożyć blokadę — bez
 *     przechowywania adresu. Stosujemy tam, gdzie potrzebna jest tożsamość
 *     techniczna, a nie lokalizacja (komentarze, sesje, dziennik audytu).
 *
 * Skracanie NIE zastąpi skrótu (192.0.2.0 to nadal 256 urządzeń, więc
 * blokada trafiłaby w sąsiadów), a skrót NIE zastąpi skracania (z SHA-256
 * nie da się odczytać operatora). Dlatego oba są potrzebne.
 */

/** Adres zastępczy, gdy nagłówek jest nieobecny lub nieprawidłowy. */
const NIEZNANY_IPV4 = '0.0.0.0'

/**
 * Skrócenie adresu do postaci nieidentyfikującej urządzenia.
 *
 * IPv4 → zerowany ostatni oktet (`192.0.2.77` → `192.0.2.0`), czyli
 * dokładnie to, co robi Google Analytics w trybie anonimizacji i co polskie
 * organy ochrony danych uznają za wystarczające dla statystyk.
 *
 * IPv6 → zachowane pierwsze 48 bitów (3 grupy), reszta ucięta
 * (`2001:db8:85a3:8d3:1319:8a2e:370:7348` → `2001:db8:85a3::`).
 * Uwaga: zostawiamy 3 grupy, nie 4. Dostawcy internetu przydzielają
 * pojedynczym gospodarstwom domowym prefiks /56 lub nawet /64, więc
 * zachowanie 4 grup (64 bity) potrafi wskazać konkretne mieszkanie —
 * anonimizacja byłaby pozorna. /48 to poziom sieci operatora.
 */
export const anonymizeIp = (ip: string | undefined | null): string => {
  const wartosc = String(ip ?? '').trim()
  if (!wartosc) return NIEZNANY_IPV4

  // IPv6 rozpoznajemy po dwukropku. Obsługujemy też postać skróconą („::”)
  // oraz adresy IPv4 zmapowane na IPv6 („::ffff:192.0.2.77”), które
  // Cloudflare potrafi podać dla klientów IPv4 za pośrednikiem.
  if (wartosc.includes(':')) {
    const zmapowany = wartosc.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
    if (zmapowany) return anonymizeIp(zmapowany[1])

    const grupy = wartosc.split(':').filter(Boolean)
    if (grupy.length === 0) return '::'
    return `${grupy.slice(0, 3).join(':')}::`
  }

  const oktety = wartosc.split('.')
  if (oktety.length !== 4) return NIEZNANY_IPV4
  // Odrzucamy wartości, które nie są liczbami z zakresu 0–255: zniekształcony
  // nagłówek nie może trafić do bazy jako pozornie poprawny adres.
  if (!oktety.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255)) return NIEZNANY_IPV4
  return `${oktety[0]}.${oktety[1]}.${oktety[2]}.0`
}

/**
 * Skrót adresu IP z tajną solą — jedna implementacja dla całego projektu.
 *
 * Sól MUSI pochodzić ze środowiska. Kolejność źródeł:
 *   1. IP_HASH_SALT — dedykowany sekret; właściwe miejsce.
 *   2. JWT_SECRET   — awaryjnie, bo jest gwarantowany w każdym środowisku.
 *      Nie jest to jego rola, ale skrót bez soli nie chroni niczego,
 *      więc lepiej pożyczyć istniejący sekret niż zapisać sól w kodzie.
 *
 * Gdy nie ma ŻADNEGO sekretu, zwracamy `null` i nie zapisujemy nic.
 * To celowe: zapis skrótu z solą zapisaną w publicznym repozytorium
 * byłby zapisem danych osobowych pod pozorem ich braku.
 *
 * Zwracamy 32 znaki heksadecymalne (128 bitów) — zgodnie z tym, co już
 * zapisano w kolumnach `ip_hash`, żeby istniejące wiersze pozostały
 * porównywalne po ujednoliceniu wywołań.
 */
export const hashIp = async (
  ip: string | undefined | null,
  env?: { IP_HASH_SALT?: string; JWT_SECRET?: string },
): Promise<string | null> => {
  const wartosc = String(ip ?? '').trim()
  if (!wartosc) return null

  const sol = env?.IP_HASH_SALT || env?.JWT_SECRET
  if (!sol) {
    console.warn(
      '[privacy] Brak IP_HASH_SALT i JWT_SECRET — skrot IP nie zostanie zapisany. ' +
        'Skrot bez tajnej soli mozna odwrocic slownikiem, wiec zapis pominieto swiadomie.',
    )
    return null
  }

  const dane = new TextEncoder().encode(`${sol}:${wartosc}`)
  const skrot = await crypto.subtle.digest('SHA-256', dane)
  const bajty = new Uint8Array(skrot)
  let wynik = ''
  for (let i = 0; i < 16; i += 1) wynik += bajty[i].toString(16).padStart(2, '0')
  return wynik
}

/**
 * Adres klienta widziany przez Cloudflare.
 *
 * `CF-Connecting-IP` jest ustawiany przez Cloudflare i nie da się go
 * podrobić z zewnątrz. `X-Forwarded-For` czytamy tylko jako zapas (np. przy
 * lokalnym `wrangler pages dev`) i bierzemy PIERWSZY wpis — kolejne mogą być
 * dopisane przez klienta, więc traktowanie ostatniego jako adresu klienta
 * pozwoliłoby obejść limity zapytań przez podstawienie dowolnej wartości.
 */
export const clientIp = (naglowek: (nazwa: string) => string | undefined): string | undefined =>
  naglowek('cf-connecting-ip') ??
  naglowek('x-forwarded-for')?.split(',')[0]?.trim() ??
  naglowek('x-real-ip') ??
  undefined
