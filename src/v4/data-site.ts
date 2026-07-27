// ============================================================================
// IZBICA24.PL v4 — DANE STRUKTURALNE STRONY (poza artykułami)
// Topbar, samorząd, statystyki, ogłoszenia, stopka, sekcje strony głównej.
// Wszystko 1:1 z szaty graficznej index.html.
// ============================================================================

// ─────────────────────────────────────────────────────────────── TOPBAR
export const TOPBAR = {
  date: 'Piątek, 23 maja 2026',
  weather: '18°C · Izbica Kujawska',
  links: [
    { label: 'Redakcja', href: '/redakcja' },
    { label: 'Newsletter', href: '/newsletter' },
    { label: 'Reklama', href: '/reklama' },
    { label: 'Kontakt', href: '/kontakt' },
  ],
  liveLink: { label: 'Na sygnale · LIVE', href: '/na-sygnale' },
}

// ─────────────────────────────────────────────────────────────── HEADER
export const HEADER = {
  logo: { text: 'izbica', red: '24', suffix: '.pl', tagline: 'Portal Gminy Izbica Kujawska' },
  searchPlaceholder: 'Szukaj — sołectwo, Kujawianka, OSP, Wietrzychowice...',
  cta: { label: 'Ogłoś', href: '/ogloszenia/dodaj' },
}

// ────────────────────────────────────────────── HERO — nagłówek kolumny bocznej
export const HERO_SIDE_HEADER = '⭐ Najważniejsze dziś'

// ──────────────────────────────────────── WIADOMOŚCI — filtry sekcji (8 chipów)
export const NEWS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'inwestycje', label: 'Inwestycje' },
  { id: 'edukacja', label: 'Edukacja' },
  { id: 'zdrowie', label: 'Zdrowie' },
  { id: 'rolnictwo', label: 'Rolnictwo' },
  { id: 'srodowisko', label: 'Środowisko' },
  { id: 'spoleczne', label: 'Społeczne' },
  { id: 'komunikaty', label: 'Komunikaty' },
]

// ─────────────────────────────────────── MULTIMEDIA — filtry sekcji (8 chipów)
export const MM_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'reportaze', label: 'Reportaże' },
  { id: 'relacje', label: 'Relacje z wydarzeń' },
  { id: 'wywiady', label: 'Wywiady wideo' },
  { id: 'drony', label: 'Drony nad Izbicą' },
  { id: 'podcast', label: 'Podcast „Głos Izbicy”' },
  { id: 'galerie', label: 'Galerie zdjęć' },
  { id: 'infografiki', label: 'Infografiki' },
]

// ─────────────────────────────────────────────────── SAMORZĄD — karta na HP
export const SAMORZAD_CARD = {
  image: '/static/img/v4/03-sesja-rady-miejskiej.jpg',
  imageAlt: 'Sesja Rady',
  tag: 'Samorząd · Rada Miejska',
  title: 'Budżet remontowy 4,8 mln zł. Rekordowe inwestycje w gminie.',
  lead:
    'Podczas sesji 22 maja Rada przyjęła zmiany w budżecie. Inwestycje drogowe i kanalizacyjne wzrosną o 18% rok do roku. Burmistrz Dorabiała: „To największy budżet remontowy w historii gminy. Czeka nas pracowite półrocze”.',
  url: '/samorzad/rada/sesja-rady-miejskiej-budzet-remontowy',
  items: [
    {
      day: '22',
      month: 'MAJ',
      title: 'Zarządzenie burmistrza nr 47/2026 — nabór kierownika ZGKiW',
      meta: 'Urząd Miejski · 14:00 · termin do 5 czerwca',
      url: '/samorzad/urzad/zarzadzenie-47-2026-nabor-zgkiw',
    },
    {
      day: '21',
      month: 'MAJ',
      title: 'Fundusze UE: 1,2 mln zł na termomodernizację SP nr 2',
      meta: 'Dofinansowanie · 11:30 · realizacja wakacje 2026',
      url: '/samorzad/budzet/fundusze-ue-termomodernizacja-sp2',
    },
    {
      day: '20',
      month: 'MAJ',
      title: 'Starostwo: rozpoczęcie remontu drogi powiatowej Izbica–Brdów',
      meta: 'Powiat włocławski · 09:00 · prace do listopada',
      url: '/samorzad/powiat/remont-drogi-izbica-brdow',
    },
    {
      day: '19',
      month: 'MAJ',
      title: 'Zebranie sołectwa Bierzyn — wybrany nowy sołtys',
      meta: 'Frekwencja 78% · 15:45 · nowy sołtys Jan Kwiatkowski',
      url: '/samorzad/solectwa/zebranie-solectwa-bierzyn-nowy-soltys',
    },
  ],
}

// ─────────────────────────────────────────────────────────── STATS BAR
export const STATS = {
  title: 'GMINA IZBICA KUJAWSKA',
  titleRed: 'W LICZBACH',
  subtitle: 'Powiat włocławski · województwo kujawsko-pomorskie · maj 2026',
  items: [
    { num: '5 400', label: 'Mieszkańców', sub: 'w 34 sołectwach' },
    { num: '34', label: 'Sołectw', sub: 'na 147 km²' },
    { num: '1750', label: 'Lokacja miasta', sub: 'prawa miejskie od króla' },
    { num: '12 847', label: 'Artykułów', sub: 'w bazie portalu' },
  ],
}

// ──────────────────────────────────── FEATURE FULL — Wietrzychowice (HP)
export const FEATURE_WIETRZYCHOWICE = {
  image: '/static/img/v4/05-wietrzychowice-megality.jpg',
  imageAlt: 'Wietrzychowice',
  tag: 'Historia · Polskie piramidy',
  tagClass: 'historia',
  title: 'Wietrzychowice: pod warstwą piasku spała tajemnica sprzed 5 500 lat.',
  lede:
    'Zespół archeologów z UMK Toruń i Muzeum Archeologicznego w Poznaniu odkrył nowy grobowiec kujawski w Parku Kulturowym. To jeden z najstarszych zabytków megalitycznych w Polsce — kultura pucharów lejkowatych, ok. 3500 p.n.e. Sensacja archeologiczna roku.',
  cta: 'Pełna relacja',
  url: '/historia/wietrzychowice/wietrzychowice-nowe-odkrycia-archeologiczne',
}

// ─────────────────────────────────────── FEATURE FULL — Dni Izbicy (Kultura)
export const FEATURE_DNI_IZBICY = {
  image: '/static/img/v4/06-dni-izbicy-koncert.jpg',
  imageAlt: 'Dni Izbicy',
  tag: 'MGCK · Dni Izbicy 2026',
  tagClass: 'kultura',
  title: '14–16 czerwca: trzy dni świętowania. Koncerty, dożynki, festyn rodzinny.',
  lede:
    'Gwiazda sobotniego wieczoru: Jacek Stachursky. Plus turniej sołectw o Puchar Burmistrza, wystawa „Dawna Izbica”, warsztaty dla dzieci oraz tradycyjne dożynki gminno-parafialne w niedzielę.',
  cta: 'Pełny program',
  url: '/kultura/mgck/dni-izbicy-2026-program',
}

// ────────────────────────────────────────────────── SOŁECTWA — sekcja HP
export const SOLECTWA_SECTION = {
  heading: '34 sołectwa.',
  headingRed: 'Jedna gmina.',
  body:
    'Gmina Izbica Kujawska to nie tylko miasto. To <strong>34 sołectwa</strong> rozsiane wokół rynku — Sadłno, Bierzyn, Pasieka, Wietrzychowice, Modzerowo, Sarnowo, Mchówek i wiele innych. Każde z własną historią, sołtysem, świetlicą i Kołem Gospodyń Wiejskich. Kliknij sołectwo, by zobaczyć wszystkie wpisy z jego okolic.',
  stats: [
    { num: '34', label: 'Sołectw' },
    { num: '5,4 tys.', label: 'Mieszkańców' },
    { num: '147 km²', label: 'Powierzchnia' },
  ],
  listHeading: 'Wszystkie sołectwa',
}

// ────────────────────────────────────────── MULTIMEDIA — galeria na HP
export const MM_GALLERY_TEASER = {
  title: 'Galeria · Dni Izbicy 2025',
  lead: 'Najlepsze ujęcia z zeszłorocznej edycji. 124 zdjęcia w pełnej galerii.',
  url: '/multimedia/galerie/dni-izbicy-2025',
  thumbs: [
    { src: '/static/img/v4/06-dni-izbicy-koncert.jpg' },
    { src: '/static/img/v4/04-kujawianka-celebracja.jpg' },
    { src: '/static/img/v4/15-kgw-pasieka-chleb.jpg' },
    { src: '/static/img/v4/14-pielgrzymka-blenna.jpg', count: '+120' },
  ],
}

// ────────────────────────────────────────── PODCAST — widget na HP
export const MM_PODCAST_TEASER = {
  tag: '🎙 Podcast · odc. 23',
  title: 'Burmistrz o termomodernizacji szkół i Dniach Izbicy',
  lead:
    'Rozmowa z Markiem Dorabiałą o najważniejszych planach gminy na 2026 rok. Inwestycje, fundusze UE, plan na drogi.',
  meta: '22 maja · 32 min · 1 845 odsłuchów',
  url: '/multimedia/podcast/podcast-23-burmistrz-termomodernizacja',
  player: { current: '11:24', total: '32:08', progress: 35 },
  episodes: [
    { num: '#22', title: 'Historia żydowska Izbicy — z dr Anną Kazanecką', dur: '28:12', url: '/multimedia/podcast/podcast-22-historia-zydowska-izbicy' },
    { num: '#21', title: 'Wietrzychowice — rozmowa z archeologiem UMK', dur: '35:40', url: '/multimedia/podcast/podcast-21-wietrzychowice-archeolog-umk' },
    { num: '#20', title: 'Podsumowanie tygodnia · 15–21 maja 2026', dur: '12:48', url: '/multimedia/podcast/podcast-20-podsumowanie-tygodnia-15-21-maja' },
  ],
}

// ──────────────────────────────────────────────────── OGŁOSZENIA — kafle
export type OglIcon =
  | 'nekro' | 'praca' | 'dom' | 'cart' | 'gear' | 'box'
  | 'doc' | 'mail' | 'calendar' | 'phone' | 'heart' | 'pin'

export interface OglTile {
  icon: OglIcon
  name: string
  sub?: string
  desc?: string
  count: string
  href: string
  variant?: 'nekro' | 'special'
}

export const OGL_TILES_ROW1: OglTile[] = [
  { icon: 'nekro', name: 'Nekrologi', sub: 'Z żałobną czcią', count: '4', href: '/ogloszenia/nekrologi', variant: 'nekro' },
  { icon: 'praca', name: 'Praca', desc: 'Oferty lokalne', count: '23', href: '/ogloszenia/praca' },
  { icon: 'dom', name: 'Nieruchomości', desc: 'Domy, działki, najem', count: '14', href: '/ogloszenia/nieruchomosci' },
  { icon: 'cart', name: 'Kupię/Sprzedam', desc: 'Drobne ogłoszenia', count: '47', href: '/ogloszenia/drobne' },
  { icon: 'gear', name: 'Usługi', desc: 'Hydraulik, elektryk, transport', count: '31', href: '/ogloszenia/uslugi' },
  { icon: 'box', name: 'Katalog firm', desc: 'Lokalni przedsiębiorcy', count: '87', href: '/ogloszenia/firmy' },
]

export const OGL_TILES_ROW2: OglTile[] = [
  { icon: 'doc', name: 'Redakcja', desc: 'Masz temat? Daj znać redakcji', count: 'tel. 502 124 567', href: '/redakcja', variant: 'special' },
  { icon: 'mail', name: 'Newsletter', desc: 'Cotygodniowy podsumowanie', count: '2 847 zapisów', href: '/newsletter', variant: 'special' },
  { icon: 'calendar', name: 'Tydzień w Izbicy', desc: 'Wszystkie wydarzenia tygodnia', count: '23 wydarzenia', href: '/kultura/kalendarz', variant: 'special' },
  { icon: 'phone', name: 'Ważne telefony', desc: 'Urząd, OSP, SPZOZ, Policja', count: '15 numerów', href: '/wazne-telefony', variant: 'special' },
  { icon: 'heart', name: 'Rocznice', desc: 'Życzenia, podziękowania', count: '5', href: '/ogloszenia/rocznice' },
  { icon: 'pin', name: 'Mapa gminy', desc: 'Instytucje, sołectwa', count: 'interaktywna', href: '/mapa-gminy' },
]

export const OGL_HEAD = {
  title: 'Ogłoszenia · Społeczność Izbica',
  cta: { label: '+ Dodaj ogłoszenie', href: '/ogloszenia/dodaj' },
}

// ─────────────────────────────────────────────────────────────── FOOTER
export const FOOTER = {
  hero: {
    logo: { text: 'izbica', red: '24', suffix: '.pl', tag: 'Portal Gminy Izbica Kujawska' },
    mission:
      '„Niezależny portal informacyjny gminy Izbica Kujawska. Codziennie świeże wiadomości, z pierwszej ręki, dla wszystkich mieszkańców 34 sołectw.”',
    cta: { label: 'Zapisz się do newslettera', href: '/newsletter' },
    ctaSub: 'Tydzień w Izbicy · co piątek wieczorem',
  },
  about:
    'Niezależny portal informacyjny dla gminy Izbica Kujawska. Powstał z myślą o mieszkańcach 34 sołectw i 5 400 izbiczan. Wiadomości, samorząd, sport, kultura — z lokalnej perspektywy.',
  socials: [
    { label: 'Facebook', icon: 'facebook', href: '#' },
    { label: 'Instagram', icon: 'instagram', href: '#' },
    { label: 'YouTube', icon: 'youtube', href: '#' },
    { label: 'RSS', icon: 'rss', href: '/rss.xml' },
  ],
  redakcja: {
    chief: { name: 'Tomasz Kotliński', role: 'Redaktor naczelny' },
    email: 'redakcja@izbica24.pl',
    phone: '+48 502 124 567',
    address: 'ul. Marszałka Piłsudskiego 26',
    postal: '87-865 Izbica Kujawska',
    links: [
      { label: 'O portalu', href: '/o-portalu' },
      { label: 'Zespół redakcyjny', href: '/redakcja' },
      { label: 'Reklama i współpraca', href: '/reklama' },
      { label: 'Dołącz do nas', href: '/dolacz-do-nas' },
      { label: 'Ważne telefony', href: '/wazne-telefony' },
      { label: 'Mapa gminy', href: '/mapa-gminy' },
    ],
  },
  newsletter: {
    heading: 'Newsletter „Tydzień w Izbicy”',
    body:
      'Co tydzień podsumowanie najważniejszych wydarzeń w gminie. Bezpłatnie. Bez spamu. Wyłącznie merytoryczne treści — w piątkowy wieczór, prosto do skrzynki.',
    placeholder: 'twoj@email.pl',
    button: 'Zapisz się →',
    stats: [
      { n: '2 847', l: 'subskrybentów' },
      { n: '96%', l: 'open rate' },
      { n: '5 lat', l: 'działalności' },
    ],
  },
  bottom: {
    copyright: '© 2026 Izbica24.pl · Wszelkie prawa zastrzeżone',
    legal: [
      { label: 'Regulamin', href: '/regulamin' },
      { label: 'Polityka prywatności', href: '/polityka-prywatnosci' },
      { label: 'RODO', href: '/rodo' },
      { label: 'Cookies', href: '/cookies' },
    ],
    aiNote:
      'Niektóre artykuły na portalu są przygotowywane z wykorzystaniem narzędzi AI i weryfikowane przez redakcję Izbica24.pl. Każdy taki materiał ma stosowne oznaczenie w stopce.',
  },
}

// ───────────────────────────────────────── NAGŁÓWKI SEKCJI STRONY GŁÓWNEJ
export const SECTION_HEADERS = {
  wiadomosci: { title: 'Wiadomości', small: '· Gmina Izbica Kujawska', more: 'Wszystkie wiadomości', href: '/wiadomosci', colorVar: 'var(--c-news)' },
  kultura: { title: 'Kultura · MGCK', small: '· Parafie · KGW · Biblioteka', more: 'Wszystkie wydarzenia', href: '/kultura', colorVar: 'var(--c-kultura)' },
  ludzie: { title: 'Ludzie Izbicy', small: '· Wywiady, sylwetki, sukcesy', more: 'Wszystkie sylwetki', href: '/ludzie', colorVar: 'var(--c-ludzie)' },
  przeglad: { title: 'Przegląd Mediów', small: '· O Izbicy piszą inni', more: 'Wszystkie publikacje', href: '/przeglad-mediow', colorVar: 'var(--c-przeglad)' },
  zycie: { title: 'Życie codzienne', small: '· Praktyczna wiedza o gminie', more: 'Wszystkie poradniki', href: '/zycie-codzienne', colorVar: 'var(--c-zycie)' },
  multimedia: { title: 'Multimedia', small: '· Wideo, podcast, galerie', more: 'Wszystkie nagrania', href: '/multimedia', colorVar: 'var(--ink)' },
}

export const SYGNALE_HEAD = {
  title: 'Na sygnale · LIVE · ostatnie 24 godziny',
  more: 'Wszystkie zdarzenia →',
  href: '/na-sygnale',
}
