// ============================================================================
// IZBICA24.PL v4 — BAZA TREŚCI DEMO, część 2
// Wiadomości, kultura, ludzie, przegląd mediów, życie codzienne, multimedia.
// ============================================================================

import type { Article, Gallery, MediaAsset } from './content-types'
import { AUTHORS as A, mk } from './content'

const IMG = '/static/img/v4'

const p = (html: string) => ({ type: 'paragraph' as const, html })
const h2 = (text: string) => ({ type: 'heading' as const, level: 2 as const, text })
const h3 = (text: string) => ({ type: 'heading' as const, level: 3 as const, text })
const ul = (items: string[]) => ({ type: 'list' as const, items })
const quote = (text: string, author?: string, role?: string) => ({
  type: 'quote' as const, text, author, role,
})
const img = (src: string, alt: string, caption?: string, credit?: string) => ({
  type: 'image' as const, src, alt, caption, credit,
})
const info = (variant: 'info' | 'warning' | 'success', title: string, html: string) => ({
  type: 'info' as const, variant, title, html,
})
const file = (url: string, label: string, sizeLabel?: string) => ({
  type: 'file' as const, url, label, sizeLabel, mime: 'application/pdf',
})

export const ARTICLES_MORE: Article[] = [
  // ══ WIADOMOŚCI — KARTY SEKCJI ═════════════════════════════════════════════
  mk({
    id: 'a-020',
    slug: 'arimr-doplaty-bezposrednie-2026',
    type: 'article',
    category: 'wiadomosci',
    subcategory: 'rolnictwo',
    title: 'ARiMR: dopłaty bezpośrednie 2026 — nabór do 15 czerwca. Stawki wyższe o 6,2%.',
    lede:
      'Agencja otworzyła nabór wniosków na płatności bezpośrednie. Stawki podwyższone w stosunku do roku 2025. Wnioski można składać elektronicznie lub osobiście w biurze powiatowym.',
    heroImage: `${IMG}/07-rolnictwo-rzepak.jpg`,
    heroAlt: 'Pole rzepaku pod Izbicą',
    author: A['redakcja'],
    publishedAt: '22.05, 10:15',
    publishedAtISO: '2026-05-22T10:15:00+02:00',
    views: 876,
    commentCount: 5,
    tags: ['ARiMR', 'dopłaty', 'rolnictwo'],
    blocks: [
      p(
        'Agencja Restrukturyzacji i Modernizacji Rolnictwa otworzyła nabór wniosków o <strong>płatności bezpośrednie za 2026 rok</strong>. Termin składania wniosków bez sankcji upływa <strong>15 czerwca 2026</strong>.'
      ),
      h2('Stawki na hektar'),
      {
        type: 'table' as const,
        head: ['Rodzaj płatności', '2025', '2026', 'Zmiana'],
        rows: [
          ['Podstawowe wsparcie dochodów', '498 zł', '529 zł', '+6,2%'],
          ['Płatność redystrybucyjna', '178 zł', '189 zł', '+6,2%'],
          ['Płatność dla młodych rolników', '283 zł', '301 zł', '+6,4%'],
          ['ONW strefa nizinna I', '179 zł', '190 zł', '+6,1%'],
        ],
      },
      h2('Gdzie złożyć wniosek'),
      ul([
        'elektronicznie — aplikacja eWniosekPlus (zalecane)',
        'osobiście — Biuro Powiatowe ARiMR we Włocławku, ul. Leśna 41',
        'z pomocą doradcy KPODR — dyżury w Urzędzie Miejskim w Izbicy, wtorki 9:00–13:00',
      ]),
      info(
        'warning',
        'Uwaga na sankcje',
        'Wnioski złożone po 15 czerwca do 10 lipca będą pomniejszone o 1% za każdy dzień opóźnienia. Po 10 lipca — bez rozpatrzenia.'
      ),
      file('/static/docs/arimr-2026-instrukcja.pdf', 'Instrukcja wypełniania wniosku ARiMR 2026', '2,1 MB'),
    ],
  }),

  mk({
    id: 'a-021',
    slug: 'sp1-wygrala-male-mistrzostwa-matematyczne',
    type: 'article',
    category: 'wiadomosci',
    subcategory: 'edukacja',
    title: 'SP nr 1 wygrała wojewódzki konkurs „Mała Mistrzostwa Matematyczne”',
    lede:
      'Uczniowie SP nr 1 w Izbicy zdobyli pierwsze miejsce w finałach wojewódzkich. Wyróżniona praca: rozwiązywanie zadań logicznych. Nagroda — wycieczka do Toruńskiego Planetarium.',
    heroImage: `${IMG}/08-edukacja-szkola.jpg`,
    heroAlt: 'Szkoła Podstawowa nr 1 w Izbicy',
    author: A['katarzyna-lis'],
    publishedAt: '22.05, 09:30',
    publishedAtISO: '2026-05-22T09:30:00+02:00',
    views: 654,
    commentCount: 8,
    tags: ['edukacja', 'SP nr 1', 'konkurs'],
    blocks: [
      p(
        'Czteroosobowa drużyna Szkoły Podstawowej nr 1 w Izbicy Kujawskiej zwyciężyła w finale wojewódzkim konkursu <strong>„Mała Mistrzostwa Matematyczne”</strong>, który odbył się 21 maja w Bydgoszczy.'
      ),
      p(
        'Izbicka drużyna wyprzedziła 23 inne szkoły z województwa kujawsko-pomorskiego. Najwyżej oceniono część poświęconą zadaniom logicznym, w której uczniowie zdobyli maksymalną liczbę punktów.'
      ),
      quote(
        'Trenowaliśmy w każdy czwartek po lekcjach od października. Dzieciaki same prosiły o dodatkowe zadania.',
        'Barbara Nowicka',
        'nauczycielka matematyki, opiekunka drużyny'
      ),
      p('Nagrodą główną jest wycieczka całej klasy do Planetarium w Toruniu, zaplanowana na 10 czerwca.'),
    ],
  }),

  mk({
    id: 'a-022',
    slug: 'spzoz-dodatkowe-godziny-poradni-kardiologicznej',
    type: 'article',
    category: 'wiadomosci',
    subcategory: 'zdrowie',
    title: 'SPZOZ uruchamia dodatkowe godziny poradni kardiologicznej',
    lede:
      'Od czerwca poradnia kardiologiczna będzie przyjmować pacjentów również w środy. Rejestracja telefoniczna od poniedziałku. Lekarz przyjmie do 30 osób tygodniowo.',
    heroImage: `${IMG}/09-spzoz-pielegniarka.jpg`,
    heroAlt: 'SPZOZ Izbica Kujawska',
    author: A['redakcja'],
    publishedAt: '21.05, 11:20',
    publishedAtISO: '2026-05-21T11:20:00+02:00',
    views: 421,
    commentCount: 3,
    tags: ['SPZOZ', 'zdrowie', 'kardiologia'],
    blocks: [
      p(
        'Samodzielny Publiczny Zakład Opieki Zdrowotnej w Izbicy Kujawskiej rozszerza działalność poradni kardiologicznej. Od <strong>3 czerwca</strong> lekarz będzie przyjmował również w <strong>środy w godz. 13:00–18:00</strong>.'
      ),
      h3('Jak się zapisać'),
      ul([
        'telefonicznie: 54 286 50 12 (rejestracja od 8:00)',
        'osobiście w rejestracji SPZOZ, ul. Narutowicza 12',
        'wymagane skierowanie od lekarza rodzinnego',
      ]),
      p('Tygodniowy limit wynosi 30 pacjentów. SPZOZ zapowiada, że w przypadku dużego zainteresowania wystąpi do NFZ o zwiększenie kontraktu.'),
    ],
  }),

  mk({
    id: 'a-023',
    slug: 'nasadzenia-200-drzew-sadlno-modzerowo',
    type: 'article',
    category: 'wiadomosci',
    subcategory: 'srodowisko',
    title: 'Nasadzenia 200 drzew w sołectwach Sadłno i Modzerowo',
    lede:
      'Pierwszy etap programu „Zielona Gmina” zakończony. Posadzono 200 dębów, lip i klonów. Akcję wsparli wolontariusze i strażacy OSP.',
    heroImage: `${IMG}/16-srodowisko-odpady.jpg`,
    heroAlt: 'Nasadzenia drzew',
    author: A['anna-wojcik'],
    publishedAt: '20.05, 14:00',
    publishedAtISO: '2026-05-20T14:00:00+02:00',
    views: 312,
    commentCount: 2,
    solectwo: 'sadlno',
    tags: ['środowisko', 'Zielona Gmina', 'Sadłno', 'Modzerowo'],
    blocks: [
      p(
        'W sołectwach <strong>Sadłno</strong> i <strong>Modzerowo</strong> zakończył się pierwszy etap gminnego programu „Zielona Gmina”. W ciągu dwóch weekendów posadzono <strong>200 drzew</strong>: 80 dębów szypułkowych, 70 lip drobnolistnych i 50 klonów pospolitych.'
      ),
      p(
        'W akcji wzięło udział ok. 60 wolontariuszy — mieszkańcy, uczniowie SP Sadłno, członkowie KGW oraz strażacy OSP, którzy zapewnili beczkowóz do podlewania nasadzeń.'
      ),
      p('Drugi etap programu zaplanowano na wrzesień — obejmie sołectwa Pasieka, Bierzyn i Świszewy. Łącznie do 2028 roku gmina chce posadzić 1000 drzew.'),
    ],
  }),

  mk({
    id: 'a-024',
    slug: 'harmonogram-odbioru-odpadow-czerwiec-2026',
    type: 'article',
    category: 'wiadomosci',
    subcategory: 'komunikaty',
    title: 'Harmonogram odbioru odpadów — czerwiec 2026. Sprawdź daty dla swojego sołectwa.',
    lede:
      'Pełen wykaz terminów odbioru zmieszanych, BIO, plastiku, szkła i papieru. Zmiany w kilku sołectwach z powodu remontów dróg. Dokładne daty w dokumencie PDF.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    heroAlt: 'Odbiór odpadów',
    author: A['redakcja'],
    publishedAt: '20.05, 09:00',
    publishedAtISO: '2026-05-20T09:00:00+02:00',
    views: 892,
    commentCount: 4,
    tags: ['odpady', 'komunikaty', 'ZGKiW'],
    blocks: [
      p('Zakład Gospodarki Komunalnej i Wodociągowej opublikował harmonogram odbioru odpadów na <strong>czerwiec 2026</strong>.'),
      h2('Miasto Izbica Kujawska'),
      {
        type: 'table' as const,
        head: ['Frakcja', 'Terminy'],
        rows: [
          ['Zmieszane', '3, 17 czerwca'],
          ['BIO', '3, 10, 17, 24 czerwca'],
          ['Plastik i metal', '10 czerwca'],
          ['Szkło', '24 czerwca'],
          ['Papier', '24 czerwca'],
        ],
      },
      info(
        'warning',
        'Zmiany w sołectwach',
        'W Sadłnie i Modzerowie odbiór przesunięty o jeden dzień z powodu remontu drogi. Pojemniki należy wystawić do godz. 6:00.'
      ),
      file('/static/docs/harmonogram-odpady-2026-06.pdf', 'Harmonogram odbioru odpadów — czerwiec 2026 (34 sołectwa)', '640 kB'),
    ],
  }),

  // ══ KULTURA ═══════════════════════════════════════════════════════════════
  mk({
    id: 'a-030',
    slug: 'wojciech-tochman-spotkanie-autorskie',
    type: 'event',
    category: 'kultura',
    subcategory: 'biblioteka',
    title: 'Wojciech Tochman w Izbicy. Spotkanie autorskie — 25 maja, godz. 18:00.',
    lede:
      'Pisarz, reporter, autor książek „Jakbyś kamień jadła” i „Eli, Eli” przyjedzie do Biblioteki Publicznej. Rozmowa o reportażu, podpisywanie książek, dyskusja z publicznością. Wstęp wolny.',
    heroImage: `${IMG}/13-tochman-bibl.jpg`,
    heroAlt: 'Spotkanie autorskie w bibliotece',
    author: A['katarzyna-lis'],
    publishedAt: '22 maja',
    publishedAtISO: '2026-05-22T12:00:00+02:00',
    views: 234,
    commentCount: 1,
    tags: ['biblioteka', 'spotkanie autorskie', 'Tochman'],
    event: {
      startsAt: '2026-05-25T18:00:00+02:00',
      place: 'Biblioteka Publiczna, ul. Marszałka Piłsudskiego 26',
      organizer: 'Biblioteka Publiczna w Izbicy Kujawskiej',
      free: true,
    },
    blocks: [
      p(
        '<strong>Wojciech Tochman</strong> — reporter, współzałożyciel Fundacji Itaka i Instytutu Reportażu, autor m.in. „Jakbyś kamień jadła”, „Eli, Eli” i „Dzisiaj narysujemy śmierć” — będzie gościem Biblioteki Publicznej w Izbicy Kujawskiej.'
      ),
      h3('Program spotkania'),
      ul([
        '18:00 — powitanie i wprowadzenie',
        '18:15 — rozmowa o rzemiośle reportażu i pracy w terenie',
        '19:15 — pytania publiczności',
        '19:45 — podpisywanie książek',
      ]),
      p('Wstęp wolny, liczba miejsc ograniczona do 80. Książki autora będą dostępne w sprzedaży na miejscu.'),
    ],
  }),

  mk({
    id: 'a-031',
    slug: 'wielka-pielgrzymka-blenna-7-czerwca',
    type: 'event',
    category: 'kultura',
    subcategory: 'parafie',
    subsubcategory: 'blenna',
    title: 'Wielka Pielgrzymka do MB Łaskawej Księżnej Kujaw — 7 czerwca.',
    lede:
      'Sanktuarium w Błennie zaprasza wiernych z całego dekanatu. Trasa pielgrzymki rozpoczyna się w Izbicy o 6:00, msza święta uroczysta w sanktuarium o 11:00. Ks. Waldemar Pasierowski przewodniczy.',
    heroImage: `${IMG}/14-pielgrzymka-blenna.jpg`,
    heroAlt: 'Pielgrzymka do Błenny',
    author: A['katarzyna-lis'],
    publishedAt: '21 maja',
    publishedAtISO: '2026-05-21T10:00:00+02:00',
    views: 189,
    commentCount: 0,
    solectwo: 'blenna',
    tags: ['parafia Błenna', 'pielgrzymka', 'sanktuarium'],
    event: {
      startsAt: '2026-06-07T06:00:00+02:00',
      place: 'Sanktuarium MB Łaskawej Księżnej Kujaw w Błennie',
      organizer: 'Parafia w Błennie · dekanat izbicki',
      free: true,
    },
    blocks: [
      p(
        'Sanktuarium Matki Bożej Łaskawej Księżnej Kujaw w <strong>Błennie</strong> zaprasza na doroczną Wielką Pielgrzymkę, która odbędzie się w niedzielę <strong>7 czerwca</strong>.'
      ),
      h3('Plan pielgrzymki'),
      ul([
        '6:00 — zbiórka przy kościele NMP w Izbicy Kujawskiej, modlitwa i wyjście',
        '8:30 — postój w Świszewach, śniadanie',
        '10:30 — wejście do sanktuarium w Błennie',
        '11:00 — uroczysta msza święta pod przewodnictwem ks. Waldemara Pasierowskiego',
        '13:00 — agapa na placu przy sanktuarium',
      ]),
      p('Trasa liczy ok. 12 km. Dla osób, które nie mogą iść pieszo, parafia organizuje transport autokarowy — zapisy w zakrystii.'),
    ],
  }),

  mk({
    id: 'a-032',
    slug: 'kgw-pasieczanki-warsztaty-chleba',
    type: 'event',
    category: 'kultura',
    subcategory: 'kgw',
    title: 'KGW Pasieczanki: warsztaty pieczenia chleba kujawskiego — 2 czerwca.',
    lede:
      'Tradycyjna receptura z mąką żytnią ze Świszew, drewno opałowe z lokalnego lasu. Warsztaty prowadzą najstarsze gospodynie wsi. Zapisy w świetlicy wiejskiej. Koszt: 30 zł od osoby.',
    heroImage: `${IMG}/15-kgw-pasieka-chleb.jpg`,
    heroAlt: 'Chleb kujawski KGW Pasieczanki',
    author: A['katarzyna-lis'],
    publishedAt: '20 maja',
    publishedAtISO: '2026-05-20T13:00:00+02:00',
    views: 156,
    commentCount: 2,
    solectwo: 'pasieka',
    tags: ['KGW', 'Pasieka', 'tradycja', 'warsztaty'],
    event: {
      startsAt: '2026-06-02T10:00:00+02:00',
      place: 'Świetlica wiejska w Pasiece',
      organizer: 'KGW Pasieczanki',
      free: false,
    },
    blocks: [
      p(
        'Koło Gospodyń Wiejskich <strong>Pasieczanki</strong> zaprasza na warsztaty pieczenia chleba kujawskiego według receptury przekazywanej w Pasiece od czterech generacji.'
      ),
      p(
        'Uczestnicy nauczą się przygotowywać zakwas, wyrabiać ciasto i wypiekać chleb w tradycyjnym piecu opalanym drewnem. Używana jest mąka żytnia z młyna w <strong>Świszewach</strong>.'
      ),
      h3('Szczegóły'),
      ul([
        'Termin: 2 czerwca, godz. 10:00–15:00',
        'Miejsce: świetlica wiejska w Pasiece',
        'Koszt: 30 zł od osoby (materiały w cenie)',
        'Limit: 15 uczestników',
        'Zapisy: świetlica wiejska lub tel. 505 118 240',
      ]),
      p('Każdy uczestnik zabiera do domu własny bochenek i przepis.'),
    ],
  }),

  // ══ LUDZIE ════════════════════════════════════════════════════════════════
  mk({
    id: 'a-040',
    slug: 'marek-dorabiala-5-pytan',
    type: 'article',
    category: 'ludzie',
    subcategory: 'wywiady',
    title: 'Marek Dorabiała: „Termomodernizacja szkół to inwestycja w przyszłość”',
    shortTitle: 'Marek Dorabiała — 5 pytań',
    lede:
      'Rozmowa z burmistrzem gminy Izbica Kujawska o budżecie remontowym, funduszach unijnych i planach na centrum miasta.',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    heroAlt: 'Marek Dorabiała, burmistrz gminy Izbica Kujawska',
    author: A['anna-wojcik'],
    publishedAt: '20 maja',
    publishedAtISO: '2026-05-20T09:00:00+02:00',
    views: 1245,
    commentCount: 16,
    tags: ['wywiad', 'burmistrz', 'samorząd'],
    blocks: [
      quote(
        'Termomodernizacja szkół to nie luksus — to inwestycja w przyszłość naszych dzieci i w portfele rodziców. Każda zaoszczędzona złotówka wróci do mieszkańców.',
        'Marek Dorabiała',
        'burmistrz gminy Izbica Kujawska'
      ),
      h3('Budżet remontowy 4,8 mln zł — skąd taki skok?'),
      p(
        'Złożyło się na to kilka rzeczy. Po pierwsze udało nam się pozyskać 1,1 mln zł z Rządowego Funduszu Rozwoju Dróg. Po drugie dostaliśmy 1,2 mln zł na termomodernizację SP nr 2. Po trzecie — i to jest kluczowe — dochody własne gminy wzrosły o 9% rok do roku.'
      ),
      h3('Które inwestycje są najpilniejsze?'),
      p(
        'Kanalizacja w Sadłnie. To sołectwo czeka od kilkunastu lat. Zaraz za nią drogi gminne — cztery odcinki, które są w najgorszym stanie technicznym.'
      ),
      h3('A rewitalizacja rynku?'),
      p(
        'W czerwcu ruszają konsultacje społeczne. Nie chcę narzucać mieszkańcom koncepcji z góry. Rynek to serce Izbicy — musi być zaprojektowany razem z izbiczanami.'
      ),
      h3('Największe wyzwanie gminy w perspektywie 5 lat?'),
      p(
        'Demografia. Mamy 5 400 mieszkańców i musimy zrobić wszystko, żeby młodzi ludzie zostawali. To znaczy: praca, mieszkania, żłobek, dobra szkoła i sensowna komunikacja z Włocławkiem.'
      ),
      h3('Co Pana najbardziej cieszy?'),
      p(
        'Że mieszkańcy się angażują. Przy nasadzeniach w Sadłnie było 60 wolontariuszy. Nikt ich nie zmuszał. To pokazuje, że ta gmina żyje.'
      ),
    ],
  }),

  mk({
    id: 'a-041',
    slug: 'jadwiga-kowalska-38-lat-w-bibliotece',
    type: 'article',
    category: 'ludzie',
    subcategory: 'sylwetki',
    title: 'Jadwiga Kowalska: 38 lat w jednej bibliotece',
    shortTitle: 'Jadwiga Kowalska — sylwetka',
    lede:
      'Bibliotekarka, która pamięta pięciu burmistrzów i trzy pokolenia czytelników. Wspomnienia z izbickiej Biblioteki Publicznej.',
    heroImage: `${IMG}/11-portret-bibliotekarka.jpg`,
    heroAlt: 'Jadwiga Kowalska, bibliotekarka',
    author: A['marek-kowalski'],
    publishedAt: '18 maja',
    publishedAtISO: '2026-05-18T11:00:00+02:00',
    views: 892,
    commentCount: 21,
    tags: ['sylwetka', 'biblioteka', 'wspomnienia'],
    blocks: [
      quote(
        'Przez 38 lat pracowałam w jednej bibliotece, ale Izbica zmieniała się każdego dnia. Każda książka znajduje swojego czytelnika.',
        'Jadwiga Kowalska',
        'bibliotekarka'
      ),
      p(
        'Do Biblioteki Publicznej w Izbicy Kujawskiej przyszła w 1988 roku jako 23-letnia absolwentka bibliotekoznawstwa. Zostawała na kolejny rok. I na kolejny. W sumie <strong>38 lat</strong>.'
      ),
      h2('Od kartoteki do katalogu online'),
      p(
        'Pamięta czasy, gdy każda książka miała kartę katalogową wypisaną ręcznie. Pierwszy komputer pojawił się w bibliotece w 2003 roku. Katalog online — w 2014.'
      ),
      p(
        'Największy skok czytelnictwa? Pandemia. „Ludzie zostali w domach i przypomnieli sobie, że istnieją książki. Wypożyczenia wzrosły o 40 procent”.'
      ),
      img(
        `${IMG}/13-tochman-bibl.jpg`,
        'Sala biblioteki',
        'Biblioteka Publiczna w Izbicy Kujawskiej. Rocznie odbywa się tu kilkanaście spotkań autorskich.',
        'fot. Izbica24.pl'
      ),
      h2('Trzy pokolenia czytelników'),
      p(
        '„Przychodzą do mnie ludzie i mówią: pani Jadwigo, pamięta pani, jak mi pani polecała »Pana Samochodzika«? A teraz przyprowadzają swoje dzieci. To jest najpiękniejsze w tej pracy”.'
      ),
    ],
  }),

  mk({
    id: 'a-042',
    slug: 'adam-adamiak-kujawianka-to-moj-dom',
    type: 'article',
    category: 'ludzie',
    subcategory: 'sukcesy',
    title: 'Adam Adamiak: „Kujawianka to mój dom”',
    shortTitle: 'Adam Adamiak — sukcesy',
    lede:
      'Napastnik z 14 golami w sezonie ma oferty z wyższych lig. Wybiera Izbicę. Rozmowa o lojalności i ambicjach.',
    heroImage: `${IMG}/12-portret-pilkarz.jpg`,
    heroAlt: 'Adam Adamiak, napastnik Kujawianki',
    author: A['redakcja'],
    publishedAt: '16 maja',
    publishedAtISO: '2026-05-16T17:00:00+02:00',
    views: 2134,
    commentCount: 34,
    tags: ['Kujawianka', 'Adam Adamiak', 'sport'],
    blocks: [
      quote(
        'Kujawianka to mój dom. Mam oferty z wyższych lig, ale Izbica wygrywa za każdym razem. Tu są moi ludzie.',
        'Adam Adamiak',
        'napastnik MGKS Kujawianka Izbica Kujawska'
      ),
      p(
        'Ma 26 lat, 14 goli w bieżącym sezonie i status najskuteczniejszego zawodnika Klasy Okręgowej gr. 2. W Kujawiance gra od czasów szkółki piłkarskiej.'
      ),
      h2('Oferty i decyzje'),
      p(
        'W zimowym okienku transferowym otrzymał trzy propozycje z klubów IV ligi. Odrzucił wszystkie. „Policzyłem: dojazdy, treningi, mniej czasu z rodziną. Za jakie pieniądze? Nie warto”.'
      ),
      h2('Cel: awans z Kujawianką'),
      p(
        'Adamiak nie ukrywa ambicji: chce awansować do IV ligi w barwach Kujawianki. „Jeśli mamy wejść wyżej, to razem. Cała szatnia. To ma sens”.'
      ),
    ],
  }),

  // ══ PRZEGLĄD MEDIÓW ═══════════════════════════════════════════════════════
  mk({
    id: 'a-050',
    slug: 'ddwloclawek-burmistrz-o-termomodernizacji',
    type: 'media-review',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    title: 'Burmistrz Izbicy o termomodernizacji szkół: „Wniosek już złożony”',
    lede:
      'Marek Dorabiała udzielił obszernego wywiadu o planach inwestycyjnych gminy. Termomodernizacja SP nr 2 to dopiero pierwszy krok — w przygotowaniu kolejne wnioski o dofinansowanie z UE.',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    heroAlt: 'Burmistrz Dorabiała wywiad',
    author: A['redakcja'],
    publishedAt: '22 maja, 12:18',
    publishedAtISO: '2026-05-22T12:18:00+02:00',
    views: 2341,
    commentCount: 4,
    externalSource: { name: 'ddwloclawek.pl', url: 'https://ddwloclawek.pl' },
    tags: ['przegląd mediów', 'termomodernizacja'],
    blocks: [
      p(
        'Portal <strong>ddwloclawek.pl</strong> opublikował obszerny wywiad z burmistrzem Izbicy Kujawskiej Markiem Dorabiałą, dotyczący planów inwestycyjnych gminy na najbliższe lata.'
      ),
      p(
        'Burmistrz potwierdził, że wniosek o dofinansowanie termomodernizacji SP nr 2 został już złożony i uzyskał pozytywną ocenę formalną. W przygotowaniu są kolejne wnioski — dotyczące budynku Urzędu Miejskiego i świetlic wiejskich.'
      ),
      info(
        'info',
        'Materiał źródłowy',
        'Pełna treść wywiadu dostępna na portalu ddwloclawek.pl. Izbica24.pl publikuje streszczenie z zachowaniem prawa cytatu.'
      ),
    ],
  }),

  mk({
    id: 'a-051',
    slug: 'pomorska-wietrzychowice-znow-otwarte',
    type: 'media-review',
    category: 'przeglad-mediow',
    subcategory: 'gazeta-pomorska',
    title: 'Wietrzychowice — polskie piramidy znów otwarte dla turystów',
    lede:
      'Park Kulturowy Wietrzychowice wraca po renowacji. Sezon turystyczny rozpoczęty — wstęp wolny, nowa ścieżka dydaktyczna, tablice informacyjne. Spodziewane 30 tys. odwiedzających rocznie.',
    heroImage: `${IMG}/05-wietrzychowice-megality.jpg`,
    heroAlt: 'Wietrzychowice — park kulturowy',
    author: A['redakcja'],
    publishedAt: '21 maja, 16:45',
    publishedAtISO: '2026-05-21T16:45:00+02:00',
    views: 5128,
    commentCount: 23,
    solectwo: 'wietrzychowice',
    externalSource: { name: 'pomorska.pl', url: 'https://pomorska.pl' },
    tags: ['przegląd mediów', 'Wietrzychowice', 'turystyka'],
    blocks: [
      p(
        '<strong>Gazeta Pomorska</strong> informuje o ponownym otwarciu Parku Kulturowego Wietrzychowice po zakończeniu prac renowacyjnych.'
      ),
      p(
        'Odnowiono ścieżkę dydaktyczną, ustawiono 14 nowych tablic informacyjnych oraz zamontowano ławki i stojaki rowerowe. Wstęp do parku pozostaje bezpłatny. Zarządca spodziewa się w tym sezonie ok. 30 tys. odwiedzających.'
      ),
    ],
  }),

  mk({
    id: 'a-052',
    slug: 'nwloclawek-kujawianka-znow-zwycieska',
    type: 'media-review',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    title: 'Kujawianka znów zwycięska. Trener Kaczor zapowiada walkę o awans',
    lede:
      'Trzecia z rzędu wygrana piłkarzy z Izbicy. Trener Mariusz Kaczor w pomeczowym wywiadzie zapowiedział walkę o awans do IV ligi. Klub wzmacnia się przed końcówką sezonu.',
    heroImage: `${IMG}/04-kujawianka-celebracja.jpg`,
    heroAlt: 'Kujawianka zwycięska',
    author: A['redakcja'],
    publishedAt: '21 maja, 18:30',
    publishedAtISO: '2026-05-21T18:30:00+02:00',
    views: 894,
    commentCount: 11,
    externalSource: { name: 'nwloclawek.pl', url: 'https://nwloclawek.pl' },
    tags: ['przegląd mediów', 'Kujawianka'],
    blocks: [
      p(
        'Portal <strong>nwloclawek.pl</strong> relacjonuje trzecie z rzędu zwycięstwo Kujawianki Izbica Kujawska w Klasie Okręgowej.'
      ),
      p(
        'W pomeczowym wywiadzie trener Mariusz Kaczor zapowiedział, że klub będzie walczył o awans do IV ligi. Zarząd rozważa wzmocnienia kadrowe na letnie okienko transferowe.'
      ),
    ],
  }),

  mk({
    id: 'a-053',
    slug: 'tv-kujawy-reportaz-dni-izbicy-2026',
    type: 'media-review',
    category: 'przeglad-mediow',
    subcategory: 'tv-radio',
    title: '📺 Reportaż: Dni Izbicy 2026 — pełna zapowiedź (wideo, 4:23)',
    lede: '20 maja, 19:00 · 4 712 odsłon · 8 kom.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    heroAlt: 'Reportaż TV Kujawy',
    author: A['redakcja'],
    publishedAt: '20 maja, 19:00',
    publishedAtISO: '2026-05-20T19:00:00+02:00',
    views: 4712,
    commentCount: 8,
    externalSource: { name: 'TV Kujawy', url: 'https://tvkujawy.pl', badgeColor: '#dc3545' },
    tags: ['przegląd mediów', 'TV Kujawy', 'Dni Izbicy'],
    blocks: [
      p(
        '<strong>TV Kujawy</strong> wyemitowała 4-minutowy reportaż zapowiadający Dni Izbicy 2026. W materiale wypowiedzi organizatorów z MGCK, fragmenty prób zespołów oraz plan wydarzeń na każdy z trzech dni.'
      ),
    ],
  }),

  mk({
    id: 'a-054',
    slug: 'radio-pik-wywiad-burmistrz-drogi',
    type: 'media-review',
    category: 'przeglad-mediow',
    subcategory: 'tv-radio',
    title: '🎙 Wywiad z burmistrzem Dorabiałą o inwestycjach drogowych',
    lede: '19 maja, 08:45 · 1 218 odsłuchów',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    heroAlt: 'Wywiad radiowy z burmistrzem',
    author: A['redakcja'],
    publishedAt: '19 maja, 08:45',
    publishedAtISO: '2026-05-19T08:45:00+02:00',
    views: 1218,
    commentCount: 0,
    externalSource: { name: 'Radio PiK', url: 'https://radiopik.pl', badgeColor: '#6a4c93' },
    tags: ['przegląd mediów', 'Radio PiK'],
    blocks: [
      p(
        'W porannym pasmie <strong>Radia PiK</strong> burmistrz Izbicy Kujawskiej mówił o planach drogowych gminy oraz współpracy ze Starostwem Powiatowym w sprawie drogi Izbica–Brdów.'
      ),
    ],
  }),

  mk({
    id: 'a-055',
    slug: 'glos-wloclawianina-sadlno-dofinansowanie-swietlicy',
    type: 'media-review',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    title: 'Sołectwo Sadłno z dofinansowaniem na remont świetlicy',
    lede: '18 maja, 14:20 · 342 odsłon · 2 kom.',
    heroImage: `${IMG}/17-swietlica-sadlno.jpg`,
    heroAlt: 'Świetlica w Sadłnie',
    author: A['redakcja'],
    publishedAt: '18 maja, 14:20',
    publishedAtISO: '2026-05-18T14:20:00+02:00',
    views: 342,
    commentCount: 2,
    solectwo: 'sadlno',
    externalSource: { name: 'gloswloclawianina.pl', url: 'https://gloswloclawianina.pl', badgeColor: '#0d6efd' },
    tags: ['przegląd mediów', 'Sadłno', 'świetlica'],
    blocks: [
      p(
        'Portal <strong>gloswloclawianina.pl</strong> informuje o przyznaniu sołectwu Sadłno dofinansowania na remont świetlicy wiejskiej w ramach programu odnowy wsi.'
      ),
    ],
  }),

  mk({
    id: 'a-056',
    slug: 'portalwloclawek-podsumowanie-tygodnia-policja',
    type: 'media-review',
    category: 'przeglad-mediow',
    subcategory: 'portale',
    title: 'Podsumowanie tygodnia: 3 zatrzymania, 12 mandatów, 0 wypadków drogowych',
    lede: '17 maja, 11:30 · 567 odsłon',
    heroImage: `${IMG}/19-policja-patrol.jpg`,
    heroAlt: 'Policja Izbica',
    author: A['redakcja'],
    publishedAt: '17 maja, 11:30',
    publishedAtISO: '2026-05-17T11:30:00+02:00',
    views: 567,
    commentCount: 0,
    externalSource: { name: 'portalwloclawek.pl', url: 'https://portalwloclawek.pl', badgeColor: '#198754' },
    tags: ['przegląd mediów', 'policja'],
    blocks: [
      p(
        '<strong>portalwloclawek.pl</strong> publikuje tygodniowe podsumowanie działań Posterunku Policji w Izbicy Kujawskiej: trzy zatrzymania, dwanaście mandatów i brak wypadków drogowych ze skutkiem poważnym.'
      ),
    ],
  }),

  // ══ ŻYCIE CODZIENNE ═══════════════════════════════════════════════════════
  mk({
    id: 'a-060',
    slug: 'jak-zalatwic-dowod-osobisty',
    type: 'article',
    category: 'zycie-codzienne',
    subcategory: 'poradnik',
    title: 'Jak załatwić dowód osobisty w Izbicy?',
    lede:
      'Pokój nr 8, parter Urzędu Miejskiego. Godziny przyjęć, lista dokumentów, terminy odbioru — kompletny przewodnik krok po kroku.',
    heroImage: `${IMG}/01-hero-ulica-koscielna.jpg`,
    heroAlt: 'Urząd Miejski w Izbicy Kujawskiej',
    author: A['redakcja'],
    publishedAt: '19 maja',
    publishedAtISO: '2026-05-19T10:00:00+02:00',
    views: 1420,
    commentCount: 3,
    tags: ['poradnik', 'urząd', 'dowód osobisty'],
    blocks: [
      h2('Gdzie i kiedy'),
      ul([
        'Urząd Miejski, ul. Marszałka Piłsudskiego 32, pokój nr 8 (parter)',
        'poniedziałek 8:00–16:00, wtorek–piątek 7:30–15:30',
        'tel. 54 286 50 09',
      ]),
      h2('Co zabrać'),
      ul([
        'aktualne zdjęcie (35 × 45 mm, na jasnym tle, bez nakrycia głowy)',
        'dotychczasowy dowód osobisty lub paszport',
        'w przypadku pierwszego dowodu dla dziecka — odpis aktu urodzenia',
      ]),
      h2('Terminy'),
      p('Standardowy czas oczekiwania to <strong>do 30 dni</strong>. Status wniosku można sprawdzić na obywatel.gov.pl. Odbiór osobisty w pokoju nr 8.'),
      info('info', 'Wniosek online', 'Wniosek o dowód dla dziecka do 12 lat można złożyć elektronicznie przez profil zaufany na gov.pl.'),
    ],
  }),

  mk({
    id: 'a-061',
    slug: 'spzoz-godziny-lekarzy-i-poradni',
    type: 'article',
    category: 'zycie-codzienne',
    subcategory: 'zdrowie',
    title: 'SPZOZ Izbica: godziny lekarzy i poradni',
    lede:
      'Lekarz rodzinny, pediatra, kardiolog, ginekolog. Numery rejestracyjne i godziny przyjęć — maj/czerwiec 2026.',
    heroImage: `${IMG}/09-spzoz-pielegniarka.jpg`,
    heroAlt: 'SPZOZ Izbica',
    author: A['redakcja'],
    publishedAt: '18 maja',
    publishedAtISO: '2026-05-18T09:00:00+02:00',
    views: 2180,
    commentCount: 6,
    tags: ['poradnik', 'SPZOZ', 'zdrowie'],
    blocks: [
      {
        type: 'table' as const,
        head: ['Poradnia', 'Dni', 'Godziny'],
        rows: [
          ['Lekarz rodzinny (2 gabinety)', 'pon.–pt.', '8:00–18:00'],
          ['Pediatria', 'pon., wt., czw.', '9:00–14:00'],
          ['Kardiologia', 'wt., śr. (od czerwca)', '13:00–18:00'],
          ['Ginekologia', 'czw.', '10:00–15:00'],
          ['Gabinet zabiegowy', 'pon.–pt.', '8:00–15:00'],
          ['Punkt szczepień', 'wt., czw.', '9:00–12:00'],
        ],
      },
      h3('Rejestracja'),
      ul([
        'telefonicznie: 54 286 50 12 (od 8:00)',
        'osobiście: ul. Narutowicza 12',
        'nocna i świąteczna opieka zdrowotna: Szpital Wojewódzki we Włocławku, tel. 54 412 94 00',
      ]),
    ],
  }),

  mk({
    id: 'a-062',
    slug: 'doplaty-arimr-2026-terminy-i-wnioski',
    type: 'article',
    category: 'zycie-codzienne',
    subcategory: 'rolnictwo',
    title: 'Dopłaty ARiMR 2026 — terminy i wnioski',
    lede:
      'Płatności bezpośrednie, ONW, ekoschematy. Stawki na hektar, wymagane dokumenty, gdzie złożyć wniosek.',
    heroImage: `${IMG}/07-rolnictwo-rzepak.jpg`,
    heroAlt: 'Rolnictwo w gminie Izbica Kujawska',
    author: A['redakcja'],
    publishedAt: '17 maja',
    publishedAtISO: '2026-05-17T08:00:00+02:00',
    views: 1080,
    commentCount: 4,
    tags: ['poradnik', 'ARiMR', 'rolnictwo'],
    blocks: [
      p('Kompletny przewodnik dla rolników z gminy Izbica Kujawska po systemie płatności bezpośrednich w 2026 roku.'),
      h2('Kluczowe terminy'),
      ul([
        '15 marca — otwarcie naboru w eWniosekPlus',
        '15 czerwca — koniec naboru bez sankcji',
        '10 lipca — ostateczny termin ze sankcjami',
        'od 1 grudnia — wypłata zaliczek',
      ]),
      h2('Ekoschematy — co się opłaca na Kujawach'),
      ul([
        'Rolnictwo węglowe — międzyplony ozime (ok. 380 zł/ha)',
        'Wymieszanie obornika na gruntach ornych (ok. 210 zł/ha)',
        'Stosowanie nawozów naturalnych płynnych (ok. 320 zł/ha)',
        'Uproszczone systemy uprawy (ok. 440 zł/ha)',
      ]),
      info('info', 'Doradca w Izbicy', 'Doradca KPODR przyjmuje w Urzędzie Miejskim we wtorki 9:00–13:00. Pomoc w wypełnieniu wniosku bezpłatna.'),
    ],
  }),

  mk({
    id: 'a-063',
    slug: 'wietrzychowice-szlak-megalitow-dla-rodziny',
    type: 'article',
    category: 'zycie-codzienne',
    subcategory: 'turystyka',
    title: 'Wietrzychowice — szlak megalitów dla całej rodziny',
    lede:
      'Trasa pieszych i rowerowych. Park Kulturowy, ścieżka dydaktyczna, miejsca piknikowe. Wstęp wolny.',
    heroImage: `${IMG}/18-szlak-megality.jpg`,
    heroAlt: 'Szlak megalitów w Wietrzychowicach',
    author: A['tomasz-kotlinski'],
    publishedAt: '16 maja',
    publishedAtISO: '2026-05-16T10:00:00+02:00',
    views: 1650,
    commentCount: 7,
    solectwo: 'wietrzychowice',
    tags: ['turystyka', 'Wietrzychowice', 'megality', 'rodzina'],
    blocks: [
      p(
        'Park Kulturowy Wietrzychowice to najlepszy pomysł na rodzinną wycieczkę w gminie. Sześć udostępnionych grobowców kujawskich, ścieżka dydaktyczna i wiaty piknikowe — wszystko bezpłatnie.'
      ),
      h2('Jak dojechać'),
      ul([
        'Samochodem z Izbicy: 9 km drogą w kierunku Lubrańca, parking bezpłatny',
        'Rowerem: oznakowana trasa 11 km z rynku w Izbicy',
        'Pieszo od parkingu: 400 m do pierwszego grobowca',
      ]),
      h2('Plan na 3 godziny'),
      ul([
        'Ścieżka dydaktyczna z 14 tablicami — ok. 1,5 h spokojnym marszem',
        'Grobowiec nr 1 i 2 — największe konstrukcje, najlepsze zdjęcia',
        'Wiata piknikowa przy parkingu — miejsce na przerwę',
        'Powrót przez las — dodatkowe 30 minut',
      ]),
      img(`${IMG}/05-wietrzychowice-megality.jpg`, 'Grobowiec kujawski', 'Grobowiec nr 1 — najdłuższa konstrukcja w parku (ok. 115 m).', 'fot. Izbica24.pl'),
      info('success', 'Dla dzieci', 'Przy tablicy nr 3 znajduje się plansza edukacyjna z zagadkami dla najmłodszych. Warto zabrać kredki.'),
    ],
  }),

  mk({
    id: 'a-064',
    slug: 'kalendarz-ogrodnika-kujawy-czerwiec',
    type: 'article',
    category: 'zycie-codzienne',
    subcategory: 'dom',
    title: 'Kalendarz ogrodnika Kujawy — czerwiec',
    lede:
      'Co siać, co podlewać, kiedy zbiór. Sezonowe porady z uwzględnieniem klimatu kujawsko-pomorskiego.',
    heroImage: `${IMG}/15-kgw-pasieka-chleb.jpg`,
    heroAlt: 'Ogród w czerwcu',
    author: A['redakcja'],
    publishedAt: '15 maja',
    publishedAtISO: '2026-05-15T09:00:00+02:00',
    views: 780,
    commentCount: 5,
    tags: ['dom i ogród', 'poradnik', 'sezon'],
    blocks: [
      h2('Co siać i sadzić'),
      ul([
        'fasola szparagowa — do 10 czerwca',
        'ogórki gruntowe — pierwsza dekada miesiąca',
        'buraki ćwikłowe na zbiór jesienny',
        'sałata i rzodkiewka — siew co 2 tygodnie',
      ]),
      h2('Podlewanie'),
      p(
        'Na glebach kujawskich (przewaga gleb brunatnych i płowych) podlewamy rzadziej ale obficie — 20 l/m² raz na 3–4 dni jest lepsze niż codzienne skrapianie.'
      ),
      h2('Zbiory'),
      ul(['truskawki — od połowy czerwca', 'wczesne odmiany czereśni', 'szczypiorek, koperek, sałata']),
      info('warning', 'Uwaga na przymrozki', 'Na Kujawach przymrozki radiacyjne występują sporadycznie do 5 czerwca. Warto mieć pod ręką agrowłókninę.'),
    ],
  }),

  mk({
    id: 'a-065',
    slug: 'posterunek-policji-izbica-dzielnicowi',
    type: 'article',
    category: 'zycie-codzienne',
    subcategory: 'bezpieczenstwo',
    title: 'Posterunek Policji Izbica — kontakt z dzielnicowymi',
    lede:
      'Telefony dyżurne, podział rejonów, dzielnicowi imiennie. Co zgłaszać, gdzie, kiedy.',
    heroImage: `${IMG}/19-policja-patrol.jpg`,
    heroAlt: 'Patrol policji w Izbicy',
    author: A['marek-kowalski'],
    publishedAt: '14 maja',
    publishedAtISO: '2026-05-14T11:00:00+02:00',
    views: 940,
    commentCount: 2,
    tags: ['bezpieczeństwo', 'policja', 'dzielnicowi'],
    blocks: [
      h2('Kontakt'),
      ul([
        'Posterunek Policji w Izbicy Kujawskiej, ul. Marszałka Piłsudskiego 15',
        'tel. 47 752 92 30 (godziny pracy posterunku)',
        'zgłoszenia całodobowe: 112 lub KMP Włocławek 47 752 22 00',
      ]),
      h2('Dzielnicowi i rejony'),
      {
        type: 'table' as const,
        head: ['Dzielnicowy', 'Rejon', 'Telefon'],
        rows: [
          ['asp. Krzysztof Malinowski', 'Miasto Izbica Kujawska', '571 323 101'],
          ['sierż. szt. Paweł Grabowski', 'Sadłno, Modzerowo, Sarnowo, Mchówek', '571 323 102'],
          ['sierż. Adam Wesołowski', 'Wietrzychowice, Pasieka, Bierzyn, Świszewy', '571 323 103'],
          ['sierż. Michał Zawadzki', 'Błenna, Lubomin, Grochowiska i pozostałe', '571 323 104'],
        ],
      },
      info('info', 'Krajowa Mapa Zagrożeń', 'Anonimowe zgłoszenia (np. spożywanie alkoholu, brawurowa jazda) można nanieść na Krajową Mapę Zagrożeń Bezpieczeństwa — policja.pl.'),
    ],
  }),

  mk({
    id: 'a-066',
    slug: 'pogoda-dla-rolnikow-izbica-7-dni',
    type: 'article',
    category: 'zycie-codzienne',
    subcategory: 'pogoda',
    title: 'Pogoda dla rolników — Izbica · 7 dni',
    lede:
      'Prognoza pól: opady, wiatr, ryzyko gradobicia. Komentarz pod kątem prac polowych. Aktualizacja codzienna.',
    heroImage: `${IMG}/20-pogoda-kujawy.jpg`,
    heroAlt: 'Pogoda nad Kujawami',
    author: A['redakcja'],
    publishedAt: '23 maja',
    publishedAtISO: '2026-05-23T06:00:00+02:00',
    views: 3210,
    commentCount: 1,
    tags: ['pogoda', 'rolnictwo'],
    blocks: [
      {
        type: 'table' as const,
        head: ['Dzień', 'Temp.', 'Opady', 'Wiatr', 'Uwagi dla pól'],
        rows: [
          ['sob 24.05', '19 / 9°C', '0 mm', '12 km/h SW', 'dobre warunki do oprysków'],
          ['ndz 25.05', '21 / 11°C', '0 mm', '15 km/h S', 'idealnie na koszenie'],
          ['pon 26.05', '23 / 13°C', '2 mm', '18 km/h SW', 'przelotny deszcz wieczorem'],
          ['wt 27.05', '20 / 12°C', '8 mm', '22 km/h W', 'wstrzymać opryski'],
          ['śr 28.05', '18 / 10°C', '4 mm', '20 km/h NW', 'gleba nasycona'],
          ['czw 29.05', '20 / 10°C', '0 mm', '10 km/h N', 'wznowienie prac'],
          ['pt 30.05', '22 / 12°C', '0 mm', '11 km/h NE', 'dobre warunki'],
        ],
      },
      h3('Komentarz agrometeorologiczny'),
      p(
        'Bilans wodny w glebie na terenie gminy jest obecnie <strong>dodatni</strong>. Opady w środku tygodnia (12 mm w sumie) uzupełnią zapasy w warstwie 0–30 cm. Ryzyko gradobicia w poniedziałek wieczorem: niskie (15%).'
      ),
    ],
  }),

  // ══ MULTIMEDIA ════════════════════════════════════════════════════════════
  mk({
    id: 'a-070',
    slug: 'wideo-dni-izbicy-2026-zapowiedz',
    type: 'video',
    category: 'multimedia',
    subcategory: 'wideo',
    subsubcategory: 'reportaze',
    title: 'Dni Izbicy 2026 — co czeka mieszkańców 14–16 czerwca?',
    lede:
      'Pełna zapowiedź trzech dni świętowania w Izbicy. Wywiady z organizatorami, pokazy występów, plan na każdy dzień. Premierowy materiał TV Kujawy.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    heroAlt: 'Wideo — Dni Izbicy 2026',
    author: A['redakcja'],
    publishedAt: '20 maja',
    publishedAtISO: '2026-05-20T19:00:00+02:00',
    views: 4712,
    commentCount: 12,
    featured: true,
    tags: ['wideo', 'reportaż', 'Dni Izbicy'],
    video: {
      src: 'https://www.youtube.com/embed/placeholder-dni-izbicy',
      poster: `${IMG}/06-dni-izbicy-koncert.jpg`,
      durationLabel: '4:23',
      provider: 'youtube',
    },
    blocks: [
      { type: 'video' as const, src: 'https://www.youtube.com/embed/placeholder-dni-izbicy', poster: `${IMG}/06-dni-izbicy-koncert.jpg`, caption: 'Reportaż: Dni Izbicy 2026 — zapowiedź', duration: '4:23' },
      p(
        'W czterominutowym reportażu pokazujemy, co czeka mieszkańców podczas Dni Izbicy 2026. Rozmawiamy z dyrektorką MGCK, zaglądamy na próby zespołów młodzieżowych i sprawdzamy przygotowania na Stadionie Miejskim.'
      ),
      h3('W materiale'),
      ul([
        'Plan trzech dni świętowania',
        'Kulisy przygotowań Turnieju Sołectw',
        'Wypowiedzi organizatorów i wykonawców',
        'Informacje o bezpłatnym transporcie z sołectw',
      ]),
    ],
  }),

  mk({
    id: 'a-071',
    slug: 'podcast-23-burmistrz-termomodernizacja',
    type: 'audio',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'rozmowy',
    title: 'Burmistrz o termomodernizacji szkół i Dniach Izbicy',
    lede:
      'Rozmowa z Markiem Dorabiałą o najważniejszych planach gminy na 2026 rok. Inwestycje, fundusze UE, plan na drogi.',
    heroImage: `${IMG}/10-portret-burmistrz.jpg`,
    heroAlt: 'Podcast Głos Izbicy — odcinek 23',
    author: A['tomasz-kotlinski'],
    publishedAt: '22 maja',
    publishedAtISO: '2026-05-22T16:00:00+02:00',
    views: 1845,
    commentCount: 5,
    featured: true,
    tags: ['podcast', 'Głos Izbicy', 'burmistrz'],
    audio: {
      src: '/static/audio/glos-izbicy-023.mp3',
      durationLabel: '32:08',
      episode: 23,
      series: 'Głos Izbicy',
      plays: 1845,
    },
    blocks: [
      { type: 'audio' as const, src: '/static/audio/glos-izbicy-023.mp3', title: 'Głos Izbicy #23 — Burmistrz o termomodernizacji', duration: '32:08' },
      p('W 23. odcinku podcastu „Głos Izbicy” gościmy burmistrza Marka Dorabiałę.'),
      h3('Tematy odcinka'),
      ul([
        '02:10 — budżet remontowy 4,8 mln zł',
        '09:45 — termomodernizacja SP nr 2 i kolejne wnioski',
        '17:20 — plan dla centrum Izbicy i rewitalizacja rynku',
        '24:00 — Dni Izbicy 2026',
        '29:30 — pytania od słuchaczy',
      ]),
    ],
  }),

  mk({
    id: 'a-072',
    slug: 'podcast-22-historia-zydowska-izbicy',
    type: 'audio',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'historia',
    title: 'Historia żydowska Izbicy — z dr Anną Kazanecką',
    lede: 'O społeczności żydowskiej Izbicy, synagodze i pamięci o Zagładzie.',
    heroImage: `${IMG}/13-tochman-bibl.jpg`,
    heroAlt: 'Podcast Głos Izbicy — odcinek 22',
    author: A['tomasz-kotlinski'],
    publishedAt: '15 maja',
    publishedAtISO: '2026-05-15T16:00:00+02:00',
    views: 1120,
    commentCount: 8,
    tags: ['podcast', 'historia', 'społeczność żydowska'],
    audio: { src: '/static/audio/glos-izbicy-022.mp3', durationLabel: '28:12', episode: 22, series: 'Głos Izbicy', plays: 1120 },
    blocks: [
      { type: 'audio' as const, src: '/static/audio/glos-izbicy-022.mp3', title: 'Głos Izbicy #22', duration: '28:12' },
      p('Rozmowa z dr Anną Kazanecką o historii społeczności żydowskiej w Izbicy Kujawskiej — od XVIII wieku do Zagłady.'),
    ],
  }),

  mk({
    id: 'a-073',
    slug: 'podcast-21-wietrzychowice-archeolog-umk',
    type: 'audio',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'rozmowy',
    title: 'Wietrzychowice — rozmowa z archeologiem UMK',
    lede: 'Jak wygląda praca przy grobowcach kujawskich i co jeszcze może kryć park.',
    heroImage: `${IMG}/05-wietrzychowice-megality.jpg`,
    heroAlt: 'Podcast Głos Izbicy — odcinek 21',
    author: A['tomasz-kotlinski'],
    publishedAt: '8 maja',
    publishedAtISO: '2026-05-08T16:00:00+02:00',
    views: 1560,
    commentCount: 11,
    tags: ['podcast', 'Wietrzychowice', 'archeologia'],
    audio: { src: '/static/audio/glos-izbicy-021.mp3', durationLabel: '35:40', episode: 21, series: 'Głos Izbicy', plays: 1560 },
    blocks: [
      { type: 'audio' as const, src: '/static/audio/glos-izbicy-021.mp3', title: 'Głos Izbicy #21', duration: '35:40' },
      p('Archeolog z UMK Toruń opowiada o badaniach w Parku Kulturowym Wietrzychowice.'),
    ],
  }),

  mk({
    id: 'a-074',
    slug: 'podcast-20-podsumowanie-tygodnia-15-21-maja',
    type: 'audio',
    category: 'multimedia',
    subcategory: 'podcast',
    subsubcategory: 'tydzien',
    title: 'Podsumowanie tygodnia · 15–21 maja 2026',
    lede: 'Najważniejsze wydarzenia tygodnia w gminie w niespełna 13 minutach.',
    heroImage: `${IMG}/03-sesja-rady-miejskiej.jpg`,
    heroAlt: 'Podcast Głos Izbicy — odcinek 20',
    author: A['redakcja'],
    publishedAt: '21 maja',
    publishedAtISO: '2026-05-21T20:00:00+02:00',
    views: 890,
    commentCount: 1,
    tags: ['podcast', 'podsumowanie tygodnia'],
    audio: { src: '/static/audio/glos-izbicy-020.mp3', durationLabel: '12:48', episode: 20, series: 'Głos Izbicy', plays: 890 },
    blocks: [
      { type: 'audio' as const, src: '/static/audio/glos-izbicy-020.mp3', title: 'Głos Izbicy #20', duration: '12:48' },
      p('Skrót tygodnia: sesja Rady Miejskiej, zwycięstwo Kujawianki, odkrycie w Wietrzychowicach, nasadzenia w Sadłnie.'),
    ],
  }),

  mk({
    id: 'a-075',
    slug: 'galeria-dni-izbicy-2025',
    type: 'gallery',
    category: 'multimedia',
    subcategory: 'galerie',
    subsubcategory: 'kultura',
    title: 'Galeria · Dni Izbicy 2025',
    lede: 'Najlepsze ujęcia z zeszłorocznej edycji. 124 zdjęcia w pełnej galerii.',
    heroImage: `${IMG}/06-dni-izbicy-koncert.jpg`,
    heroAlt: 'Galeria Dni Izbicy 2025',
    author: A['redakcja'],
    publishedAt: '10 maja',
    publishedAtISO: '2026-05-10T12:00:00+02:00',
    views: 5640,
    commentCount: 14,
    featured: true,
    galleryId: 'g-dni-izbicy-2025',
    tags: ['galeria', 'Dni Izbicy'],
    blocks: [
      { type: 'gallery' as const, galleryId: 'g-dni-izbicy-2025' },
      p('Archiwalna galeria z Dni Izbicy 2025. W pełnym zbiorze 124 fotografie z trzech dni świętowania.'),
    ],
  }),
]

// ─────────────────────────────────────────────────────────────────────────────
// GALERIE
// ─────────────────────────────────────────────────────────────────────────────

export const GALLERIES: Gallery[] = [
  {
    id: 'g-dni-izbicy-2025',
    slug: 'dni-izbicy-2025',
    title: 'Dni Izbicy 2025',
    description:
      'Trzy dni świętowania w Izbicy Kujawskiej — koncerty, Turniej Sołectw, dożynki gminno-parafialne. Wybór 124 fotografii.',
    cover: `${IMG}/06-dni-izbicy-koncert.jpg`,
    section: 'kultura',
    publishedAt: '10 maja 2026',
    eventDate: '2025-06-15',
    photos: [
      { src: `${IMG}/06-dni-izbicy-koncert.jpg`, alt: 'Koncert główny', caption: 'Koncert gwiazdy wieczoru na Placu Wolności', credit: 'fot. Izbica24.pl' },
      { src: `${IMG}/04-kujawianka-celebracja.jpg`, alt: 'Turniej Sołectw', caption: 'Finał Turnieju Sołectw o Puchar Burmistrza', credit: 'fot. Izbica24.pl' },
      { src: `${IMG}/15-kgw-pasieka-chleb.jpg`, alt: 'Stoisko KGW', caption: 'Stoisko KGW Pasieczanki — chleb kujawski', credit: 'fot. Izbica24.pl' },
      { src: `${IMG}/14-pielgrzymka-blenna.jpg`, alt: 'Msza dożynkowa', caption: 'Msza dożynkowa w kościele parafialnym', credit: 'fot. Izbica24.pl' },
      { src: `${IMG}/17-swietlica-sadlno.jpg`, alt: 'Wieńce dożynkowe', caption: 'Prezentacja wieńców 34 sołectw', credit: 'fot. Izbica24.pl' },
      { src: `${IMG}/08-edukacja-szkola.jpg`, alt: 'Warsztaty dla dzieci', caption: 'Warsztaty ceramiczne w strefie rodzinnej', credit: 'fot. Izbica24.pl' },
    ],
  },
  {
    id: 'g-kujawianka-sparta',
    slug: 'kujawianka-sparta-brzesc-3-1',
    title: 'Kujawianka — Sparta Brześć 3:1',
    description: 'Fotorelacja z 25. kolejki Klasy Okręgowej. Hat-trick Adama Adamiaka.',
    cover: `${IMG}/04-kujawianka-celebracja.jpg`,
    section: 'sport',
    publishedAt: '21 maja 2026',
    eventDate: '2026-05-21',
    photos: [
      { src: `${IMG}/04-kujawianka-celebracja.jpg`, alt: 'Celebracja bramki', caption: 'Radość po trzeciej bramce Adamiaka', credit: 'fot. Izbica24.pl' },
      { src: `${IMG}/12-portret-pilkarz.jpg`, alt: 'Adam Adamiak', caption: 'Bohater spotkania — Adam Adamiak', credit: 'fot. Izbica24.pl' },
    ],
  },
  {
    id: 'g-wietrzychowice-wykopaliska',
    slug: 'wietrzychowice-wykopaliska-2026',
    title: 'Wietrzychowice — wykopaliska 2026',
    description: 'Prace archeologów UMK przy siódmym grobowcu kujawskim.',
    cover: `${IMG}/05-wietrzychowice-megality.jpg`,
    section: 'natura',
    publishedAt: '21 maja 2026',
    photos: [
      { src: `${IMG}/05-wietrzychowice-megality.jpg`, alt: 'Grobowiec kujawski', caption: 'Obstawa kamienna grobowca nr 1', credit: 'fot. Izbica24.pl' },
      { src: `${IMG}/18-szlak-megality.jpg`, alt: 'Szlak megalitów', caption: 'Ścieżka dydaktyczna w parku', credit: 'fot. Izbica24.pl' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// BIBLIOTEKA MEDIÓW (dla panelu admina)
// ─────────────────────────────────────────────────────────────────────────────

export const MEDIA_LIBRARY: MediaAsset[] = [
  { id: 'm-001', kind: 'image', url: `${IMG}/01-hero-ulica-koscielna.jpg`, title: 'Remont ul. Kościelnej', alt: 'Nowa nawierzchnia ul. Kościelnej', credit: 'fot. Izbica24.pl', width: 1600, height: 1067, mime: 'image/jpeg', uploadedAt: '2026-05-22', uploadedBy: 'anna-wojcik', tags: ['inwestycje', 'drogi'] },
  { id: 'm-002', kind: 'image', url: `${IMG}/02-osp-pozar-stodola.jpg`, title: 'OSP — pożar stodoły w Bierzynie', credit: 'fot. OSP Izbica', mime: 'image/jpeg', uploadedAt: '2026-05-23', uploadedBy: 'marek-kowalski', tags: ['OSP', 'pożar'] },
  { id: 'm-003', kind: 'image', url: `${IMG}/03-sesja-rady-miejskiej.jpg`, title: 'Sesja Rady Miejskiej', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-22', tags: ['samorząd'] },
  { id: 'm-004', kind: 'image', url: `${IMG}/04-kujawianka-celebracja.jpg`, title: 'Kujawianka — celebracja', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-21', tags: ['Kujawianka', 'sport'] },
  { id: 'm-005', kind: 'image', url: `${IMG}/05-wietrzychowice-megality.jpg`, title: 'Wietrzychowice — megality', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-21', tags: ['historia', 'Wietrzychowice'] },
  { id: 'm-006', kind: 'image', url: `${IMG}/06-dni-izbicy-koncert.jpg`, title: 'Dni Izbicy — koncert', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-20', tags: ['kultura', 'MGCK'] },
  { id: 'm-007', kind: 'image', url: `${IMG}/07-rolnictwo-rzepak.jpg`, title: 'Pole rzepaku', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-22', tags: ['rolnictwo'] },
  { id: 'm-008', kind: 'image', url: `${IMG}/08-edukacja-szkola.jpg`, title: 'Szkoła Podstawowa nr 1', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-22', tags: ['edukacja'] },
  { id: 'm-009', kind: 'image', url: `${IMG}/09-spzoz-pielegniarka.jpg`, title: 'SPZOZ Izbica', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-21', tags: ['zdrowie'] },
  { id: 'm-010', kind: 'image', url: `${IMG}/10-portret-burmistrz.jpg`, title: 'Portret — Marek Dorabiała', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-20', tags: ['portret', 'samorząd'] },
  { id: 'm-011', kind: 'image', url: `${IMG}/11-portret-bibliotekarka.jpg`, title: 'Portret — Jadwiga Kowalska', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-18', tags: ['portret', 'kultura'] },
  { id: 'm-012', kind: 'image', url: `${IMG}/12-portret-pilkarz.jpg`, title: 'Portret — Adam Adamiak', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-16', tags: ['portret', 'sport'] },
  { id: 'm-013', kind: 'image', url: `${IMG}/13-tochman-bibl.jpg`, title: 'Biblioteka — spotkanie autorskie', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-22', tags: ['biblioteka'] },
  { id: 'm-014', kind: 'image', url: `${IMG}/14-pielgrzymka-blenna.jpg`, title: 'Pielgrzymka do Błenny', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-21', tags: ['parafie'] },
  { id: 'm-015', kind: 'image', url: `${IMG}/15-kgw-pasieka-chleb.jpg`, title: 'KGW Pasieczanki — chleb', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-20', tags: ['KGW', 'tradycja'] },
  { id: 'm-016', kind: 'image', url: `${IMG}/16-srodowisko-odpady.jpg`, title: 'Środowisko — odpady', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-20', tags: ['środowisko'] },
  { id: 'm-017', kind: 'image', url: `${IMG}/17-swietlica-sadlno.jpg`, title: 'Świetlica w Sadłnie', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-18', tags: ['sołectwa'] },
  { id: 'm-018', kind: 'image', url: `${IMG}/18-szlak-megality.jpg`, title: 'Szlak megalitów', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-16', tags: ['turystyka'] },
  { id: 'm-019', kind: 'image', url: `${IMG}/19-policja-patrol.jpg`, title: 'Patrol policji', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-23', tags: ['bezpieczeństwo'] },
  { id: 'm-020', kind: 'image', url: `${IMG}/20-pogoda-kujawy.jpg`, title: 'Pogoda nad Kujawami', credit: 'fot. Izbica24.pl', mime: 'image/jpeg', uploadedAt: '2026-05-23', tags: ['pogoda'] },
  { id: 'm-101', kind: 'audio', url: '/static/audio/glos-izbicy-023.mp3', thumb: `${IMG}/10-portret-burmistrz.jpg`, title: 'Głos Izbicy #23 — Burmistrz o termomodernizacji', durationSec: 1928, mime: 'audio/mpeg', uploadedAt: '2026-05-22', uploadedBy: 'tomasz-kotlinski', tags: ['podcast'] },
  { id: 'm-102', kind: 'audio', url: '/static/audio/glos-izbicy-022.mp3', thumb: `${IMG}/13-tochman-bibl.jpg`, title: 'Głos Izbicy #22 — Historia żydowska Izbicy', durationSec: 1692, mime: 'audio/mpeg', uploadedAt: '2026-05-15', tags: ['podcast', 'historia'] },
  { id: 'm-103', kind: 'audio', url: '/static/audio/glos-izbicy-021.mp3', thumb: `${IMG}/05-wietrzychowice-megality.jpg`, title: 'Głos Izbicy #21 — Wietrzychowice', durationSec: 2140, mime: 'audio/mpeg', uploadedAt: '2026-05-08', tags: ['podcast'] },
  { id: 'm-104', kind: 'audio', url: '/static/audio/glos-izbicy-020.mp3', thumb: `${IMG}/03-sesja-rady-miejskiej.jpg`, title: 'Głos Izbicy #20 — Podsumowanie tygodnia', durationSec: 768, mime: 'audio/mpeg', uploadedAt: '2026-05-21', tags: ['podcast'] },
  { id: 'm-201', kind: 'video', url: 'https://www.youtube.com/embed/placeholder-dni-izbicy', thumb: `${IMG}/06-dni-izbicy-koncert.jpg`, title: 'Dni Izbicy 2026 — zapowiedź (reportaż)', durationSec: 263, mime: 'video/mp4', uploadedAt: '2026-05-20', tags: ['wideo', 'reportaż'] },
  { id: 'm-301', kind: 'document', url: '/static/docs/harmonogram-odpady-2026-06.pdf', title: 'Harmonogram odpadów — czerwiec 2026', sizeBytes: 655360, mime: 'application/pdf', uploadedAt: '2026-05-20', tags: ['komunikaty'] },
  { id: 'm-302', kind: 'document', url: '/static/docs/arimr-2026-instrukcja.pdf', title: 'Instrukcja wniosku ARiMR 2026', sizeBytes: 2202009, mime: 'application/pdf', uploadedAt: '2026-05-22', tags: ['rolnictwo'] },
]
