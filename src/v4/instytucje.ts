// ============================================================================
// IZBICA24.PL — INSTYTUCJE PUBLICZNE GMINY IZBICA KUJAWSKA
//
// Jedno źródło prawdy dla danych teleadresowych. Zastępuje dwa niezależne,
// wzajemnie niezgodne wykazy: tablicę INSTYTUCJE w src/v4/pages/Mapa.tsx
// oraz tabelę „Instytucje w gminie" w src/v4/info-routes.tsx (/telefony).
//
// ════════════════════════════════════════════════════════════════════════════
// DLACZEGO TEN PLIK POWSTAŁ — I DLACZEGO KAŻDY WPIS MA POLE `zrodlo`
// ════════════════════════════════════════════════════════════════════════════
// Poprzednie wykazy zawierały numery telefonów i adresy, których nie da się
// potwierdzić w żadnym źródle. Sprawdziłem wszystkie osiem pozycji w
// oficjalnym wykazie jednostek organizacyjnych gminy
// (izbicakuj.pl/jednostki-organizacyjne.html) oraz na stronach jednostek:
//
//   Urząd Miejski      54 286 50 09      — POTWIERDZONY
//   SPZOZ              „54 286 51 12"    — BŁĄD, w rzeczywistości 54 286 50 30
//                                          i adres Narutowicza 16, nie Kolejowa 5
//   Posterunek Policji „47 725 42 30"    — BŁĄD, w rzeczywistości 47 753 15 10
//                                          i adres Nowomiejska 20a, nie Narutowicza 8
//   MGCK               „54 286 50 41"    — BŁĄD, w rzeczywistości 54 286 51 93
//                                          i adres Narutowicza 63, nie Piłsudskiego 26
//   Biblioteka         „54 286 50 42"    — BŁĄD, w rzeczywistości 54 286 51 67
//   MGOPS              „54 286 51 45"    — BŁĄD, w rzeczywistości 54 286 51 60
//                                          i adres Piłsudskiego 32, nie Sportowa 4
//   ZGKiW              „54 286 50 88"    — BŁĄD, w rzeczywistości 54 286 51 19
//                                          i adres Piłsudskiego 32, nie Kolejowa 14
//   „ZGKiW awarie 601 445 220"           — BŁĄD, numeru nie ma w żadnym źródle
//   „OSP ul. Sportowa 2, 998/112"        — USUNIĘTE, brak potwierdzenia siedziby
//
// Siedem z ośmiu pozycji było nieprawdziwych. To nie jest usterka kosmetyczna:
// mieszkaniec, który dzwoni pod podany przez portal numer ośrodka zdrowia albo
// „całodobowy numer awaryjny wodociągów", trafia w nikąd — a przy awarii wody
// czy w sprawie zdrowia dziecka traci na tym czas, którego nie ma. Portal
// informacyjny odpowiada za takie dane wprost.
//
// Dlatego każdy wpis ma pole `zrodlo` z adresem, pod którym dane sprawdzono,
// oraz `sprawdzono` z datą. Wpis bez źródła nie ma prawa się tu znaleźć.
// Ta sama zasada co w gmina-fakty.ts (liczby z datą i źródłem GUS).
//
// ════════════════════════════════════════════════════════════════════════════
// GODZINY OTWARCIA — CELOWO PODANE OSZCZĘDNIE
// ════════════════════════════════════════════════════════════════════════════
// Wykaz gminy nie publikuje godzin pracy jednostek. Godziny urzędu są
// potwierdzone. Dla pozostałych jednostek pole `godziny` jest `null` —
// zamiast wpisywać prawdopodobne „pon–pt 8:00–15:00". Czytelnik, który
// przyjedzie pod zamknięte drzwi, ma prawo uznać, że portal go wprowadził
// w błąd; brak informacji jest uczciwszy niż informacja wymyślona.
//
// ════════════════════════════════════════════════════════════════════════════
// WSPÓŁRZĘDNE
// ════════════════════════════════════════════════════════════════════════════
// `lat`/`lon` tylko dla punktów potwierdzonych w OpenStreetMap. Znacznik
// postawiony „na oko" z adresu jest gorszy niż jego brak, bo czytelnik ufa
// mapie i pojedzie we wskazane miejsce. Instytucje bez współrzędnych
// pokazują się wyłącznie na liście adresowej pod mapą.
// ============================================================================

export interface Instytucja {
  nazwa: string
  rodzaj: string
  /** Ulica z numerem. Kod pocztowy jest wspólny (87-865) i dopisywany w widoku. */
  adres: string
  /** Telefon w formacie krajowym, np. „54 286 50 09". `null` = brak potwierdzenia. */
  telefon: string | null
  /** `null` gdy godzin nie ma w źródle — patrz nagłówek pliku. */
  godziny: string | null
  email: string | null
  www: string | null
  lat: number | null
  lon: number | null
  /** Adres źródła, w którym dane sprawdzono. Wymagany. */
  zrodlo: string
  /** Data weryfikacji w formacie DD.MM.RRRR. */
  sprawdzono: string
}

const WYKAZ_GMINY = 'https://izbicakuj.pl/jednostki-organizacyjne.html'
const DATA = '27.07.2026'

export const INSTYTUCJE: readonly Instytucja[] = [
  {
    nazwa: 'Urząd Miejski w Izbicy Kujawskiej',
    rodzaj: 'Samorząd',
    adres: 'ul. Marszałka Piłsudskiego 32',
    telefon: '54 286 50 09',
    // Jedyne godziny potwierdzone w źródle (strona kontaktowa urzędu).
    godziny: 'pon–pt 7:30–15:30',
    email: 'urzad@izbicakuj.pl',
    www: 'https://izbicakuj.pl',
    // Współrzędne z OSM — ten punkt jest zweryfikowany (siedziba gminy).
    lat: 52.41925,
    lon: 18.76435,
    zrodlo: 'https://izbicakuj.pl/kontakt.html',
    sprawdzono: DATA,
  },
  {
    nazwa: 'Samodzielny Publiczny Zakład Opieki Zdrowotnej',
    rodzaj: 'Zdrowie',
    adres: 'ul. Narutowicza 16',
    telefon: '54 286 50 30',
    godziny: null,
    email: 'kontakt@spzozizbica.pl',
    www: 'https://spzozizbica.pl',
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Posterunek Policji w Izbicy Kujawskiej',
    rodzaj: 'Bezpieczeństwo',
    // Źródła podają rozbieżnie Nowomiejską 20a (strona gminy) i 22 (KMP
    // Włocławek). Podajemy wersję ze strony gminy i nie rozstrzygamy różnicy
    // numeru budynku — telefon jest w obu źródłach ten sam.
    adres: 'ul. Nowomiejska 20a',
    telefon: '47 753 15 10',
    godziny: 'dyżur pon–pt; zgłoszenia całodobowo: 112',
    email: null,
    www: 'https://wloclawek.policja.gov.pl',
    lat: null,
    lon: null,
    zrodlo: 'https://izbicakuj.pl/komisariat-policji.html',
    sprawdzono: DATA,
  },
  {
    nazwa: 'Miejsko-Gminne Centrum Kultury',
    rodzaj: 'Kultura',
    adres: 'ul. Narutowicza 63',
    telefon: '54 286 51 93',
    godziny: null,
    email: 'mgck-izbicakuj@wp.pl',
    www: 'https://www.mgck-izbicakujawska.net.pl',
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Biblioteka Publiczna',
    rodzaj: 'Kultura',
    adres: 'ul. Narutowicza 63',
    telefon: '54 286 51 67',
    godziny: null,
    email: null,
    www: null,
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Miejsko-Gminny Ośrodek Pomocy Społecznej',
    rodzaj: 'Pomoc społeczna',
    adres: 'ul. Marszałka Piłsudskiego 32',
    // Wykaz gminy podaje centralę urzędu (54 286 50 09); własna strona MGOPS
    // podaje numer bezpośredni 54 286 51 60 — jego używamy, bo prowadzi
    // wprost do jednostki.
    telefon: '54 286 51 60',
    godziny: null,
    email: 'mgops@izbicakuj.pl',
    www: 'https://mgopsizbica.naszops.pl',
    lat: null,
    lon: null,
    zrodlo: 'https://mgopsizbica.naszops.pl/kontakt',
    sprawdzono: DATA,
  },
  {
    nazwa: 'Zakład Gospodarki Komunalnej i Wodociągów',
    rodzaj: 'Komunalne',
    adres: 'ul. Marszałka Piłsudskiego 32',
    telefon: '54 286 51 19',
    // Poprzednia wersja podawała „awarie całodobowo: 601 445 220". Takiego
    // numeru nie ma w żadnym źródle. Numer awaryjny wodociągów to informacja,
    // po którą sięga się w sytuacji pilnej — nie może być domyślona.
    godziny: null,
    email: null,
    www: 'https://zgkiw-izbica-kujawska.bip.gov.pl/',
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Przedszkole Samorządowe',
    rodzaj: 'Oświata',
    adres: 'ul. Narutowicza 63',
    telefon: '54 286 52 97',
    godziny: null,
    email: null,
    www: null,
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Szkoła Podstawowa nr 1 im. Marszałka Józefa Piłsudskiego',
    rodzaj: 'Oświata',
    adres: 'ul. Tymieniecka 1',
    telefon: '54 286 50 36',
    godziny: null,
    email: null,
    www: null,
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Szkoła Podstawowa nr 2 im. Augustyna Słubickiego',
    rodzaj: 'Oświata',
    adres: 'ul. Nowomiejska 3',
    telefon: '54 286 50 11',
    godziny: null,
    email: null,
    www: null,
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Szkoła Podstawowa w Błennie',
    rodzaj: 'Oświata',
    adres: 'Błenna 2',
    telefon: '54 286 82 05',
    godziny: null,
    email: null,
    www: null,
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
  {
    nazwa: 'Centrum Usług Wspólnych',
    rodzaj: 'Samorząd',
    adres: 'ul. Marszałka Piłsudskiego 32',
    telefon: '54 286 50 09 w. 108, 109',
    godziny: null,
    email: null,
    www: null,
    lat: null,
    lon: null,
    zrodlo: WYKAZ_GMINY,
    sprawdzono: DATA,
  },
] as const

/**
 * Numery alarmowe. Wydzielone od instytucji, bo nie są danymi teleadresowymi
 * jednostki — to numery ogólnokrajowe, niezależne od gminy, i nie wymagają
 * weryfikacji lokalnej. Świadomie NIE ma tu numeru do OSP: zgłoszenie pożaru
 * idzie na 998/112, a nie do remizy.
 */
export const NUMERY_ALARMOWE: readonly { nazwa: string; numer: string }[] = [
  { nazwa: 'Numer alarmowy (wszystkie służby)', numer: '112' },
  { nazwa: 'Pogotowie ratunkowe', numer: '999' },
  { nazwa: 'Straż pożarna', numer: '998' },
  { nazwa: 'Policja', numer: '997' },
  { nazwa: 'Pogotowie gazowe', numer: '992' },
  { nazwa: 'Pogotowie energetyczne', numer: '991' },
]

/** Telefon w formie nadającej się do `href="tel:"` (E.164, prefiks +48). */
export const telefonDoWybierania = (telefon: string): string => {
  // Odcinamy numer wewnętrzny („w. 108, 109") — do wybrania służy centrala.
  const glowny = telefon.split(/\s*w\.\s*/)[0]
  return `+48${glowny.replace(/[^0-9]/g, '')}`
}
