// ============================================================================
// IZBICA24.PL v4 — TAKSONOMIA PORTALU
// Źródło prawdy: "PORTAL IZBICA24.PL — FINALNA STRUKTURA KATEGORII I PODKATEGORII"
// 12 pozycji menu głównego + pełne drzewo podkategorii (z 3. poziomem)
// ============================================================================

export interface SubCategory {
  slug: string
  title: string
  /** Pełna ścieżka URL, np. /wiadomosci/inwestycje */
  path: string
  description: string
  /** Trzeci poziom (np. parafie, wideo, podcast, galerie) */
  children?: SubCategory[]
}

export interface Category {
  slug: string
  title: string
  /** Krótka nazwa w belce nawigacji */
  navLabel: string
  path: string
  /** Zmienna CSS koloru kategorii z izbica-v4.css */
  colorVar: string
  /** Wartość hex — do badge'y i sitemapy */
  color: string
  /** Klasa modyfikatora dla .tag */
  tagClass: string
  lead: string
  subcategories: SubCategory[]
}

const sub = (
  parent: string,
  slug: string,
  title: string,
  description: string,
  children?: SubCategory[]
): SubCategory => ({
  slug,
  title,
  path: `/${parent}/${slug}`,
  description,
  children,
})

export const CATEGORIES: Category[] = [
  // ────────────────────────────────────────────────────────── 2. WIADOMOŚCI
  {
    slug: 'wiadomosci',
    title: 'Wiadomości',
    navLabel: 'Wiadomości',
    path: '/wiadomosci',
    colorVar: 'var(--c-news)',
    color: '#d6121a',
    tagClass: '',
    lead:
      'Główna kategoria informacyjna portalu. Wszystko, co jest bieżącą informacją z gminy Izbica Kujawska.',
    subcategories: [
      sub('wiadomosci', 'inwestycje', 'Inwestycje i remonty', 'Drogi, kanalizacja, wodociągi, budynki publiczne, przetargi, fundusze UE.'),
      // Wykaz zgodny z oficjalną listą placówek oświatowych gminy
      // (izbicakuj.pl/placowki-oswiatowe.html): SP nr 1 im. Marszałka
      // Józefa Piłsudskiego, SP nr 2 im. Augustyna Słubickiego,
      // SP w Błennie, Przedszkole Samorządowe, Samorządowy Żłobek.
      // Ponadprowadzony przez powiat Zespół Szkół im. Jana Kasprowicza.
      //
      // Usunięte „SP Sarnowo": Publiczna Szkoła Podstawowa im. st. sierż.
      // Feliksa Rybickiego w Sarnowie ma wprawdzie adres pocztowy
      // „Józefowo 2, 87-865 Izbica Kujawska", ale organem prowadzącym
      // jest gmina Lubraniec (wykaz szkół woj. kujawsko-pomorskiego,
      // TERYT 418125) i w wykazie placówek gminy Izbica Kujawska jej nie
      // ma. Kod pocztowy Izbicy obsługuje także część gminy Lubraniec —
      // stąd pomyłka. Opisy podkategorii trafiają do meta description,
      // więc gmina ogłaszałaby w Google szkołę, której nie prowadzi.
      sub('wiadomosci', 'edukacja', 'Edukacja', 'SP nr 1, SP nr 2, SP Błenna, Zespół Szkół im. Kasprowicza, przedszkole, żłobek.'),
      sub('wiadomosci', 'zdrowie', 'Zdrowie', 'SPZOZ Izbica Kujawska, godziny przyjęć, szczepienia, programy profilaktyczne, NFZ.'),
      sub('wiadomosci', 'spoleczne', 'Społeczne', 'MGOPS, programy socjalne, pomoc żywnościowa, seniorzy, Caritas, rodzina.'),
      sub('wiadomosci', 'komunikaty', 'Komunikaty i ogłoszenia', 'Wyłączenia prądu i wody, objazdy, harmonogramy odpadów, ostrzeżenia meteo.'),
      sub('wiadomosci', 'srodowisko', 'Środowisko i ekologia', 'Gospodarka odpadami, segregacja, ochrona przyrody, Kanał Zgłowiączki, nasadzenia.'),
      sub('wiadomosci', 'rolnictwo', 'Rolnictwo', 'Dopłaty ARiMR, szkolenia KPODR, ceny skupu, melioracje, Gminna Spółka Wodna.'),
    ],
  },

  // ─────────────────────────────────────────────────────────── 3. NA SYGNALE
  {
    slug: 'na-sygnale',
    title: 'Na sygnale',
    navLabel: 'Na sygnale',
    path: '/na-sygnale',
    colorVar: 'var(--c-sygnale)',
    color: '#ff1f28',
    tagClass: 'sygnale',
    lead: 'Interwencje służb ratunkowych i mundurowych. Najczęściej czytana sekcja portalu.',
    subcategories: [
      sub('na-sygnale', 'wypadki', 'Wypadki i kolizje', 'Zdarzenia drogowe na drogach gminy i powiatu włocławskiego.'),
      sub('na-sygnale', 'pozary', 'Pożary', 'Pożary budynków, stodół, lasów, traw i pojazdów — interwencje OSP i PSP.'),
      sub('na-sygnale', 'interwencje', 'Interwencje ratunkowe', 'Zdarzenia medyczne, poszukiwania osób, akcje ratownicze, ćwiczenia.'),
      sub('na-sygnale', 'policja', 'Kronika policyjna', 'Zatrzymania, kradzieże, oszustwa, włamania, kontrole drogowe.'),
      sub('na-sygnale', 'awarie', 'Pogotowie i awarie', 'Awarie wodociągów, kanalizacji, sieci energetycznej i gazowej.'),
    ],
  },

  // ───────────────────────────────────────────────────────────── 4. SAMORZĄD
  {
    slug: 'samorzad',
    title: 'Samorząd',
    navLabel: 'Samorząd',
    path: '/samorzad',
    colorVar: 'var(--c-samorzad)',
    color: '#1e4a8a',
    tagClass: 'samorzad',
    lead: 'Informacje o działalności władz gminy Izbica Kujawska i powiatu włocławskiego.',
    subcategories: [
      sub('samorzad', 'urzad', 'Urząd Miejski', 'Zarządzenia burmistrza, informacje urzędowe, godziny pracy, zmiany kadrowe.'),
      sub('samorzad', 'rada', 'Rada Miejska', 'Relacje z sesji, uchwały z komentarzem, interpelacje radnych, komisje.'),
      sub('samorzad', 'budzet', 'Budżet i finanse', 'Budżet gminy, dotacje UE, fundusze rządowe, zmiany budżetowe.'),
      sub('samorzad', 'solectwa', 'Sołectwa', 'Fundusz sołecki, zebrania wiejskie, inicjatywy, wybory sołtysów — wszystkie sołectwa gminy.'),
      sub('samorzad', 'powiat', 'Powiat włocławski', 'Starostwo: drogi powiatowe, pozwolenia, edukacja ponadpodstawowa, PUP.'),
      sub('samorzad', 'wybory', 'Wybory i referenda', 'Kandydaci, programy, wyniki, frekwencja, okręgi i komisje wyborcze.'),
    ],
  },

  // ─────────────────────────────────────────────────────────── 5. KUJAWIANKA
  {
    slug: 'kujawianka',
    title: 'Kujawianka',
    navLabel: 'Kujawianka',
    path: '/kujawianka',
    colorVar: 'var(--c-kujawianka)',
    color: '#0d7a3e',
    tagClass: 'kujawianka',
    lead: 'MGKS Kujawianka Izbica Kujawska — jedyny klub sportowy w gminie, od 1949 roku.',
    subcategories: [
      sub('kujawianka', 'aktualnosci', 'Aktualności', 'Transfery, treningi, sparingi, kontuzje, komunikaty zarządu, sponsoring.'),
      sub('kujawianka', 'mecze', 'Mecze i wyniki', 'Zapowiedzi meczowe i relacje pomeczowe: wynik, bramki, przebieg, ocena.'),
      sub('kujawianka', 'tabela', 'Tabela i terminarz', 'Tabela Klasy Okręgowej gr. 2 oraz terminarz rozgrywek — aktualizacja po kolejce.'),
      sub('kujawianka', 'kadra', 'Kadra', 'Lista zawodników, sztab szkoleniowy, zarząd klubu.'),
      sub('kujawianka', 'junior', 'Junior i młodzież', 'Drużyny juniorskie, młodzieżowe, szkółka piłkarska — wyniki i turnieje.'),
      sub('kujawianka', 'historia', 'Historia klubu', 'Od 1949 roku do dziś: sezony, sukcesy, legendy klubu, old boys, rocznice.'),
      sub('kujawianka', 'galeria', 'Galeria', 'Zdjęcia z meczów, treningów i wydarzeń klubowych.'),
    ],
  },

  // ────────────────────────────────────────────────────────────── 6. KULTURA
  {
    slug: 'kultura',
    title: 'Kultura',
    navLabel: 'Kultura',
    path: '/kultura',
    colorVar: 'var(--c-kultura)',
    color: '#8b2c8e',
    tagClass: 'kultura',
    lead: 'Życie kulturalne, religijne i społeczne gminy Izbica Kujawska.',
    subcategories: [
      sub('kultura', 'mgck', 'MGCK – Centrum Kultury', 'Wydarzenia, warsztaty, koncerty, Dni Izbicy, dożynki, zajęcia i wystawy.'),
      sub('kultura', 'biblioteka', 'Biblioteka', 'Spotkania autorskie, nowe książki, warsztaty czytelnicze, konkursy.'),
      sub('kultura', 'parafie', 'Kościół i parafie', 'Życie religijne w gminie — trzy parafie i dekanat izbicki.', [
        sub('kultura/parafie', 'izbica', 'Parafia NMP Izbica', 'Ogłoszenia parafialne, odpusty, pielgrzymki, rekolekcje, sakramenty.'),
        sub('kultura/parafie', 'blenna', 'Parafia Błenna', 'Sanktuarium MB Łaskawej Księżnej Kujaw, odpusty, pielgrzymki, zabytkowy kościół.'),
        sub('kultura/parafie', 'modzerowo', 'Parafia Modzerowo', 'Wydarzenia parafialne w Modzerowie.'),
        sub('kultura/parafie', 'dekanat', 'Dekanat izbicki', 'Informacje obejmujące cały dekanat (8 parafii) i diecezję włocławską.'),
      ]),
      sub('kultura', 'orionisci', 'Orioniści – DPS', 'Dom Pomocy Społecznej im. ks. Karola Sterpi — życie podopiecznych, uroczystości.'),
      sub('kultura', 'kgw', 'KGW i tradycja', 'Notecianki, Pasieczanki, Świszewy, Świętosławice — imprezy, tradycje kujawskie.'),
      sub('kultura', 'rozrywka', 'Rozrywka', 'Fenix Club, koncerty, eventy, majówki, festyny i pikniki.'),
      sub('kultura', 'kalendarz', 'Kalendarz wydarzeń', 'Interaktywny kalendarz wszystkich nadchodzących wydarzeń w gminie.'),
    ],
  },

  // ────────────────────────────────────────────────────────────── 7. HISTORIA
  {
    slug: 'historia',
    title: 'Historia',
    navLabel: 'Historia',
    path: '/historia',
    colorVar: 'var(--c-historia)',
    color: '#b8860b',
    tagClass: 'historia',
    lead: 'Sekcja evergreen — strategiczna rezerwa treści i generator ruchu organicznego.',
    subcategories: [
      sub('historia', 'dzieje', 'Dzieje Izbicy Kujawskiej', 'Od neolitu przez prawa miejskie 1750, zabory, wojny, PRL po współczesność.'),
      sub('historia', 'wietrzychowice', 'Wietrzychowice – Polskie Piramidy', 'Park Kulturowy, grobowce kujawskie sprzed 5 500 lat, badania archeologiczne.'),
      sub('historia', 'spolecznosc-zydowska', 'Społeczność żydowska', 'Historia Żydów w Izbicy, synagoga 1880–1895, cmentarz, jesziwa, Zagłada, pamięć.'),
      sub('historia', 'stare-zdjecia', 'Dawna Izbica w fotografii', 'Archiwalne zdjęcia z komentarzem — „poznajesz to miejsce?”.'),
      // Zagrodnica zostaje — to realna część miasta na zachód od starówki
      // (w rejonie ul. Narutowicza) z zachowanym dworem szlacheckim,
      // potwierdzona w polskiezabytki.pl (obiekt 1029, gmina Izbica
      // Kujawska). W dworze działa dziś dom pomocy społecznej, więc
      // nazwa „dwór w Izbicy-Zagrodnicy" jest ściślejsza niż sama
      // „Zagrodnica" — czytelnik nie szuka wtedy osobnej wsi.
      sub('historia', 'zabytki', 'Zabytki i architektura', 'Gotycki kościół NMP, dwór w Izbicy-Zagrodnicy, rynek historyczny, kapliczki.'),
      sub('historia', 'sylwetki', 'Sylwetki historyczne', 'Biogramy zasłużonych mieszkańców i postaci historycznych związanych z miastem.'),
      sub('historia', 'tego-dnia', 'Tego dnia w Izbicy', 'Cykl „co wydarzyło się tego dnia w historii Izbicy Kujawskiej”.'),
      sub('historia', 'publikacje', 'Artykuły naukowe i publikacje', 'Zapiski Kujawsko-Dobrzyńskie, prace archeologiczne, publikacje diecezjalne.'),
    ],
  },

  // ─────────────────────────────────────────────────────────────── 8. LUDZIE
  {
    slug: 'ludzie',
    title: 'Ludzie',
    navLabel: 'Ludzie',
    path: '/ludzie',
    colorVar: 'var(--c-ludzie)',
    color: '#d6121a',
    tagClass: 'dark',
    lead: 'Portrety, wywiady i sukcesy mieszkańców gminy. Sekcja w 100% redakcyjna.',
    subcategories: [
      sub('ludzie', 'wywiady', 'Wywiady', 'Rozmowy z burmistrzem, dyrektorami, proboszczem, sołtysami, trenerem, działaczami.'),
      sub('ludzie', 'sylwetki', 'Sylwetki mieszkańców', 'Najstarsi mieszkańcy, rzemieślnicy, rolnicy, pasjonaci, wolontariusze, strażacy.'),
      sub('ludzie', 'sukcesy', 'Sukcesy', 'Uczniowie, sportowcy, odznaczeni mieszkańcy, nagrodzone firmy i rolnicy.'),
      sub('ludzie', 'wspomnienia', 'Wspomnienia', 'Wspomnienia pośmiertne, życiorysy i hołdy dla zasłużonych mieszkańców.'),
    ],
  },

  // ────────────────────────────────────────────────────── 9. ŻYCIE CODZIENNE
  {
    slug: 'zycie-codzienne',
    title: 'Życie codzienne',
    navLabel: 'Życie codzienne',
    path: '/zycie-codzienne',
    colorVar: 'var(--c-zycie)',
    color: '#2d6a4f',
    tagClass: 'zycie',
    lead: 'Praktyczna wiedza o gminie — treści przydatne dla mieszkańca Izbicy Kujawskiej.',
    subcategories: [
      sub('zycie-codzienne', 'poradnik', 'Poradnik mieszkańca', 'Wnioski, harmonogramy, godziny pracy urzędu, rozkłady busów, dokumenty.'),
      sub('zycie-codzienne', 'zdrowie', 'Zdrowie i profilaktyka', 'Godziny SPZOZ, badania w powiecie, szczepienia, program 40 PLUS.'),
      sub('zycie-codzienne', 'rolnictwo', 'Rolnictwo i doradztwo', 'Terminy ARiMR, szkolenia KPODR, ceny skupu, susze i melioracje.'),
      sub('zycie-codzienne', 'turystyka', 'Turystyka i rekreacja', 'Szlak megalitów, synagoga, trasy rowerowe, Jezioro Głuszyńskie, Brdów.'),
      sub('zycie-codzienne', 'edukacja', 'Edukacja i rozwój', 'Rekrutacja ZS Kasprowicza, kursy LGD, dotacje na działalność, oferty PUP.'),
      sub('zycie-codzienne', 'bezpieczenstwo', 'Bezpieczeństwo', 'Posterunek Policji, dzielnicowi, zgłaszanie przestępstw, oszustwa.'),
      sub('zycie-codzienne', 'dom', 'Dom i ogród', 'Kalendarz ogrodnika Kujawy, przeglądy pieców, programy termomodernizacji.'),
      sub('zycie-codzienne', 'pogoda', 'Pogoda i sezon', 'Prognoza dla rolników, sezon grzewczy, stan dróg, poziom wody w kanale.'),
    ],
  },

  // ────────────────────────────────────────────────────── 10. PRZEGLĄD MEDIÓW
  {
    slug: 'przeglad-mediow',
    title: 'Przegląd mediów',
    navLabel: 'Przegląd mediów',
    path: '/przeglad-mediow',
    colorVar: 'var(--c-przeglad)',
    color: '#2563a8',
    tagClass: 'przeglad',
    lead: 'O Izbicy piszą inni — automatyczna agregacja publikacji z mediów regionalnych.',
    subcategories: [
      sub('przeglad-mediow', 'portale', 'Portale informacyjne', 'ddwloclawek.pl, nwloclawek.pl, portalwloclawek.pl, gloswloclawianina.pl.'),
      sub('przeglad-mediow', 'gazeta-pomorska', 'Gazeta Pomorska', 'Artykuły z pomorska.pl dotyczące Izbicy i powiatu włocławskiego.'),
      sub('przeglad-mediow', 'tv-radio', 'Telewizja i radio', 'TV Kujawy, TVP3 Bydgoszcz, Radio Kujawy, Radio Włocławek, Radio PiK.'),
      sub('przeglad-mediow', 'social-media', 'Media społecznościowe', 'Przetworzone posty z publicznych profili instytucji i grup lokalnych.'),
    ],
  },

  // ─────────────────────────────────────────────────────────── 11. MULTIMEDIA
  {
    slug: 'multimedia',
    title: 'Multimedia',
    navLabel: 'Multimedia',
    path: '/multimedia',
    colorVar: 'var(--c-multimedia)',
    color: '#0a0a0a',
    tagClass: 'dark',
    lead: 'Wideo, podcast „Głos Izbicy”, galerie zdjęć i infografiki.',
    subcategories: [
      sub('multimedia', 'wideo', 'Wideo', 'Materiały wideo z życia gminy — reportaże, relacje, wywiady, drony.', [
        sub('multimedia/wideo', 'reportaze', 'Reportaże', 'Dłuższe formy wideo o gminie i jej mieszkańcach.'),
        sub('multimedia/wideo', 'relacje', 'Relacje z wydarzeń', 'Nagrania z sesji, uroczystości, festynów i imprez.'),
        sub('multimedia/wideo', 'wywiady', 'Wywiady wideo', 'Rozmowy z mieszkańcami i przedstawicielami instytucji.'),
        sub('multimedia/wideo', 'drony', 'Drony nad Izbicą', 'Ujęcia z powietrza — gmina, sołectwa, inwestycje, krajobraz.'),
      ]),
      sub('multimedia', 'podcast', 'Podcast „Głos Izbicy”', 'Audio: podsumowania tygodnia, rozmowy i historia na ucho.', [
        sub('multimedia/podcast', 'tydzien', 'Podsumowanie tygodnia', 'Najważniejsze wydarzenia tygodnia w 10–15 minutach.'),
        sub('multimedia/podcast', 'rozmowy', 'Rozmowy', 'Wywiady 20–30 minut z mieszkańcami gminy.'),
        sub('multimedia/podcast', 'historia', 'Historia na ucho', 'Artykuły historyczne w wersji audio.'),
      ]),
      sub('multimedia', 'galerie', 'Galerie zdjęć', 'Galerie pogrupowane tematycznie — każde wydarzenie to galeria.', [
        sub('multimedia/galerie', 'oficjalne', 'Oficjalne uroczystości', 'Sesje, jubileusze, święta państwowe, wizyty.'),
        sub('multimedia/galerie', 'sport', 'Sport', 'Mecze Kujawianki, turnieje, zawody, drużyny młodzieżowe.'),
        sub('multimedia/galerie', 'kultura', 'Kultura i szkoły', 'MGCK, biblioteka, szkolne akademie, wystawy, warsztaty.'),
        sub('multimedia/galerie', 'na-sygnale', 'Na sygnale', 'Dokumentacja interwencji służb — OSP, policja, pogotowie.'),
        sub('multimedia/galerie', 'natura', 'Natura i krajobraz', 'Kujawska przyroda, pola, Kanał Zgłowiączki, pory roku.'),
      ]),
      sub('multimedia', 'infografiki', 'Infografiki', 'Budżet gminy, statystyki demograficzne, wyniki wyborów, podsumowania.'),
    ],
  },

  // ─────────────────────────────────────────────────────────── 12. OGŁOSZENIA
  {
    slug: 'ogloszenia',
    title: 'Ogłoszenia',
    navLabel: 'Ogłoszenia',
    path: '/ogloszenia',
    colorVar: 'var(--ink)',
    color: '#0a0a0a',
    tagClass: 'dark',
    lead: 'Społeczność Izbica — nekrologi, praca, nieruchomości, usługi i katalog firm.',
    subcategories: [
      sub('ogloszenia', 'nekrologi', 'Nekrologi', 'Ogłoszenia o zgonach mieszkańców gminy i okolic.'),
      sub('ogloszenia', 'rocznice', 'Rocznice i podziękowania', 'Rocznice śmierci, podziękowania za kondolencje, życzenia jubileuszowe.'),
      sub('ogloszenia', 'praca', 'Praca', 'Oferty pracy w gminie i okolicy, także z PUP Włocławek.'),
      sub('ogloszenia', 'drobne', 'Kupię / Sprzedam / Zamienię', 'Darmowe ogłoszenia drobne dla mieszkańców gminy.'),
      sub('ogloszenia', 'nieruchomosci', 'Nieruchomości', 'Sprzedaż i wynajem domów, mieszkań, działek i gruntów rolnych.'),
      sub('ogloszenia', 'uslugi', 'Usługi', 'Hydraulik, elektryk, mechanik, korepetycje, transport.'),
      sub('ogloszenia', 'firmy', 'Katalog firm', 'Baza lokalnych przedsiębiorców — wizytówki firm z gminy i okolic.'),
    ],
  },
]

// ─────────────────────────────────────────────────────────── SOŁECTWA
// Liczbę bierzemy z SOLECTWA.length, nigdy z liczby wpisanej w tekście —
// wcześniej w nawiasie stało „(34)", a tablica po weryfikacji ma 36 wpisów.
export interface Solectwo {
  slug: string
  name: string
  articleCount: number
  /** Szerokość geograficzna wsi (OpenStreetMap, ODbL). */
  lat?: number
  /** Długość geograficzna wsi (OpenStreetMap, ODbL). */
  lon?: number
}

export const SOLECTWA: Solectwo[] = [
  // ══════════════════════════════════════════════════════════════════════
  // LISTA GENEROWANA — nie edytuj ręcznie.
  //   node scripts/i10-generuj-taksonomie.mjs
  // Źródło: data/solectwa-osm.json (Wikipedia + OpenStreetMap).
  //
  // Poprzednia zawartość tej tablicy zawierała 16 nazw, które NIE są
  // sołectwami gminy Izbica Kujawska. Trzy z nich leżą w gminach
  // sąsiednich (Bierzyn i Lubomin — Boniewo, Sarnowo — Lubraniec),
  // pozostałych OpenStreetMap nie zna w tym rejonie. Jednocześnie
  // brakowało 18 sołectw istniejących. Szczegóły i sposób weryfikacji:
  // scripts/i10-geokoduj-solectwa.mjs
  //
  // `articleCount: 0` jest prawdą — żaden artykuł nie ma jeszcze
  // ustawionego solectwo_slug. Wcześniejsze liczby były wymyślone
  // i obiecywały czytelnikowi materiały, których nie było.
  //
  // Współrzędne: OpenStreetMap, licencja ODbL. Wyświetlając mapę
  // trzeba pokazać „© OpenStreetMap contributors" — to warunek licencji.
  // ══════════════════════════════════════════════════════════════════════
  { slug: 'augustynowo',       name: 'Augustynowo',        articleCount: 0, lat: 52.433223, lon: 18.770186 },
  { slug: 'blenna',            name: 'Błenna',             articleCount: 0, lat: 52.3844, lon: 18.87943 },
  { slug: 'blenna-a',          name: 'Błenna A',           articleCount: 0, lat: 52.379596, lon: 18.895338 },
  { slug: 'blenna-b',          name: 'Błenna B',           articleCount: 0, lat: 52.367476, lon: 18.897395 },
  { slug: 'chociszewo',        name: 'Chociszewo',         articleCount: 0, lat: 52.382706, lon: 18.811295 },
  { slug: 'cieplinki',         name: 'Cieplinki',          articleCount: 0, lat: 52.34738, lon: 18.833333 },
  { slug: 'ciepliny',          name: 'Ciepliny',           articleCount: 0, lat: 52.36706, lon: 18.84293 },
  { slug: 'dlugie',            name: 'Długie',             articleCount: 0, lat: 52.399561, lon: 18.751802 },
  { slug: 'gasiorowo',         name: 'Gąsiorowo',          articleCount: 0, lat: 52.378889, lon: 18.921111 },
  { slug: 'grochowiska',       name: 'Grochowiska',        articleCount: 0, lat: 52.413656, lon: 18.72514 },
  { slug: 'helenowo',          name: 'Helenowo',           articleCount: 0, lat: 52.386898, lon: 18.860833 },
  { slug: 'hulanka',           name: 'Hulanka',            articleCount: 0, lat: 52.430556, lon: 18.725278 },
  { slug: 'joasin',            name: 'Joasin',             articleCount: 0, lat: 52.355833, lon: 18.860556 },
  { slug: 'jozefowo',          name: 'Józefowo',           articleCount: 0, lat: 52.415493, lon: 18.781631 },
  { slug: 'kazanki',           name: 'Kazanki',            articleCount: 0, lat: 52.401535, lon: 18.817473 },
  { slug: 'kazimierowo',       name: 'Kazimierowo',        articleCount: 0, lat: 52.442222, lon: 18.738056 },
  { slug: 'komorowo',          name: 'Komorowo',           articleCount: 0, lat: 52.390983, lon: 18.797281 },
  { slug: 'mchowek',           name: 'Mchówek',            articleCount: 0, lat: 52.41867, lon: 18.68712 },
  { slug: 'mieczyslawowo',     name: 'Mieczysławowo',      articleCount: 0, lat: 52.357205, lon: 18.790692 },
  { slug: 'modzerowo',         name: 'Modzerowo',          articleCount: 0, lat: 52.34794, lon: 18.77023 },
  { slug: 'naczachowo',        name: 'Naczachowo',         articleCount: 0, lat: 52.406093, lon: 18.842876 },
  { slug: 'nowa-wies',         name: 'Nowa Wieś',          articleCount: 0, lat: 52.369248, lon: 18.818298 },
  { slug: 'obalki',            name: 'Obałki',             articleCount: 0, lat: 52.42133, lon: 18.838957 },
  { slug: 'pasieka',           name: 'Pasieka',            articleCount: 0, lat: 52.45184, lon: 18.79812 },
  { slug: 'skarbanowo',        name: 'Skarbanowo',         articleCount: 0, lat: 52.43007, lon: 18.820894 },
  { slug: 'sokolowo',          name: 'Sokołowo',           articleCount: 0, lat: 52.423594, lon: 18.796992 },
  { slug: 'szczkowek',         name: 'Szczkówek',          articleCount: 0, lat: 52.380003, lon: 18.840546 },
  { slug: 'slazewo',           name: 'Ślazewo',            articleCount: 0, lat: 52.4006, lon: 18.731061 },
  { slug: 'smiely',            name: 'Śmieły',             articleCount: 0, lat: 52.40169, lon: 18.8743 },
  { slug: 'swietoslawice',     name: 'Świętosławice',      articleCount: 0, lat: 52.388768, lon: 18.73885 },
  { slug: 'swiszewy',          name: 'Świszewy',           articleCount: 0, lat: 52.43781, lon: 18.72736 },
  { slug: 'tymien',            name: 'Tymień',             articleCount: 0, lat: 52.400744, lon: 18.774493 },
  { slug: 'wietrzychowice',    name: 'Wietrzychowice',     articleCount: 0, lat: 52.41238, lon: 18.85958 },
  { slug: 'wiszczelice',       name: 'Wiszczelice',        articleCount: 0, lat: 52.370456, lon: 18.874961 },
  { slug: 'wolka-komorowska',  name: 'Wólka Komorowska',   articleCount: 0, lat: 52.381547, lon: 18.775993 },
  { slug: 'zdzislawin',        name: 'Zdzisławin',         articleCount: 0, lat: 52.368, lon: 18.855525 },
]

// ───────────────────────────────────────────────────────────────── LOOKUP API
export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
)

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug)

export function findCategory(slug: string): Category | undefined {
  return CATEGORY_BY_SLUG[slug]
}

export function findSubcategory(
  catSlug: string,
  subSlug: string
): { category: Category; subcategory: SubCategory } | undefined {
  const category = findCategory(catSlug)
  if (!category) return undefined
  const subcategory = category.subcategories.find((s) => s.slug === subSlug)
  if (!subcategory) return undefined
  return { category, subcategory }
}

export function findThirdLevel(
  catSlug: string,
  subSlug: string,
  childSlug: string
): { category: Category; subcategory: SubCategory; child: SubCategory } | undefined {
  const found = findSubcategory(catSlug, subSlug)
  if (!found?.subcategory.children) return undefined
  const child = found.subcategory.children.find((c) => c.slug === childSlug)
  if (!child) return undefined
  return { ...found, child }
}

/** Wszystkie ścieżki taksonomii — dla sitemapy i walidacji routingu */
export function allTaxonomyPaths(): string[] {
  const out: string[] = []
  for (const cat of CATEGORIES) {
    out.push(cat.path)
    for (const s of cat.subcategories) {
      out.push(s.path)
      for (const c of s.children ?? []) out.push(c.path)
    }
  }
  return out
}
