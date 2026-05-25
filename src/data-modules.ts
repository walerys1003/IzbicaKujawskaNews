/* ===================================================================
   DANE ROZSZERZAJĄCE dla v3.5 — 24 modułów strony głównej
   Sandbox G/H/I — mock data dla wszystkich nowych sekcji
   =================================================================== */

// ============ SOŁECTWA GMINY IZBICA KUJAWSKA ============
// Gmina liczy 27 sołectw — wybieramy 15 najaktywniejszych dla home
export const SOLECTWA = [
  { slug: 'augustowo', name: 'Augustowo', sołtys: 'Marek Lewandowski', activity: 'high', lastNews: 'Remont świetlicy zakończony', x: 35, y: 42 },
  { slug: 'blenna', name: 'Błenna', sołtys: 'Anna Kowalska', activity: 'medium', lastNews: 'Festyn 14 czerwca', x: 60, y: 28 },
  { slug: 'dlugie', name: 'Długie', sołtys: 'Piotr Nowak', activity: 'medium', lastNews: 'Nowy plac zabaw', x: 22, y: 55 },
  { slug: 'gusin', name: 'Gusin', sołtys: 'Janina Wiśniewska', activity: 'low', lastNews: 'Zebranie sołeckie 5 czerwca', x: 75, y: 38 },
  { slug: 'helenowo', name: 'Helenowo', sołtys: 'Tomasz Kubiak', activity: 'high', lastNews: 'OSP otrzymała nowy wóz', x: 48, y: 22 },
  { slug: 'komorowo', name: 'Komorowo', sołtys: 'Krystyna Mazur', activity: 'medium', lastNews: 'Modernizacja drogi 2 km', x: 30, y: 70 },
  { slug: 'mchowek', name: 'Mchówek', sołtys: 'Zbigniew Pawlak', activity: 'high', lastNews: 'Wyłączenia prądu 28 maja', x: 82, y: 60 },
  { slug: 'naczachowo', name: 'Naczachowo', sołtys: 'Maria Wójcik', activity: 'low', lastNews: 'Plan funduszu sołeckiego', x: 18, y: 35 },
  { slug: 'obalin', name: 'Obałki', sołtys: 'Jacek Kowalczyk', activity: 'medium', lastNews: 'Nowy przystanek autobusowy', x: 65, y: 75 },
  { slug: 'pamiecin', name: 'Pamięcin', sołtys: 'Halina Adamska', activity: 'medium', lastNews: 'Konkurs „Najpiękniejszy ogród"', x: 52, y: 50 },
  { slug: 'sadlno', name: 'Sadłno', sołtys: 'Stanisław Szymański', activity: 'high', lastNews: 'Sieć wodociągowa modernizowana', x: 38, y: 82 },
  { slug: 'smolsk', name: 'Smólsk', sołtys: 'Barbara Kaczmarek', activity: 'high', lastNews: 'Wyłączenia prądu 28 maja', x: 70, y: 18 },
  { slug: 'swietoslawice', name: 'Świętosławice', sołtys: 'Andrzej Zieliński', activity: 'medium', lastNews: 'Festyn rodzinny 21 czerwca', x: 12, y: 65 },
  { slug: 'tymien', name: 'Tymień', sołtys: 'Ewa Jankowska', activity: 'low', lastNews: 'Spotkanie z burmistrzem', x: 88, y: 45 },
  { slug: 'wietrzychowice', name: 'Wietrzychowice', sołtys: 'dr Jan Maciejewski', activity: 'high', lastNews: 'Sezon turystyczny otwarty', x: 25, y: 18 },
] as const

// ============ PARTNERZY / INSTYTUCJE GMINY ============
export const PARTNERS = [
  { slug: 'urzad', name: 'Urząd Miejski', short: 'UMiG', color: '#0a2540', icon: 'building', url: '/instytucje/urzad' },
  { slug: 'mgck', name: 'MGCK Izbica', short: 'MGCK', color: '#7b2d8b', icon: 'palette', url: '/instytucje/mgck' },
  { slug: 'biblioteka', name: 'Biblioteka Publiczna', short: 'Biblioteka', color: '#1a3a5c', icon: 'book', url: '/instytucje/biblioteka' },
  { slug: 'caritas', name: 'Caritas Diecezjalna', short: 'Caritas', color: '#c0392b', icon: 'heart', url: '/instytucje/caritas' },
  { slug: 'osp', name: 'Ochotnicza Straż Pożarna', short: 'OSP', color: '#b8302a', icon: 'flame', url: '/instytucje/osp' },
  { slug: 'orionisci', name: 'Dom Orionistów', short: 'Orioniści', color: '#2d5a3d', icon: 'cross', url: '/instytucje/orionisci' },
  { slug: 'parafia', name: 'Parafia Izbica Kujawska', short: 'Parafia', color: '#8a6d2a', icon: 'church', url: '/instytucje/parafia' },
] as const

// ============ NAJBLIŻSZA SESJA RADY MIEJSKIEJ ============
export const SESJA_RADY = {
  numer: 'XLVII',
  data: '12 czerwca 2026',
  godzina: '14:00',
  miejsce: 'Sala konferencyjna UMiG, Izbica Kujawska',
  agenda: [
    'Sprawozdanie burmistrza z prac między sesjami',
    'Uchwała ws. zmian w budżecie gminy na 2026 r.',
    'Uchwała ws. nadania nazwy ulicy „Polskich Piramid"',
    'Uchwała ws. miejscowego planu zagospodarowania Sadłno',
    'Interpelacje i zapytania radnych',
    'Sprawy bieżące',
  ],
  link: '/samorzad/sesje/47',
}

// ============ BUDŻET 2026 — DONUT CHART STAATIC ============
// Wartości w mln zł, suma ~ 38.2 mln
export const BUDZET_2026 = {
  total: 38.2,
  pozycje: [
    { name: 'Oświata', value: 14.5, percent: 38, color: '#3498db' },
    { name: 'Inwestycje', value: 9.8, percent: 26, color: '#c0392b' },
    { name: 'Pomoc społ.', value: 5.2, percent: 14, color: '#e67e22' },
    { name: 'Kultura', value: 3.1, percent: 8, color: '#7b2d8b' },
    { name: 'Administracja', value: 2.9, percent: 7, color: '#0a2540' },
    { name: 'Pozostałe', value: 2.7, percent: 7, color: '#95a5a6' },
  ],
}

// ============ INWESTYCJE — PROGRESS LIST ============
export const INWESTYCJE = [
  {
    slug: 'koscielna-remont',
    title: 'Remont ul. Kościelnej',
    budget: '2,8 mln zł',
    progress: 100,
    status: 'completed',
    deadline: 'Maj 2026',
    location: 'Centrum',
  },
  {
    slug: 'wodociag-sadlno',
    title: 'Sieć wodociągowa Sadłno',
    budget: '4,2 mln zł',
    progress: 35,
    status: 'in_progress',
    deadline: 'Październik 2026',
    location: 'Sadłno',
  },
  {
    slug: 'plac-wolnosci',
    title: 'Przebudowa Pl. Wolności',
    budget: '3,5 mln zł',
    progress: 0,
    status: 'planned',
    deadline: 'Lipiec 2026 (start)',
    location: 'Centrum',
  },
  {
    slug: 'przedszkole-rozbudowa',
    title: 'Rozbudowa Przedszkola Gminnego',
    budget: '6,1 mln zł',
    progress: 62,
    status: 'in_progress',
    deadline: 'Wrzesień 2026',
    location: 'Izbica · ul. Słoneczna',
  },
  {
    slug: 'oswietlenie-led',
    title: 'Modernizacja oświetlenia LED — Smólsk',
    budget: '0,8 mln zł',
    progress: 80,
    status: 'in_progress',
    deadline: 'Czerwiec 2026',
    location: 'Smólsk',
  },
]

// ============ KUJAWIANKA — NASTĘPNY MECZ + TOP SCORERZY ============
export const NEXT_MATCH = {
  data: '8 czerwca 2026',
  godzina: '17:00',
  rywal: 'Lubraniec',
  miejsce: 'Stadion Miejski, Izbica Kujawska',
  kolejka: '28',
  daysLeft: 14,
}

export const TOP_SCORERS = [
  { player: 'Adamski', goals: 12, position: 'napastnik' },
  { player: 'Szymański', goals: 9, position: 'pomocnik' },
  { player: 'Kowalczyk', goals: 7, position: 'napastnik' },
  { player: 'Lewandowski Jr', goals: 5, position: 'pomocnik' },
]

// ============ SPORT AMATORSKI ============
export const SPORT_AMATORSKI = [
  { title: 'Turniej tenisowy w hali — finał 5 czerwca', cat: 'tenis' },
  { title: 'Bieg „Polskie Piramidy" — zapisy ruszają 1 czerwca', cat: 'bieganie' },
]

// ============ HISTORIA — 3 MINI CARDS ============
export const HISTORIA_CARDS = [
  { slug: 'dzieje', title: 'Dzieje Izbicy — 630 lat praw miejskich', excerpt: 'Od 1394 r. — historia, daty, wydarzenia.', icon: 'scroll' },
  { slug: 'zydzi', title: 'Społeczność żydowska Izbicy', excerpt: 'Dziedzictwo, sztetł, II wojna światowa.', icon: 'star' },
  { slug: 'zabytki', title: 'Zabytki gminy — szlak architektoniczny', excerpt: 'Kościół, ratusz, pałacyki, kaplice.', icon: 'church' },
]

// ============ KULTURA — KALENDARZ MGCK ============
export const KULTURA_EVENTS = [
  { date: '8', month: 'CZE', title: 'Koncert plenerowy „Kapela z Kujaw"', place: 'Rynek', cat: 'koncert' },
  { date: '14', month: 'CZE', title: 'Warsztaty plastyczne dla dzieci', place: 'MGCK · sala 12', cat: 'warsztaty' },
  { date: '21', month: 'CZE', title: 'Noc Świętojańska — ognisko + muzyka', place: 'Park miejski', cat: 'event' },
  { date: '28', month: 'CZE', title: 'Wernisaż wystawy „Kujawy w obiektywie"', place: 'Galeria MGCK', cat: 'wystawa' },
]

// ============ EDUKACJA — ZS KASPROWICZ FEATURE ============
export const EDUKACJA_NEWS = [
  { title: 'Maturalne wyniki — 100% zdawalności w klasach humanistycznych', date: '23 maja', school: 'ZS im. Kasprowicza' },
  { title: 'Rekrutacja do przedszkoli — zapisy do 15 czerwca', date: '20 maja', school: 'Przedszkola gminne' },
  { title: 'Uczniowie SP nr 1 na finale konkursu „Mistrz matematyki"', date: '18 maja', school: 'SP nr 1' },
]

// ============ ZDROWIE — APTEKA DYŻURNA + SPZOZ ============
export const APTEKA_DYZUR = {
  nazwa: 'Apteka Medikus',
  adres: 'ul. Rynek 12, Izbica Kujawska',
  telefon: '54 286 70 22',
  godziny: 'Dziś dyżur do 22:00 · Jutro do 20:00',
  mapsUrl: 'https://maps.google.com/?q=Apteka+Medikus+Izbica+Kujawska',
}

export const SPZOZ_INFO = {
  pediatra: { dni: 'Pon-Pt', godziny: '8:00–18:00 (piątki do 18:00)', sobota: '8:00–12:00 od czerwca' },
  rodzinny: { dni: 'Pon-Pt', godziny: '7:30–19:00', sobota: 'zamknięte' },
  internista: { dni: 'Pon, Śr, Pt', godziny: '15:00–19:00', sobota: 'zamknięte' },
}

// ============ ŚRODOWISKO + ROLNICTWO ============
export const KANAL_ZGLOWIACZKI = {
  poziom: 'normalny',
  ostatnia_kontrola: '22 maja 2026',
  prace: 'Zakończono kwartalne czyszczenie 14 km rowów',
  budget_2026: '580 tys. zł',
}

export const ROLNICTWO_PROGRAMY = [
  { title: 'Dopłaty obszarowe ARiMR — termin do 15 czerwca', deadline: '15.06.2026', urgency: 'high' },
  { title: 'Modernizacja gospodarstw — nabór 1-30 lipca', deadline: '01.07.2026', urgency: 'medium' },
  { title: 'Ekosystemy — szkolenie gminy 12 czerwca', deadline: '12.06.2026', urgency: 'medium' },
]

// ============ LUDZIE — PORTRETY + FEATURED WYWIAD ============
export const LUDZIE_PORTRETY = [
  {
    slug: 'maria-kowalska-osp',
    name: 'Maria Kowalska',
    role: 'Pierwsza kobieta-komendant OSP w gminie',
    quote: 'Strażacka pasja jest niezależna od płci. Liczy się odwaga i odpowiedzialność.',
    avatar: '#a64430',
  },
  {
    slug: 'tadeusz-nowak-rolnik',
    name: 'Tadeusz Nowak',
    role: 'Rolnik roku 2026 województwa kujawsko-pomorskiego',
    quote: 'Trzydzieści lat na tej samej ziemi nauczyło mnie, że szanować ją trzeba bardziej niż siebie.',
    avatar: '#2d5a3d',
  },
  {
    slug: 'anna-kowalska-redakcja',
    name: 'Anna Kowalska',
    role: 'Redaktor naczelna izbica24.pl',
    quote: 'Lokalne dziennikarstwo to nie zawód — to misja wobec sąsiadów.',
    avatar: '#0a2540',
  },
]

export const WYWIAD_FEATURED = {
  slug: 'wywiad-dorabiala-burmistrz',
  name: 'Marek Dorabiała',
  role: 'Burmistrz Izbicy Kujawskiej',
  intro: 'O budżecie 2026, planach inwestycyjnych i tym, czemu Polskie Piramidy będą wizytówką gminy.',
  quote: 'Izbica to gmina która ma wszystko — historię od 630 lat, młodych mieszkańców, sportowy klub i wyjątkowe dziedzictwo. Naszą rolą jest to wszystko opowiedzieć światu.',
  readingMinutes: 8,
  publishedAt: '23 maja 2026',
}

// ============ MIESZKANIEC PYTA — FEED ============
export const MIESZKANIEC_FEED = [
  { author: 'Krzysztof M.', solectwo: 'Sadłno', q: 'Kiedy ruszy budowa wodociągu na ul. Polnej?', a: 'Etap 2 — sierpień 2026. Pełny harmonogram w artykule.', votes: 23, time: '2h temu' },
  { author: 'Halina W.', solectwo: 'Świętosławice', q: 'Czy będzie autobus do Włocławka w soboty?', a: 'Trwają rozmowy z PKS. Decyzja w czerwcu.', votes: 17, time: '5h temu' },
  { author: 'Tomasz K.', solectwo: 'Augustowo', q: 'Brakuje placu zabaw dla dzieci.', a: 'Fundusz sołecki 2027 — planowana inwestycja 80 tys. zł.', votes: 41, time: 'wczoraj' },
  { author: 'Anna B.', solectwo: 'Centrum', q: 'Czemu nie ma śmietnika przy rynku po nowym remoncie?', a: 'Zamówione 4 kosze stylizowane — montaż do 15 czerwca.', votes: 12, time: 'wczoraj' },
]

// ============ OPINIE & FELIETONY ============
export const OPINIE = [
  {
    slug: 'felieton-630-lat-izbicy',
    title: 'Czy 630 lat zobowiązuje? O tożsamości Izbicy',
    author: 'dr Jan Maciejewski',
    authorRole: 'historyk regionalny',
    excerpt: 'Mamy prawa miejskie od 1394 r. — i co z tego wynika dla mieszkańca 2026 roku?',
    readingMinutes: 6,
    avatar: '#8a6d2a',
  },
  {
    slug: 'felieton-mlodzi-zostac',
    title: 'Jak zatrzymać młodych w gminie?',
    author: 'Krystyna Nowak',
    authorRole: 'pedagog',
    excerpt: 'Praca, mieszkanie, kultura. Trzy filary — i wszystkie wymagają pracy.',
    readingMinutes: 4,
    avatar: '#c0392b',
  },
  {
    slug: 'felieton-piramidy-szansa',
    title: 'Polskie Piramidy: szansa, której nie wolno zmarnować',
    author: 'Tomasz Lewandowski',
    authorRole: 'dziennikarz',
    excerpt: 'Wietrzychowice to nasza wizytówka. Czas zacząć ją traktować poważnie.',
    readingMinutes: 5,
    avatar: '#2d5a3d',
  },
]

export const NAJ_KOMENTOWANE = [
  { title: 'Remont ul. Kościelnej zakończony', comments: 47 },
  { title: 'Kujawianka wygrywa 3:1', comments: 32 },
  { title: 'PGE — wyłączenia 28 maja', comments: 28 },
  { title: 'MGCK ogłasza program Lata', comments: 19 },
]

// ============ MULTIMEDIA — VIDEO + THUMBS + PODCAST ============
export const VIDEO_FEATURED = {
  slug: 'video-otwarcie-koscielna',
  title: 'Uroczyste otwarcie ulicy Kościelnej — relacja wideo',
  duration: '3:42',
  views: '1,8 tys.',
  thumb: '#0a2540',
}

export const VIDEO_THUMBS = [
  { slug: 'wietrzychowice-drone', title: 'Polskie Piramidy z drona — sezon 2026', duration: '2:15' },
  { slug: 'kujawianka-bramki', title: 'Kujawianka — wszystkie bramki sezonu', duration: '4:08' },
  { slug: 'kgw-pierogi', title: 'KGW Pamięcin — warsztaty pierogarskie', duration: '5:30' },
  { slug: 'sesja-rady-22maja', title: 'Sesja Rady Miejskiej 22 maja — pełna relacja', duration: '47:12' },
]

export const PODCAST_LATEST = {
  episode: 12,
  title: '„Izbica rozmawia": Burmistrz o budżecie 2026',
  duration: '32 min',
  publishedAt: '24 maja 2026',
}

// ============ KALENDARZ TYGODNIA — 7 DNI ============
export const KALENDARZ_7DNI = [
  { dzien: 'PON', data: '26.05', eventy: [{ title: 'Sesja komisji budżetowej', time: '14:00', cat: 'samorzad' }] },
  { dzien: 'WT', data: '27.05', eventy: [{ title: 'Warsztaty MGCK dla seniorów', time: '11:00', cat: 'kultura' }, { title: 'Trening Kujawianki', time: '18:00', cat: 'sport' }] },
  { dzien: 'ŚR', data: '28.05', eventy: [{ title: 'Wyłączenia prądu — Smólsk', time: '8:00–14:00', cat: 'komunikat' }] },
  { dzien: 'CZW', data: '29.05', eventy: [{ title: 'Spotkanie z burmistrzem — Tymień', time: '17:00', cat: 'samorzad' }] },
  { dzien: 'PT', data: '30.05', eventy: [{ title: 'Wernisaż „Kujawy w obiektywie"', time: '18:00', cat: 'kultura' }, { title: 'Próba chóru parafialnego', time: '19:30', cat: 'kultura' }] },
  { dzien: 'SOB', data: '31.05', eventy: [{ title: 'Festyn rodzinny — Pamięcin', time: '14:00', cat: 'event' }] },
  { dzien: 'NIE', data: '01.06', eventy: [{ title: 'Dzień Dziecka — Rynek', time: '12:00–18:00', cat: 'event' }, { title: 'Mecz Kujawianka — Lubraniec', time: '17:00', cat: 'sport' }] },
]

// ============ OGŁOSZENIA — 3 KOLUMNY ============
export const NEKROLOGI = [
  { name: 'Ś.P. Stanisław Kowalski', dates: '1942–2026', text: 'Msza żałobna 27 maja, godz. 10:00, kościół parafialny.' },
  { name: 'Ś.P. Janina Nowakowa', dates: '1948–2026', text: 'Pogrzeb 26 maja, godz. 12:00, cmentarz parafialny.' },
]

export const PRACA = [
  { title: 'Kierowca C+E — okolice Izbicy', firm: 'Trans-Pol Sp. z o.o.', stawka: '5500–7000 zł' },
  { title: 'Sprzedawca w sklepie spożywczym', firm: 'PSS Społem', stawka: 'do uzgodnienia' },
  { title: 'Pomoc kuchenna — restauracja', firm: 'Karczma Kujawska', stawka: '4200 zł' },
]

export const NIERUCHOMOSCI = [
  { title: 'Dom 120 m² + działka 1200 m² · Sadłno', price: '385 000 zł' },
  { title: 'Mieszkanie 48 m² · ul. Kościelna', price: '215 000 zł' },
  { title: 'Działka budowlana 800 m² · Augustowo', price: '65 000 zł' },
]

// ============ TOP 10 TYGODNIA ============
export const TOP10_TYDZIEN = [
  { title: 'Remont ulicy Kościelnej zakończony przed terminem', views: '4 287' },
  { title: 'Kujawianka wygrywa 3:1 z Włocłavią', views: '3 521' },
  { title: 'PGE — wyłączenia prądu 28 maja w Smólsku', views: '2 894' },
  { title: 'Sesja Rady Miejskiej — relacja z 22 maja', views: '2 412' },
  { title: 'MGCK ogłasza program „Lata w Izbicy 2026"', views: '1 938' },
  { title: 'Wietrzychowice — rusza letni sezon turystyczny', views: '1 765' },
  { title: 'SPZOZ — nowe godziny pediatry od czerwca', views: '1 522' },
  { title: 'Caritas — program „Lato w gminie" dla dzieci', views: '1 348' },
  { title: 'Kanał Zgłowiączki — prace melioracyjne zakończone', views: '1 102' },
  { title: 'Rekrutacja do ZS Kasprowicz — harmonogram', views: '987' },
]

// ============ ARCHIWUM — LATA + MIESIĄCE ============
export const ARCHIWUM = {
  lata: [2026, 2025, 2024, 2023, 2022],
  miesiace: ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU'],
}
