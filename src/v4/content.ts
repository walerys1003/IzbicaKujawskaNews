// ============================================================================
// IZBICA24.PL v4 — BAZA TREŚCI DEMO
// Treści 1:1 z szaty graficznej (index.html). Każdy materiał ma pełny obiekt
// Article, dzięki czemu strona główna, kategorie i strony artykułów renderują
// się z jednego źródła prawdy.
// ============================================================================

import type { Article, Author, ContentBlock } from './content-types'

const IMG = '/static/img/v4'

// ─────────────────────────────────────────────────────────────────────────────
// AUTORZY / REDAKCJA
// ─────────────────────────────────────────────────────────────────────────────

export const AUTHORS: Record<string, Author> = {
  'anna-wojcik': {
    slug: 'anna-wojcik',
    name: 'Anna Wójcik',
    role: 'Reporterka · samorząd, inwestycje',
    bio: 'Od 2019 roku pisze o samorządzie gminy Izbica Kujawska. Specjalizuje się w budżecie i inwestycjach drogowych.',
    email: 'a.wojcik@izbica24.pl',
  },
  'marek-kowalski': {
    slug: 'marek-kowalski',
    name: 'Marek Kowalski',
    role: 'Reporter · na sygnale, bezpieczeństwo',
    bio: 'Współpracuje z OSP i Posterunkiem Policji w Izbicy. Relacje z akcji ratowniczych i kronika policyjna.',
    email: 'm.kowalski@izbica24.pl',
  },
  'tomasz-kotlinski': {
    slug: 'tomasz-kotlinski',
    name: 'Tomasz Kotliński',
    role: 'Redaktor naczelny',
    bio: 'Założyciel portalu Izbica24.pl. Publicystyka, wywiady, historia regionu.',
    email: 'redakcja@izbica24.pl',
  },
  'katarzyna-lis': {
    slug: 'katarzyna-lis',
    name: 'Katarzyna Lis',
    role: 'Reporterka · kultura, ludzie',
    bio: 'Pisze o MGCK, bibliotece, parafiach i kołach gospodyń wiejskich.',
    email: 'k.lis@izbica24.pl',
  },
  redakcja: {
    slug: 'redakcja',
    name: 'redakcja',
    role: 'Zespół Izbica24.pl',
    email: 'redakcja@izbica24.pl',
  },
}

const A = AUTHORS

// ─────────────────────────────────────────────────────────────────────────────
// POMOCNIK
// ─────────────────────────────────────────────────────────────────────────────

export type Draft = Omit<Article, 'status' | 'commentCount' | 'tags' | 'readingMinutes'> &
  Partial<Pick<Article, 'status' | 'commentCount' | 'tags' | 'readingMinutes'>>

export function mk(d: Draft): Article {
  const words = d.blocks.reduce((n, b) => {
    if (b.type === 'paragraph') return n + b.html.split(/\s+/).length
    if (b.type === 'list') return n + b.items.join(' ').split(/\s+/).length
    if (b.type === 'quote') return n + b.text.split(/\s+/).length
    return n + 12
  }, d.lede.split(/\s+/).length)
  return {
    status: 'published',
    commentCount: 0,
    tags: [],
    readingMinutes: Math.max(1, Math.round(words / 190)),
    ...d,
  }
}

const p = (html: string): ContentBlock => ({ type: 'paragraph', html })
const h2 = (text: string): ContentBlock => ({ type: 'heading', level: 2, text })
const h3 = (text: string): ContentBlock => ({ type: 'heading', level: 3, text })
const ul = (items: string[]): ContentBlock => ({ type: 'list', items })
const quote = (text: string, author?: string, role?: string): ContentBlock => ({
  type: 'quote', text, author, role,
})
const img = (src: string, alt: string, caption?: string, credit?: string): ContentBlock => ({
  type: 'image', src, alt, caption, credit,
})
const info = (
  variant: 'info' | 'warning' | 'success',
  title: string,
  html: string
): ContentBlock => ({ type: 'info', variant, title, html })

// ─────────────────────────────────────────────────────────────────────────────
// ARTYKUŁY
// ─────────────────────────────────────────────────────────────────────────────

export const ARTICLES_CORE: Article[] = [
  // ══ HERO GŁÓWNY ═══════════════════════════════════════════════════════════
  mk({
    id: 'a-001',
    slug: 'remont-ulicy-koscielnej-zakonczony',
    type: 'article',
    category: 'wiadomosci',
    subcategory: 'inwestycje',
    title:
      'Remont ulicy Kościelnej zakończony przed terminem. „To dopiero początek” — burmistrz Dorabiała.',
    shortTitle: 'Remont ul. Kościelnej zakończony przed terminem',
    lede:
      'W środę burmistrz Marek Dorabiała oficjalnie otworzył wyremontowany odcinek ul. Kościelnej. Inwestycja warta 2,4 mln zł objęła nową nawierzchnię, chodniki, kanalizację burzową i oświetlenie LED. W planach kolejne ulice w centrum Izbicy.',
    heroImage: `${IMG}/01-hero-ulica-koscielna.jpg`,
    heroAlt: 'Remont ulicy Kościelnej',
    heroCaption:
      'Nowa nawierzchnia i chodniki na ul. Kościelnej. Odcinek oddano do użytku trzy tygodnie przed terminem.',
    heroCredit: 'fot. Izbica24.pl',
    author: A['anna-wojcik'],
    publishedAt: '22 maja, 17:42',
    publishedAtISO: '2026-05-22T17:42:00+02:00',
    views: 2341,
    commentCount: 12,
    featured: true,
    tags: ['inwestycje', 'drogi', 'ul. Kościelna', 'budżet gminy'],
    blocks: [
      p(
        'Uroczyste otwarcie wyremontowanego odcinka ul. Kościelnej odbyło się w środę o godz. 16:00. W wydarzeniu wzięli udział burmistrz <strong>Marek Dorabiała</strong>, radni Rady Miejskiej, przedstawiciele wykonawcy oraz mieszkańcy ulicy.'
      ),
      p(
        'Zakres prac objął <strong>640 metrów</strong> jezdni, obustronne chodniki z kostki betonowej, przebudowę kanalizacji burzowej oraz wymianę oświetlenia na energooszczędne lampy LED. Całkowity koszt inwestycji to <strong>2,4 mln zł</strong>, z czego 1,1 mln zł pochodzi z Rządowego Funduszu Rozwoju Dróg.'
      ),
      quote(
        'To dopiero początek. W przygotowaniu mamy dokumentację dla ul. Augustowskiej i ul. Kolejowej. Chcemy, żeby centrum Izbicy w ciągu trzech lat wyglądało zupełnie inaczej.',
        'Marek Dorabiała',
        'burmistrz gminy Izbica Kujawska'
      ),
      h2('Trzy tygodnie przed terminem'),
      p(
        'Umowa z wykonawcą przewidywała zakończenie prac do 15 czerwca. Sprzyjająca pogoda w kwietniu i maju pozwoliła skrócić harmonogram o blisko trzy tygodnie. Wykonawca — firma drogowa z Włocławka — nie zgłaszał roszczeń o zwiększenie wynagrodzenia.'
      ),
      img(
        `${IMG}/01-hero-ulica-koscielna.jpg`,
        'Nowa nawierzchnia ul. Kościelnej',
        'Nowe oświetlenie LED zamontowano na 18 słupach.',
        'fot. Izbica24.pl'
      ),
      h2('Co dalej z centrum Izbicy?'),
      p('Zgodnie z uchwałą budżetową na 2026 rok w kolejce czekają:'),
      ul([
        'ul. Augustowska — przebudowa nawierzchni i budowa ścieżki pieszo-rowerowej (planowany start: III kwartał 2026)',
        'ul. Kolejowa — wymiana magistrali wodociągowej wraz z odtworzeniem nawierzchni',
        'Plac Wolności — koncepcja rewitalizacji rynku, konsultacje społeczne w czerwcu',
      ]),
      info(
        'info',
        'Utrudnienia zakończone',
        'Objazd przez ul. Narutowicza został zniesiony. Autobusy szkolne wracają na standardową trasę od poniedziałku 25 maja.'
      ),
    ],
  }),

  // ══ HERO SIDE ═════════════════════════════════════════════════════════════
  mk({
    id: 'a-002',
    slug: 'sesja-rady-miejskiej-budzet-remontowy',
    type: 'article',
    category: 'samorzad',
    subcategory: 'rada',
    title: 'Sesja Rady Miejskiej: budżet remontowy 4,8 mln zł',
    lede:
      'Rekordowy budżet inwestycyjny na 2026. Drogi, kanalizacja, termomodernizacja szkół.',
    heroImage: `${IMG}/03-sesja-rady-miejskiej.jpg`,
    heroAlt: 'Sesja Rady Miejskiej',
    author: A['anna-wojcik'],
    publishedAt: '22.05, 18:30',
    publishedAtISO: '2026-05-22T18:30:00+02:00',
    views: 1876,
    commentCount: 7,
    featured: true,
    tags: ['rada miejska', 'budżet', 'inwestycje'],
    blocks: [
      p(
        'Podczas sesji 22 maja Rada Miejska w Izbicy Kujawskiej przyjęła zmiany w budżecie gminy na 2026 rok. Wydatki inwestycyjne wzrosły do <strong>4,8 mln zł</strong> — to o 18% więcej niż w roku 2025 i najwyższa kwota w historii gminy.'
      ),
      h2('Na co pójdą pieniądze'),
      {
        type: 'table',
        head: ['Zadanie', 'Kwota', 'Termin'],
        rows: [
          ['Drogi gminne (4 odcinki)', '2,1 mln zł', 'IV kw. 2026'],
          ['Kanalizacja sanitarna Sadłno', '1,3 mln zł', 'III kw. 2026'],
          ['Termomodernizacja SP nr 2', '1,2 mln zł', 'wakacje 2026'],
          ['Świetlice wiejskie (3 sołectwa)', '0,2 mln zł', 'do listopada'],
        ],
      },
      quote(
        'To największy budżet remontowy w historii gminy. Czeka nas pracowite półrocze.',
        'Marek Dorabiała',
        'burmistrz'
      ),
      p(
        'Uchwałę przyjęto 13 głosami za, przy 2 wstrzymujących się. Radni opozycyjni zgłaszali uwagi do kolejności realizacji zadań drogowych.'
      ),
    ],
  }),

  mk({
    id: 'a-003',
    slug: 'kujawianka-sparta-brzesc-3-1',
    type: 'article',
    category: 'kujawianka',
    subcategory: 'mecze',
    title: 'Kujawianka pokonała Spartę Brześć 3:1',
    lede: 'Hat-trick Adama Adamiaka. Klub awansuje w tabeli ligowej.',
    heroImage: `${IMG}/04-kujawianka-celebracja.jpg`,
    heroAlt: 'Kujawianka celebruje zwycięstwo',
    author: A['redakcja'],
    publishedAt: '21.05, 18:00',
    publishedAtISO: '2026-05-21T18:00:00+02:00',
    views: 3120,
    commentCount: 24,
    featured: true,
    tags: ['Kujawianka', 'klasa okręgowa', 'Adam Adamiak'],
    blocks: [
      p(
        'W 25. kolejce klasy okręgowej Kujawianka Izbica pokonała na własnym stadionie Spartę Brześć <strong>3:1</strong>. Wszystkie bramki dla gospodarzy zdobył <strong>Adam Adamiak</strong>, który ma już 14 goli w sezonie.'
      ),
      h3('Przebieg spotkania'),
      ul([
        "23' — Adamiak 1:0 (dośrodkowanie Wójcickiego)",
        "51' — Adamiak 2:0 (rzut karny)",
        "68' — Sparta Brześć 2:1",
        "84' — Adamiak 3:1 (kontratak, asysta Nowaka)",
      ]),
      quote(
        'Forma wzrasta — wierzymy w awans do IV ligi.',
        'Mariusz Kaczor',
        'trener Kujawianki'
      ),
      p(
        'Po tym zwycięstwie Kujawianka zajmuje <strong>3. miejsce</strong> w tabeli z 54 punktami. Do drugiej Sparty Brześć traci 3 punkty, do prowadzącej Pogoni Łabiszyn — 8.'
      ),
    ],
  }),

  mk({
    id: 'a-004',
    slug: 'wietrzychowice-nowe-odkrycia-archeologiczne',
    type: 'article',
    category: 'historia',
    subcategory: 'wietrzychowice',
    title: 'Wietrzychowice: nowe odkrycia archeologiczne sprzed 5500 lat',
    lede:
      'Naukowcy z UMK odsłonili nowy grobowiec kujawski. Sensacyjne znalezisko.',
    heroImage: `${IMG}/05-wietrzychowice-megality.jpg`,
    heroAlt: 'Megality w Wietrzychowicach',
    author: A['tomasz-kotlinski'],
    publishedAt: '21.05, 11:00',
    publishedAtISO: '2026-05-21T11:00:00+02:00',
    views: 5412,
    commentCount: 31,
    featured: true,
    tags: ['Wietrzychowice', 'archeologia', 'megality', 'UMK'],
    blocks: [
      p(
        'Zespół archeologów z Uniwersytetu Mikołaja Kopernika w Toruniu oraz Muzeum Archeologicznego w Poznaniu odkrył w Parku Kulturowym Wietrzychowice <strong>nowy grobowiec kujawski</strong> — siódmy na terenie parku.'
      ),
      p(
        'Grobowiec datowany jest na około <strong>3500 lat p.n.e.</strong> i przypisywany kulturze pucharów lejkowatych. Konstrukcja o długości blisko 90 metrów była do tej pory ukryta pod warstwą piasku i współczesnych nasadzeń.'
      ),
      img(
        `${IMG}/18-szlak-megality.jpg`,
        'Szlak megalitów',
        'Ścieżka dydaktyczna prowadzi obecnie do sześciu grobowców. Siódmy zostanie udostępniony po zakończeniu badań.',
        'fot. Izbica24.pl'
      ),
      h2('Dlaczego to sensacja'),
      p(
        'Grobowce kujawskie nazywane są „polskimi piramidami”. Wietrzychowice to jedno z najważniejszych stanowisk megalitycznych w Europie Środkowej. Nowe znalezisko może zmienić dotychczasowe ustalenia dotyczące zasięgu osadnictwa neolitycznego na Kujawach.'
      ),
      quote(
        'Nie spodziewaliśmy się kolejnej konstrukcji w tym miejscu. Badania geofizyczne wskazały anomalię, a wykop potwierdził obecność obstawy kamiennej.',
        'dr hab. Piotr Bogucki',
        'UMK Toruń, kierownik badań'
      ),
      info(
        'info',
        'Park otwarty dla zwiedzających',
        'Prace archeologiczne nie zakłócają zwiedzania. Wstęp do Parku Kulturowego Wietrzychowice pozostaje bezpłatny.'
      ),
    ],
  }),

  mk({
    id: 'a-005',
    slug: 'dni-izbicy-2026-program',
    type: 'event',
    category: 'kultura',
    subcategory: 'mgck',
    title: 'Dni Izbicy 2026: 14–16 czerwca. Pełny program',
    lede:
      'Stachursky, dożynki, festyn rodzinny. Trzy dni świętowania w sercu Kujaw.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    heroAlt: 'Koncert podczas Dni Izbicy',
    author: A['katarzyna-lis'],
    publishedAt: '22.05, 14:15',
    publishedAtISO: '2026-05-22T14:15:00+02:00',
    views: 4102,
    commentCount: 18,
    featured: true,
    tags: ['Dni Izbicy', 'MGCK', 'wydarzenia'],
    event: {
      startsAt: '2026-06-14T15:00:00+02:00',
      endsAt: '2026-06-16T22:00:00+02:00',
      place: 'Plac Wolności i Stadion Miejski, Izbica Kujawska',
      organizer: 'MGCK Izbica Kujawska',
      free: true,
    },
    blocks: [
      p(
        'Miejsko-Gminne Centrum Kultury opublikowało pełny program <strong>Dni Izbicy 2026</strong>. Święto gminy odbędzie się w dniach <strong>14–16 czerwca</strong>. Wstęp na wszystkie wydarzenia jest bezpłatny.'
      ),
      h2('Piątek, 14 czerwca'),
      ul([
        '15:00 — otwarcie strefy rodzinnej, dmuchańce i animacje (Plac Wolności)',
        '17:00 — wystawa „Dawna Izbica” — fotografie ze zbiorów mieszkańców',
        '19:00 — koncert zespołów młodzieżowych MGCK',
      ]),
      h2('Sobota, 15 czerwca'),
      ul([
        '10:00 — Turniej Sołectw o Puchar Burmistrza (Stadion Miejski)',
        '14:00 — warsztaty dla dzieci: ceramika, wikliniarstwo, pieczenie chleba',
        '18:00 — występ Kapeli Kujawskiej',
        '20:30 — koncert gwiazdy wieczoru: Jacek Stachursky',
        '22:30 — pokaz sztucznych ogni',
      ]),
      h2('Niedziela, 16 czerwca'),
      ul([
        '11:00 — msza dożynkowa w kościele parafialnym',
        '13:00 — korowód dożynkowy, prezentacja wieńców 34 sołectw',
        '15:00 — dożynki gminno-parafialne, konkurs na najlepszy wieniec',
        '18:00 — biesiada kujawska, zakończenie',
      ]),
      info(
        'success',
        'Bezpłatny transport',
        'MGCK organizuje bezpłatne autobusy z sołectw: Sadłno, Wietrzychowice, Błenna, Pasieka. Rozkład dostępny w świetlicach wiejskich.'
      ),
    ],
  }),

  // ══ NA SYGNALE — DUŻE ═════════════════════════════════════════════════════
  mk({
    id: 'a-010',
    slug: 'pozar-stodoly-bierzyn-osp',
    type: 'live',
    category: 'na-sygnale',
    subcategory: 'pozary',
    title: 'OSP Izbica, Pasieka i Wietrzychowice w akcji ratowniczej',
    lede:
      'Stodoła w Bierzynie stanęła w płomieniach po godz. 14:30. Trzy jednostki OSP gasiły ogień przez blisko 2 godziny. Sytuacja opanowana, nikt nie ucierpiał. Interwencja nr 47/2026.',
    heroImage: `${IMG}/02-osp-pozar-stodola.jpg`,
    heroAlt: 'OSP Izbica gaszą pożar',
    author: A['marek-kowalski'],
    publishedAt: '23 maja, 14:32',
    publishedAtISO: '2026-05-23T14:32:00+02:00',
    views: 6840,
    commentCount: 22,
    breaking: true,
    featured: true,
    solectwo: 'bierzyn',
    tags: ['OSP', 'pożar', 'Bierzyn'],
    incident: {
      time: '14:32',
      dayLabel: 'dziś',
      kind: 'Pożar stodoły · Bierzyn',
      icon: '🔥',
      place: 'Bierzyn',
      source: 'OSP Izbica Kujawska · FB · KMP Włocławek',
      resolved: true,
    },
    blocks: [
      p(
        'Zgłoszenie o pożarze stodoły w sołectwie <strong>Bierzyn</strong> wpłynęło do dyżurnego o godz. 14:28. Na miejsce zadysponowano trzy jednostki Ochotniczej Straży Pożarnej: OSP Izbica Kujawska, OSP Pasieka i OSP Wietrzychowice.'
      ),
      p(
        'Palił się drewniany budynek gospodarczy o powierzchni ok. 180 m², w którym składowane były bele siana. Ze względu na bliskość budynku mieszkalnego działania skupiono najpierw na zabezpieczeniu sąsiednich zabudowań.'
      ),
      h3('Przebieg działań'),
      ul([
        '14:28 — zgłoszenie do dyżurnego PSP Włocławek',
        '14:36 — pierwszy zastęp OSP Izbica na miejscu',
        '14:44 — dwie kolejne jednostki, podanie trzech prądów wody',
        '15:50 — pożar opanowany',
        '16:25 — dogaszanie i przeszukiwanie pogorzeliska',
      ]),
      p(
        '<strong>Nikt nie ucierpiał.</strong> Ogień nie rozprzestrzenił się na sąsiednie zabudowania. Straty wstępnie oszacowano na ok. 60 tys. zł. Przyczyny pożaru ustala policja — nie wyklucza się samozapłonu wilgotnego siana.'
      ),
      info(
        'warning',
        'Apel OSP',
        'Strażacy przypominają o zagrożeniu samozapłonem świeżo zebranego siana. Bele należy składować w przewiewnym miejscu i kontrolować ich temperaturę w pierwszych tygodniach.'
      ),
    ],
  }),

  mk({
    id: 'a-011',
    slug: 'zatrzymanie-nietrzezwego-kierowcy-augustowska',
    type: 'live',
    category: 'na-sygnale',
    subcategory: 'policja',
    title: 'Zatrzymanie nietrzeźwego kierowcy na ul. Augustowskiej',
    lede:
      '41-latek z gminy Choceń. 1,8 promila alkoholu w wydychanym powietrzu. Stracił prawo jazdy, sprawa skierowana do prokuratury.',
    heroImage: `${IMG}/19-policja-patrol.jpg`,
    heroAlt: 'Policja Izbica',
    author: A['marek-kowalski'],
    publishedAt: '23 maja, 08:15',
    publishedAtISO: '2026-05-23T08:15:00+02:00',
    views: 2140,
    commentCount: 9,
    tags: ['policja', 'kronika policyjna', 'nietrzeźwy kierowca'],
    incident: {
      time: '08:15',
      dayLabel: 'dziś',
      kind: 'Kronika policyjna',
      icon: '🚓',
      place: 'ul. Augustowska, Izbica Kujawska',
      source: 'Posterunek Policji Izbica',
    },
    blocks: [
      p(
        'Patrol Posterunku Policji w Izbicy Kujawskiej zatrzymał w nocy z czwartku na piątek kierowcę osobowego opla, który jechał ul. Augustowską w sposób wskazujący na nietrzeźwość.'
      ),
      p(
        'Badanie alkomatem wykazało <strong>1,8 promila</strong> alkoholu w wydychanym powietrzu. 41-letni mieszkaniec gminy Choceń stracił prawo jazdy na miejscu. Samochód odholowano na parking depozytowy.'
      ),
      p(
        'Sprawa została skierowana do Prokuratury Rejonowej we Włocławku. Za jazdę w stanie nietrzeźwości grozi do 3 lat pozbawienia wolności, wysoka grzywna oraz zakaz prowadzenia pojazdów.'
      ),
    ],
  }),

  mk({
    id: 'a-012',
    slug: 'zaginiona-84-latka-sarnowo-odnaleziona',
    type: 'live',
    category: 'na-sygnale',
    subcategory: 'interwencje',
    title: 'Zaginiona 84-latka odnaleziona w ciągu 35 minut',
    lede:
      'Mieszkanka Sarnowa wyszła z domu po południu. Wieczorem rodzina zgłosiła zaginięcie. OSP Izbica we współpracy z policją odnalazła kobietę. Bezpieczna w domu.',
    heroImage: `${IMG}/20-pogoda-kujawy.jpg`,
    heroAlt: 'Akcja poszukiwawcza',
    author: A['marek-kowalski'],
    publishedAt: '22 maja, 22:40',
    publishedAtISO: '2026-05-22T22:40:00+02:00',
    views: 3980,
    commentCount: 41,
    solectwo: 'sarnowo',
    tags: ['OSP', 'poszukiwania', 'Sarnowo'],
    incident: {
      time: '22:40',
      dayLabel: 'wczoraj',
      kind: 'Akcja poszukiwawcza · Sarnowo',
      icon: '🏥',
      place: 'Sarnowo',
      source: 'OSP Izbica · KMP Włocławek',
      resolved: true,
    },
    blocks: [
      p(
        'O godz. 22:05 rodzina zgłosiła zaginięcie 84-letniej mieszkanki <strong>Sarnowa</strong>. Kobieta wyszła z domu po południu i nie wróciła. Cierpi na zaburzenia pamięci.'
      ),
      p(
        'Do akcji poszukiwawczej zadysponowano OSP Izbica Kujawska oraz patrol Posterunku Policji. Wykorzystano <strong>drona z kamerą termowizyjną</strong>. Kobietę odnaleziono po 35 minutach w zagajniku ok. 800 metrów od domu.'
      ),
      quote(
        'Termowizja zadecydowała. Bez drona szukalibyśmy do rana.',
        'Naczelnik OSP Izbica Kujawska'
      ),
      p(
        'Seniorka była wychłodzona, ale bez obrażeń. Po badaniu przez ratowników wróciła do domu pod opiekę rodziny.'
      ),
    ],
  }),

  // ══ NA SYGNALE — MAŁE ═════════════════════════════════════════════════════
  mk({
    id: 'a-013',
    slug: 'wypadek-dk62-pasieka',
    type: 'live',
    category: 'na-sygnale',
    subcategory: 'wypadki',
    title: 'Wypadek w okolicy Pasieki',
    lede:
      'Dwa samochody osobowe. Kierowcy bez poważnych obrażeń. Utrudnienia ok. 90 minut.',
    heroImage: `${IMG}/01-hero-ulica-koscielna.jpg`,
    heroAlt: 'Wypadek DK62',
    author: A['marek-kowalski'],
    publishedAt: '23 maja, 11:45',
    publishedAtISO: '2026-05-23T11:45:00+02:00',
    views: 1620,
    commentCount: 4,
    solectwo: 'pasieka',
    tags: ['DK 62', 'kolizja', 'Pasieka'],
    incident: {
      time: '11:45',
      dayLabel: 'dziś',
      kind: 'Kolizja · DK 62',
      icon: '🚗',
      place: 'DK 62, okolice Pasieki',
      source: 'KMP Włocławek',
    },
    blocks: [
      p(
        'Na drodze krajowej nr 62 w okolicy Pasieki zderzyły się dwa samochody osobowe. Do zdarzenia doszło przed godz. 11:45.'
      ),
      p(
        'Kierowcy nie odnieśli poważnych obrażeń — zostali zbadani przez ratowników na miejscu. Ruch odbywał się wahadłowo przez ok. 90 minut. Policja ustala okoliczności; wstępnie przyczyną było niezachowanie bezpiecznej odległości.'
      ),
    ],
  }),

  mk({
    id: 'a-014',
    slug: 'wylaczenie-wody-ul-kolejowa',
    type: 'live',
    category: 'na-sygnale',
    subcategory: 'awarie',
    title: 'Wyłączenie wody · ul. Kolejowa',
    lede:
      'Awaria magistrali. Wody nie będzie do godz. 16:00. ZGKiW pracuje na miejscu.',
    heroImage: `${IMG}/16-srodowisko-odpady.jpg`,
    heroAlt: 'Awaria wody',
    author: A['redakcja'],
    publishedAt: '23 maja, 13:08',
    publishedAtISO: '2026-05-23T13:08:00+02:00',
    views: 2870,
    commentCount: 6,
    tags: ['ZGKiW', 'awaria', 'woda'],
    incident: {
      time: '13:08',
      dayLabel: 'dziś',
      kind: 'Awaria sieci wodnej',
      icon: '💧',
      place: 'ul. Kolejowa, Izbica Kujawska',
      source: 'ZGKiW Izbica',
    },
    blocks: [
      p(
        'Zakład Gospodarki Komunalnej i Wodociągowej informuje o awarii magistrali wodociągowej przy ul. Kolejowej. Dostawa wody została wstrzymana od godz. 13:00.'
      ),
      p('Planowane przywrócenie dostaw: <strong>godz. 16:00</strong>. Po wznowieniu może wystąpić chwilowe zmętnienie wody — należy odkręcić kran i spuścić wodę do uzyskania przejrzystości.'),
      info('warning', 'Punkt poboru wody', 'Beczkowóz ZGKiW stoi przy skrzyżowaniu ul. Kolejowej i ul. Narutowicza.'),
    ],
  }),

  mk({
    id: 'a-015',
    slug: 'sadlno-modzerowo-planowane-wylaczenie-pradu',
    type: 'live',
    category: 'na-sygnale',
    subcategory: 'awarie',
    title: 'Sadłno, Modzerowo — planowane wyłączenie',
    lede:
      'PGE: prace konserwacyjne w godz. 9–14. Część gospodarstw bez prądu.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    heroAlt: 'Awaria prądu',
    author: A['redakcja'],
    publishedAt: '23 maja, 09:20',
    publishedAtISO: '2026-05-23T09:20:00+02:00',
    views: 1340,
    commentCount: 2,
    solectwo: 'sadlno',
    tags: ['PGE', 'prąd', 'Sadłno', 'Modzerowo'],
    incident: {
      time: '09:20',
      dayLabel: 'dziś',
      kind: 'Awaria prądu',
      icon: '⚡',
      place: 'Sadłno, Modzerowo',
      source: 'PGE Dystrybucja',
    },
    blocks: [
      p(
        'PGE Dystrybucja informuje o planowanym wyłączeniu energii elektrycznej w sołectwach <strong>Sadłno</strong> i <strong>Modzerowo</strong> w godzinach 9:00–14:00.'
      ),
      p('Przyczyną są prace konserwacyjne na linii średniego napięcia. Wyłączenie obejmuje ok. 40 gospodarstw.'),
    ],
  }),

  mk({
    id: 'a-016',
    slug: 'pasieka-zaslabniecie-warsztaty',
    type: 'live',
    category: 'na-sygnale',
    subcategory: 'interwencje',
    title: 'Pasieka — zasłabnięcie podczas warsztatów',
    lede: '71-latka zasłabła w świetlicy. Karetka przewiozła do SPZOZ. Stan dobry.',
    heroImage: `${IMG}/15-kgw-pasieka-chleb.jpg`,
    heroAlt: 'Interwencja medyczna',
    author: A['marek-kowalski'],
    publishedAt: '22 maja, 19:25',
    publishedAtISO: '2026-05-22T19:25:00+02:00',
    views: 980,
    commentCount: 3,
    solectwo: 'pasieka',
    tags: ['SPZOZ', 'interwencja medyczna', 'Pasieka'],
    incident: {
      time: '19:25',
      dayLabel: 'wczoraj',
      kind: 'Interwencja medyczna',
      icon: '🏥',
      place: 'Świetlica wiejska w Pasiece',
      source: 'SPZOZ Izbica',
    },
    blocks: [
      p(
        '71-letnia mieszkanka Pasieki zasłabła podczas warsztatów kulinarnych w świetlicy wiejskiej. Uczestniczki natychmiast wezwały pogotowie.'
      ),
      p('Zespół ratownictwa medycznego przewiózł kobietę do SPZOZ w Izbicy Kujawskiej. Jej stan określono jako dobry — przyczyną było prawdopodobnie przegrzanie.'),
    ],
  }),
]

// ─────────────────────────────────────────────────────────────────────────────
// TICKER „Na sygnale" — pasek breaking
// ─────────────────────────────────────────────────────────────────────────────

export interface TickerItem {
  time: string
  text: string
  url?: string
}

export const TICKER: TickerItem[] = [
  { time: '14:32', text: 'OSP Izbica interweniowała przy pożarze stodoły w Bierzynie', url: '/na-sygnale/pozary/pozar-stodoly-bierzyn-osp' },
  { time: '13:08', text: 'Wyłączenie wody na ul. Kolejowej do godz. 16:00 — ZGKiW', url: '/na-sygnale/awarie/wylaczenie-wody-ul-kolejowa' },
  { time: '11:45', text: 'Wypadek na DK 62 w okolicy Pasieki — utrudnienia', url: '/na-sygnale/wypadki/wypadek-dk62-pasieka' },
  { time: '09:20', text: 'Burmistrz Dorabiała otworzył nowy odcinek ul. Kościelnej', url: '/wiadomosci/inwestycje/remont-ulicy-koscielnej-zakonczony' },
  { time: '08:15', text: 'Posterunek Policji: zatrzymanie nietrzeźwego kierowcy w nocy', url: '/na-sygnale/policja/zatrzymanie-nietrzezwego-kierowcy-augustowska' },
]

