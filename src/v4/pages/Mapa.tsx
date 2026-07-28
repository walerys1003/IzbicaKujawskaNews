/**
 * Etap I10 — interaktywna mapa gminy Izbica Kujawska.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO MAPA NIE JEST RENDEROWANA NA SERWERZE
 * ═══════════════════════════════════════════════════════════════════════
 * MapLibre GL rysuje kafle w WebGL — w Workerze nie ma ani `canvas`,
 * ani kontekstu graficznego, więc mapa MUSI powstać w przeglądarce.
 *
 * Konsekwencja, którą trzeba obsłużyć uczciwie: użytkownik bez
 * JavaScriptu (albo z zablokowanym CDN — filtry w szkołach, blokery)
 * zobaczyłby pusty prostokąt. Dlatego pod mapą znajduje się PEŁNA lista
 * sołectw wyrenderowana serwerowo. To nie jest „zapas" — to równoprawna
 * forma dostępu do tej samej informacji, wymagana przez WCAG 2.1
 * (kryterium 1.1.1: treść nietekstowa musi mieć alternatywę tekstową).
 * Robot Google indeksuje właśnie tę listę.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SKĄD POCHODZĄ PUNKTY — Z BAZY, NIE Z TABLICY W KODZIE
 * ═══════════════════════════════════════════════════════════════════════
 * Wcześniejsza wersja tej strony renderowała listę z tablicy `SOLECTWA`
 * (taxonomy.ts), a mapa pobierała punkty z /api/v1/mapa/solectwa, czyli
 * z tabeli `solectwa` w D1. Dwa niezależne źródła tej samej listy na jednej
 * stronie: po wpisaniu sołtysa w panelu redakcyjnym dymek na mapie
 * pokazywałby nazwisko, a lista pod mapą nie — i nikt by nie wiedział,
 * która wersja jest aktualna. Teraz oba widoki czytają z bazy: trasa
 * przekazuje punkty propsem, a skrypt mapy pobiera te same dane z API.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO PODKŁAD Z CARTO, A NIE Z tile.openstreetmap.org
 * ═══════════════════════════════════════════════════════════════════════
 * Regulamin OpenStreetMap Tile Usage Policy wyraźnie zabrania kierowania
 * ruchu produkcyjnego na tile.openstreetmap.org — to serwery utrzymywane
 * z darowizn, przeznaczone do celów poglądowych. Portal gminny z ruchem
 * czytelniczym byłby naruszeniem, a w reakcji OSM blokuje odpytujących.
 *
 * Carto „Positron" udostępnia darmowy styl wektorowy oparty o dane OSM,
 * dopuszczający użycie publiczne. Jasnoszary podkład ma dodatkową zaletę
 * praktyczną: czerwone znaczniki (--red) są na nim czytelne, czego nie
 * dałby kolorowy podkład standardowy.
 *
 * Uwaga licencyjna: dane pozostają na licencji ODbL, więc adnotacja
 * „© OpenStreetMap contributors" jest WARUNKIEM UŻYCIA, nie ozdobą —
 * i to zarówno dla kafli, jak i dla samych współrzędnych sołectw,
 * które pobraliśmy z Overpass API. Adnotacja jest w dwóch miejscach:
 * na mapie (MapLibre) i w stopce sekcji (dla wersji bez JS).
 */
import type { FC } from 'hono/jsx'
import { Breadcrumbs, SectionHeader } from '../components/Layout'
import { GMINA } from '../gmina-fakty'
import { INSTYTUCJE, telefonDoWybierania } from '../instytucje'

/** Punkt zwracany przez /api/v1/mapa/solectwa — kształt z routes/v1/mapa.ts. */
export interface PunktMapy {
  slug: string
  nazwa: string
  lat: number
  lon: number
  soltys: string | null
  liczbaMaterialow: number
  adres: string
  jestSiedziba: boolean
}

/** Odmiana rzeczownika po liczbie — polski wymaga trzech form. */
const odmien = (n: number, poj: string, mnogaMala: string, mnogaDuza: string): string => {
  if (n === 1) return poj
  const r100 = n % 100
  const r10 = n % 10
  if (r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14)) return mnogaMala
  return mnogaDuza
}

export const MapaPageV4: FC<{
  punkty?: PunktMapy[]
  liczbaSolectw?: number
  blad?: string | null
}> = ({ punkty = [], liczbaSolectw = 0, blad = null }) => {
  // Sortowanie po polsku: COLLATE NOCASE w SQLite nie zna miejsca „Ł" po „L"
  // ani „Ś" po „S", więc kolejność z bazy nie jest alfabetyczna dla czytelnika.
  const posortowane = [...punkty].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))
  const zMaterialami = punkty.filter((p) => p.liczbaMaterialow > 0).length
  const zSoltysem = punkty.filter((p) => p.soltys).length

  return (
    <div class="page" id="strona-mapa">
      <Breadcrumbs items={[{ label: 'Sołectwa', href: '/solectwa' }, { label: 'Mapa gminy' }]} />

      <header class="cat-hero reveal" style="--c:var(--c-samorzad)">
        <span class="tag samorzad">Gmina Izbica Kujawska</span>
        <h1 style="margin-top:12px">Mapa gminy — sołectwa i instytucje</h1>
        <p class="cat-lead">
          Wszystkie sołectwa gminy Izbica Kujawska na mapie interaktywnej wraz z instytucjami
          publicznymi. Powierzchnia {GMINA.powierzchnia.tekst}, {GMINA.ludnosc.tekst} mieszkańców (
          {GMINA.ludnosc.naDzien}), powiat {GMINA.powiat}, województwo {GMINA.wojewodztwo}.
        </p>
      </header>

      {/*
        Komunikat o błędzie zamiast strony, która wygląda jak gmina bez sołectw.
        Pusta lista bez wyjaśnienia jest myląca — czytelnik uzna, że portal
        nie ma tych danych, podczas gdy w rzeczywistości zawiodła baza.
      */}
      {blad ? (
        <div class="mapa-blad" role="alert" id="mapa-blad-danych">
          <strong>Nie udało się wczytać danych sołectw.</strong>{' '}
          <span>{blad}</span>{' '}
          <span>
            Możesz skorzystać z <a href="/solectwa">listy sołectw</a>.
          </span>
        </div>
      ) : null}

      {/* ══════════════════════════════════════════════════ MAPA INTERAKTYWNA */}
      {punkty.length > 0 ? (
        <section class="section reveal" aria-labelledby="mapa-naglowek">
          <SectionHeader
            title="Mapa interaktywna"
            small={`${liczbaSolectw} ${odmien(liczbaSolectw, 'sołectwo', 'sołectwa', 'sołectw')}`}
            colorVar="var(--c-samorzad)"
            id="mapa-naglowek"
          />

          <div class="mapa-otoczka">
            {/*
              `data-endpoint` zamiast wstrzykniętego JSON-a: punkty (37 obiektów,
              ~5 kB) nie muszą blokować pierwszego renderowania dokumentu, a mapa
              i tak nie pokaże się przed wczytaniem MapLibre z CDN. Lista poniżej
              jest już w HTML, więc treść jest dostępna od pierwszego bajtu.

              role="application" — mapa przechwytuje strzałki (przesuwanie widoku),
              więc czytnik ekranu musi przełączyć się w tryb aplikacji, inaczej
              użytkownik traci możliwość nawigacji klawiaturą po stronie (WCAG 2.1.1).
            */}
            <div
              id="mapa-gminy"
              class="mapa-plotno"
              data-endpoint="/api/v1/mapa/solectwa"
              role="application"
              aria-label={
                `Interaktywna mapa ${liczbaSolectw} ` +
                `${odmien(liczbaSolectw, 'sołectwa', 'sołectw', 'sołectw')} gminy Izbica Kujawska. ` +
                `Pełna lista sołectw z odnośnikami znajduje się bezpośrednio pod mapą.`
              }
              tabindex={0}
            >
              <div class="mapa-ladowanie" id="mapa-ladowanie">
                <span class="mapa-ladowanie-tekst">Wczytywanie mapy…</span>
              </div>
            </div>

            <div class="mapa-legenda" aria-hidden="true">
              <span class="mapa-legenda-poz">
                <span class="mapa-znacznik-probka mapa-znacznik-probka--siedziba" />
                Siedziba gminy
              </span>
              <span class="mapa-legenda-poz">
                <span class="mapa-znacznik-probka" />
                Sołectwo
              </span>
            </div>
          </div>

          {/*
            Adnotacja licencyjna także w HTML, nie tylko w warstwie MapLibre.
            Gdy mapa się nie wczyta, wymóg licencji ODbL i tak jest spełniony,
            bo współrzędne na liście poniżej również pochodzą z OpenStreetMap.
          */}
          <p class="mapa-licencja">
            Dane geograficzne:{' '}
            <a href="https://www.openstreetmap.org/copyright" rel="noopener nofollow" target="_blank">
              © OpenStreetMap contributors
            </a>{' '}
            (ODbL 1.0). Podkład mapowy:{' '}
            <a href="https://carto.com/attributions" rel="noopener nofollow" target="_blank">
              © CARTO
            </a>
            .
          </p>
        </section>
      ) : null}

      {/* ══════════════════════════════════ LISTA SOŁECTW (alternatywa tekstowa) */}
      <section class="section reveal" aria-labelledby="lista-solectw-naglowek">
        <SectionHeader
          title="Sołectwa gminy"
          small={`${liczbaSolectw} · lista alfabetyczna`}
          colorVar="var(--c-samorzad)"
          moreHref="/solectwa"
          moreLabel="Materiały z sołectw"
          id="lista-solectw-naglowek"
        />
        <p class="mapa-lista-wstep">
          Ta lista zawiera te same sołectwa, co mapa powyżej — oba widoki czytają z tej samej bazy.
          Kliknięcie nazwy otwiera wszystkie materiały portalu dotyczące danego sołectwa.
        </p>
        <div class="sol-page-grid">
          {posortowane.map((p) => (
            <a
              class={p.jestSiedziba ? 'sol-card sol-card--siedziba' : 'sol-card'}
              href={p.adres}
              data-solectwo={p.slug}
            >
              <h3>{p.nazwa}</h3>
              {p.jestSiedziba ? <span class="sc-znacznik">siedziba gminy</span> : null}
              {/*
                Sołtys pokazywany tylko wtedy, gdy jest w bazie. Brak wpisu to
                brak wiersza, nie „sołtys: —": puste pole wygląda jak usterka,
                a w rzeczywistości redakcja jeszcze nie uzupełniła danych.
              */}
              {p.soltys ? <span class="sc-soltys">sołtys: {p.soltys}</span> : null}
              <div class="sc-count">
                {p.liczbaMaterialow}{' '}
                {odmien(p.liczbaMaterialow, 'materiał', 'materiały', 'materiałów')}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ INSTYTUCJE */}
      <section class="section reveal" aria-labelledby="instytucje-naglowek">
        <SectionHeader
          title="Instytucje publiczne"
          small={`${INSTYTUCJE.length} jednostek`}
          colorVar="var(--c-samorzad)"
          moreHref="/telefony"
          moreLabel="Wszystkie telefony"
          id="instytucje-naglowek"
        />
        <div class="list-grid cols-2">
          {INSTYTUCJE.map((i) => (
            <article class="lc" style="--c:var(--c-samorzad)">
              <div class="lc-body">
                <span class="tag samorzad">{i.rodzaj}</span>
                <h3>{i.nazwa}</h3>
                <dl class="inst-dane">
                  <div class="inst-poz">
                    <dt>Adres</dt>
                    <dd>
                      {i.adres}, 87-865 Izbica Kujawska
                    </dd>
                  </div>
                  {i.telefon ? (
                    <div class="inst-poz">
                      <dt>Telefon</dt>
                      <dd>
                        {/* tel: — na telefonie jedno dotknięcie zamiast przepisywania numeru */}
                        <a href={`tel:${telefonDoWybierania(i.telefon)}`}>{i.telefon}</a>
                      </dd>
                    </div>
                  ) : null}
                  {i.email ? (
                    <div class="inst-poz">
                      <dt>E-mail</dt>
                      <dd>
                        <a href={`mailto:${i.email}`}>{i.email}</a>
                      </dd>
                    </div>
                  ) : null}
                  {/*
                    Godziny tylko gdy potwierdzone w źródle. Wykaz gminy ich nie
                    publikuje dla większości jednostek — wpisanie prawdopodobnych
                    „pon–pt 8:00–15:00" wysyłałoby ludzi pod zamknięte drzwi.
                  */}
                  {i.godziny ? (
                    <div class="inst-poz">
                      <dt>Godziny</dt>
                      <dd>{i.godziny}</dd>
                    </div>
                  ) : null}
                  {i.www ? (
                    <div class="inst-poz">
                      <dt>Strona</dt>
                      <dd>
                        <a href={i.www} rel="noopener" target="_blank">
                          {i.www.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </article>
          ))}
        </div>

        <p class="mapa-licencja">
          Dane teleadresowe pochodzą z{' '}
          <a href="https://izbicakuj.pl/jednostki-organizacyjne.html" rel="noopener nofollow" target="_blank">
            wykazu jednostek organizacyjnych gminy
          </a>{' '}
          i ze stron jednostek; sprawdzone {INSTYTUCJE[0].sprawdzono}. Godziny pracy podajemy tylko
          tam, gdzie są opublikowane przez jednostkę.{' '}
          <a href="/kontakt">Zauważyłeś nieaktualną informację? Napisz do nas.</a>
        </p>
      </section>

      {/* ══════════════════════════════════════════════════ NOTA O DANYCH */}
      <aside class="mapa-nota" aria-label="Nota o danych">
        <h2>Skąd pochodzą dane na mapie</h2>
        <p>
          Wykaz miejscowości ustaliliśmy na podstawie wykazu sołectw gminy Izbica Kujawska,
          a współrzędne pobraliśmy z OpenStreetMap (Overpass API) w granicach gminy
          (relacja administracyjna, TERYT {GMINA.teryt}). Każda nazwa z wykazu została odnaleziona
          w OpenStreetMap wewnątrz granicy gminy.
        </p>
        <p>
          <strong>Kwestia otwarta:</strong> część źródeł podaje 34 sołectwa, a wykaz imienny zawiera{' '}
          {liczbaSolectw}. Różnica dotyczy najprawdopodobniej Błenny oraz Błenny A i B —
          traktowanych raz jako jedno sołectwo, raz jako trzy. Nie rozstrzygamy tego domysłem;
          ostateczna liczba wynika ze statutu gminy. Do czasu potwierdzenia pokazujemy wszystkie
          pozycje z wykazu imiennego.
        </p>
        <p class="mapa-nota-zrodlo">
          Uzupełnionych danych sołtysów: {zSoltysem} z {punkty.length}. Miejscowości z materiałami
          na portalu: {zMaterialami}. Powierzchnia gminy: {GMINA.powierzchnia.tekst} (
          {GMINA.powierzchnia.zrodlo}, {GMINA.powierzchnia.naDzien}). Liczba mieszkańców:{' '}
          {GMINA.ludnosc.tekst} ({GMINA.ludnosc.zrodlo}, {GMINA.ludnosc.naDzien}).
        </p>
      </aside>
    </div>
  )
}
