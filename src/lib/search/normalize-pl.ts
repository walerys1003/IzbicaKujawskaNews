/**
 * Etap D5 — normalizacja polskiego tekstu dla wyszukiwania pełnotekstowego.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO TO JEST POTRZEBNE — ustalone pomiarem, nie założeniem
 * ═══════════════════════════════════════════════════════════════════════
 *
 * 1. Wbudowany tokenizer `unicode61 remove_diacritics 2` NIE radzi sobie
 *    z polską literą „ł”. Sprawdzone na działającej bazie:
 *
 *      MATCH 'sadlno'  → 0 wyników
 *      MATCH 'sadłno'  → 1 wynik
 *      MATCH 'blenna'  → 0 wyników
 *      MATCH 'błenna'  → 1 wynik
 *      MATCH 'wolka'   → 1 wynik   (ó jest obsługiwane)
 *
 *    Przyczyna: „ł” to w Unicode osobna litera (U+0142), a nie „l” ze
 *    znakiem diakrytycznym do zdjęcia — reguła usuwania diakrytyków jej
 *    nie dotyczy. To samo dotyczy „Ł”.
 *
 *    Skutek praktyczny: cztery z 34 sołectw gminy (Sadłno, Błenna,
 *    Bartłomiejowice, Świętosławice) byłyby nieosiągalne dla każdego,
 *    kto pisze bez polskiej klawiatury — a to codzienność na telefonie.
 *    Mieszkaniec szukający „sadlno” dostawał pustą stronę wyników
 *    i uznawał, że portal nic o jego wsi nie ma.
 *
 * 2. Polska odmiana rzeczowników łamie dopasowanie dokładne. Też zmierzone:
 *
 *      MATCH 'izbica' → 0 wyników   (w tekstach jest „w Izbicy”)
 *      MATCH 'izbic*' → 2 wyniki
 *      MATCH 'gminy'  → 0 wyników   (w tekstach jest „gmina”)
 *      MATCH 'gmina'  → 1 wynik
 *
 *    Nazwa gminy odmienia się przez siedem przypadków (Izbica, Izbicy,
 *    Izbicę, Izbicą, Izbico). Wyszukiwarka lokalnego portalu, która nie
 *    znajduje nazwy własnej gminy, jest bezużyteczna w swoim głównym
 *    zastosowaniu.
 *
 * Rozwiązanie: nie próbujemy budować stemmera dla polszczyzny (to zadanie
 * na osobny słownik morfologiczny, którego nie zmieścimy w Workerze).
 * Zamiast tego (a) składamy litery do postaci bez diakrytyków po obu
 * stronach — przy indeksowaniu i w zapytaniu, oraz (b) obcinamy końcówkę
 * fleksyjną i szukamy po przedrostku. To pokrywa przypadki, które
 * realnie wpisują czytelnicy, bez udawania pełnej analizy morfologicznej.
 */

/**
 * Mapa liter, których `remove_diacritics 2` nie składa samo.
 * Pozostałe (ą, ć, ę, ń, ó, ś, ź, ż) tokenizer obsługuje, ale składamy
 * je tutaj również — indeks i zapytanie muszą przechodzić DOKŁADNIE tę
 * samą transformację, inaczej rozjazd wraca w innym miejscu.
 */
const LITERY: Record<string, string> = {
  ą: 'a',
  Ą: 'a',
  ć: 'c',
  Ć: 'c',
  ę: 'e',
  Ę: 'e',
  ł: 'l',
  Ł: 'l',
  ń: 'n',
  Ń: 'n',
  ó: 'o',
  Ó: 'o',
  ś: 's',
  Ś: 's',
  ź: 'z',
  Ź: 'z',
  ż: 'z',
  Ż: 'z',
}

/**
 * Składa polski tekst do postaci ASCII z zachowaniem podziału na wyrazy.
 *
 * Kolejność ma znaczenie: najpierw podmieniamy litery z naszej mapy
 * (obejmuje „ł”), a dopiero potem stosujemy rozkład NFD dla ewentualnych
 * pozostałych znaków z innych języków (np. nazwisko „Müller”).
 */
export const foldPolish = (input: string): string =>
  input
    .replace(/[ąĄćĆęĘłŁńŃóÓśŚźŹżŻ]/g, (znak) => LITERY[znak] ?? znak)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/**
 * Końcówki fleksyjne obcinane przy budowie zapytania przedrostkowego.
 *
 * Lista jest krótka i celowo zachowawcza. Zbyt agresywne obcinanie
 * zamienia wyszukiwarkę w generator przypadkowych trafień: obcięcie
 * „rada” do „rad” dołącza „radar” i „radio”, a mieszkaniec szukający
 * uchwał rady gminy dostaje artykuł o stacji radiowej i traci zaufanie
 * do wyników. Dlatego minimalna długość rdzenia to 4 znaki.
 */
const KONCOWKI = ['ami', 'ach', 'owi', 'iem', 'em', 'ie', 'ów', 'ow', 'om', 'ie', 'y', 'i', 'a', 'e', 'ę', 'ą', 'u', 'o']

const MIN_RDZEN = 4

/**
 * Zamienia wyraz na rdzeń nadający się do dopasowania przedrostkowego.
 * Zwraca `null`, gdy wyraz jest zbyt krótki, by go bezpiecznie skracać.
 */
export const rdzen = (wyraz: string): string | null => {
  const w = foldPolish(wyraz)
  if (w.length < MIN_RDZEN) return null
  for (const k of KONCOWKI) {
    if (w.length - k.length >= MIN_RDZEN && w.endsWith(foldPolish(k))) {
      return w.slice(0, w.length - k.length)
    }
  }
  return w
}

/** Wyrazy pomijane — nie wnoszą nic do trafności, a psują ranking. */
const STOP = new Set([
  'i',
  'w',
  'z',
  'na',
  'do',
  'od',
  'za',
  'po',
  'o',
  'u',
  'a',
  'że',
  'ze',
  'to',
  'nie',
  'jest',
  'sie',
  'sa',
  'oraz',
  'lub',
  'ale',
  'jak',
  'dla',
  'przez',
  'przy',
  'pod',
  'nad',
  'the',
])

export interface ZapytanieFts {
  /** Wyrażenie gotowe do wstawienia po `MATCH`. */
  match: string
  /** Wyrazy po normalizacji — do podświetlania i diagnostyki. */
  terminy: string[]
  /** `true`, gdy z wejścia nie dało się zbudować sensownego zapytania. */
  puste: boolean
}

/**
 * Buduje wyrażenie FTS5 z tekstu wpisanego przez czytelnika.
 *
 * ZNAKI SPECJALNE FTS5 SĄ USUWANE, NIE PRZEKAZYWANE DALEJ.
 * Składnia FTS5 traktuje `"`, `*`, `(`, `)`, `:`, `^`, `-` jako operatory.
 * Wpisane w polu wyszukiwania przez czytelnika — choćby przypadkiem,
 * jak w „remont ul. Kościelnej (etap 2)” — powodują błąd składni SQL
 * i całe zapytanie kończy się wyjątkiem. Czytelnik widzi wtedy stronę
 * błędu zamiast wyników, mimo że jego zapytanie było zupełnie sensowne.
 * Nie jest to droga do wstrzyknięcia SQL (parametr jest wiązany), ale
 * jest to niezawodny sposób na zepsucie wyszukiwarki zwykłym nawiasem.
 */
export const budujZapytanie = (wejscie: string): ZapytanieFts => {
  const wyrazy = foldPolish(wejscie)
    // wszystko, co nie jest literą ASCII ani cyfrą, staje się separatorem
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 0 && !STOP.has(w))
    .slice(0, 12) // górny limit — 12 wyrazów wystarcza, chroni przed zapytaniem na 5 kB

  if (wyrazy.length === 0) return { match: '', terminy: [], puste: true }

  const czlony = wyrazy.map((w) => {
    const r = rdzen(w)
    // Rdzeń krótszy niż wyraz → dopasowanie przedrostkowe łapie odmianę.
    // Wyraz krótki (poniżej 4 znaków) zostaje dopasowaniem dokładnym.
    return r && r.length >= MIN_RDZEN ? `${r}*` : w
  })

  return {
    // OR, nie AND: przy zapytaniu „dożynki Wietrzychowice” czytelnik woli
    // zobaczyć artykuły o dożynkach ORAZ o Wietrzychowicach uszeregowane
    // według trafności, niż pustą stronę, bo żaden tekst nie zawiera obu
    // słów naraz. Ranking bm25 i tak wypycha na górę te z oboma.
    match: czlony.join(' OR '),
    terminy: wyrazy,
    puste: false,
  }
}

/**
 * Wyrażenie SQL składające polskie litery w zapytaniu SQLite.
 *
 * Używane w wyzwalaczach utrzymujących indeks — SQLite nie ma funkcji
 * normalizującej Unicode, więc jedyną dostępną drogą jest łańcuch
 * `replace()`. Nieładne, ale wykonuje się w bazie, więc indeks pozostaje
 * spójny także przy zapisie omijającym kod aplikacji (import, migracja,
 * ręczna korekta redaktora przez konsolę d1).
 */
export const sqlFoldPolish = (wyrazenie: string): string => {
  const pary: Array<[string, string]> = [
    ['ą', 'a'],
    ['ć', 'c'],
    ['ę', 'e'],
    ['ł', 'l'],
    ['ń', 'n'],
    ['ó', 'o'],
    ['ś', 's'],
    ['ź', 'z'],
    ['ż', 'z'],
    ['Ą', 'a'],
    ['Ć', 'c'],
    ['Ę', 'e'],
    ['Ł', 'l'],
    ['Ń', 'n'],
    ['Ó', 'o'],
    ['Ś', 's'],
    ['Ź', 'z'],
    ['Ż', 'z'],
  ]
  return pary.reduce((acc, [z, na]) => `replace(${acc}, '${z}', '${na}')`, `lower(${wyrazenie})`)
}
