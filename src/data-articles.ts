// SANDBOX B — task B1-B6: Mock article database with full-text content
// 12 realistycznych artykułów Izbica Kujawska — gotowe do D1 migration

import { ArticleData } from './components/article'

export const ARTICLES: ArticleData[] = [
  {
    slug: 'remont-koscielnej-zakonczony',
    category: 'inwestycje',
    categoryColor: '#c0392b',
    title: 'Remont ulicy Kościelnej zakończony przed terminem — droga oddana mieszkańcom',
    lede: 'Po sześciu miesiącach prac modernizacyjnych ulica Kościelna w centrum Izbicy została w pełni przebudowana. Nowa nawierzchnia, chodniki, oświetlenie LED i odwodnienie kosztowały gminę 2,8 mln zł.',
    body: [
      'Po sześciu miesiącach intensywnych prac modernizacyjnych, ulica Kościelna w centrum Izbicy Kujawskiej została <strong>w pełni przebudowana</strong> i oddana mieszkańcom. Nowa nawierzchnia bitumiczna, chodniki z kostki brukowej, energooszczędne oświetlenie LED oraz kompleksowy system odwodnienia kosztowały gminę 2,8 mln zł.',
      '<h2>Inwestycja przed terminem</h2>',
      'Wykonawca, firma DROGBUD ze Włocławka, oddała inwestycję <strong>dwa tygodnie przed terminem umownym</strong>. — „To duży sukces. Pogoda nam sprzyjała, a zespół wykonawcy zaplanował prace bardzo dokładnie" — komentuje burmistrz Marek Dorabiała.',
      '<h2>Co zyskali mieszkańcy</h2>',
      'Ulica Kościelna to jedna z głównych arterii w centrum Izbicy. Codziennie przejeżdża nią ponad 1 200 pojazdów. Przed remontem nawierzchnia była w fatalnym stanie — pełna ubytków i kałuż.',
      '<ul><li>650 m nowej nawierzchni bitumicznej</li><li>1 200 m² chodników z kostki brukowej</li><li>32 lampy LED (oszczędność energii: 65%)</li><li>Nowy system odwodnienia (4 wpusty co 100 m)</li><li>Przejście dla pieszych przy ZS im. Kasprowicza</li></ul>',
      '<blockquote>To była najbardziej oczekiwana inwestycja drogowa ostatnich lat. Cieszę się, że udało nam się ją zrealizować pod budżet i przed terminem.</blockquote>',
      'Następna duża inwestycja drogowa — przebudowa ulicy Plac Wolności — ruszy w lipcu 2026 r.',
    ],
    author: 'Anna Kowalska',
    authorRole: 'Redaktor naczelna',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
    publishedAt: '25 maja 2026, 09:30',
    updatedAt: '25 maja 2026, 11:15',
    readingMinutes: 4,
    heroImage: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=1200&h=675&fit=crop',
    heroCaption: 'Nowa nawierzchnia ulicy Kościelnej w centrum Izbicy Kujawskiej · fot. UMiG',
    tags: ['Inwestycje', 'Drogi', 'Centrum', 'DROGBUD', 'Burmistrz'],
    related: [
      { slug: 'wodociag-sadlno', title: 'ZGKiW podpisał umowę na modernizację sieci wodociągowej', category: 'inwestycje', thumb: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&h=225&fit=crop' },
      { slug: 'pge-wylaczenia-maj', title: 'PGE — planowane wyłączenia prądu 28 maja', category: 'komunikaty', thumb: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=225&fit=crop' },
      { slug: 'kujawianka-wlocłavia', title: 'Kujawianka wygrywa 3:1 z Włocłavią', category: 'sport', thumb: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=225&fit=crop' },
    ],
  },
  {
    slug: 'wodociag-sadlno',
    category: 'inwestycje',
    categoryColor: '#c0392b',
    title: 'Wielomilionowa inwestycja w sieć wodociągową — ZGKiW podpisał umowę z wykonawcą',
    lede: 'Burmistrz Marek Dorabiała poinformował o podpisaniu umowy z firmą HYDROBUDOWA na modernizację 8,4 km sieci wodociągowej w sołectwach Sadłno, Bierzyn i Pasieka.',
    body: [
      'Burmistrz Marek Dorabiała wraz z kierownictwem ZGKiW podpisał umowę z firmą HYDROBUDOWA z Bydgoszczy na <strong>modernizację 8,4 km sieci wodociągowej</strong>. Wartość kontraktu: 6,7 mln zł, z czego 4,2 mln to dofinansowanie z Rządowego Funduszu Polski Ład.',
      '<h2>Trzy sołectwa pod modernizację</h2>',
      'Inwestycja obejmuje sołectwa Sadłno, Bierzyn i Pasieka. Stara sieć z lat 70. zostanie wymieniona na nowoczesne rury PE 100 RC, odporne na uszkodzenia mechaniczne.',
      'Prace ruszą w czerwcu 2026 r. i potrwają do października 2027 r.',
    ],
    author: 'Redakcja izbica24.pl',
    publishedAt: '24 maja 2026, 14:20',
    readingMinutes: 3,
    heroImage: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1200&h=675&fit=crop',
    tags: ['Inwestycje', 'ZGKiW', 'Wodociągi', 'Polski Ład'],
  },
  {
    slug: 'sesja-rady-22-maja',
    category: 'samorzad',
    categoryColor: '#1a3a5c',
    title: 'Sesja Rady Miejskiej — relacja z 22 maja: budżet, fundusz sołecki, sprawy bieżące',
    lede: 'Radni przegłosowali zmiany w budżecie 2026 oraz przyjęli harmonogram funduszu sołeckiego. W obradach wzięło udział 14 z 15 radnych.',
    body: [
      'Sesja Rady Miejskiej w Izbicy Kujawskiej odbyła się 22 maja w sali konferencyjnej UMiG. W obradach wzięło udział 14 z 15 radnych. Najważniejszym punktem była zmiana w uchwale budżetowej.',
      '<h2>Budżet 2026 — zmiany</h2>',
      'Radni przeznaczyli dodatkowe 480 tys. zł na remont szkoły w Sadłnie. Środki pochodzą z nadwyżki za 2025 r.',
    ],
    author: 'Marta S.',
    publishedAt: '23 maja 2026, 12:00',
    readingMinutes: 5,
    heroImage: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&h=675&fit=crop',
    tags: ['Rada Miejska', 'Budżet', 'Fundusz sołecki'],
  },
  {
    slug: 'kujawianka-wloclavia',
    category: 'sport',
    categoryColor: '#1e7a4f',
    title: 'Kujawianka wygrywa 3:1 z Włocłavią w wyjazdowym meczu klasy okręgowej',
    lede: 'Po pasjonującym meczu w Włocławku, Kujawianka pokonała tamtejszą Włocłavię 3:1. Bramki dla naszych: Nowak (2) i Wiśniewski.',
    body: [
      'Mecz 26. kolejki klasy okręgowej grupy 2 dostarczył kibicom emocji do ostatniego gwizdka. <strong>Kujawianka Izbica Kujawska pokonała na wyjeździe Włocłavię 3:1</strong>.',
      '<h2>Skład Kujawianki</h2>',
      'Trener Marek Lewandowski wystawił optymalny skład: Kowalski — Nowak, Wiśniewski, Kubiak, Mazur — Pawlak, Wójcik, Lewandowski Jr — Kowalczyk, Adamski, Szymański.',
    ],
    author: 'Tomasz Lewandowski',
    authorRole: 'Korespondent sportowy',
    publishedAt: '24 maja 2026, 19:45',
    readingMinutes: 3,
    heroImage: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&h=675&fit=crop',
    tags: ['Kujawianka', 'Mecz', 'Klasa okręgowa', 'Sport'],
  },
  {
    slug: 'mgck-program-lata-2026',
    category: 'kultura',
    categoryColor: '#7b2d8b',
    title: 'MGCK ogłasza program „Lata w Izbicy 2026" — wakacyjny pakiet wydarzeń kulturalnych',
    lede: 'Miejsko-Gminne Centrum Kultury przygotowało bogaty program letni: kino plenerowe, warsztaty dla dzieci, koncerty na rynku i piknik historyczny.',
    body: [
      'MGCK w Izbicy Kujawskiej zaprezentowało w piątek <strong>program „Lata w Izbicy 2026"</strong>. Wakacyjny pakiet wydarzeń ruszy 1 lipca i potrwa do końca sierpnia.',
      '<h2>Co w programie</h2>',
      'Główne atrakcje: kino plenerowe w każdy czwartek, warsztaty plastyczne dla dzieci, koncerty plenerowe na rynku w środy, piknik historyczny 15 sierpnia.',
    ],
    author: 'Krystyna Nowak',
    publishedAt: '24 maja 2026, 10:00',
    readingMinutes: 2,
    heroImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=675&fit=crop',
    tags: ['MGCK', 'Kultura', 'Lato', 'Wydarzenia'],
  },
  {
    slug: 'wietrzychowice-sezon',
    category: 'historia',
    categoryColor: '#b8860b',
    title: 'Wietrzychowice — rusza letni sezon na "Polskich Piramidach" z nowymi przewodnikami',
    lede: 'Muzeum Archeologiczne w Wietrzychowicach otwiera sezon turystyczny 1 czerwca. W tym roku siedmioro nowych przewodników oprowadzi po stanowisku.',
    body: [
      '„Polskie Piramidy" w Wietrzychowicach — neolityczne kurhany sprzed 5 500 lat — przyciągają rocznie ponad 18 tys. turystów.',
      '<h2>Nowi przewodnicy</h2>',
      'W tym roku siedmioro studentów archeologii z UMK w Toruniu rozpocznie pracę jako przewodnicy.',
    ],
    author: 'dr Jan Maciejewski',
    authorRole: 'Historyk regionalny',
    publishedAt: '23 maja 2026, 16:30',
    readingMinutes: 4,
    heroImage: 'https://images.unsplash.com/photo-1568663917787-95c6daa14b30?w=1200&h=675&fit=crop',
    tags: ['Wietrzychowice', 'Historia', 'Turystyka', 'Archeologia'],
  },
  {
    slug: 'spzoz-pediatra-czerwiec',
    category: 'zdrowie',
    categoryColor: '#27ae60',
    title: 'SPZOZ Izbica wprowadza nowe godziny przyjęć pediatry od czerwca',
    lede: 'Od 1 czerwca pediatra w SPZOZ Izbica będzie przyjmował w wydłużonych godzinach — w piątki do 18:00, a w soboty rano od 8:00 do 12:00.',
    body: [
      'SPZOZ w Izbicy Kujawskiej ogłosił od czerwca <strong>nowe, wydłużone godziny przyjęć pediatrycznych</strong>.',
    ],
    author: 'Redakcja izbica24.pl',
    publishedAt: '24 maja 2026, 11:00',
    readingMinutes: 2,
    heroImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=675&fit=crop',
    tags: ['Zdrowie', 'SPZOZ', 'Pediatra'],
  },
  {
    slug: 'caritas-lato-w-gminie',
    category: 'spoleczne',
    categoryColor: '#e67e22',
    title: 'Caritas i MGOPS uruchamiają program „Lato w gminie" dla dzieci z rodzin potrzebujących',
    lede: 'Caritas Diecezji Włocławskiej wraz z MGOPS przygotowały dwutygodniowy program letni dla 45 dzieci z rodzin objętych pomocą społeczną.',
    body: [
      'Program „Lato w gminie" ruszy 14 lipca i potrwa do 25 lipca. Dzieci spędzą czas na wycieczkach, warsztatach i zajęciach sportowych.',
    ],
    author: 'K. Nowak',
    publishedAt: '24 maja 2026, 13:30',
    readingMinutes: 2,
    heroImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=675&fit=crop',
    tags: ['Caritas', 'MGOPS', 'Dzieci', 'Społeczne'],
  },
  {
    slug: 'pge-wylaczenia-28-maja',
    category: 'komunikaty',
    categoryColor: '#34495e',
    title: 'PGE — planowane wyłączenia prądu w sołectwach Świętosławice i Mchówek 28 maja',
    lede: 'Energa-Operator informuje o pracach konserwacyjnych. Wyłączenia w godz. 8:00–14:00.',
    body: ['Lista adresów objętych wyłączeniem dostępna na stronie Energa-Operator.'],
    author: 'Komunikat',
    publishedAt: '23 maja 2026, 09:00',
    readingMinutes: 1,
    heroImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=675&fit=crop',
    tags: ['PGE', 'Wyłączenia', 'Komunikaty'],
  },
  {
    slug: 'kanal-zglowiaczki',
    category: 'srodowisko',
    categoryColor: '#16a085',
    title: 'Kanał Zgłowiączki — Gminna Spółka Wodna zakończyła wiosenne prace melioracyjne',
    lede: 'Gminna Spółka Wodna w Izbicy zakończyła kwartalne prace przy konserwacji Kanału Zgłowiączki.',
    body: ['Czyszczenie 14 km rowów i wymiana 6 przepustów kosztowała 145 tys. zł.'],
    author: 'Redakcja izbica24.pl',
    publishedAt: '22 maja 2026, 14:00',
    readingMinutes: 2,
    heroImage: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1200&h=675&fit=crop',
    tags: ['Środowisko', 'Spółka Wodna', 'Melioracja'],
  },
  {
    slug: 'arimr-doplaty-2026',
    category: 'rolnictwo',
    categoryColor: '#d4ac0d',
    title: 'ARiMR — ostatnie dni na składanie wniosków o dopłaty bezpośrednie 2026',
    lede: 'Termin składania wniosków upływa 31 maja. Rolnicy z gminy mogą skorzystać z pomocy biura w Izbicy.',
    body: ['Biuro ARiMR w Izbicy Kujawskiej dyżuruje w godz. 7:30–15:30. Po godzinie 14:30 wstęp tylko z numerem kolejkowym.'],
    author: 'Redakcja izbica24.pl',
    publishedAt: '22 maja 2026, 11:00',
    readingMinutes: 2,
    heroImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=675&fit=crop',
    tags: ['ARiMR', 'Rolnictwo', 'Dopłaty'],
  },
  {
    slug: 'zs-kasprowicz-rekrutacja',
    category: 'edukacja',
    categoryColor: '#3498db',
    title: 'Zespół Szkół im. Kasprowicza — rekrutacja 2026/2027 rusza w czerwcu',
    lede: 'ZS im. Kasprowicza otwiera nabór na nowy rok szkolny 1 czerwca. W ofercie 4 kierunki kształcenia ogólnego i 3 zawodowe.',
    body: ['Liceum ogólnokształcące, technikum informatyczne, technikum mechaniczne i szkoła branżowa I stopnia.'],
    author: 'Maria S.',
    publishedAt: '23 maja 2026, 08:00',
    readingMinutes: 2,
    heroImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=675&fit=crop',
    tags: ['Edukacja', 'ZS Kasprowicz', 'Rekrutacja'],
  },
]

// Build category index
export const CATEGORIES_MAP: Record<string, { title: string; description: string; color: string; subcategories: { slug: string; title: string }[] }> = {
  wiadomosci: {
    title: 'Wiadomości',
    description: 'Najnowsze wiadomości z gminy Izbica Kujawska — inwestycje, edukacja, zdrowie, środowisko.',
    color: '#c0392b',
    subcategories: [
      { slug: 'inwestycje', title: 'Inwestycje' },
      { slug: 'edukacja', title: 'Edukacja' },
      { slug: 'zdrowie', title: 'Zdrowie' },
      { slug: 'spoleczne', title: 'Społeczne' },
      { slug: 'komunikaty', title: 'Komunikaty' },
      { slug: 'srodowisko', title: 'Środowisko' },
      { slug: 'rolnictwo', title: 'Rolnictwo' },
    ],
  },
  samorzad: {
    title: 'Samorząd',
    description: 'Rada Miejska, Urząd Miejski, sołectwa, budżet i finanse publiczne.',
    color: '#1a3a5c',
    subcategories: [
      { slug: 'rada', title: 'Rada Miejska' },
      { slug: 'urzad', title: 'Urząd Miejski' },
      { slug: 'budzet', title: 'Budżet' },
      { slug: 'solectwa', title: 'Sołectwa' },
    ],
  },
  kujawianka: {
    title: 'Kujawianka',
    description: 'Klub piłkarski Kujawianka Izbica Kujawska — wyniki, tabela, kadra, historia.',
    color: '#1e7a4f',
    subcategories: [
      { slug: 'mecze', title: 'Mecze i wyniki' },
      { slug: 'tabela', title: 'Tabela' },
      { slug: 'kadra', title: 'Kadra' },
      { slug: 'historia', title: 'Historia klubu' },
    ],
  },
  kultura: {
    title: 'Kultura',
    description: 'MGCK, Biblioteka, koła gospodyń wiejskich, wydarzenia kulturalne.',
    color: '#7b2d8b',
    subcategories: [
      { slug: 'mgck', title: 'MGCK' },
      { slug: 'biblioteka', title: 'Biblioteka' },
      { slug: 'kgw', title: 'KGW' },
      { slug: 'wydarzenia', title: 'Wydarzenia' },
    ],
  },
  historia: {
    title: 'Historia',
    description: 'Dzieje Izbicy Kujawskiej, Polskie Piramidy w Wietrzychowicach, dziedzictwo żydowskie.',
    color: '#b8860b',
    subcategories: [
      { slug: 'dzieje', title: 'Dzieje Izbicy' },
      { slug: 'wietrzychowice', title: 'Wietrzychowice' },
      { slug: 'zydzi', title: 'Społeczność żydowska' },
      { slug: 'zabytki', title: 'Zabytki' },
    ],
  },
  sport: {
    title: 'Sport',
    description: 'Kujawianka, sport amatorski, młodzieżówka, hala sportowa.',
    color: '#1e7a4f',
    subcategories: [],
  },
  zdrowie: {
    title: 'Zdrowie',
    description: 'SPZOZ, apteki dyżurujące, profilaktyka zdrowotna.',
    color: '#27ae60',
    subcategories: [],
  },
  edukacja: {
    title: 'Edukacja',
    description: 'Szkoły podstawowe, ZS im. Kasprowicza, przedszkola, edukacja dorosłych.',
    color: '#3498db',
    subcategories: [],
  },
  inwestycje: {
    title: 'Inwestycje',
    description: 'Drogi, sieci, budynki publiczne, fundusze europejskie i krajowe.',
    color: '#c0392b',
    subcategories: [],
  },
  rolnictwo: {
    title: 'Rolnictwo',
    description: 'ARiMR, doradztwo, dopłaty, KGW, rolnictwo zrównoważone.',
    color: '#d4ac0d',
    subcategories: [],
  },
  srodowisko: {
    title: 'Środowisko',
    description: 'Ochrona środowiska, gospodarka odpadami, Spółka Wodna, OZE.',
    color: '#16a085',
    subcategories: [],
  },
  spoleczne: {
    title: 'Społeczne',
    description: 'MGOPS, Caritas, wolontariat, pomoc rodzinom.',
    color: '#e67e22',
    subcategories: [],
  },
  komunikaty: {
    title: 'Komunikaty',
    description: 'Oficjalne ogłoszenia urzędowe, wyłączenia mediów, sytuacje awaryjne.',
    color: '#34495e',
    subcategories: [],
  },
}

export const findArticle = (slug: string): ArticleData | null =>
  ARTICLES.find(a => a.slug === slug) || null

export const articlesByCategory = (category: string): ArticleData[] =>
  ARTICLES.filter(a => a.category === category)

export const searchArticles = (query: string): ArticleData[] => {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase().trim()
  return ARTICLES.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.lede.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q)) ||
    a.body.some(p => p.toLowerCase().includes(q))
  )
}
