// Realistyczne dane demo dla portalu izbica24.pl
// Wszystkie nazwy ulic, instytucji, sołectw, osób są prawdziwe — z gminy Izbica Kujawska.

export const SITE = {
  name: "izbica24",
  tagline: "Portal Gminy Izbica Kujawska",
  domain: "izbica24.pl",
  today: "Poniedziałek, 25 maja 2026",
  weather: { temp: 19, icon: "sun", city: "Izbica Kujawska" },
}

export type Article = {
  id: string
  title: string
  lead: string
  category: string
  subcategory?: string
  image?: string
  author: string
  time: string
  url?: string
  pilne?: boolean
  tags?: string[]
}

// Heroowe artykuły / NAJWAŻNIEJSZE
export const HERO_MAIN: Article = {
  id: "art-001",
  title: "Wielomilionowa inwestycja w sieć wodociągową — ZGKiW podpisał umowę z wykonawcą",
  lead: "Burmistrz Marek Dorabiała poinformował o podpisaniu umowy z firmą HYDROBUDOWA na modernizację 8,4 km sieci wodociągowej w sołectwach Sadłno, Bierzyn i Pasieka. Wartość: 6,7 mln zł, z czego 4,2 mln to dofinansowanie z Rządowego Funduszu Polski Ład.",
  category: "Wiadomości",
  subcategory: "Inwestycje",
  image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&h=675&fit=crop",
  author: "Redakcja izbica24.pl",
  time: "2 godziny temu",
}

export const HERO_SECONDARY: Article[] = [
  {
    id: "art-002",
    title: "Sesja Rady Miejskiej — relacja z 22 maja: budżet, fundusz sołecki, sprawy bieżące",
    lead: "",
    category: "Samorząd",
    subcategory: "Rada Miejska",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=160&h=120&fit=crop",
    author: "Redakcja",
    time: "5 godz. temu",
  },
  {
    id: "art-003",
    title: "Kujawianka wygrywa 3:1 z Włocłavią w wyjazdowym meczu klasy okręgowej",
    lead: "",
    category: "Kujawianka",
    subcategory: "Mecze",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=160&h=120&fit=crop",
    author: "Sport",
    time: "wczoraj",
  },
  {
    id: "art-004",
    title: 'MGCK ogłasza program „Lata w Izbicy 2026" — wakacyjny pakiet wydarzeń kulturalnych',
    lead: "",
    category: "Kultura",
    subcategory: "MGCK",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160&h=120&fit=crop",
    author: "Redakcja",
    time: "wczoraj",
  },
  {
    id: "art-005",
    title: 'Wietrzychowice — rusza letni sezon na "Polskich Piramidach" z nowymi przewodnikami',
    lead: "",
    category: "Historia",
    subcategory: "Wietrzychowice",
    image: "https://images.unsplash.com/photo-1568663917787-95c6daa14b30?w=160&h=120&fit=crop",
    author: "Redakcja",
    time: "23 maja",
  },
]

// NA SYGNALE — interwencje
export const NA_SYGNALE = [
  { time: "07:42", type: "🚒 OSP", desc: "Pożar stodoły w Bierzynie — 3 zastępy OSP w akcji, brak osób poszkodowanych", live: true },
  { time: "06:15", type: "🚑 IZM", desc: "Wypadek motocyklisty na DW 270 koło Świszewy — kierowca zabrany do szpitala" },
  { time: "23:18", type: "🚔 KMP", desc: "Zatrzymano nietrzeźwego kierowcę w Sarnowie — 2,1 promila alkoholu" },
  { time: "21:04", type: "🚒 OSP", desc: "Pożar trawy przy ul. Toruńskiej — interwencja OSP Izbica Kujawska" },
  { time: "19:22", type: "💧 ZGKiW", desc: "Awaria wodociągu w Modzerowie — utrudnienia do godz. 23:00" },
]

// NAJWAŻNIEJSZE WIADOMOŚCI — moduł 3
export const NEWS_MAIN: Article = {
  id: "art-news-main",
  title: "Remont ulicy Kościelnej zakończony przed terminem — droga oddana mieszkańcom",
  lead: "Po sześciu miesiącach prac modernizacyjnych ulica Kościelna w centrum Izbicy została w pełni przebudowana. Nowa nawierzchnia, chodniki, oświetlenie LED i odwodnienie kosztowały gminę 2,8 mln zł. Wykonawca, firma DROGBUD ze Włocławka, oddała inwestycję dwa tygodnie przed terminem umownym.",
  category: "Wiadomości",
  subcategory: "Inwestycje",
  image: "https://images.unsplash.com/photo-1545987796-200677ee1011?w=800&h=600&fit=crop",
  author: "Anna Kowalska",
  time: "Dziś, 09:30",
  tags: ["Inwestycje", "Drogi", "Centrum"],
}

export const NEWS_CARDS: Article[] = [
  {
    id: "n1",
    title: "Zespół Szkół im. Kasprowicza — rekrutacja 2026/2027 rusza w czerwcu",
    lead: "",
    category: "Wiadomości",
    subcategory: "Edukacja",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop",
    author: "Maria S.",
    time: "Dziś, 08:00",
  },
  {
    id: "n2",
    title: "SPZOZ Izbica wprowadza nowe godziny przyjęć pediatry od czerwca",
    lead: "",
    category: "Wiadomości",
    subcategory: "Zdrowie",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=225&fit=crop",
    author: "Redakcja",
    time: "wczoraj",
  },
  {
    id: "n3",
    title: 'Caritas i MGOPS uruchamiają program „Lato w gminie" dla dzieci z rodzin potrzebujących',
    lead: "",
    category: "Wiadomości",
    subcategory: "Społeczne",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=225&fit=crop",
    author: "K. Nowak",
    time: "wczoraj",
  },
  {
    id: "n4",
    title: "PGE — planowane wyłączenia prądu w sołectwach Świętosławice i Mchówek 28 maja",
    lead: "",
    category: "Wiadomości",
    subcategory: "Komunikaty",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=225&fit=crop",
    author: "Komunikat",
    time: "2 dni temu",
  },
  {
    id: "n5",
    title: "Kanał Zgłowiączki — Gminna Spółka Wodna zakończyła wiosenne prace melioracyjne",
    lead: "",
    category: "Wiadomości",
    subcategory: "Środowisko",
    image: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&h=225&fit=crop",
    author: "Redakcja",
    time: "3 dni temu",
  },
  {
    id: "n6",
    title: "ARiMR — ostatnie dni na składanie wniosków o dopłaty bezpośrednie 2026",
    lead: "",
    category: "Wiadomości",
    subcategory: "Rolnictwo",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=225&fit=crop",
    author: "Redakcja",
    time: "3 dni temu",
  },
]

// PILNE — breaking ticker
export const BREAKING = [
  "Pożar stodoły w Bierzynie — OSP w akcji",
  "Sesja Rady Miejskiej — porządek obrad opublikowany",
  "Kujawianka 3:1 z Włocłavią — relacja",
  'MGCK ogłasza program „Lata w Izbicy 2026"',
  "Wyłączenia prądu w Świętosławicach 28 maja",
  "Dożynki gminne 2026 — Sadłno gospodarzem",
]

// KUJAWIANKA — wynik + tabela
export const KUJAWIANKA = {
  lastMatch: {
    home: "WŁOCŁAVIA Włocławek",
    away: "KUJAWIANKA Izbica Kujawska",
    homeScore: 1,
    awayScore: 3,
    date: "24 maja 2026",
    round: "Kolejka 26",
    league: "Klasa Okręgowa, grupa 2",
  },
  nextMatch: {
    home: "KUJAWIANKA Izbica Kujawska",
    away: "POLONIA Lubraniec",
    date: "31 maja 2026, 17:00",
    venue: "Stadion w Izbicy",
  },
  table: [
    { pos: 1, team: "Lider Choceń", m: 26, w: 19, d: 4, l: 3, pts: 61 },
    { pos: 2, team: "Sparta Brześć", m: 26, w: 17, d: 5, l: 4, pts: 56 },
    { pos: 3, team: "Polonia Lubraniec", m: 26, w: 16, d: 4, l: 6, pts: 52 },
    { pos: 4, team: "KUJAWIANKA Izbica", m: 26, w: 15, d: 5, l: 6, pts: 50, highlight: true },
    { pos: 5, team: "Wisła Nieszawa", m: 26, w: 13, d: 6, l: 7, pts: 45 },
    { pos: 6, team: "Promień Kowal", m: 26, w: 12, d: 5, l: 9, pts: 41 },
    { pos: 7, team: "Włocłavia W-w", m: 26, w: 11, d: 4, l: 11, pts: 37 },
    { pos: 8, team: "Lubraniec II", m: 26, w: 9, d: 6, l: 11, pts: 33 },
  ],
  scorers: [
    { name: "M. Kowalczyk", goals: 18 },
    { name: "P. Wiśniewski", goals: 12 },
    { name: "T. Wojciechowski", goals: 9 },
  ],
  articles: [
    { title: "Trener Tomasz W.: 'Trzeci tercjał był nasz' — wywiad pomeczowy", time: "wczoraj", img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=160&h=110&fit=crop" },
    { title: "Junior Kujawianki Jakub Nowak powołany do reprezentacji wojewódzkiej U17", time: "3 dni temu", img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=160&h=110&fit=crop" },
  ],
}

// SAMORZĄD
export const SAMORZAD = [
  {
    title: "Burmistrz Marek Dorabiała ogłasza konkurs grantowy dla NGO — pula 80 tys. zł",
    lead: "Termin składania wniosków: 15 czerwca 2026. Dofinansowanie do 8 tys. zł na projekt.",
    cat: "Urząd Miejski",
    img: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=150&fit=crop",
    time: "Dziś, 11:00",
  },
  {
    title: "Komisja Rewizyjna Rady Miejskiej rozpoczyna kontrolę gospodarki odpadami",
    lead: "Przewodniczący Komisji R. Janik zapowiedział audyt umów z ZGKiW.",
    cat: "Rada Miejska",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=150&fit=crop",
    time: "wczoraj",
  },
  {
    title: "Fundusz sołecki 2026 — wszystkie 34 sołectwa przedstawiły plany inwestycyjne",
    lead: "Łączna pula: 487 tys. zł. Największe sołectwo Sadłno otrzyma 24,8 tys. zł na remont świetlicy wiejskiej.",
    cat: "Sołectwa",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=150&fit=crop",
    time: "2 dni temu",
  },
]

// PRZEGLĄD MEDIÓW
export const PRZEGLAD_MEDIOW = [
  {
    src: "DDWłocławek",
    srcUrl: "ddwloclawek.pl",
    title: "Izbica Kujawska świętuje 76. rocznicę Kujawianki — relacja z gali w MGCK",
    summary: "Portal DDWłocławek opisuje galę 76-lecia klubu Kujawianka. AI streszczenie: uroczystość zgromadziła ponad 200 osób.",
    date: "23 maja",
  },
  {
    src: "Gazeta Pomorska",
    srcUrl: "pomorska.pl",
    title: "Gmina Izbica Kujawska zdobywa nagrodę za projekt LGD Dorzecza Zgłowiączki",
    summary: "Wyróżnienie w konkursie 'Liderzy lokalnego rozwoju' województwa kujawsko-pomorskiego.",
    date: "22 maja",
  },
  {
    src: "Kujawy.info",
    srcUrl: "kujawy.info",
    title: "Megality w Wietrzychowicach — Telewizja Kujawy publikuje nowy reportaż",
    summary: "20-minutowy film o Parku Kulturowym 'Wietrzychowice — Polskie Piramidy'.",
    date: "22 maja",
  },
  {
    src: "NWłocławek",
    srcUrl: "nwloclawek.pl",
    title: "Powiat włocławski — nowe inwestycje drogowe obejmą również drogi w gminie Izbica",
    summary: "Starostwo Powiatowe ogłasza plan remontów dróg powiatowych na 2026 rok.",
    date: "21 maja",
  },
  {
    src: "TVP3 Bydgoszcz",
    srcUrl: "tvp.pl",
    title: 'TVP3 Bydgoszcz w reportażu „Kujawy mojego dzieciństwa" odwiedza Izbicę',
    summary: "8-minutowy materiał o tradycjach kujawskich w gminie Izbica Kujawska.",
    date: "20 maja",
  },
]

// KULTURA + HISTORIA
export const KULTURA_MAIN = {
  title: "Dni Izbicy 2026 — program imprez gotowy. MGCK zaprasza od 12 do 14 lipca",
  lead: "Trzydniowe święto miasta z koncertami, jarmarkiem, biegiem ulicznym i pokazem ognia. Gwiazda wieczoru: zespół Lady Pank.",
  img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop",
  time: "Dziś",
}

export const KULTURA_EVENTS = [
  { day: "29", mon: "maj", title: "Spotkanie autorskie z Joanną Bator", venue: "Biblioteka Publiczna" },
  { day: "01", mon: "cze", title: "Dzień Dziecka — festyn na rynku", venue: "Rynek MGCK" },
  { day: "08", mon: "cze", title: "Koncert chóru parafialnego NMP", venue: "Kościół NMP Izbica" },
]

export const HISTORIA_MAIN = {
  title: "25 maja 1940 — pierwsza deportacja społeczności żydowskiej z Izbicy",
  lead: "Tego dnia, 86 lat temu, niemieckie władze okupacyjne rozpoczęły masową deportację ludności żydowskiej z izbickiego getta. Spośród ok. 3 600 Żydów mieszkających w mieście, ocalały zaledwie pojedyncze osoby.",
  img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop&sat=-100",
}

export const HISTORIA_ARCHIWUM = [
  { title: "Synagoga w Izbicy — zapomniana perła Kujaw (1880–1939)", time: "ostatnio czytane" },
  { title: 'Dwór w Zagrodnicy — historia rodu Borzewskich i kaplica kolumnowa', time: "23 maja" },
]

// LUDZIE
export const LUDZIE = [
  {
    name: "Tadeusz Pawlak",
    role: "strażak OSP Izbica, weteran 45 lat służby",
    title: '„Kiedy zaczynałem w 1981, mieliśmy starą Star 25" — wspomnienia weterana OSP',
    img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=240&h=240&fit=crop",
  },
  {
    name: "Halina Kowalska",
    role: "sołtys Sadłna, prezes KGW",
    title: '„Sołtys to nie funkcja — to powołanie" — rozmowa z liderką największego sołectwa',
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&h=240&fit=crop",
  },
  {
    name: "Krzysztof Wojtkowski",
    role: "nauczyciel matematyki, SP Sarnowo",
    title: '„Moi uczniowie wygrywają olimpiady — bo wierzę w nich" — sylwetka pedagoga',
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop",
  },
  {
    name: "Maria Witkowska",
    role: "bibliotekarka, 30 lat w bibliotece",
    title: '„Książka zawsze znajdzie swojego czytelnika" — pani Maria odchodzi na emeryturę',
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&h=240&fit=crop",
  },
]

// ŻYCIE CODZIENNE
export const ZYCIE = [
  { icon: "📋", name: "Poradnik mieszkańca", count: 28, last: "Jak złożyć wniosek o fundusz sołecki — krok po kroku" },
  { icon: "🏥", name: "Zdrowie i profilaktyka", count: 14, last: "Godziny pracy SPZOZ Izbica — wszystkie poradnie" },
  { icon: "🌾", name: "Rolnictwo i doradztwo", count: 22, last: "Terminy składania wniosków ARiMR 2026" },
  { icon: "🗺️", name: "Turystyka i rekreacja", count: 17, last: "Szlak megalitów kujawskich — co zobaczyć w Wietrzychowicach" },
  { icon: "🎓", name: "Edukacja i rozwój", count: 11, last: "Oferta Zespołu Szkół im. Kasprowicza 2026/2027" },
  { icon: "🛡️", name: "Bezpieczeństwo", count: 9, last: "Posterunek Policji w Izbicy — kontakt, dzielnicowi" },
  { icon: "🏡", name: "Dom i ogród", count: 16, last: "Kiedy sadzić na Kujawach — kalendarz ogrodnika" },
  { icon: "🌤️", name: "Pogoda i sezon", count: 8, last: "Prognoza na tydzień + komentarz dla rolników" },
]

// DZIŚ W IZBICY — AI evergreen
export const DZIS_W_IZBICY = {
  title: "Maj na Kujawach: kiedy zacząć siew kukurydzy i jak chronić uprawy przed przymrozkami",
  lead: "Tradycyjnie w gminie Izbica Kujawska siew kukurydzy rozpoczyna się około 15 maja, gdy gleba osiąga 10°C na głębokości 5 cm. Aktualne warunki pogodowe sprzyjają — temperatura nocna powyżej 8°C, gleba dobrze ogrzana po ciepłej majówce. Przypominamy jednak, że historyczne dane stacji meteo Włocławek pokazują przymrozki w drugiej dekadzie maja co 3-4 lata...",
  img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop",
  author: "Redakcja izbica24.pl ✦ AI",
}

// SOŁECTWA — 34 sołectwa gminy Izbica Kujawska
export const SOLECTWA = [
  { name: "Bachorka", count: 4 }, { name: "Bierzyn", count: 12 }, { name: "Błenna", count: 18 },
  { name: "Chotel", count: 3 }, { name: "Cienin", count: 5 }, { name: "Długie", count: 7 },
  { name: "Helenowo", count: 6 }, { name: "Józefowo", count: 4 }, { name: "Kazanki", count: 9 },
  { name: "Komorowo", count: 5 }, { name: "Kozy", count: 3 }, { name: "Krzewie", count: 8 },
  { name: "Lubsin", count: 6 }, { name: "Mchówek", count: 11 }, { name: "Mieczysławowo", count: 4 },
  { name: "Modzerowo", count: 14 }, { name: "Naczachowo", count: 5 }, { name: "Nowa Wieś", count: 7 },
  { name: "Obałki", count: 6 }, { name: "Pasieka", count: 16 }, { name: "Przysypka", count: 4 },
  { name: "Sadłno", count: 23 }, { name: "Sarnowo", count: 13 }, { name: "Skarbanowo", count: 7 },
  { name: "Sokołowo", count: 5 }, { name: "Stefanowo", count: 4 }, { name: "Szczkówek", count: 6 },
  { name: "Świerczyn", count: 7 }, { name: "Świerczynek", count: 5 }, { name: "Świętosławice", count: 10 },
  { name: "Świszewy", count: 8 }, { name: "Wietrzychowice", count: 19 }, { name: "Wólka Komorowska", count: 4 },
  { name: "Zdrojówka", count: 5 },
]

// OGŁOSZENIA
export const OGLOSZENIA = [
  { icon: "🕊️", name: "Nekrologi", count: 3, color: "#888", sub: "Z żałobną czcią" },
  { icon: "🎂", name: "Rocznice", count: 12, color: "#a09080" },
  { icon: "💼", name: "Praca", count: 47, color: "#2563a8" },
  { icon: "🛒", name: "Sprzedam", count: 124, color: "#1e7a4f" },
  { icon: "🏠", name: "Nieruchomości", count: 28, color: "#b8860b" },
  { icon: "🔧", name: "Usługi", count: 63, color: "#c0392b" },
  { icon: "🏢", name: "Katalog firm", count: 184, color: "#7b2d8b" },
]

// MULTIMEDIA — placeholder
export const MULTIMEDIA = {
  video: { title: 'Reportaż z Dożynek Gminnych 2025 — pełna relacja MGCK', cat: "Reportaże", thumb: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop" },
  galleries: [
    { title: "Dni Izbicy 2025", count: 84, img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop" },
    { title: "Sezon Kujawianki", count: 156, img: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=300&fit=crop" },
    { title: "Megality Wietrzychowice", count: 47, img: "https://images.unsplash.com/photo-1568663917787-95c6daa14b30?w=400&h=300&fit=crop" },
    { title: "Strażackie zawody powiatowe", count: 92, img: "https://images.unsplash.com/photo-1582550945154-aaf7ea2c4c80?w=400&h=300&fit=crop" },
  ],
  podcast: { title: 'Głos Izbicy — odcinek 47: „Sołtysi opowiadają"', duration: "23:14" },
}

// SIDEBAR
export const SIDEBAR_TOP5 = [
  { title: "Pożar stodoły w Bierzynie — OSP w akcji", cat: "Na Sygnale" },
  { title: "Remont ulicy Kościelnej zakończony przed terminem", cat: "Wiadomości" },
  { title: "Kujawianka 3:1 z Włocłavią — relacja", cat: "Kujawianka" },
  { title: "Dni Izbicy 2026 — program imprez gotowy", cat: "Kultura" },
  { title: '25 maja 1940 — pierwsza deportacja Żydów z Izbicy', cat: "Historia" },
]

export const SIDEBAR_PHONES = [
  { icon: "🚒", name: "OSP Izbica Kujawska", num: "54 286 51 12" },
  { icon: "🚑", name: "SPZOZ Izbica", num: "54 286 51 04" },
  { icon: "🚔", name: "Posterunek Policji", num: "47 752 91 50" },
  { icon: "🏛️", name: "Urząd Miejski", num: "54 286 51 35" },
  { icon: "💧", name: "ZGKiW awarie", num: "54 286 51 88" },
  { icon: "📞", name: "Numer alarmowy", num: "112" },
]

export const WEEK_FORECAST = [
  { day: "PN", icon: "☀️", t: 19 }, { day: "WT", icon: "⛅", t: 21 },
  { day: "ŚR", icon: "🌧️", t: 16 }, { day: "CZW", icon: "⛅", t: 18 },
  { day: "PT", icon: "☀️", t: 22 }, { day: "SO", icon: "☀️", t: 24 },
  { day: "ND", icon: "🌤️", t: 23 },
]

// NAWIGACJA
export const NAV = [
  { key: "wiadomosci",  label: "WIADOMOŚCI",  href: "/#wiadomosci",  color: "#c0392b", sub: [
    { label: "Inwestycje i remonty", href: "/wiadomosci/inwestycje" },
    { label: "Edukacja", href: "/wiadomosci/edukacja" },
    { label: "Zdrowie", href: "/wiadomosci/zdrowie" },
    { label: "Społeczne", href: "/wiadomosci/spoleczne" },
    { label: "Komunikaty", href: "/wiadomosci/komunikaty" },
    { label: "Środowisko", href: "/wiadomosci/srodowisko" },
    { label: "Rolnictwo", href: "/wiadomosci/rolnictwo" },
  ]},
  { key: "sygnale", label: "NA SYGNALE", href: "/#na-sygnale", color: "#e74c3c", sub: [
    { label: "Wypadki i kolizje", href: "#" },
    { label: "Pożary", href: "#" },
    { label: "Interwencje ratunkowe", href: "#" },
    { label: "Kronika policyjna", href: "#" },
    { label: "Pogotowie i awarie", href: "#" },
  ]},
  { key: "samorzad", label: "SAMORZĄD", href: "/#samorzad", color: "#1a3a5c", sub: [
    { label: "Urząd Miejski", href: "#" },
    { label: "Rada Miejska", href: "#" },
    { label: "Budżet i finanse", href: "#" },
    { label: "Sołectwa", href: "#" },
    { label: "Powiat włocławski", href: "#" },
    { label: "Wybory i referenda", href: "#" },
  ]},
  { key: "kujawianka", label: "KUJAWIANKA", href: "/#kujawianka", color: "#1e7a4f", sub: [
    { label: "Aktualności", href: "#" },
    { label: "Mecze i wyniki", href: "#" },
    { label: "Tabela i terminarz", href: "#" },
    { label: "Kadra", href: "#" },
    { label: "Historia klubu", href: "#" },
  ]},
  { key: "kultura", label: "KULTURA", href: "/#kultura", color: "#7b2d8b", sub: [
    { label: "MGCK — Centrum Kultury", href: "#" },
    { label: "Biblioteka", href: "#" },
    { label: "Kościół i parafie", href: "#" },
    { label: "Orioniści — DPS", href: "#" },
    { label: "KGW i tradycja", href: "#" },
    { label: "Kalendarz wydarzeń", href: "#" },
  ]},
  { key: "historia", label: "HISTORIA", href: "/#historia", color: "#b8860b", sub: [
    { label: "Dzieje Izbicy Kujawskiej", href: "#" },
    { label: "Wietrzychowice — Polskie Piramidy", href: "#" },
    { label: "Społeczność żydowska", href: "#" },
    { label: "Dawna Izbica w fotografii", href: "#" },
    { label: "Zabytki i architektura", href: "#" },
  ]},
  { key: "ludzie", label: "LUDZIE", href: "/#ludzie", color: "#c0392b", sub: [
    { label: "Wywiady", href: "#" },
    { label: "Sylwetki mieszkańców", href: "#" },
    { label: "Sukcesy", href: "#" },
    { label: "Wspomnienia", href: "#" },
  ]},
  { key: "zycie", label: "ŻYCIE CODZIENNE", href: "/#zycie", color: "#2d6a4f", sub: [
    { label: "Poradnik mieszkańca", href: "#" },
    { label: "Zdrowie i profilaktyka", href: "#" },
    { label: "Rolnictwo i doradztwo", href: "#" },
    { label: "Turystyka i rekreacja", href: "#" },
  ]},
  { key: "przeglad", label: "PRZEGLĄD MEDIÓW", href: "/#przeglad", color: "#2563a8", sub: [
    { label: "Portale informacyjne", href: "#" },
    { label: "Gazeta Pomorska", href: "#" },
    { label: "Telewizja i radio", href: "#" },
    { label: "Media społecznościowe", href: "#" },
  ]},
  { key: "multimedia", label: "MULTIMEDIA", href: "/#multimedia", color: "#111827", sub: [
    { label: "Wideo", href: "#" },
    { label: "Podcast Głos Izbicy", href: "#" },
    { label: "Galerie zdjęć", href: "#" },
    { label: "Infografiki", href: "#" },
  ]},
  { key: "ogloszenia", label: "OGŁOSZENIA", href: "/#ogloszenia", color: "#374151", sub: [
    { label: "Nekrologi", href: "#" },
    { label: "Praca", href: "#" },
    { label: "Kupię / Sprzedam", href: "#" },
    { label: "Nieruchomości", href: "#" },
    { label: "Katalog firm", href: "#" },
  ]},
]
