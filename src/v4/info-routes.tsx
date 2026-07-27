// ============================================================================
// IZBICA24.PL v4 — TRASY STRON INFORMACYJNYCH
// Naprawiają błędy 500/404 widoków legacy i utrzymują je w szacie v4.
// ============================================================================

import { Hono } from 'hono'
import { CATEGORIES, SOLECTWA } from './taxonomy'
import { GMINA } from './gmina-fakty'
import { rendererV4 } from './renderer'
import { Shell } from './components/Layout'
import {
  InfoPageV4,
  NewsletterPageV4,
  AddAnnouncementPageV4,
  MapaGminyPageV4,
  type InfoSection,
} from './pages/Info'

const app = new Hono()
app.use('*', rendererV4)

const page = (
  path: string,
  title: string,
  lead: string,
  sections: InfoSection[],
  opts: { badge?: string; colorVar?: string; description?: string } = {}
) => {
  app.get(path, (c) =>
    c.render(
      <Shell>
        <InfoPageV4
          title={title}
          lead={lead}
          sections={sections}
          badge={opts.badge}
          colorVar={opts.colorVar}
        />
      </Shell>,
      { title: `${title} — Izbica24.pl`, description: opts.description || lead.slice(0, 200) }
    )
  )
}

// ─────────────────────────────────────────────────────── NEWSLETTER
app.get('/newsletter', (c) =>
  c.render(
    <Shell>
      <NewsletterPageV4 />
    </Shell>,
    {
      title: 'Newsletter „Tydzień w Izbicy” — Izbica24.pl',
      description:
        'Zapisz się do bezpłatnego newslettera Izbica24.pl. Co tydzień podsumowanie wydarzeń w gminie.',
    }
  )
)

// ───────────────────────────────────────────── DODAJ OGŁOSZENIE
app.get('/ogloszenia/dodaj', (c) =>
  c.render(
    <Shell activeCategory="ogloszenia">
      <AddAnnouncementPageV4 />
    </Shell>,
    {
      title: 'Dodaj ogłoszenie — Izbica24.pl',
      description: 'Dodaj bezpłatne ogłoszenie drobne, ofertę pracy lub usługi w gminie Izbica Kujawska.',
    }
  )
)

// ─────────────────────────────────────────────────────── MAPA GMINY
app.get('/mapa-gminy', (c) =>
  c.render(
    <Shell>
      <MapaGminyPageV4 />
    </Shell>,
    {
      title: 'Mapa gminy — instytucje i sołectwa — Izbica24.pl',
      description: `Instytucje publiczne i ${SOLECTWA.length} sołectw gminy Izbica Kujawska — adresy, telefony, godziny.`,
    }
  )
)

// ─────────────────────────────────────────────── WAŻNE TELEFONY
page(
  '/telefony',
  'Ważne telefony',
  'Numery alarmowe i kontakty do instytucji w gminie Izbica Kujawska. Zapisz na wypadek potrzeby.',
  [
    {
      heading: 'Numery alarmowe',
      body: 'W nagłych wypadkach zawsze dzwoń pod numer <strong>112</strong> — Centrum Powiadamiania Ratunkowego przekieruje zgłoszenie do właściwej służby.',
      table: {
        head: ['Służba', 'Numer'],
        rows: [
          ['Centrum Powiadamiania Ratunkowego', '<strong>112</strong>'],
          ['Policja', '997'],
          ['Straż Pożarna', '998'],
          ['Pogotowie Ratunkowe', '999'],
          ['Pogotowie gazowe', '992'],
          ['Pogotowie energetyczne PGE', '991'],
        ],
      },
    },
    {
      heading: 'Instytucje w gminie',
      body: 'Kontakty do urzędu i jednostek gminnych.',
      table: {
        head: ['Instytucja', 'Telefon', 'Godziny'],
        rows: [
          ['Urząd Miejski', '54 286 50 09', 'pon–pt 7:30–15:30, śr do 17:00'],
          ['SPZOZ Izbica — rejestracja', '54 286 51 12', 'pon–pt od 7:30'],
          ['Posterunek Policji', '47 725 42 30', 'pon–pt 8:00–15:00'],
          ['MGOPS', '54 286 51 45', 'pon–pt 7:30–15:30'],
          ['ZGKiW — awarie', '601 445 220', 'całodobowo'],
          ['MGCK — Centrum Kultury', '54 286 50 41', 'pon–pt 9:00–19:00'],
          ['Biblioteka Publiczna', '54 286 50 42', 'pon–pt 10:00–18:00'],
        ],
      },
    },
    {
      heading: 'Redakcja portalu',
      body: 'Masz temat, zdjęcia lub informację o zdarzeniu? Napisz albo zadzwoń — działamy szybko.\nTelefon: <strong>+48 502 124 567</strong> · E-mail: <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>',
    },
  ],
  { badge: 'Informator', colorVar: 'var(--c-sygnale)' }
)

// ────────────────────────────────────────────────── O PORTALU
page(
  '/o-portalu',
  'O portalu Izbica24.pl',
  `Niezależny portal informacyjny gminy Izbica Kujawska. Codziennie świeże wiadomości dla mieszkańców ${SOLECTWA.length} sołectw.`,
  [
    {
      heading: 'Nasza misja',
      body: 'Izbica24.pl powstał z prostego przekonania: <strong>społeczność lokalna zasługuje na rzetelną informację</strong> o tym, co dzieje się najbliżej — w gminie, w sołectwie, na własnej ulicy.\nDostarczamy informacje z gminy Izbica Kujawska: samorząd, inwestycje, interwencje służb, sport, kultura, historia i sprawy codzienne. Bez sensacji, bez politycznych zależności.',
    },
    {
      heading: 'Co znajdziesz na portalu',
      body: 'Portal podzielony jest na 12 sekcji tematycznych, z których każda ma własne podkategorie.',
      list: [
        '<strong>Wiadomości</strong> — bieżące informacje z gminy: inwestycje, edukacja, zdrowie, rolnictwo',
        '<strong>Na sygnale</strong> — interwencje OSP, policji i pogotowia, awarie i utrudnienia',
        '<strong>Samorząd</strong> — sesje Rady, zarządzenia burmistrza, budżet, sołectwa, powiat',
        '<strong>Kujawianka</strong> — MGKS Kujawianka: mecze, tabela, kadra, junior, historia klubu',
        '<strong>Kultura</strong> — MGCK, biblioteka, parafie, KGW, kalendarz wydarzeń',
        '<strong>Historia</strong> — dzieje Izbicy, Wietrzychowice, społeczność żydowska, zabytki',
        '<strong>Ludzie</strong> — wywiady, sylwetki mieszkańców, sukcesy, wspomnienia',
        '<strong>Życie codzienne</strong> — praktyczne poradniki: urząd, zdrowie, rolnictwo, turystyka',
        '<strong>Przegląd mediów</strong> — co o Izbicy piszą media regionalne',
        '<strong>Multimedia</strong> — wideo, podcast „Głos Izbicy”, galerie zdjęć, infografiki',
        '<strong>Ogłoszenia</strong> — nekrologi, praca, nieruchomości, usługi, katalog firm',
      ],
    },
    {
      heading: 'Gmina Izbica Kujawska w liczbach',
      body: '',
      table: {
        head: ['Wskaźnik', 'Wartość'],
        rows: [
          ['Mieszkańcy', `${GMINA.ludnosc.tekst} (${GMINA.ludnosc.naDzien})`],
          ['Sołectwa', '34'],
          ['Powierzchnia', GMINA.powierzchnia.tekst],
          ['Prawa miejskie', 'od 1750 roku'],
          ['Powiat', 'włocławski'],
          ['Województwo', 'kujawsko-pomorskie'],
        ],
      },
    },
    {
      heading: 'Wykorzystanie narzędzi AI',
      body: 'Część materiałów o charakterze informacyjno-poradnikowym (harmonogramy, terminy, zestawienia) przygotowujemy z wykorzystaniem narzędzi sztucznej inteligencji. <strong>Każdy taki materiał jest weryfikowany przez redakcję i wyraźnie oznaczony</strong> stosowną adnotacją.\nSekcje <strong>Ludzie</strong> oraz <strong>wywiady</strong> są zawsze w 100% redakcyjne — tu AI nie pisze.',
    },
    {
      heading: 'Kontakt',
      body: 'Redakcja Izbica24.pl\nul. Marszałka Piłsudskiego 26, 87-865 Izbica Kujawska\nTelefon: +48 502 124 567\nE-mail: <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>',
    },
  ],
  { badge: 'O nas' }
)

// ──────────────────────────────────────────────── DOŁĄCZ DO NAS
page(
  '/dolacz',
  'Dołącz do nas',
  'Chcesz współtworzyć Izbica24.pl? Szukamy współpracowników, korespondentów sołeckich i osób z pasją do lokalnych spraw.',
  [
    {
      heading: 'Zostań korespondentem sołeckim',
      body: 'Mieszkasz w jednym z sołectw gminy i wiesz, co się w nim dzieje? <strong>Zostań naszym korespondentem.</strong> Nie musisz być dziennikarzem — wystarczy, że prześlesz informację, zdjęcie lub relację z zebrania wiejskiego. Redakcja zajmie się resztą.',
      list: [
        'Relacje z zebrań wiejskich i inicjatyw sołeckich',
        'Zdjęcia z wydarzeń w sołectwie',
        'Informacje o inwestycjach i problemach lokalnych',
        'Sylwetki ciekawych mieszkańców',
      ],
    },
    {
      heading: 'Współpraca redakcyjna',
      body: 'Piszesz, fotografujesz, montujesz wideo albo interesujesz się historią regionu? Chętnie porozmawiamy o stałej lub okazjonalnej współpracy.',
      list: [
        'Redaktor działu (wiadomości, kultura, sport)',
        'Fotoreporter — wydarzenia w gminie',
        'Operator / montażysta wideo — reportaże i relacje',
        'Autor tekstów historycznych i evergreen',
      ],
    },
    {
      heading: 'Zgłoś temat lub zdarzenie',
      body: 'Widzisz coś, o czym powinniśmy napisać? Nie czekaj — daj znać. Najszybciej: telefon <strong>+48 502 124 567</strong> (również SMS i WhatsApp) lub e-mail <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>.\nJeśli masz zdjęcia lub nagranie ze zdarzenia — załącz je. Zawsze podajemy autora materiału, o ile sobie tego życzy.',
    },
  ],
  { badge: 'Współpraca' }
)

// ───────────────────────────────────────── POLITYKA COOKIES
page(
  '/polityka-cookies',
  'Polityka plików cookies',
  'Informacja o plikach cookies wykorzystywanych w serwisie Izbica24.pl.',
  [
    {
      heading: 'Czym są pliki cookies',
      body: 'Pliki cookies to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu przez przeglądarkę podczas korzystania z serwisu. Umożliwiają rozpoznanie urządzenia i odpowiednie wyświetlenie strony.',
    },
    {
      heading: 'Jakie cookies stosujemy',
      body: '',
      table: {
        head: ['Rodzaj', 'Cel', 'Czas przechowywania'],
        rows: [
          ['Niezbędne', 'Prawidłowe działanie serwisu, sesja użytkownika', 'do zamknięcia przeglądarki'],
          ['Preferencje', 'Zapamiętanie ustawień (np. rozmiar tekstu)', 'do 12 miesięcy'],
          ['Analityczne', 'Anonimowe statystyki odwiedzin i popularności treści', 'do 24 miesięcy'],
        ],
      },
    },
    {
      heading: 'Zarządzanie cookies',
      body: 'W każdej chwili możesz zmienić ustawienia dotyczące plików cookies w swojej przeglądarce — zablokować je lub usunąć zapisane pliki. Wyłączenie cookies niezbędnych może wpłynąć na działanie niektórych funkcji serwisu.\nSzczegóły znajdziesz w dokumentacji swojej przeglądarki (Chrome, Firefox, Safari, Edge).',
    },
    {
      heading: 'Kontakt',
      body: 'Pytania dotyczące polityki cookies: <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>.\nZobacz także: <a href="/polityka-prywatnosci" style="color:var(--red)">Polityka prywatności</a> i <a href="/rodo" style="color:var(--red)">RODO</a>.',
    },
  ],
  { badge: 'Dokumenty' }
)

// ──────────────────────────────────────────────────────── RODO
page(
  '/rodo',
  'RODO — ochrona danych osobowych',
  'Informacja o przetwarzaniu danych osobowych w serwisie Izbica24.pl zgodnie z RODO.',
  [
    {
      heading: 'Administrator danych',
      body: 'Administratorem Twoich danych osobowych jest redakcja portalu <strong>Izbica24.pl</strong>, ul. Marszałka Piłsudskiego 26, 87-865 Izbica Kujawska.\nKontakt w sprawach danych osobowych: <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>.',
    },
    {
      heading: 'Cele i podstawy przetwarzania',
      body: '',
      table: {
        head: ['Cel', 'Dane', 'Podstawa prawna'],
        rows: [
          ['Newsletter', 'adres e-mail, imię (opcjonalnie)', 'art. 6 ust. 1 lit. a — zgoda'],
          ['Komentarze', 'imię, e-mail, treść', 'art. 6 ust. 1 lit. a — zgoda'],
          ['Ogłoszenia', 'dane kontaktowe', 'art. 6 ust. 1 lit. b — umowa'],
          ['Statystyki', 'dane anonimowe', 'art. 6 ust. 1 lit. f — uzasadniony interes'],
        ],
      },
    },
    {
      heading: 'Twoje prawa',
      body: 'W związku z przetwarzaniem danych masz prawo do:',
      list: [
        'dostępu do swoich danych i otrzymania ich kopii',
        'sprostowania (poprawienia) danych',
        'usunięcia danych („prawo do zapomnienia”)',
        'ograniczenia przetwarzania',
        'przenoszenia danych',
        'wniesienia sprzeciwu wobec przetwarzania',
        'wycofania zgody w dowolnym momencie',
        'wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych',
      ],
    },
    {
      heading: 'Okres przechowywania',
      body: 'Dane subskrybentów newslettera przechowujemy do momentu wycofania zgody. Dane komentujących — przez okres publikacji materiału. Dane ogłoszeniodawców — 12 miesięcy od publikacji ogłoszenia.',
    },
    {
      heading: 'Odbiorcy danych',
      body: 'Dane mogą być przekazywane dostawcom usług hostingowych i narzędzi do wysyłki newslettera, wyłącznie w zakresie niezbędnym do realizacji usługi i na podstawie umów powierzenia przetwarzania.\n<strong>Nie sprzedajemy i nie udostępniamy danych w celach marketingowych podmiotom trzecim.</strong>',
    },
  ],
  { badge: 'Dokumenty' }
)

// ──────────────────────────────────────────────────────── FAQ
page(
  '/faq',
  'Często zadawane pytania',
  'Odpowiedzi na najczęstsze pytania dotyczące portalu Izbica24.pl.',
  [
    {
      heading: 'Jak zgłosić temat lub zdarzenie?',
      body: 'Najszybciej telefonicznie: <strong>+48 502 124 567</strong> (również SMS/WhatsApp) lub e-mailem na <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>. Jeśli masz zdjęcia lub nagranie — załącz je do zgłoszenia.',
    },
    {
      heading: 'Czy dodanie ogłoszenia jest płatne?',
      body: 'Ogłoszenia drobne (kupię/sprzedam), oferty pracy i usługi są <strong>bezpłatne</strong>. Płatne są: nekrologi, rocznice i podziękowania oraz rozszerzone wizytówki w katalogu firm. Podstawowy wpis firmy jest darmowy.\nFormularz: <a href="/ogloszenia/dodaj" style="color:var(--red)">Dodaj ogłoszenie</a>.',
    },
    {
      heading: 'Jak długo trwa publikacja ogłoszenia?',
      body: 'Ogłoszenia weryfikuje redakcja — zwykle publikujemy w ciągu 24 godzin w dni robocze.',
    },
    {
      heading: 'Czy komentarze są moderowane?',
      body: 'Tak. Publikujemy wypowiedzi merytoryczne. Usuwamy komentarze obraźliwe, zawierające mowę nienawiści, dane osobowe osób trzecich lub treści niezgodne z prawem.',
    },
    {
      heading: 'Czy materiały AI są oznaczane?',
      body: 'Tak. Każdy materiał przygotowany z wykorzystaniem narzędzi AI ma widoczną adnotację i został zweryfikowany przez redakcję. Wywiady i sylwetki są zawsze w 100% redakcyjne.',
    },
    {
      heading: 'Czy mogę wykorzystać materiały z portalu?',
      body: 'Krótkie cytaty z podaniem źródła i linkiem — tak. Przedruk całych materiałów lub wykorzystanie zdjęć wymaga zgody redakcji. Napisz na <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>.',
    },
    {
      heading: 'Jak zapisać się do newslettera?',
      body: 'Przez formularz na stronie <a href="/newsletter" style="color:var(--red)">Newsletter „Tydzień w Izbicy”</a>. Wysyłka co piątek wieczorem, bezpłatnie, w każdej chwili możesz się wypisać.',
    },
    {
      heading: 'Jak znaleźć materiały o moim sołectwie?',
      body: 'Wejdź na stronę <a href="/solectwa" style="color:var(--red)">Sołectwa</a> i wybierz swoje. Zobaczysz wszystkie materiały oznaczone tym sołectwem.',
    },
  ],
  { badge: 'Pomoc' }
)

// ────────────────────────────────────────────────────── POMOC
page(
  '/pomoc',
  'Pomoc i wsparcie',
  'Jak korzystać z portalu Izbica24.pl — nawigacja, wyszukiwanie, zgłaszanie treści.',
  [
    {
      heading: 'Nawigacja po portalu',
      body: 'Górna belka zawiera 12 głównych sekcji. Po najechaniu na sekcję rozwija się panel z jej podkategoriami oraz najnowszymi materiałami — możesz przejść bezpośrednio do interesującego Cię tematu.\nNa urządzeniach mobilnych menu otwiera przycisk w prawym górnym narożniku.',
    },
    {
      heading: 'Wyszukiwanie',
      body: 'Pole wyszukiwania w nagłówku przeszukuje wszystkie materiały portalu — tytuły, zajawki i tagi. Możesz też wejść na dedykowaną stronę <a href="/szukaj" style="color:var(--red)">wyszukiwarki</a>.',
    },
    {
      heading: 'Czytanie artykułów',
      body: 'Pod tytułem każdego artykułu znajdziesz pasek narzędzi:',
      list: [
        '<strong>Udostępnij</strong> — wyślij link znajomym lub skopiuj go do schowka',
        '<strong>Drukuj</strong> — wersja do druku bez elementów nawigacji',
        '<strong>A+ / A−</strong> — powiększenie i zmniejszenie tekstu',
        '<strong>Komentarze</strong> — przejście do dyskusji pod materiałem',
      ],
    },
    {
      heading: 'Problem techniczny?',
      body: 'Jeśli coś nie działa — strona się nie wyświetla, zdjęcia się nie ładują, formularz nie wysyła — napisz na <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a>. Podaj adres strony i nazwę przeglądarki, którą używasz.',
    },
  ],
  { badge: 'Pomoc' }
)

// ─────────────────────────────────────────────── MAPA STRONY
app.get('/mapa-strony', (c) => {
  return c.render(
    <Shell>
      <div class="page">
        <header class="cat-hero reveal" style="--c:var(--red)">
          <span class="tag dark">Nawigacja</span>
          <h1 style="margin-top:12px">Mapa strony</h1>
          <p class="cat-lead">
            Pełna struktura portalu Izbica24.pl — 12 kategorii głównych, podkategorie i strony
            pomocnicze.
          </p>
        </header>
        <section class="section reveal">
          <div class="list-grid cols-2">
            {CATEGORIES.map((cat) => (
              <article class="lc" style={`--c:${cat.colorVar}`}>
                <div class="lc-body">
                  <span class={`tag ${cat.tagClass}`}>{cat.title}</span>
                  <h3>
                    <a href={cat.path}>{cat.title}</a>
                  </h3>
                  <p>{cat.lead}</p>
                  <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">
                    {cat.subcategories.map((s) => (
                      <>
                        <a
                          href={s.path}
                          style="font:600 12.5px var(--body);color:var(--ink-3);padding:3px 0;border-bottom:1px solid var(--bg-2)"
                        >
                          › {s.title}
                        </a>
                        {(s.children ?? []).map((ch) => (
                          <a
                            href={ch.path}
                            style="font:500 12px var(--body);color:var(--ink-5);padding:2px 0 2px 18px"
                          >
                            · {ch.title}
                          </a>
                        ))}
                      </>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section class="section reveal">
          <div class="list-grid cols-2">
            <article class="lc">
              <div class="lc-body">
                <span class="tag dark">Serwis</span>
                <h3>Strony pomocnicze</h3>
                <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">
                  {[
                    ['/o-portalu', 'O portalu'],
                    ['/redakcja', 'Zespół redakcyjny'],
                    ['/kontakt', 'Kontakt'],
                    ['/reklama', 'Reklama i współpraca'],
                    ['/dolacz', 'Dołącz do nas'],
                    ['/newsletter', 'Newsletter'],
                    ['/telefony', 'Ważne telefony'],
                    ['/mapa-gminy', 'Mapa gminy'],
                    ['/solectwa', 'Sołectwa (34)'],
                    ['/szukaj', 'Wyszukiwarka'],
                    ['/pomoc', 'Pomoc'],
                    ['/faq', 'FAQ'],
                  ].map(([href, label]) => (
                    <a
                      href={href}
                      style="font:600 12.5px var(--body);color:var(--ink-3);padding:3px 0;border-bottom:1px solid var(--bg-2)"
                    >
                      › {label}
                    </a>
                  ))}
                </div>
              </div>
            </article>
            <article class="lc">
              <div class="lc-body">
                <span class="tag dark">Dokumenty</span>
                <h3>Regulaminy i polityki</h3>
                <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">
                  {[
                    ['/regulamin', 'Regulamin'],
                    ['/polityka-prywatnosci', 'Polityka prywatności'],
                    ['/rodo', 'RODO'],
                    ['/polityka-cookies', 'Polityka cookies'],
                    ['/dostepnosc', 'Deklaracja dostępności'],
                    ['/rss.xml', 'Kanał RSS'],
                    ['/sitemap.xml', 'Mapa XML (sitemap)'],
                  ].map(([href, label]) => (
                    <a
                      href={href}
                      style="font:600 12.5px var(--body);color:var(--ink-3);padding:3px 0;border-bottom:1px solid var(--bg-2)"
                    >
                      › {label}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </Shell>,
    { title: 'Mapa strony — Izbica24.pl' }
  )
})

// ──────────────────────────────────── DEKLARACJA DOSTĘPNOŚCI
page(
  '/dostepnosc',
  'Deklaracja dostępności',
  'Izbica24.pl dąży do zapewnienia dostępności serwisu zgodnie ze standardem WCAG 2.1 na poziomie AA.',
  [
    {
      heading: 'Status dostępności',
      body: 'Serwis Izbica24.pl jest <strong>częściowo zgodny</strong> ze standardem WCAG 2.1 poziom AA. Pracujemy nad usunięciem pozostałych niezgodności.',
    },
    {
      heading: 'Udogodnienia w serwisie',
      body: '',
      list: [
        'Semantyczna struktura nagłówków i sekcji (nawigacja czytnikami ekranu)',
        'Powiększanie i zmniejszanie tekstu artykułu (przyciski A+ / A−)',
        'Wersja do druku każdego artykułu',
        'Teksty alternatywne dla zdjęć',
        'Respektowanie ustawienia „ogranicz animacje” w systemie (prefers-reduced-motion)',
        'Nawigacja klawiaturą po menu i treści',
        'Kontrast tekstu spełniający wymagania AA dla treści podstawowej',
      ],
    },
    {
      heading: 'Znane ograniczenia',
      body: 'Część materiałów archiwalnych oraz osadzenia z serwisów zewnętrznych (YouTube, Spotify, Facebook) mogą nie spełniać w pełni wymogów dostępności — nie mamy wpływu na ich kod. Materiały wideo nie zawsze posiadają napisy.',
    },
    {
      heading: 'Informacje zwrotne',
      body: 'Napotkałeś barierę w dostępności? Napisz na <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">redakcja@izbica24.pl</a> lub zadzwoń: +48 502 124 567. Odpowiadamy w ciągu 7 dni.\nJeśli potrzebujesz materiału w innej formie (np. odczytanie treści przez telefon) — również daj znać.',
    },
  ],
  { badge: 'Dostępność' }
)

// ──────────────────────────────────────── PRZYDATNE LINKI
page(
  '/linki',
  'Przydatne linki',
  'Instytucje, urzędy i organizacje przydatne mieszkańcom gminy Izbica Kujawska.',
  [
    {
      heading: 'Gmina i powiat',
      body: '',
      list: [
        'Urząd Miejski w Izbicy Kujawskiej — BIP, zarządzenia, uchwały',
        'Starostwo Powiatowe we Włocławku — drogi powiatowe, geodezja, pozwolenia',
        'Powiatowy Urząd Pracy we Włocławku — oferty pracy, szkolenia, dotacje',
        'Powiatowe Centrum Pomocy Rodzinie',
        'Urząd Marszałkowski Województwa Kujawsko-Pomorskiego',
      ],
    },
    {
      heading: 'Rolnictwo',
      body: '',
      list: [
        'ARiMR — Biuro Powiatowe we Włocławku (dopłaty, wnioski)',
        'KPODR Minikowo — doradztwo i szkolenia dla rolników',
        'KOWR — Krajowy Ośrodek Wsparcia Rolnictwa',
        'Gminna Spółka Wodna — melioracje',
      ],
    },
    {
      heading: 'Instytucje w gminie',
      body: '',
      list: [
        'SPZOZ Izbica Kujawska — rejestracja i harmonogram poradni',
        'MGCK — Miejsko-Gminne Centrum Kultury',
        'Biblioteka Publiczna w Izbicy Kujawskiej',
        'MGOPS — pomoc społeczna',
        'ZGKiW — woda, kanalizacja, odpady',
        'MGKS Kujawianka Izbica Kujawska',
      ],
    },
    {
      heading: 'Bezpieczeństwo i awarie',
      body: '',
      list: [
        'PGE Dystrybucja — planowane wyłączenia prądu (991)',
        'Posterunek Policji w Izbicy Kujawskiej',
        'OSP Izbica Kujawska, Pasieka, Wietrzychowice, Modzerowo',
        'IMGW — ostrzeżenia meteorologiczne dla powiatu włocławskiego',
      ],
    },
    {
      heading: 'Turystyka i historia',
      body: '',
      list: [
        'Park Kulturowy Wietrzychowice — „polskie piramidy”',
        'Wirtualny Sztetl (sztetl.org.pl) — historia społeczności żydowskiej',
        'Sanktuarium MB Łaskawej Księżnej Kujaw w Błennie',
        'Diecezja Włocławska — dekanat izbicki',
      ],
    },
  ],
  { badge: 'Informator' }
)

// ──────────────────────────────────────────────── SPONSORZY
page(
  '/sponsorzy',
  'Partnerzy i sponsorzy',
  'Portal Izbica24.pl utrzymuje się ze wsparcia lokalnych przedsiębiorców i przychodów z ogłoszeń.',
  [
    {
      heading: 'Dlaczego warto wspierać lokalne media',
      body: 'Niezależny portal informacyjny w gminie liczącej niespełna 8 tysięcy mieszkańców nie utrzyma się z samych wyświetleń. <strong>Wsparcie lokalnych firm pozwala nam pracować rzetelnie</strong> — bez zależności od jednego źródła finansowania.',
    },
    {
      heading: 'Formy współpracy',
      body: '',
      list: [
        '<strong>Wizytówka w katalogu firm</strong> — rozszerzony wpis z opisem, zdjęciami i linkiem',
        '<strong>Banner reklamowy</strong> — ekspozycja na stronie głównej lub w wybranej sekcji',
        '<strong>Artykuł sponsorowany</strong> — z wyraźnym oznaczeniem, zgodnie z zasadami etyki',
        '<strong>Patronat sekcji</strong> — np. sekcji Kujawianka lub Kalendarza wydarzeń',
        '<strong>Sponsoring newslettera</strong> — 2 847 subskrybentów, 96% open rate',
      ],
    },
    {
      heading: 'Zasięgi portalu',
      body: '',
      table: {
        head: ['Wskaźnik', 'Wartość'],
        rows: [
          ['Subskrybenci newslettera', '2 847'],
          ['Open rate newslettera', '96%'],
          ['Materiałów w bazie', '12 847'],
          ['Lat działalności', '5'],
        ],
      },
    },
    {
      heading: 'Kontakt w sprawie współpracy',
      body: 'Napisz: <a href="mailto:reklama@izbica24.pl" style="color:var(--red)">reklama@izbica24.pl</a> lub zadzwoń: +48 502 124 567.\nSzczegółowy cennik i formy współpracy: <a href="/reklama" style="color:var(--red)">Reklama i współpraca</a>.',
    },
  ],
  { badge: 'Współpraca' }
)

export default app
