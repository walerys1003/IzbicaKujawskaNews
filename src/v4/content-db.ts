// ============================================================================
// IZBICA24.PL v4 — BAZA TREŚCI (warstwa danych strony głównej i podstron)
// Treści przeniesione 1:1 z szaty graficznej + rozszerzone na podkategorie,
// aby każda ścieżka taksonomii miała materiał do wyświetlenia.
// ============================================================================

import type { Article, Author, Gallery, MediaAsset } from './content-types'

const IMG = '/static/img/v4'

// ────────────────────────────────────────────────────────────────── AUTORZY
export const AUTHORS: Record<string, Author> = {
  'anna-wojcik': {
    slug: 'anna-wojcik',
    name: 'Anna Wójcik',
    role: 'Redaktor prowadząca · samorząd i inwestycje',
    email: 'a.wojcik@izbica24.pl',
    bio: 'Od 2021 roku relacjonuje sesje Rady Miejskiej i inwestycje gminne. Absolwentka dziennikarstwa UMK.',
  },
  'marek-kowalski': {
    slug: 'marek-kowalski',
    name: 'Marek Kowalski',
    role: 'Reporter · Na sygnale, bezpieczeństwo',
    email: 'm.kowalski@izbica24.pl',
    bio: 'Współpracuje z OSP Izbica Kujawska i KMP Włocławek. Na miejscu zdarzeń — często pierwszy.',
  },
  'tomasz-kotlinski': {
    slug: 'tomasz-kotlinski',
    name: 'Tomasz Kotliński',
    role: 'Redaktor naczelny',
    email: 'redakcja@izbica24.pl',
    bio: 'Założyciel portalu izbica24.pl. Odpowiada za linię redakcyjną i weryfikację materiałów AI.',
  },
  redakcja: {
    slug: 'redakcja',
    name: 'Redakcja izbica24.pl',
    role: 'Zespół redakcyjny',
    email: 'redakcja@izbica24.pl',
  },
}

const A = AUTHORS

/** Skrót do budowania artykułu z sensownymi wartościami domyślnymi */
function art(a: Partial<Article> & Pick<Article, 'slug' | 'category' | 'title' | 'lede'>): Article {
  return {
    id: a.id ?? a.slug,
    type: a.type ?? 'article',
    status: a.status ?? 'published',
    blocks: a.blocks ?? [],
    author: a.author ?? A.redakcja,
    publishedAt: a.publishedAt ?? '23 maja 2026, 10:00',
    publishedAtISO: a.publishedAtISO ?? '2026-05-23T10:00:00+02:00',
    readingMinutes: a.readingMinutes ?? 3,
    views: a.views ?? 0,
    commentCount: a.commentCount ?? 0,
    tags: a.tags ?? [],
    ...a,
  } as Article
}

// ════════════════════════════════════════════════════════════════════════════
// ARTYKUŁY
// ════════════════════════════════════════════════════════════════════════════
export const ARTICLES_V4: Article[] = [
  // ───────────────────────────────── HERO GŁÓWNY
  art({
    slug: 'remont-ulicy-koscielnej-zakonczony',
    category: 'wiadomosci',
    subcategory: 'inwestycje',
    title:
      'Remont ulicy Kościelnej zakończony przed terminem. „To dopiero początek” — burmistrz Dorabiała.',
    lede:
      'W środę burmistrz Marek Dorabiała oficjalnie otworzył wyremontowany odcinek ul. Kościelnej. Inwestycja warta 2,4 mln zł objęła nową nawierzchnię, chodniki, kanalizację burzową i oświetlenie LED. W planach kolejne ulice w centrum Izbicy.',
    heroImage: `${IMG}/01-hero-ulica-koscielna.jpg`,
    heroAlt: 'Remont ulicy Kościelnej w Izbicy Kujawskiej',
    heroCaption: 'Nowa nawierzchnia ul. Kościelnej po zakończeniu prac · fot. UMiG Izbica Kujawska',
    heroCredit: 'fot. UMiG Izbica Kujawska',
    author: A['anna-wojcik'],
    publishedAt: '22 maja 2026, 17:42',
    publishedAtISO: '2026-05-22T17:42:00+02:00',
    updatedAt: '22 maja 2026, 19:10',
    readingMinutes: 4,
    views: 2341,
    commentCount: 12,
    featured: true,
    tags: ['Inwestycje', 'Drogi', 'Centrum', 'Burmistrz', 'Fundusze'],
    blocks: [
      { type: 'paragraph', html: 'Po sześciu miesiącach prac ulica Kościelna w centrum Izbicy Kujawskiej została <strong>w pełni przebudowana</strong> i oddana mieszkańcom. Wykonawca oddał inwestycję dwa tygodnie przed terminem umownym.' },
      { type: 'heading', level: 2, text: 'Co dokładnie zrobiono' },
      { type: 'list', items: ['650 m nowej nawierzchni bitumicznej', '1 200 m² chodników z kostki brukowej', '32 lampy LED — oszczędność energii do 65%', 'Kanalizacja burzowa z wpustami co 100 m', 'Nowe przejście dla pieszych przy Zespole Szkół'] },
      { type: 'image', src: `${IMG}/01-hero-ulica-koscielna.jpg`, alt: 'Nowa nawierzchnia', caption: 'Odcinek od rynku do skrzyżowania z ul. Augustowską', credit: 'fot. UMiG' },
      { type: 'quote', text: 'To była najbardziej oczekiwana inwestycja drogowa ostatnich lat. Cieszę się, że udało się ją zrealizować pod budżet i przed terminem. To dopiero początek.', author: 'Marek Dorabiała', role: 'Burmistrz gminy Izbica Kujawska' },
      { type: 'heading', level: 2, text: 'Co dalej' },
      { type: 'paragraph', html: 'Kolejna duża inwestycja drogowa — przebudowa Placu Wolności — ruszy w lipcu 2026 roku. Gmina złożyła też wniosek o dofinansowanie remontu ul. Kolejowej.' },
      { type: 'info', variant: 'info', title: 'Koszt inwestycji', html: '2,4 mln zł, z czego 1,6 mln zł to dofinansowanie z Rządowego Funduszu Rozwoju Dróg.' },
    ],
  }),

  // ───────────────────────────────── HERO SIDE
  art({
    slug: 'sesja-rady-miejskiej-budzet-remontowy',
    category: 'samorzad',
    subcategory: 'rada',
    title: 'Sesja Rady Miejskiej: budżet remontowy 4,8 mln zł',
    lede:
      'Rekordowy budżet inwestycyjny na 2026 rok. Drogi, kanalizacja, termomodernizacja szkół. Inwestycje drogowe i kanalizacyjne wzrosną o 18% rok do roku.',
    heroImage: `${IMG}/03-sesja-rady-miejskiej.jpg`,
    heroAlt: 'Sesja Rady Miejskiej w Izbicy Kujawskiej',
    author: A['anna-wojcik'],
    publishedAt: '22 maja 2026, 18:30',
    publishedAtISO: '2026-05-22T18:30:00+02:00',
    readingMinutes: 5,
    views: 1876,
    commentCount: 8,
    featured: true,
    tags: ['Rada Miejska', 'Budżet', 'Inwestycje'],
    blocks: [
      { type: 'paragraph', html: 'Podczas sesji 22 maja Rada Miejska przyjęła zmiany w budżecie gminy na 2026 rok. Najważniejsza pozycja: <strong>4,8 mln zł na inwestycje remontowe</strong>.' },
      { type: 'heading', level: 2, text: 'Największe pozycje budżetu' },
      { type: 'table', head: ['Inwestycja', 'Kwota', 'Termin'], rows: [['Plac Wolności — przebudowa', '1,9 mln zł', 'lipiec–listopad 2026'], ['Termomodernizacja SP nr 2', '1,2 mln zł', 'wakacje 2026'], ['Kanalizacja Sadłno–Bierzyn', '1,1 mln zł', 'czerwiec 2026 – X 2027'], ['Świetlice wiejskie (4 sołectwa)', '0,6 mln zł', 'do końca 2026']] },
      { type: 'quote', text: 'To największy budżet remontowy w historii gminy. Czeka nas pracowite półrocze.', author: 'Marek Dorabiała', role: 'Burmistrz' },
    ],
  }),

  art({
    slug: 'kujawianka-sparta-brzesc-3-1',
    category: 'kujawianka',
    subcategory: 'mecze',
    title: 'Hat-trick Adamiaka! Kujawianka rozbija Spartę i atakuje awans',
    lede:
      'Adam Adamiak zdobył wszystkie trzy bramki dla gospodarzy. Trener Kaczor: „Forma wzrasta — wierzymy w awans do IV ligi”. Klub awansuje na 3. miejsce w tabeli.',
    heroImage: `${IMG}/04-kujawianka-celebracja.jpg`,
    heroAlt: 'Piłkarze Kujawianki celebrują zwycięstwo',
    author: A.redakcja,
    publishedAt: '21 maja 2026, 18:00',
    publishedAtISO: '2026-05-21T18:00:00+02:00',
    readingMinutes: 4,
    views: 3128,
    commentCount: 24,
    featured: true,
    tags: ['Kujawianka', 'Klasa Okręgowa', 'Adamiak', 'Zwycięstwo'],
    blocks: [
      { type: 'paragraph', html: 'W 25. kolejce Klasy Okręgowej gr. 2 <strong>Kujawianka Izbica Kujawska pokonała Spartę Brześć 3:1</strong>. Wszystkie bramki dla gospodarzy zdobył Adam Adamiak.' },
      { type: 'heading', level: 2, text: 'Przebieg meczu' },
      { type: 'list', items: ['12′ Adamiak 1:0 — dobitka po rzucie rożnym', '38′ Adamiak 2:0 — kontra po podaniu Wójcickiego', '61′ 2:1 — kontaktowa dla gości', '84′ Adamiak 3:1 — rzut karny'] },
      { type: 'quote', text: 'Forma wzrasta w najlepszym momencie sezonu. Wierzymy w awans do IV ligi.', author: 'Mariusz Kaczor', role: 'Trener Kujawianki' },
      { type: 'gallery', galleryId: 'kujawianka-sparta-2026' },
    ],
  }),

  art({
    slug: 'wietrzychowice-nowe-odkrycia-archeologiczne',
    category: 'historia',
    subcategory: 'wietrzychowice',
    title: 'Wietrzychowice: pod warstwą piasku spała tajemnica sprzed 5 500 lat',
    lede:
      'Zespół archeologów z UMK Toruń i Muzeum Archeologicznego w Poznaniu odkrył nowy grobowiec kujawski w Parku Kulturowym. To jeden z najstarszych zabytków megalitycznych w Polsce — kultura pucharów lejkowatych, ok. 3500 p.n.e.',
    heroImage: `${IMG}/05-wietrzychowice-megality.jpg`,
    heroAlt: 'Megality w Wietrzychowicach — polskie piramidy',
    heroCaption: 'Grobowce kujawskie w Parku Kulturowym Wietrzychowice',
    author: A['tomasz-kotlinski'],
    publishedAt: '21 maja 2026, 11:00',
    publishedAtISO: '2026-05-21T11:00:00+02:00',
    readingMinutes: 7,
    views: 5128,
    commentCount: 31,
    featured: true,
    tags: ['Wietrzychowice', 'Archeologia', 'Megality', 'UMK', 'Polskie piramidy'],
    blocks: [
      { type: 'paragraph', html: 'W Parku Kulturowym Wietrzychowice odkryto <strong>nowy grobowiec kujawski</strong> — datowany na ok. 3500 lat p.n.e. To sensacja archeologiczna roku w regionie.' },
      { type: 'heading', level: 2, text: 'Dlaczego to ważne' },
      { type: 'paragraph', html: 'Grobowce kujawskie zwane „polskimi piramidami” to konstrukcje ziemno-kamienne kultury pucharów lejkowatych. Wietrzychowice to największe takie cmentarzysko w Polsce.' },
      { type: 'image', src: `${IMG}/18-szlak-megality.jpg`, alt: 'Szlak megalitów', caption: 'Ścieżka dydaktyczna w Parku Kulturowym' },
      { type: 'embed', provider: 'youtube', url: 'https://www.youtube.com/watch?v=example' },
    ],
  }),

  art({
    slug: 'dni-izbicy-2026-program',
    category: 'kultura',
    subcategory: 'mgck',
    title: 'Dni Izbicy 2026: 14–16 czerwca. Trzy dni świętowania — pełny program',
    lede:
      'Gwiazda sobotniego wieczoru: Jacek Stachursky. Plus turniej sołectw o Puchar Burmistrza, wystawa „Dawna Izbica”, warsztaty dla dzieci oraz tradycyjne dożynki gminno-parafialne w niedzielę.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    heroAlt: 'Koncert podczas Dni Izbicy',
    author: A.redakcja,
    publishedAt: '22 maja 2026, 14:15',
    publishedAtISO: '2026-05-22T14:15:00+02:00',
    readingMinutes: 6,
    views: 4204,
    commentCount: 18,
    featured: true,
    tags: ['MGCK', 'Dni Izbicy', 'Dożynki', 'Koncert'],
    blocks: [
      { type: 'heading', level: 2, text: 'Piątek, 14 czerwca' },
      { type: 'list', items: ['17:00 — otwarcie, wystawa „Dawna Izbica” (MGCK)', '18:30 — występy zespołów dziecięcych', '20:00 — kino pod chmurką na rynku'] },
      { type: 'heading', level: 2, text: 'Sobota, 15 czerwca' },
      { type: 'list', items: ['11:00 — turniej sołectw o Puchar Burmistrza', '15:00 — festyn rodzinny, dmuchańce, warsztaty KGW', '21:00 — koncert główny: Jacek Stachursky'] },
      { type: 'heading', level: 2, text: 'Niedziela, 16 czerwca' },
      { type: 'list', items: ['12:00 — msza dożynkowa', '14:00 — korowód dożynkowy', '16:00 — konkurs wieńców, zakończenie'] },
      { type: 'file', url: '/static/downloads/dni-izbicy-2026-program.pdf', label: 'Program Dni Izbicy 2026 (PDF)', sizeLabel: '1,2 MB', mime: 'application/pdf' },
    ],
  }),

  // ───────────────────────────────── NA SYGNALE (type: live)
  art({
    slug: 'pozar-stodoly-bierzyn',
    category: 'na-sygnale',
    subcategory: 'pozary',
    type: 'live',
    title: 'OSP Izbica, Pasieka i Wietrzychowice w akcji ratowniczej',
    lede:
      'Stodoła w Bierzynie stanęła w płomieniach po godz. 14:30. Trzy jednostki OSP gasiły ogień przez blisko 2 godziny. Sytuacja opanowana, nikt nie ucierpiał. Interwencja nr 47/2026.',
    heroImage: `${IMG}/02-osp-pozar-stodola.jpg`,
    heroAlt: 'Strażacy OSP gaszą pożar stodoły',
    author: A['marek-kowalski'],
    publishedAt: '23 maja 2026, 15:10',
    publishedAtISO: '2026-05-23T15:10:00+02:00',
    readingMinutes: 5,
    views: 1248,
    commentCount: 6,
    breaking: true,
    featured: true,
    solectwo: 'bierzyn',
    tags: ['OSP', 'Pożar', 'Bierzyn', 'Interwencja'],
    incident: { time: '14:32', dayLabel: 'dziś', kind: 'Pożar stodoły · Bierzyn', icon: '🔥', place: 'Bierzyn', source: 'OSP Izbica Kujawska · FB · KMP Włocławek', resolved: true },
    blocks: [
      { type: 'paragraph', html: 'Zgłoszenie wpłynęło o <strong>14:32</strong>. Na miejsce skierowano OSP Izbica Kujawska, OSP Pasieka oraz OSP Wietrzychowice.' },
      { type: 'list', items: ['14:32 — zgłoszenie pożaru', '14:41 — pierwszy zastęp na miejscu', '15:20 — pożar opanowany', '16:25 — zakończenie działań'] },
      { type: 'info', variant: 'success', title: 'Bilans', html: 'Brak osób poszkodowanych. Ogień nie rozprzestrzenił się na sąsiednie zabudowania.' },
    ],
  }),

  art({
    slug: 'zatrzymanie-nietrzezwego-kierowcy-augustowska',
    category: 'na-sygnale',
    subcategory: 'policja',
    type: 'live',
    title: 'Zatrzymanie nietrzeźwego kierowcy na ul. Augustowskiej',
    lede:
      '41-latek z gminy Choceń. 1,8 promila alkoholu w wydychanym powietrzu. Stracił prawo jazdy, sprawa skierowana do prokuratury.',
    heroImage: `${IMG}/19-policja-patrol.jpg`,
    heroAlt: 'Patrol policji w Izbicy Kujawskiej',
    author: A['marek-kowalski'],
    publishedAt: '23 maja 2026, 08:40',
    publishedAtISO: '2026-05-23T08:40:00+02:00',
    views: 892,
    commentCount: 4,
    featured: true,
    tags: ['Policja', 'Nietrzeźwy kierowca', 'Kronika'],
    incident: { time: '08:15', dayLabel: 'dziś', kind: 'Kronika policyjna', icon: '🚓', place: 'ul. Augustowska', source: 'Posterunek Policji Izbica' },
    blocks: [{ type: 'paragraph', html: 'Podczas rutynowej kontroli drogowej funkcjonariusze zatrzymali kierowcę osobowego opla. Badanie alkomatem wykazało <strong>1,8 promila</strong>.' }],
  }),

  art({
    slug: 'zaginiona-84-latka-sarnowo-odnaleziona',
    category: 'na-sygnale',
    subcategory: 'interwencje',
    type: 'live',
    title: 'Zaginiona 84-latka odnaleziona w ciągu 35 minut',
    lede:
      'Mieszkanka Sarnowa wyszła z domu po południu. Wieczorem rodzina zgłosiła zaginięcie. OSP Izbica we współpracy z policją odnalazła kobietę. Bezpieczna w domu.',
    heroImage: `${IMG}/20-pogoda-kujawy.jpg`,
    heroAlt: 'Akcja poszukiwawcza w okolicy Sarnowa',
    author: A['marek-kowalski'],
    publishedAt: '22 maja 2026, 23:15',
    publishedAtISO: '2026-05-22T23:15:00+02:00',
    views: 1654,
    commentCount: 9,
    featured: true,
    solectwo: 'sarnowo',
    tags: ['OSP', 'Poszukiwania', 'Sarnowo'],
    incident: { time: '22:40', dayLabel: 'wczoraj', kind: 'Akcja poszukiwawcza · Sarnowo', icon: '🏥', place: 'Sarnowo', source: 'OSP Izbica · KMP Włocławek', resolved: true },
    blocks: [{ type: 'paragraph', html: 'Do akcji zaangażowano 14 strażaków oraz dwa patrole policji. Kobietę odnaleziono po 35 minutach poszukiwań w pobliskim zagajniku.' }],
  }),

  art({
    slug: 'wypadek-dk62-pasieka',
    category: 'na-sygnale',
    subcategory: 'wypadki',
    type: 'live',
    title: 'Wypadek w okolicy Pasieki — utrudnienia na DK 62',
    lede: 'Dwa samochody osobowe. Kierowcy bez poważnych obrażeń. Utrudnienia ok. 90 minut.',
    heroImage: `${IMG}/01-hero-ulica-koscielna.jpg`,
    heroAlt: 'Kolizja na drodze krajowej 62',
    author: A['marek-kowalski'],
    publishedAt: '23 maja 2026, 12:05',
    publishedAtISO: '2026-05-23T12:05:00+02:00',
    views: 743,
    solectwo: 'pasieka',
    tags: ['DK 62', 'Kolizja', 'Pasieka'],
    incident: { time: '11:45', dayLabel: 'dziś', kind: 'Kolizja · DK 62', icon: '🚗', place: 'Pasieka', source: 'KMP Włocławek' },
    blocks: [{ type: 'paragraph', html: 'Do zdarzenia doszło na wysokości zjazdu do Pasieki. Ruch odbywał się wahadłowo przez ok. 90 minut.' }],
  }),

  art({
    slug: 'wylaczenie-wody-kolejowa',
    category: 'na-sygnale',
    subcategory: 'awarie',
    type: 'live',
    title: 'Wyłączenie wody · ul. Kolejowa',
    lede: 'Awaria magistrali. Wody nie będzie do godz. 16:00. ZGKiW pracuje na miejscu.',
    heroImage: `${IMG}/16-srodowisko-odpady.jpg`,
    heroAlt: 'Prace przy awarii sieci wodociągowej',
    author: A.redakcja,
    publishedAt: '23 maja 2026, 13:20',
    publishedAtISO: '2026-05-23T13:20:00+02:00',
    views: 1102,
    tags: ['ZGKiW', 'Awaria', 'Woda'],
    incident: { time: '13:08', dayLabel: 'dziś', kind: 'Awaria sieci wodnej', icon: '💧', place: 'ul. Kolejowa', source: 'ZGKiW Izbica' },
    blocks: [{ type: 'paragraph', html: 'ZGKiW informuje o awarii magistrali wodociągowej. Beczkowóz podstawiono przy skrzyżowaniu z ul. Dworcową.' }],
  }),

  art({
    slug: 'planowane-wylaczenie-pradu-sadlno-modzerowo',
    category: 'na-sygnale',
    subcategory: 'awarie',
    type: 'live',
    title: 'Sadłno, Modzerowo — planowane wyłączenie prądu',
    lede: 'PGE: prace konserwacyjne w godz. 9–14. Część gospodarstw bez prądu.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    heroAlt: 'Sieć energetyczna w sołectwie Sadłno',
    author: A.redakcja,
    publishedAt: '23 maja 2026, 09:30',
    publishedAtISO: '2026-05-23T09:30:00+02:00',
    views: 654,
    solectwo: 'sadlno',
    tags: ['PGE', 'Prąd', 'Sadłno', 'Modzerowo'],
    incident: { time: '09:20', dayLabel: 'dziś', kind: 'Awaria prądu', icon: '⚡', place: 'Sadłno, Modzerowo', source: 'PGE Dystrybucja' },
    blocks: [{ type: 'paragraph', html: 'PGE Dystrybucja informuje o planowanych pracach konserwacyjnych na linii średniego napięcia.' }],
  }),

  art({
    slug: 'zaslabniecie-pasieka-warsztaty',
    category: 'na-sygnale',
    subcategory: 'interwencje',
    type: 'live',
    title: 'Pasieka — zasłabnięcie podczas warsztatów',
    lede: '71-latka zasłabła w świetlicy. Karetka przewiozła do SPZOZ. Stan dobry.',
    heroImage: `${IMG}/15-kgw-pasieka-chleb.jpg`,
    heroAlt: 'Świetlica wiejska w Pasiece',
    author: A['marek-kowalski'],
    publishedAt: '22 maja 2026, 19:50',
    publishedAtISO: '2026-05-22T19:50:00+02:00',
    views: 431,
    solectwo: 'pasieka',
    tags: ['SPZOZ', 'Interwencja medyczna', 'Pasieka'],
    incident: { time: '19:25', dayLabel: 'wczoraj', kind: 'Interwencja medyczna', icon: '🏥', place: 'Pasieka', source: 'SPZOZ Izbica', resolved: true },
    blocks: [{ type: 'paragraph', html: 'Zespół ratownictwa medycznego przewiózł kobietę do SPZOZ Izbica Kujawska. Stan pacjentki określono jako dobry.' }],
  }),

  // ───────────────────────────────── WIADOMOŚCI — GRID
  art({
    slug: 'arimr-doplaty-2026-nabor',
    category: 'wiadomosci',
    subcategory: 'rolnictwo',
    title: 'ARiMR: dopłaty bezpośrednie 2026 — nabór do 15 czerwca. Stawki wyższe o 6,2%.',
    lede:
      'Agencja otworzyła nabór wniosków na płatności bezpośrednie. Stawki podwyższone w stosunku do roku 2025. Wnioski można składać elektronicznie lub osobiście w biurze powiatowym.',
    heroImage: `${IMG}/07-rolnictwo-rzepak.jpg`,
    heroAlt: 'Pole rzepaku na Kujawach',
    author: A.redakcja,
    publishedAt: '22 maja 2026, 10:15',
    publishedAtISO: '2026-05-22T10:15:00+02:00',
    views: 876,
    commentCount: 3,
    tags: ['ARiMR', 'Dopłaty', 'Rolnictwo'],
    aiAssisted: true,
    blocks: [
      { type: 'paragraph', html: 'Nabór wniosków o płatności bezpośrednie trwa do <strong>15 czerwca 2026</strong>. Stawki wzrosły średnio o 6,2%.' },
      { type: 'table', head: ['Rodzaj płatności', 'Stawka 2026', 'Zmiana'], rows: [['Podstawowe wsparcie dochodów', '512 zł/ha', '+6,2%'], ['Płatność redystrybucyjna', '178 zł/ha', '+4,1%'], ['Ekoschemat — rolnictwo węglowe', 'do 320 zł/ha', '+8,0%']] },
      { type: 'info', variant: 'warning', title: 'Gdzie złożyć wniosek', html: 'Biuro Powiatowe ARiMR we Włocławku, ul. Leśna 7, lub przez aplikację eWniosekPlus.' },
    ],
  }),

  art({
    slug: 'sp1-wygrala-konkurs-matematyczny',
    category: 'wiadomosci',
    subcategory: 'edukacja',
    title: 'SP nr 1 wygrała wojewódzki konkurs „Małe Mistrzostwa Matematyczne”',
    lede:
      'Uczniowie SP nr 1 w Izbicy zdobyli pierwsze miejsce w finałach wojewódzkich. Wyróżniona praca: rozwiązywanie zadań logicznych. Nagroda — wycieczka do Toruńskiego Planetarium.',
    heroImage: `${IMG}/08-edukacja-szkola.jpg`,
    heroAlt: 'Uczniowie SP nr 1 w Izbicy Kujawskiej',
    author: A['anna-wojcik'],
    publishedAt: '22 maja 2026, 09:30',
    publishedAtISO: '2026-05-22T09:30:00+02:00',
    views: 654,
    commentCount: 7,
    tags: ['SP nr 1', 'Konkurs', 'Edukacja', 'Sukces'],
    blocks: [{ type: 'paragraph', html: 'Drużyna SP nr 1 w składzie: Zofia Malinowska, Antoni Kowalczyk i Jan Wiśniewski zajęła <strong>pierwsze miejsce</strong> w finale wojewódzkim.' }],
  }),

  art({
    slug: 'spzoz-dodatkowe-godziny-kardiologia',
    category: 'wiadomosci',
    subcategory: 'zdrowie',
    title: 'SPZOZ uruchamia dodatkowe godziny poradni kardiologicznej',
    lede:
      'Od czerwca poradnia kardiologiczna będzie przyjmować pacjentów również w środy. Rejestracja telefoniczna od poniedziałku. Lekarz przyjmie do 30 osób tygodniowo.',
    heroImage: `${IMG}/09-spzoz-pielegniarka.jpg`,
    heroAlt: 'Pielęgniarka w SPZOZ Izbica Kujawska',
    author: A.redakcja,
    publishedAt: '21 maja 2026, 11:20',
    publishedAtISO: '2026-05-21T11:20:00+02:00',
    views: 421,
    tags: ['SPZOZ', 'Kardiologia', 'Zdrowie'],
    blocks: [{ type: 'paragraph', html: 'Poradnia kardiologiczna będzie dostępna w <strong>środy 8:00–14:00</strong>. Rejestracja: 54 286 51 12.' }],
  }),

  art({
    slug: 'nasadzenia-200-drzew-sadlno-modzerowo',
    category: 'wiadomosci',
    subcategory: 'srodowisko',
    title: 'Nasadzenia 200 drzew w sołectwach Sadłno i Modzerowo',
    lede:
      'Pierwszy etap programu „Zielona Gmina” zakończony. Posadzono 200 dębów, lip i klonów. Akcję wsparli wolontariusze i strażacy OSP.',
    heroImage: `${IMG}/16-srodowisko-odpady.jpg`,
    heroAlt: 'Nasadzenia drzew w gminie',
    author: A.redakcja,
    publishedAt: '20 maja 2026, 14:00',
    publishedAtISO: '2026-05-20T14:00:00+02:00',
    views: 312,
    solectwo: 'sadlno',
    tags: ['Zielona Gmina', 'Środowisko', 'Nasadzenia'],
    blocks: [{ type: 'paragraph', html: 'W akcji wzięło udział 45 wolontariuszy. Drugi etap programu — 300 drzew — zaplanowano na wrzesień.' }],
  }),

  art({
    slug: 'harmonogram-odbioru-odpadow-czerwiec-2026',
    category: 'wiadomosci',
    subcategory: 'komunikaty',
    title: 'Harmonogram odbioru odpadów — czerwiec 2026. Sprawdź daty dla swojego sołectwa.',
    lede:
      'Pełen wykaz terminów odbioru zmieszanych, BIO, plastiku, szkła i papieru. Zmiany w kilku sołectwach z powodu remontów dróg. Dokładne daty w dokumencie PDF.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    heroAlt: 'Pojemniki na odpady',
    author: A.redakcja,
    publishedAt: '20 maja 2026, 09:00',
    publishedAtISO: '2026-05-20T09:00:00+02:00',
    views: 892,
    tags: ['Odpady', 'Harmonogram', 'Komunikaty'],
    aiAssisted: true,
    blocks: [
      { type: 'table', head: ['Frakcja', 'Miasto', 'Sołectwa'], rows: [['Zmieszane', '3, 17 czerwca', '4, 18 czerwca'], ['BIO', '10, 24 czerwca', '11, 25 czerwca'], ['Plastik / metal', '5 czerwca', '6 czerwca'], ['Szkło', '12 czerwca', '13 czerwca'], ['Papier', '19 czerwca', '20 czerwca']] },
      { type: 'file', url: '/static/downloads/harmonogram-odpady-2026-06.pdf', label: 'Harmonogram odbioru odpadów — czerwiec 2026', sizeLabel: '480 kB', mime: 'application/pdf' },
    ],
  }),

  art({
    slug: 'mgops-pomoc-zywnosciowa-czerwiec',
    category: 'wiadomosci',
    subcategory: 'spoleczne',
    title: 'MGOPS: wydawanie żywności w ramach FEPŻ — terminy czerwcowe',
    lede:
      'Miejsko-Gminny Ośrodek Pomocy Społecznej informuje o terminach wydawania paczek żywnościowych. Uprawnieni: osoby z dochodem do 1 823 zł.',
    heroImage: `${IMG}/09-spzoz-pielegniarka.jpg`,
    heroAlt: 'Pomoc żywnościowa MGOPS',
    author: A.redakcja,
    publishedAt: '19 maja 2026, 12:00',
    publishedAtISO: '2026-05-19T12:00:00+02:00',
    views: 528,
    tags: ['MGOPS', 'Pomoc społeczna', 'FEPŻ'],
    blocks: [{ type: 'paragraph', html: 'Wydawanie żywności: <strong>9 i 23 czerwca</strong>, godz. 9:00–14:00, magazyn przy ul. Sportowej 4.' }],
  }),

  // ───────────────────────────────── SAMORZĄD — lista
  art({
    slug: 'zarzadzenie-47-2026-nabor-kierownika-zgkiw',
    category: 'samorzad',
    subcategory: 'urzad',
    title: 'Zarządzenie burmistrza nr 47/2026 — nabór na kierownika ZGKiW',
    lede: 'Urząd Miejski ogłosił konkurs na stanowisko kierownika Zakładu Gospodarki Komunalnej i Wodociągów. Termin składania dokumentów: 5 czerwca.',
    heroImage: `${IMG}/03-sesja-rady-miejskiej.jpg`,
    author: A['anna-wojcik'],
    publishedAt: '22 maja 2026, 14:00',
    publishedAtISO: '2026-05-22T14:00:00+02:00',
    views: 412,
    tags: ['Zarządzenie', 'ZGKiW', 'Nabór'],
    blocks: [{ type: 'paragraph', html: 'Wymagania: wykształcenie wyższe techniczne, min. 5 lat doświadczenia, znajomość prawa wodnego.' }],
  }),

  art({
    slug: 'fundusze-ue-termomodernizacja-sp2',
    category: 'samorzad',
    subcategory: 'budzet',
    title: 'Fundusze UE: 1,2 mln zł na termomodernizację SP nr 2',
    lede: 'Gmina otrzymała dofinansowanie na kompleksową termomodernizację budynku Szkoły Podstawowej nr 2. Realizacja: wakacje 2026.',
    heroImage: `${IMG}/08-edukacja-szkola.jpg`,
    author: A['anna-wojcik'],
    publishedAt: '21 maja 2026, 11:30',
    publishedAtISO: '2026-05-21T11:30:00+02:00',
    views: 687,
    tags: ['Fundusze UE', 'Termomodernizacja', 'SP nr 2'],
    blocks: [{ type: 'paragraph', html: 'Zakres: ocieplenie ścian i dachu, wymiana okien, nowa instalacja c.o., pompa ciepła i fotowoltaika.' }],
  }),

  art({
    slug: 'remont-drogi-powiatowej-izbica-brdow',
    category: 'samorzad',
    subcategory: 'powiat',
    title: 'Starostwo: rozpoczęcie remontu drogi powiatowej Izbica–Brdów',
    lede: 'Powiat włocławski rozpoczyna przebudowę 6,2 km drogi powiatowej. Prace potrwają do listopada. Przewidziane objazdy.',
    heroImage: `${IMG}/01-hero-ulica-koscielna.jpg`,
    author: A.redakcja,
    publishedAt: '20 maja 2026, 09:00',
    publishedAtISO: '2026-05-20T09:00:00+02:00',
    views: 934,
    tags: ['Powiat', 'Drogi', 'Brdów'],
    blocks: [{ type: 'paragraph', html: 'Wartość inwestycji: 8,4 mln zł. Wykonawca: konsorcjum DROGBUD–Włocławek.' }],
  }),

  art({
    slug: 'zebranie-solectwa-bierzyn-nowy-soltys',
    category: 'samorzad',
    subcategory: 'solectwa',
    title: 'Zebranie sołectwa Bierzyn — wybrany nowy sołtys',
    lede: 'Frekwencja 78%. Nowym sołtysem Bierzyna został Jan Kwiatkowski. Rada sołecka w pełnym składzie.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    author: A['anna-wojcik'],
    publishedAt: '19 maja 2026, 15:45',
    publishedAtISO: '2026-05-19T15:45:00+02:00',
    views: 556,
    solectwo: 'bierzyn',
    tags: ['Sołectwa', 'Bierzyn', 'Sołtys'],
    blocks: [{ type: 'paragraph', html: 'W zebraniu wzięło udział 61 z 78 uprawnionych mieszkańców. Fundusz sołecki na 2027: 42 800 zł.' }],
  }),

  // ───────────────────────────────── KULTURA
  art({
    slug: 'wojciech-tochman-spotkanie-autorskie',
    category: 'kultura',
    subcategory: 'biblioteka',
    title: 'Wojciech Tochman w Izbicy. Spotkanie autorskie — 25 maja, godz. 18:00.',
    lede:
      'Pisarz, reporter, autor książek „Jakbyś kamień jadła” i „Eli, Eli” przyjedzie do Biblioteki Publicznej. Rozmowa o reportażu, podpisywanie książek, dyskusja z publicznością. Wstęp wolny.',
    heroImage: `${IMG}/13-tochman-bibl.jpg`,
    heroAlt: 'Spotkanie autorskie w bibliotece',
    author: A.redakcja,
    publishedAt: '22 maja 2026, 12:00',
    publishedAtISO: '2026-05-22T12:00:00+02:00',
    views: 234,
    tags: ['Biblioteka', 'Spotkanie autorskie', 'Tochman'],
    event: { startsAt: '2026-05-25T18:00:00+02:00', place: 'Biblioteka Publiczna, ul. Piłsudskiego 26', organizer: 'Biblioteka Publiczna', free: true },
    blocks: [{ type: 'paragraph', html: 'Spotkanie poprowadzi Tomasz Kotliński. Po rozmowie przewidziano podpisywanie książek.' }],
  }),

  art({
    slug: 'pielgrzymka-blenna-7-czerwca',
    category: 'kultura',
    subcategory: 'parafie',
    subsubcategory: 'blenna',
    title: 'Wielka Pielgrzymka do MB Łaskawej Księżnej Kujaw — 7 czerwca',
    lede:
      'Sanktuarium w Błennie zaprasza wiernych z całego dekanatu. Trasa pielgrzymki rozpoczyna się w Izbicy o 6:00, msza święta uroczysta w sanktuarium o 11:00.',
    heroImage: `${IMG}/14-pielgrzymka-blenna.jpg`,
    heroAlt: 'Pielgrzymka do sanktuarium w Błennie',
    author: A.redakcja,
    publishedAt: '21 maja 2026, 10:00',
    publishedAtISO: '2026-05-21T10:00:00+02:00',
    views: 189,
    solectwo: 'blenna',
    tags: ['Parafia Błenna', 'Pielgrzymka', 'Sanktuarium'],
    event: { startsAt: '2026-06-07T06:00:00+02:00', place: 'Sanktuarium MB Łaskawej, Błenna', organizer: 'Parafia Błenna', free: true },
    blocks: [{ type: 'paragraph', html: 'Pielgrzymce przewodniczy ks. Waldemar Pasierowski. Trasa: 11 km, zbiórka przy kościele NMP w Izbicy.' }],
  }),

  art({
    slug: 'kgw-pasieczanki-warsztaty-chleba',
    category: 'kultura',
    subcategory: 'kgw',
    title: 'KGW Pasieczanki: warsztaty pieczenia chleba kujawskiego — 2 czerwca',
    lede:
      'Tradycyjna receptura z mąką żytnią ze Świszew, drewno opałowe z lokalnego lasu. Warsztaty prowadzą najstarsze gospodynie wsi. Zapisy w świetlicy wiejskiej. Koszt: 30 zł od osoby.',
    heroImage: `${IMG}/15-kgw-pasieka-chleb.jpg`,
    heroAlt: 'Warsztaty pieczenia chleba KGW Pasieczanki',
    author: A.redakcja,
    publishedAt: '20 maja 2026, 11:00',
    publishedAtISO: '2026-05-20T11:00:00+02:00',
    views: 156,
    solectwo: 'pasieka',
    tags: ['KGW', 'Pasieka', 'Tradycja', 'Warsztaty'],
    event: { startsAt: '2026-06-02T10:00:00+02:00', place: 'Świetlica wiejska w Pasiece', organizer: 'KGW Pasieczanki', free: false },
    blocks: [{ type: 'paragraph', html: 'Uczestnicy zabierają do domu własny bochenek. Liczba miejsc ograniczona do 16 osób.' }],
  }),

  // ───────────────────────────────── LUDZIE
  art({
    slug: 'marek-dorabiala-5-pytan',
    category: 'ludzie',
    subcategory: 'wywiady',
    title: 'Marek Dorabiała: „Termomodernizacja szkół to inwestycja w przyszłość”',
    lede:
      '„Termomodernizacja szkół to nie luksus — to inwestycja w przyszłość naszych dzieci i w portfele rodziców. Każda zaoszczędzona złotówka wróci do mieszkańców.”',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    heroAlt: 'Marek Dorabiała, burmistrz gminy Izbica Kujawska',
    author: A['anna-wojcik'],
    publishedAt: '20 maja 2026, 08:00',
    publishedAtISO: '2026-05-20T08:00:00+02:00',
    readingMinutes: 8,
    views: 1245,
    commentCount: 15,
    featured: true,
    tags: ['Wywiad', 'Burmistrz', 'Samorząd'],
    blocks: [
      { type: 'heading', level: 2, text: 'Jaka inwestycja jest dla Pana najważniejsza w 2026 roku?' },
      { type: 'paragraph', html: 'Termomodernizacja SP nr 2. Rachunki za ogrzewanie szkół to jedna z największych pozycji w budżecie oświatowym.' },
      { type: 'quote', text: 'Termomodernizacja szkół to nie luksus — to inwestycja w przyszłość naszych dzieci i w portfele rodziców.', author: 'Marek Dorabiała', role: 'Burmistrz gminy Izbica Kujawska' },
    ],
  }),

  art({
    slug: 'jadwiga-kowalska-38-lat-w-bibliotece',
    category: 'ludzie',
    subcategory: 'sylwetki',
    title: 'Jadwiga Kowalska: 38 lat w jednej bibliotece',
    lede:
      '„Przez 38 lat pracowałam w jednej bibliotece, ale Izbica zmieniała się każdego dnia. Każda książka znajduje swojego czytelnika.”',
    heroImage: `${IMG}/11-portret-bibliotekarka.jpg`,
    heroAlt: 'Jadwiga Kowalska, bibliotekarka',
    author: A['marek-kowalski'],
    publishedAt: '18 maja 2026, 10:00',
    publishedAtISO: '2026-05-18T10:00:00+02:00',
    readingMinutes: 6,
    views: 892,
    commentCount: 11,
    featured: true,
    tags: ['Sylwetka', 'Biblioteka', 'Wspomnienia'],
    blocks: [{ type: 'quote', text: 'Każda książka znajduje swojego czytelnika. Trzeba tylko poczekać.', author: 'Jadwiga Kowalska', role: 'Bibliotekarka' }],
  }),

  art({
    slug: 'adam-adamiak-kujawianka-to-moj-dom',
    category: 'ludzie',
    subcategory: 'sukcesy',
    title: 'Adam Adamiak: „Kujawianka to mój dom”',
    lede:
      '„Kujawianka to mój dom. Mam oferty z wyższych lig, ale Izbica wygrywa za każdym razem. Tu są moi ludzie.”',
    heroImage: `${IMG}/12-portret-pilkarz.jpg`,
    heroAlt: 'Adam Adamiak, napastnik Kujawianki',
    author: A.redakcja,
    publishedAt: '16 maja 2026, 12:00',
    publishedAtISO: '2026-05-16T12:00:00+02:00',
    readingMinutes: 5,
    views: 2134,
    commentCount: 28,
    featured: true,
    tags: ['Sukcesy', 'Kujawianka', 'Adamiak', 'Sport'],
    blocks: [{ type: 'quote', text: 'Mam oferty z wyższych lig, ale Izbica wygrywa za każdym razem.', author: 'Adam Adamiak', role: 'Napastnik Kujawianki · 14 goli' }],
  }),

  // ───────────────────────────────── PRZEGLĄD MEDIÓW
  art({
    slug: 'ddwloclawek-burmistrz-termomodernizacja',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    type: 'media-review',
    title: 'Burmistrz Izbicy o termomodernizacji szkół: „Wniosek już złożony”',
    lede:
      'Marek Dorabiała udzielił obszernego wywiadu o planach inwestycyjnych gminy. Termomodernizacja SP nr 2 to dopiero pierwszy krok — w przygotowaniu kolejne wnioski o dofinansowanie z UE.',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    author: A.redakcja,
    publishedAt: '22 maja 2026, 12:18',
    publishedAtISO: '2026-05-22T12:18:00+02:00',
    views: 2341,
    commentCount: 4,
    externalSource: { name: 'ddwloclawek.pl', url: 'https://ddwloclawek.pl' },
    tags: ['Przegląd mediów', 'Burmistrz'],
    blocks: [{ type: 'paragraph', html: 'Pełny wywiad dostępny w serwisie ddwloclawek.pl.' }],
  }),

  art({
    slug: 'pomorska-wietrzychowice-otwarte',
    category: 'przeglad-mediow',
    subcategory: 'gazeta-pomorska',
    type: 'media-review',
    title: 'Wietrzychowice — polskie piramidy znów otwarte dla turystów',
    lede:
      'Park Kulturowy Wietrzychowice wraca po renowacji. Sezon turystyczny rozpoczęty — wstęp wolny, nowa ścieżka dydaktyczna, tablice informacyjne. Spodziewane 30 tys. odwiedzających rocznie.',
    heroImage: `${IMG}/05-wietrzychowice-megality.jpg`,
    author: A.redakcja,
    publishedAt: '21 maja 2026, 16:45',
    publishedAtISO: '2026-05-21T16:45:00+02:00',
    views: 5128,
    commentCount: 23,
    externalSource: { name: 'pomorska.pl', url: 'https://pomorska.pl' },
    tags: ['Przegląd mediów', 'Wietrzychowice', 'Turystyka'],
    blocks: [{ type: 'paragraph', html: 'Materiał ukazał się w Gazecie Pomorskiej.' }],
  }),

  art({
    slug: 'nwloclawek-kujawianka-awans',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    type: 'media-review',
    title: 'Kujawianka znów zwycięska. Trener Kaczor zapowiada walkę o awans',
    lede:
      'Trzecia z rzędu wygrana piłkarzy z Izbicy. Trener Mariusz Kaczor w pomeczowym wywiadzie zapowiedział walkę o awans do IV ligi. Klub wzmacnia się przed końcówką sezonu.',
    heroImage: `${IMG}/04-kujawianka-celebracja.jpg`,
    author: A.redakcja,
    publishedAt: '21 maja 2026, 18:30',
    publishedAtISO: '2026-05-21T18:30:00+02:00',
    views: 894,
    commentCount: 11,
    externalSource: { name: 'nwloclawek.pl', url: 'https://nwloclawek.pl' },
    tags: ['Przegląd mediów', 'Kujawianka'],
    blocks: [{ type: 'paragraph', html: 'Relacja opublikowana w portalu nwloclawek.pl.' }],
  }),

  art({
    slug: 'tvkujawy-reportaz-dni-izbicy',
    category: 'przeglad-mediow',
    subcategory: 'tv-radio',
    type: 'media-review',
    title: 'Reportaż: Dni Izbicy 2026 — pełna zapowiedź (wideo, 4:23)',
    lede: 'Premierowy materiał TV Kujawy z zapowiedzią trzech dni świętowania w Izbicy Kujawskiej.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    author: A.redakcja,
    publishedAt: '20 maja 2026, 19:00',
    publishedAtISO: '2026-05-20T19:00:00+02:00',
    views: 4712,
    commentCount: 8,
    externalSource: { name: 'TV Kujawy', url: 'https://kujawy.info', badgeColor: '#dc3545' },
    tags: ['Przegląd mediów', 'TV Kujawy', 'Wideo'],
    blocks: [{ type: 'embed', provider: 'youtube', url: 'https://www.youtube.com/watch?v=example' }],
  }),

  art({
    slug: 'radiopik-wywiad-burmistrz-drogi',
    category: 'przeglad-mediow',
    subcategory: 'tv-radio',
    type: 'media-review',
    title: 'Wywiad z burmistrzem Dorabiałą o inwestycjach drogowych',
    lede: 'Rozmowa w porannym pasmie Radia PiK o planach drogowych gminy Izbica Kujawska.',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    author: A.redakcja,
    publishedAt: '19 maja 2026, 08:45',
    publishedAtISO: '2026-05-19T08:45:00+02:00',
    views: 1218,
    externalSource: { name: 'Radio PiK', url: 'https://radiopik.pl', badgeColor: '#6a4c93' },
    tags: ['Przegląd mediów', 'Radio PiK'],
    blocks: [{ type: 'paragraph', html: 'Nagranie dostępne w archiwum Radia PiK.' }],
  }),

  art({
    slug: 'gloswloclawianina-sadlno-swietlica',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    type: 'media-review',
    title: 'Sołectwo Sadłno z dofinansowaniem na remont świetlicy',
    lede: 'Sołectwo Sadłno otrzymało środki na modernizację świetlicy wiejskiej z programu wojewódzkiego.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    author: A.redakcja,
    publishedAt: '18 maja 2026, 14:20',
    publishedAtISO: '2026-05-18T14:20:00+02:00',
    views: 342,
    commentCount: 2,
    solectwo: 'sadlno',
    externalSource: { name: 'gloswloclawianina.pl', url: 'https://gloswloclawianina.pl', badgeColor: '#0d6efd' },
    tags: ['Przegląd mediów', 'Sadłno'],
    blocks: [{ type: 'paragraph', html: 'Kwota dofinansowania: 180 tys. zł.' }],
  }),

  art({
    slug: 'portalwloclawek-podsumowanie-tygodnia-policja',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    type: 'media-review',
    title: 'Podsumowanie tygodnia: 3 zatrzymania, 12 mandatów, 0 wypadków drogowych',
    lede: 'Tygodniowe statystyki Posterunku Policji w Izbicy Kujawskiej.',
    heroImage: `${IMG}/19-policja-patrol.jpg`,
    author: A.redakcja,
    publishedAt: '17 maja 2026, 11:30',
    publishedAtISO: '2026-05-17T11:30:00+02:00',
    views: 567,
    externalSource: { name: 'portalwloclawek.pl', url: 'https://portalwloclawek.pl', badgeColor: '#198754' },
    tags: ['Przegląd mediów', 'Policja'],
    blocks: [{ type: 'paragraph', html: 'Zero wypadków drogowych w tygodniu 11–17 maja.' }],
  }),

  // ───────────────────────────────── ŻYCIE CODZIENNE
  art({
    slug: 'jak-zalatwic-dowod-osobisty-w-izbicy',
    category: 'zycie-codzienne',
    subcategory: 'poradnik',
    title: 'Jak załatwić dowód osobisty w Izbicy?',
    lede:
      'Pokój nr 8, parter Urzędu Miejskiego. Godziny przyjęć, lista dokumentów, terminy odbioru — kompletny przewodnik krok po kroku.',
    heroImage: `${IMG}/01-hero-ulica-koscielna.jpg`,
    author: A.redakcja,
    publishedAt: '18 maja 2026, 09:00',
    publishedAtISO: '2026-05-18T09:00:00+02:00',
    views: 1892,
    tags: ['Poradnik', 'Urząd', 'Dokumenty'],
    aiAssisted: true,
    blocks: [
      { type: 'heading', level: 2, text: 'Gdzie i kiedy' },
      { type: 'paragraph', html: 'Urząd Miejski, ul. Marszałka Piłsudskiego 32, <strong>pokój nr 8</strong> (parter). Poniedziałek–piątek 7:30–15:30, w środy do 17:00.' },
      { type: 'heading', level: 2, text: 'Co zabrać' },
      { type: 'list', ordered: true, items: ['Dotychczasowy dowód osobisty lub paszport', 'Aktualne zdjęcie 35×45 mm (nie starsze niż 6 miesięcy)', 'W przypadku dzieci — akt urodzenia i obecność rodzica'] },
      { type: 'info', variant: 'success', title: 'Czas oczekiwania', html: 'Do 30 dni. Status wniosku sprawdzisz na obywatel.gov.pl.' },
    ],
  }),

  art({
    slug: 'spzoz-izbica-godziny-lekarzy',
    category: 'zycie-codzienne',
    subcategory: 'zdrowie',
    title: 'SPZOZ Izbica: godziny lekarzy i poradni',
    lede:
      'Lekarz rodzinny, pediatra, kardiolog, ginekolog. Numery rejestracyjne i godziny przyjęć — maj/czerwiec 2026.',
    heroImage: `${IMG}/09-spzoz-pielegniarka.jpg`,
    author: A.redakcja,
    publishedAt: '17 maja 2026, 10:00',
    publishedAtISO: '2026-05-17T10:00:00+02:00',
    views: 1456,
    tags: ['SPZOZ', 'Zdrowie', 'Poradnik'],
    aiAssisted: true,
    blocks: [
      { type: 'table', head: ['Poradnia', 'Dni', 'Godziny'], rows: [['Lekarz rodzinny', 'pon–pt', '8:00–18:00'], ['Pediatra', 'pon, śr, pt', '8:00–13:00'], ['Kardiolog', 'środa (od czerwca)', '8:00–14:00'], ['Ginekolog', 'czwartek', '9:00–14:00']] },
      { type: 'info', variant: 'info', title: 'Rejestracja', html: 'Telefon: 54 286 51 12, od 7:30. Rejestracja online: spzoz-izbica.pl.' },
    ],
  }),

  art({
    slug: 'doplaty-arimr-2026-terminy-wnioski',
    category: 'zycie-codzienne',
    subcategory: 'rolnictwo',
    title: 'Dopłaty ARiMR 2026 — terminy i wnioski',
    lede:
      'Płatności bezpośrednie, ONW, ekoschematy. Stawki na hektar, wymagane dokumenty, gdzie złożyć wniosek.',
    heroImage: `${IMG}/07-rolnictwo-rzepak.jpg`,
    author: A.redakcja,
    publishedAt: '16 maja 2026, 08:00',
    publishedAtISO: '2026-05-16T08:00:00+02:00',
    views: 1120,
    tags: ['ARiMR', 'Rolnictwo', 'Poradnik'],
    aiAssisted: true,
    blocks: [{ type: 'paragraph', html: 'Termin składania wniosków: <strong>15 marca – 15 czerwca 2026</strong>. Po terminie — sankcje 1% za każdy dzień.' }],
  }),

  art({
    slug: 'wietrzychowice-szlak-megalitow-rodzina',
    category: 'zycie-codzienne',
    subcategory: 'turystyka',
    title: 'Wietrzychowice — szlak megalitów dla całej rodziny',
    lede:
      'Trasa piesza i rowerowa. Park Kulturowy, ścieżka dydaktyczna, miejsca piknikowe. Wstęp wolny.',
    heroImage: `${IMG}/18-szlak-megality.jpg`,
    author: A.redakcja,
    publishedAt: '15 maja 2026, 09:00',
    publishedAtISO: '2026-05-15T09:00:00+02:00',
    views: 2340,
    solectwo: 'wietrzychowice',
    tags: ['Turystyka', 'Wietrzychowice', 'Megality'],
    aiAssisted: true,
    blocks: [{ type: 'paragraph', html: 'Trasa: 4,2 km, oznakowana, dostępna dla wózków na odcinku 1,8 km. Parking bezpłatny.' }],
  }),

  art({
    slug: 'kalendarz-ogrodnika-kujawy-czerwiec',
    category: 'zycie-codzienne',
    subcategory: 'dom',
    title: 'Kalendarz ogrodnika Kujawy — czerwiec',
    lede:
      'Co siać, co podlewać, kiedy zbiór. Sezonowe porady z uwzględnieniem klimatu kujawsko-pomorskiego.',
    heroImage: `${IMG}/15-kgw-pasieka-chleb.jpg`,
    author: A.redakcja,
    publishedAt: '14 maja 2026, 09:00',
    publishedAtISO: '2026-05-14T09:00:00+02:00',
    views: 678,
    tags: ['Dom i ogród', 'Poradnik', 'Sezon'],
    aiAssisted: true,
    blocks: [{ type: 'list', items: ['Siew: fasola szparagowa, ogórki gruntowe, koper', 'Zbiór: truskawki, rzodkiewka, szpinak, młoda marchew', 'Podlewanie: wieczorem, 15–20 l/m² raz na 3 dni'] }],
  }),

  art({
    slug: 'posterunek-policji-izbica-dzielnicowi',
    category: 'zycie-codzienne',
    subcategory: 'bezpieczenstwo',
    title: 'Posterunek Policji Izbica — kontakt z dzielnicowymi',
    lede: 'Telefony dyżurne, podział rejonów, dzielnicowi imiennie. Co zgłaszać, gdzie, kiedy.',
    heroImage: `${IMG}/19-policja-patrol.jpg`,
    author: A.redakcja,
    publishedAt: '13 maja 2026, 09:00',
    publishedAtISO: '2026-05-13T09:00:00+02:00',
    views: 812,
    tags: ['Bezpieczeństwo', 'Policja', 'Poradnik'],
    aiAssisted: true,
    blocks: [{ type: 'table', head: ['Rejon', 'Dzielnicowy', 'Telefon'], rows: [['Miasto Izbica', 'asp. Piotr Nowak', '571 335 112'], ['Sołectwa północ', 'sierż. Adam Lis', '571 335 113'], ['Sołectwa południe', 'st. sierż. Ewa Kot', '571 335 114']] }],
  }),

  art({
    slug: 'pogoda-dla-rolnikow-izbica-7-dni',
    category: 'zycie-codzienne',
    subcategory: 'pogoda',
    title: 'Pogoda dla rolników — Izbica · 7 dni',
    lede:
      'Prognoza pól: opady, wiatr, ryzyko gradobicia. Komentarz pod kątem prac polowych. Aktualizacja codzienna.',
    heroImage: `${IMG}/20-pogoda-kujawy.jpg`,
    author: A.redakcja,
    publishedAt: '23 maja 2026, 06:00',
    publishedAtISO: '2026-05-23T06:00:00+02:00',
    views: 934,
    tags: ['Pogoda', 'Rolnictwo', 'Prognoza'],
    aiAssisted: true,
    blocks: [{ type: 'paragraph', html: 'Weekend: 18–22°C, przelotne opady w niedzielę. Opryski najlepiej wykonać w piątek rano.' }],
  }),

  art({
    slug: 'rekrutacja-zs-kasprowicza-2026',
    category: 'zycie-codzienne',
    subcategory: 'edukacja',
    title: 'Oferta edukacyjna Zespołu Szkół im. Kasprowicza — rekrutacja 2026/2027',
    lede: 'Kierunki, progi punktowe z ostatnich lat, terminy składania dokumentów, dni otwarte.',
    heroImage: `${IMG}/08-edukacja-szkola.jpg`,
    author: A.redakcja,
    publishedAt: '12 maja 2026, 09:00',
    publishedAtISO: '2026-05-12T09:00:00+02:00',
    views: 1245,
    tags: ['Edukacja', 'Rekrutacja', 'Poradnik'],
    aiAssisted: true,
    blocks: [{ type: 'paragraph', html: 'Rekrutacja elektroniczna: 13 maja – 20 czerwca 2026. Dzień otwarty: 30 maja, godz. 10:00.' }],
  }),

  // ───────────────────────────────── MULTIMEDIA
  art({
    slug: 'wideo-dni-izbicy-2026-zapowiedz',
    category: 'multimedia',
    subcategory: 'wideo',
    subsubcategory: 'reportaze',
    type: 'video',
    title: 'Dni Izbicy 2026 — co czeka mieszkańców 14–16 czerwca?',
    lede:
      'Pełna zapowiedź trzech dni świętowania w Izbicy. Wywiady z organizatorami, pokazy występów, plan na każdy dzień. Premierowy materiał TV Kujawy.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    author: A.redakcja,
    publishedAt: '20 maja 2026, 19:00',
    publishedAtISO: '2026-05-20T19:00:00+02:00',
    views: 4712,
    commentCount: 12,
    featured: true,
    tags: ['Wideo', 'Reportaż', 'Dni Izbicy'],
    video: { src: 'https://www.youtube.com/embed/example', poster: `${IMG}/06-dni-izbicy-koncert.jpg`, durationLabel: '4:23', provider: 'youtube' },
    blocks: [{ type: 'video', src: 'https://www.youtube.com/embed/example', poster: `${IMG}/06-dni-izbicy-koncert.jpg`, caption: 'Zapowiedź Dni Izbicy 2026', duration: '4:23' }],
  }),

  art({
    slug: 'podcast-23-burmistrz-termomodernizacja',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'rozmowy',
    type: 'audio',
    title: 'Burmistrz o termomodernizacji szkół i Dniach Izbicy',
    lede:
      'Rozmowa z Markiem Dorabiałą o najważniejszych planach gminy na 2026 rok. Inwestycje, fundusze UE, plan na drogi.',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    author: A['tomasz-kotlinski'],
    publishedAt: '22 maja 2026, 20:00',
    publishedAtISO: '2026-05-22T20:00:00+02:00',
    views: 1845,
    commentCount: 6,
    featured: true,
    tags: ['Podcast', 'Głos Izbicy', 'Burmistrz'],
    audio: { src: '/static/audio/glos-izbicy-23.mp3', durationLabel: '32:08', episode: 23, series: 'Głos Izbicy', plays: 1845 },
    blocks: [{ type: 'audio', src: '/static/audio/glos-izbicy-23.mp3', title: 'Głos Izbicy #23', duration: '32:08' }],
  }),

  art({
    slug: 'podcast-22-historia-zydowska-izbicy',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'historia',
    type: 'audio',
    title: 'Historia żydowska Izbicy — z dr Anną Kazanecką',
    lede: 'O społeczności, która przed wojną stanowiła większość mieszkańców Izbicy Kujawskiej.',
    heroImage: `${IMG}/11-portret-bibliotekarka.jpg`,
    author: A['tomasz-kotlinski'],
    publishedAt: '15 maja 2026, 20:00',
    publishedAtISO: '2026-05-15T20:00:00+02:00',
    views: 1204,
    tags: ['Podcast', 'Historia', 'Społeczność żydowska'],
    audio: { src: '/static/audio/glos-izbicy-22.mp3', durationLabel: '28:12', episode: 22, series: 'Głos Izbicy', plays: 1204 },
    blocks: [{ type: 'audio', src: '/static/audio/glos-izbicy-22.mp3', title: 'Głos Izbicy #22', duration: '28:12' }],
  }),

  art({
    slug: 'podcast-21-wietrzychowice-archeolog',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'rozmowy',
    type: 'audio',
    title: 'Wietrzychowice — rozmowa z archeologiem UMK',
    lede: 'Jak wygląda praca przy grobowcach kujawskich i co jeszcze skrywa Park Kulturowy.',
    heroImage: `${IMG}/05-wietrzychowice-megality.jpg`,
    author: A['tomasz-kotlinski'],
    publishedAt: '8 maja 2026, 20:00',
    publishedAtISO: '2026-05-08T20:00:00+02:00',
    views: 986,
    tags: ['Podcast', 'Wietrzychowice', 'Archeologia'],
    audio: { src: '/static/audio/glos-izbicy-21.mp3', durationLabel: '35:40', episode: 21, series: 'Głos Izbicy', plays: 986 },
    blocks: [{ type: 'audio', src: '/static/audio/glos-izbicy-21.mp3', title: 'Głos Izbicy #21', duration: '35:40' }],
  }),

  art({
    slug: 'podcast-20-podsumowanie-tygodnia-15-21-maja',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'tydzien',
    type: 'audio',
    title: 'Podsumowanie tygodnia · 15–21 maja 2026',
    lede: 'Najważniejsze wydarzenia tygodnia w gminie Izbica Kujawska w 13 minutach.',
    heroImage: `${IMG}/03-sesja-rady-miejskiej.jpg`,
    author: A.redakcja,
    publishedAt: '22 maja 2026, 18:00',
    publishedAtISO: '2026-05-22T18:00:00+02:00',
    views: 742,
    tags: ['Podcast', 'Podsumowanie tygodnia'],
    aiAssisted: true,
    audio: { src: '/static/audio/glos-izbicy-20.mp3', durationLabel: '12:48', episode: 20, series: 'Głos Izbicy', plays: 742 },
    blocks: [{ type: 'audio', src: '/static/audio/glos-izbicy-20.mp3', title: 'Głos Izbicy #20', duration: '12:48' }],
  }),

  art({
    slug: 'galeria-dni-izbicy-2025',
    category: 'multimedia',
    subcategory: 'galerie',
    subsubcategory: 'kultura',
    type: 'gallery',
    title: 'Galeria · Dni Izbicy 2025',
    lede: 'Najlepsze ujęcia z zeszłorocznej edycji. 124 zdjęcia w pełnej galerii.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    author: A.redakcja,
    publishedAt: '18 czerwca 2025, 12:00',
    publishedAtISO: '2025-06-18T12:00:00+02:00',
    views: 6820,
    commentCount: 22,
    featured: true,
    tags: ['Galeria', 'Dni Izbicy', 'MGCK'],
    galleryId: 'dni-izbicy-2025',
    blocks: [{ type: 'gallery', galleryId: 'dni-izbicy-2025' }],
  }),

  art({
    slug: 'infografika-budzet-gminy-2026',
    category: 'multimedia',
    subcategory: 'infografiki',
    type: 'infographic',
    title: 'Budżet gminy Izbica Kujawska 2026 w liczbach',
    lede: 'Skąd gmina bierze pieniądze i na co je wydaje — infografika z pełnym rozbiciem wydatków.',
    heroImage: `${IMG}/03-sesja-rady-miejskiej.jpg`,
    author: A.redakcja,
    publishedAt: '10 maja 2026, 12:00',
    publishedAtISO: '2026-05-10T12:00:00+02:00',
    views: 1580,
    tags: ['Infografika', 'Budżet'],
    blocks: [{ type: 'image', src: `${IMG}/03-sesja-rady-miejskiej.jpg`, alt: 'Infografika budżetu gminy 2026', caption: 'Budżet gminy 2026 — dochody i wydatki' }],
  }),

  // ───────────────────────────────── KUJAWIANKA — dodatkowe
  art({
    slug: 'kujawianka-transfer-napastnika',
    category: 'kujawianka',
    subcategory: 'aktualnosci',
    title: 'Kujawianka wzmacnia atak przed końcówką sezonu',
    lede: 'Zarząd klubu potwierdził transfer napastnika z Włocłavii II. Zawodnik zagra już w najbliższej kolejce.',
    heroImage: `${IMG}/12-portret-pilkarz.jpg`,
    author: A.redakcja,
    publishedAt: '19 maja 2026, 16:00',
    publishedAtISO: '2026-05-19T16:00:00+02:00',
    views: 1432,
    tags: ['Kujawianka', 'Transfer'],
    blocks: [{ type: 'paragraph', html: 'Nowy zawodnik podpisał kontrakt do końca sezonu 2026/27.' }],
  }),

  art({
    slug: 'kujawianka-junior-puchar-kujaw',
    category: 'kujawianka',
    subcategory: 'junior',
    title: 'Juniorzy U-15 wygrali „Puchar Kujaw” w Aleksandrowie',
    lede: 'Trampkarze Kujawianki bez straty punktu w turnieju. Awans do finału wojewódzkiego w czerwcu.',
    heroImage: `${IMG}/04-kujawianka-celebracja.jpg`,
    author: A.redakcja,
    publishedAt: '18 maja 2026, 19:00',
    publishedAtISO: '2026-05-18T19:00:00+02:00',
    views: 876,
    tags: ['Kujawianka', 'Junior', 'U-15'],
    blocks: [{ type: 'paragraph', html: 'W finale Kujawianka pokonała gospodarzy 2:0. Trener: Adam Krawczyk.' }],
  }),

  art({
    slug: 'kujawianka-historia-1949',
    category: 'kujawianka',
    subcategory: 'historia',
    title: 'Kujawianka od 1949 roku — kalendarium 77 lat klubu',
    lede: 'Od boiska przy szkole do Klasy Okręgowej. Najważniejsze momenty w historii MGKS Kujawianka Izbica Kujawska.',
    heroImage: `${IMG}/04-kujawianka-celebracja.jpg`,
    author: A['tomasz-kotlinski'],
    publishedAt: '10 maja 2026, 12:00',
    publishedAtISO: '2026-05-10T12:00:00+02:00',
    readingMinutes: 12,
    views: 2140,
    tags: ['Kujawianka', 'Historia klubu'],
    blocks: [{ type: 'list', items: ['1949 — założenie klubu', '1974 — pierwszy awans do klasy A', '1998 — 50-lecie i nowy stadion', '2019 — awans do Klasy Okręgowej', '2026 — walka o IV ligę'] }],
  }),

  // ───────────────────────────────── HISTORIA — dodatkowe
  art({
    slug: 'synagoga-w-izbicy-zapomniana-perla',
    category: 'historia',
    subcategory: 'spolecznosc-zydowska',
    title: 'Synagoga w Izbicy — zapomniana perła Kujaw',
    lede:
      'Wybudowana w latach 1880–1895, zniszczona w czasie wojny. Przed 1939 rokiem społeczność żydowska stanowiła większość mieszkańców Izbicy.',
    heroImage: `${IMG}/05-wietrzychowice-megality.jpg`,
    author: A['tomasz-kotlinski'],
    publishedAt: '12 maja 2026, 10:00',
    publishedAtISO: '2026-05-12T10:00:00+02:00',
    readingMinutes: 9,
    views: 3120,
    tags: ['Historia', 'Społeczność żydowska', 'Synagoga'],
    blocks: [{ type: 'paragraph', html: 'W 1939 roku w Izbicy mieszkało ok. <strong>3 600 Żydów</strong> — ponad połowa mieszkańców miasta.' }],
  }),

  art({
    slug: 'dwor-w-zagrodnicy-xviii-wiek',
    category: 'historia',
    subcategory: 'zabytki',
    title: 'Dwór w Zagrodnicy — perła architektury romantycznej',
    lede: 'XVIII-wieczny dwór z parkiem krajobrazowym, kaplicą kolumnową i budowlą romantyczną. Historia i stan obecny.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    author: A['tomasz-kotlinski'],
    publishedAt: '8 maja 2026, 10:00',
    publishedAtISO: '2026-05-08T10:00:00+02:00',
    readingMinutes: 7,
    views: 1420,
    solectwo: 'zagrodnica',
    tags: ['Historia', 'Zabytki', 'Zagrodnica'],
    blocks: [{ type: 'paragraph', html: 'Zespół dworsko-parkowy wpisany do rejestru zabytków w 1957 roku.' }],
  }),

  // ───────────────────────────────── OGŁOSZENIA
  art({
    slug: 'nekrolog-jan-nowak',
    category: 'ogloszenia',
    subcategory: 'nekrologi',
    type: 'announcement',
    title: 'Z głębokim żalem zawiadamiamy o śmierci Jana Nowaka',
    lede: 'Msza żałobna 26 maja o godz. 11:00 w kościele NMP w Izbicy Kujawskiej. Pogrzeb na cmentarzu parafialnym.',
    author: A.redakcja,
    publishedAt: '23 maja 2026, 09:00',
    publishedAtISO: '2026-05-23T09:00:00+02:00',
    views: 1840,
    tags: ['Nekrolog'],
    announcement: { paid: true, contact: 'rodzina', validUntil: '2026-06-23' },
    blocks: [{ type: 'paragraph', html: 'Rodzina i przyjaciele.' }],
  }),

  art({
    slug: 'praca-kierowca-kat-c-izbica',
    category: 'ogloszenia',
    subcategory: 'praca',
    type: 'announcement',
    title: 'Poszukujemy kierowcy kat. C+E — transport lokalny',
    lede: 'Firma transportowa z Izbicy Kujawskiej zatrudni kierowcę. Trasy krajowe, powroty do domu codziennie.',
    author: A.redakcja,
    publishedAt: '22 maja 2026, 11:00',
    publishedAtISO: '2026-05-22T11:00:00+02:00',
    views: 612,
    tags: ['Praca', 'Kierowca'],
    announcement: { price: '6 500 – 8 000 zł netto', contact: '502 145 678', validUntil: '2026-06-30' },
    blocks: [{ type: 'paragraph', html: 'Wymagania: prawo jazdy kat. C+E, karta kierowcy, min. rok doświadczenia.' }],
  }),

  art({
    slug: 'nieruchomosc-dzialka-budowlana-pasieka',
    category: 'ogloszenia',
    subcategory: 'nieruchomosci',
    type: 'announcement',
    title: 'Działka budowlana 1 200 m² — Pasieka, media w drodze',
    lede: 'Działka o powierzchni 1 200 m² w sołectwie Pasieka. Prąd i woda w drodze, warunki zabudowy wydane.',
    heroImage: `${IMG}/07-rolnictwo-rzepak.jpg`,
    author: A.redakcja,
    publishedAt: '21 maja 2026, 14:00',
    publishedAtISO: '2026-05-21T14:00:00+02:00',
    views: 428,
    solectwo: 'pasieka',
    tags: ['Nieruchomości', 'Działka', 'Pasieka'],
    announcement: { price: '89 000 zł', contact: '607 223 114' },
    blocks: [{ type: 'paragraph', html: 'Dojazd drogą asfaltową. 3 km od centrum Izbicy.' }],
  }),
]

// ════════════════════════════════════════════════════════════════════════════
// GALERIE
// ════════════════════════════════════════════════════════════════════════════
export const GALLERIES: Gallery[] = [
  {
    id: 'dni-izbicy-2025',
    slug: 'dni-izbicy-2025',
    title: 'Dni Izbicy 2025',
    description: 'Najlepsze ujęcia z zeszłorocznej edycji Dni Izbicy Kujawskiej.',
    cover: `${IMG}/06-dni-izbicy-koncert.jpg`,
    section: 'kultura',
    publishedAt: '18 czerwca 2025',
    eventDate: '2025-06-13',
    photos: [
      { src: `${IMG}/06-dni-izbicy-koncert.jpg`, alt: 'Koncert główny', caption: 'Koncert główny na rynku', credit: 'fot. MGCK' },
      { src: `${IMG}/04-kujawianka-celebracja.jpg`, alt: 'Turniej sołectw', caption: 'Finał turnieju sołectw' },
      { src: `${IMG}/15-kgw-pasieka-chleb.jpg`, alt: 'Stoiska KGW', caption: 'Stoiska Kół Gospodyń Wiejskich' },
      { src: `${IMG}/14-pielgrzymka-blenna.jpg`, alt: 'Msza dożynkowa', caption: 'Niedzielna msza dożynkowa' },
      { src: `${IMG}/13-tochman-bibl.jpg`, alt: 'Wystawa', caption: 'Wystawa „Dawna Izbica”' },
      { src: `${IMG}/17-swietlica-sadlno.jpg`, alt: 'Festyn rodzinny', caption: 'Festyn rodzinny' },
    ],
  },
  {
    id: 'kujawianka-sparta-2026',
    slug: 'kujawianka-sparta-2026',
    title: 'Kujawianka — Sparta Brześć 3:1',
    description: 'Zdjęcia z 25. kolejki Klasy Okręgowej.',
    cover: `${IMG}/04-kujawianka-celebracja.jpg`,
    section: 'sport',
    publishedAt: '21 maja 2026',
    eventDate: '2026-05-21',
    photos: [
      { src: `${IMG}/04-kujawianka-celebracja.jpg`, alt: 'Celebracja bramki', caption: 'Radość po trzeciej bramce' },
      { src: `${IMG}/12-portret-pilkarz.jpg`, alt: 'Adam Adamiak', caption: 'Adam Adamiak — hat-trick' },
    ],
  },
  {
    id: 'osp-interwencja-bierzyn',
    slug: 'osp-interwencja-bierzyn',
    title: 'Pożar stodoły w Bierzynie',
    description: 'Dokumentacja interwencji OSP nr 47/2026.',
    cover: `${IMG}/02-osp-pozar-stodola.jpg`,
    section: 'na-sygnale',
    publishedAt: '23 maja 2026',
    photos: [
      { src: `${IMG}/02-osp-pozar-stodola.jpg`, alt: 'Akcja gaśnicza', caption: 'Trzy jednostki OSP w akcji' },
      { src: `${IMG}/19-policja-patrol.jpg`, alt: 'Zabezpieczenie terenu', caption: 'Policja zabezpiecza teren' },
    ],
  },
]

// ════════════════════════════════════════════════════════════════════════════
// BIBLIOTEKA MEDIÓW (podstawa panelu admina)
// ════════════════════════════════════════════════════════════════════════════
export const MEDIA_LIBRARY: MediaAsset[] = [
  { id: 'm01', kind: 'image', url: `${IMG}/01-hero-ulica-koscielna.jpg`, thumb: `${IMG}/01-hero-ulica-koscielna.jpg`, title: 'Remont ul. Kościelnej', alt: 'Nowa nawierzchnia ulicy', credit: 'fot. UMiG', width: 1600, height: 1000, uploadedAt: '2026-05-22', uploadedBy: 'anna-wojcik', tags: ['inwestycje', 'drogi'] },
  { id: 'm02', kind: 'image', url: `${IMG}/02-osp-pozar-stodola.jpg`, thumb: `${IMG}/02-osp-pozar-stodola.jpg`, title: 'OSP — pożar stodoły', alt: 'Strażacy gaszą pożar', credit: 'fot. OSP Izbica', uploadedAt: '2026-05-23', uploadedBy: 'marek-kowalski', tags: ['osp', 'pożar'] },
  { id: 'm03', kind: 'image', url: `${IMG}/03-sesja-rady-miejskiej.jpg`, thumb: `${IMG}/03-sesja-rady-miejskiej.jpg`, title: 'Sesja Rady Miejskiej', alt: 'Obrady rady', uploadedAt: '2026-05-22', tags: ['samorząd'] },
  { id: 'm04', kind: 'image', url: `${IMG}/04-kujawianka-celebracja.jpg`, thumb: `${IMG}/04-kujawianka-celebracja.jpg`, title: 'Kujawianka — celebracja', alt: 'Piłkarze cieszą się', uploadedAt: '2026-05-21', tags: ['sport'] },
  { id: 'm05', kind: 'image', url: `${IMG}/05-wietrzychowice-megality.jpg`, thumb: `${IMG}/05-wietrzychowice-megality.jpg`, title: 'Megality Wietrzychowice', alt: 'Grobowce kujawskie', uploadedAt: '2026-05-21', tags: ['historia', 'turystyka'] },
  { id: 'm06', kind: 'image', url: `${IMG}/06-dni-izbicy-koncert.jpg`, thumb: `${IMG}/06-dni-izbicy-koncert.jpg`, title: 'Dni Izbicy — koncert', alt: 'Koncert na rynku', uploadedAt: '2026-05-22', tags: ['kultura'] },
  { id: 'm07', kind: 'image', url: `${IMG}/07-rolnictwo-rzepak.jpg`, thumb: `${IMG}/07-rolnictwo-rzepak.jpg`, title: 'Pole rzepaku', alt: 'Kujawskie pola', uploadedAt: '2026-05-22', tags: ['rolnictwo'] },
  { id: 'm08', kind: 'image', url: `${IMG}/08-edukacja-szkola.jpg`, thumb: `${IMG}/08-edukacja-szkola.jpg`, title: 'Szkoła Podstawowa', alt: 'Uczniowie w klasie', uploadedAt: '2026-05-22', tags: ['edukacja'] },
  { id: 'm09', kind: 'image', url: `${IMG}/09-spzoz-pielegniarka.jpg`, thumb: `${IMG}/09-spzoz-pielegniarka.jpg`, title: 'SPZOZ Izbica', alt: 'Pielęgniarka', uploadedAt: '2026-05-21', tags: ['zdrowie'] },
  { id: 'm10', kind: 'image', url: `${IMG}/10-portret-burmistrz.jpg`, thumb: `${IMG}/10-portret-burmistrz.jpg`, title: 'Portret — burmistrz', alt: 'Marek Dorabiała', uploadedAt: '2026-05-20', tags: ['ludzie', 'samorząd'] },
  { id: 'm11', kind: 'image', url: `${IMG}/11-portret-bibliotekarka.jpg`, thumb: `${IMG}/11-portret-bibliotekarka.jpg`, title: 'Portret — bibliotekarka', alt: 'Jadwiga Kowalska', uploadedAt: '2026-05-18', tags: ['ludzie'] },
  { id: 'm12', kind: 'image', url: `${IMG}/12-portret-pilkarz.jpg`, thumb: `${IMG}/12-portret-pilkarz.jpg`, title: 'Portret — piłkarz', alt: 'Adam Adamiak', uploadedAt: '2026-05-16', tags: ['ludzie', 'sport'] },
  { id: 'm13', kind: 'image', url: `${IMG}/13-tochman-bibl.jpg`, thumb: `${IMG}/13-tochman-bibl.jpg`, title: 'Spotkanie autorskie', alt: 'Biblioteka', uploadedAt: '2026-05-22', tags: ['kultura'] },
  { id: 'm14', kind: 'image', url: `${IMG}/14-pielgrzymka-blenna.jpg`, thumb: `${IMG}/14-pielgrzymka-blenna.jpg`, title: 'Pielgrzymka Błenna', alt: 'Sanktuarium', uploadedAt: '2026-05-21', tags: ['kultura', 'parafie'] },
  { id: 'm15', kind: 'image', url: `${IMG}/15-kgw-pasieka-chleb.jpg`, thumb: `${IMG}/15-kgw-pasieka-chleb.jpg`, title: 'KGW — chleb kujawski', alt: 'Warsztaty pieczenia', uploadedAt: '2026-05-20', tags: ['kultura', 'kgw'] },
  { id: 'm16', kind: 'image', url: `${IMG}/16-srodowisko-odpady.jpg`, thumb: `${IMG}/16-srodowisko-odpady.jpg`, title: 'Środowisko — odpady', alt: 'Segregacja odpadów', uploadedAt: '2026-05-20', tags: ['środowisko'] },
  { id: 'm17', kind: 'image', url: `${IMG}/17-swietlica-sadlno.jpg`, thumb: `${IMG}/17-swietlica-sadlno.jpg`, title: 'Świetlica Sadłno', alt: 'Budynek świetlicy', uploadedAt: '2026-05-18', tags: ['sołectwa'] },
  { id: 'm18', kind: 'image', url: `${IMG}/18-szlak-megality.jpg`, thumb: `${IMG}/18-szlak-megality.jpg`, title: 'Szlak megalitów', alt: 'Ścieżka dydaktyczna', uploadedAt: '2026-05-15', tags: ['turystyka'] },
  { id: 'm19', kind: 'image', url: `${IMG}/19-policja-patrol.jpg`, thumb: `${IMG}/19-policja-patrol.jpg`, title: 'Patrol policji', alt: 'Radiowóz', uploadedAt: '2026-05-23', tags: ['bezpieczeństwo'] },
  { id: 'm20', kind: 'image', url: `${IMG}/20-pogoda-kujawy.jpg`, thumb: `${IMG}/20-pogoda-kujawy.jpg`, title: 'Pogoda — Kujawy', alt: 'Niebo nad polami', uploadedAt: '2026-05-23', tags: ['pogoda'] },
  { id: 'a01', kind: 'audio', url: '/static/audio/glos-izbicy-23.mp3', title: 'Głos Izbicy #23', durationSec: 1928, mime: 'audio/mpeg', uploadedAt: '2026-05-22', tags: ['podcast'] },
  { id: 'a02', kind: 'audio', url: '/static/audio/glos-izbicy-22.mp3', title: 'Głos Izbicy #22', durationSec: 1692, mime: 'audio/mpeg', uploadedAt: '2026-05-15', tags: ['podcast'] },
  { id: 'v01', kind: 'video', url: 'https://www.youtube.com/embed/example', thumb: `${IMG}/06-dni-izbicy-koncert.jpg`, title: 'Dni Izbicy 2026 — zapowiedź', durationSec: 263, uploadedAt: '2026-05-20', tags: ['wideo'] },
  { id: 'd01', kind: 'document', url: '/static/downloads/harmonogram-odpady-2026-06.pdf', title: 'Harmonogram odpadów czerwiec 2026', mime: 'application/pdf', sizeBytes: 491520, uploadedAt: '2026-05-20', tags: ['komunikaty'] },
]

// ════════════════════════════════════════════════════════════════════════════
// QUERY API
// ════════════════════════════════════════════════════════════════════════════
const published = () => ARTICLES_V4.filter((a) => a.status === 'published')

const byDateDesc = (a: Article, b: Article) =>
  new Date(b.publishedAtISO).getTime() - new Date(a.publishedAtISO).getTime()

export function findArticleV4(slug: string): Article | undefined {
  return ARTICLES_V4.find((a) => a.slug === slug)
}

export function byCategory(catSlug: string): Article[] {
  return published().filter((a) => a.category === catSlug).sort(byDateDesc)
}

export function bySubcategory(catSlug: string, subSlug: string): Article[] {
  return published()
    .filter((a) => a.category === catSlug && a.subcategory === subSlug)
    .sort(byDateDesc)
}

export function byThirdLevel(catSlug: string, subSlug: string, childSlug: string): Article[] {
  return published()
    .filter((a) => a.category === catSlug && a.subcategory === subSlug && a.subsubcategory === childSlug)
    .sort(byDateDesc)
}

export function byType(type: Article['type']): Article[] {
  return published().filter((a) => a.type === type).sort(byDateDesc)
}

export function latest(limit = 10): Article[] {
  return published().sort(byDateDesc).slice(0, limit)
}

export function featured(limit = 5): Article[] {
  return published().filter((a) => a.featured).sort(byDateDesc).slice(0, limit)
}

export function incidents(limit = 10): Article[] {
  return published().filter((a) => a.type === 'live').sort(byDateDesc).slice(0, limit)
}

export function mostRead(limit = 6): Article[] {
  return published().sort((a, b) => b.views - a.views).slice(0, limit)
}

export function byTag(tag: string): Article[] {
  const t = tag.toLowerCase()
  return published().filter((a) => a.tags.some((x) => x.toLowerCase() === t)).sort(byDateDesc)
}

export function bySolectwo(slug: string): Article[] {
  return published().filter((a) => a.solectwo === slug).sort(byDateDesc)
}

export function relatedArticles(a: Article, limit = 3): Article[] {
  return published()
    .filter((x) => x.slug !== a.slug)
    .map((x) => {
      let score = 0
      if (x.category === a.category) score += 3
      if (x.subcategory && x.subcategory === a.subcategory) score += 2
      score += x.tags.filter((t) => a.tags.includes(t)).length
      return { x, score }
    })
    .filter((r) => r.score > 0)
    .sort((p, q) => q.score - p.score || byDateDesc(p.x, q.x))
    .slice(0, limit)
    .map((r) => r.x)
}

export function searchV4(q: string): Article[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return []
  return published()
    .filter((a) =>
      [a.title, a.lede, a.tags.join(' '), a.category, a.subcategory ?? ''].join(' ').toLowerCase().includes(needle)
    )
    .sort(byDateDesc)
}

export function findGallery(id: string): Gallery | undefined {
  return GALLERIES.find((g) => g.id === id || g.slug === id)
}

/** Ticker "Na sygnale" — pasek breaking na górze strony */
export function tickerItems(): Array<{ time: string; text: string; url: string }> {
  return incidents(6).map((a) => ({
    time: a.incident?.time ?? '—',
    text: a.title,
    url: `/${a.category}/${a.subcategory}/${a.slug}`,
  }))
}
