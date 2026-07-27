/**
 * Etap I5 — widget pogodowy i jakości powietrza (renderowanie serwerowe).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO SSR, A NIE `fetch` W PRZEGLĄDARCE
 * ═══════════════════════════════════════════════════════════════════════
 * Widget pogodowy pobierany skryptem po wczytaniu strony daje przeskok
 * układu (CLS): pasek najpierw jest pusty, potem wskakuje temperatura
 * i wszystko poniżej się przesuwa. To liczy się w Core Web Vitals
 * (etap F4) i jest zauważalne na telefonie w słabym zasięgu — a portal
 * gminny czyta się głównie na telefonie.
 *
 * Dane i tak leżą w KV, więc pobranie ich w trakcie renderowania strony
 * kosztuje jedno odczytanie KV (~5 ms), nie zapytanie sieciowe. Przy
 * pustym KV strona nie czeka na Open-Meteo — komponent dostaje `null`
 * i po prostu się nie pokazuje.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * OZNACZANIE ŹRÓDŁA I WIEKU
 * ═══════════════════════════════════════════════════════════════════════
 * Open-Meteo jest na licencji CC-BY 4.0 — podanie źródła jest warunkiem
 * użycia, nie ozdobą. Wiek danych pokazujemy, gdy przekracza 30 minut:
 * rolnik podejmujący decyzję o sianokosach ma prawo wiedzieć, że patrzy
 * na pomiar sprzed dwóch godzin, bo dostawca chwilowo milczy.
 */
import type { FC } from 'hono/jsx'
import type { OdpowiedzPogody, JakoscPowietrza } from '../../lib/integrations/pogoda'
import { kierunekNaSkrot } from '../../lib/integrations/pogoda'

export interface DanePogody extends OdpowiedzPogody {
  nieswieze?: boolean
  wiekMinut?: number | null
  ostrzezenie?: string
}

export interface DanePowietrza extends JakoscPowietrza {
  nieswieze?: boolean
  wiekMinut?: number | null
}

/**
 * Ikony jako inline SVG, nie Font Awesome.
 *
 * Widget jest w pasku górnym na każdej podstronie. Zależność od
 * zewnętrznego arkusza ikon oznacza, że przy zablokowanym CDN
 * (a jest blokowany — filtry treści w szkołach, bloker reklam)
 * temperatura zostaje bez obrazka albo z prostokątem zastępczym.
 */
const IKONY: Record<string, string> = {
  sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4',
  'cloud-sun': 'M4 15h11a3 3 0 100-6 5 5 0 00-9.6 1.5A2.75 2.75 0 004 15z',
  cloud: 'M6 17h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 17z',
  'cloud-rain': 'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM8 18v2M12 18v2.5M16 18v2',
  'cloud-snow': 'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM9 18h.01M13 19h.01M16 18h.01',
  'cloud-lightning': 'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM13 15l-3 5h3l-1 3',
  fog: 'M3 9h18M3 13h18M5 17h14',
  drizzle: 'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM9 18v1.5M13 18v1.5',
}

const IkonaPogody: FC<{ ikona: string; rozmiar?: number }> = ({ ikona, rozmiar = 20 }) => {
  const sciezka = IKONY[ikona] ?? IKONY.cloud
  return (
    <svg
      viewBox="0 0 24 24"
      width={rozmiar}
      height={rozmiar}
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {ikona === 'sun' ? <circle cx="12" cy="12" r="4" /> : null}
      {ikona === 'cloud-sun' ? <circle cx="17" cy="7" r="2.5" /> : null}
      <path d={sciezka} />
    </svg>
  )
}

// ───────────────────────────────────────── pasek górny (kompaktowy)

/*
 * USUNIĘTO komponent `PogodaPasek` (etap I10).
 *
 * Renderował `<span id="topbar-pogoda">` — czyli DOKŁADNIE ten sam
 * identyfikator, który `Topbar` w `Layout.tsx:89` już wystawia i który
 * `izbica-v4-pogoda.js:27` odnajduje przez `getElementById`. Komponent
 * nie był nigdzie importowany, więc duplikat nie występował w wysyłanym
 * HTML-u — ale każde jego przyszłe użycie dałoby dwa elementy o tym samym
 * `id`. Skutek: `getElementById` zwraca pierwszy z nich, więc jeden pasek
 * aktualizowałby się, a drugi zostałby z pustą treścią na zawsze; do tego
 * dokument przestaje być poprawny (WCAG 4.1.1) i czytnik ekranu ogłasza
 * dwa różne obszary `aria-live` o tej samej roli.
 *
 * Pasek górny jest wypełniany po stronie przeglądarki (`data-endpoint`),
 * bo pokazuje jedną liczbę i nie przesuwa układu; karta pogodowa na
 * stronie głównej jest renderowana serwerowo, bo zajmuje ok. 200 px
 * i jej doładowanie przesuwałoby treść. Dwie ścieżki są tu celowe —
 * ale wystarcza po jednym komponencie na każdą.
 *
 * `kierunekNaSkrot` pozostaje w użyciu w `PogodaKarta` poniżej.
 */

// ──────────────────────────────────────────── karta na stronie głównej

const odmienDzien = (n: number): string => {
  if (n === 1) return 'dzień'
  return 'dni'
}

/**
 * Karta pogodowa do kolumny bocznej strony głównej.
 * Pokazuje warunki teraz + 5 kolejnych dni (7. dzień prognozy ma już
 * niską trafność, a szósta i siódma kolumna nie mieszczą się na telefonie).
 */
export const PogodaKarta: FC<{ dane: DanePogody | null; powietrze?: DanePowietrza | null }> = ({
  dane,
  powietrze,
}) => {
  if (!dane?.teraz) {
    return (
      <section class="pogoda-karta pogoda-karta--brak" aria-labelledby="pogoda-naglowek">
        <h2 id="pogoda-naglowek" class="pogoda-naglowek">
          Pogoda
        </h2>
        <p class="pogoda-brak-tresc">
          Serwis pogodowy chwilowo nie odpowiada. Nie pokazujemy danych zastępczych — wolimy puste miejsce
          niż nieprawdziwą temperaturę.
        </p>
      </section>
    )
  }

  const t = dane.teraz
  const dni = dane.prognoza.slice(0, 6)
  const pokazWiek = dane.nieswieze === true || (dane.wiekMinut ?? 0) > 30

  return (
    <section class="pogoda-karta" aria-labelledby="pogoda-naglowek">
      <header class="pogoda-karta-head">
        <h2 id="pogoda-naglowek" class="pogoda-naglowek">
          Pogoda · {dane.lokalizacja}
        </h2>
        <a href="/pogoda" class="pogoda-wiecej">
          7 {odmienDzien(7)}
        </a>
      </header>

      <div class="pogoda-teraz">
        <div class="pogoda-teraz-ikona" aria-hidden="true">
          <IkonaPogody ikona={t.ikona} rozmiar={56} />
        </div>
        <div class="pogoda-teraz-liczby">
          <p class="pogoda-temp">
            {t.temperatura}
            <span class="pogoda-temp-jedn">°C</span>
          </p>
          <p class="pogoda-opis">{t.opis}</p>
          <p class="pogoda-odczuwalna">
            odczuwalna {t.odczuwalna}°C · wilgotność {t.wilgotnosc}%
          </p>
        </div>
      </div>

      <dl class="pogoda-szczegoly">
        <div class="pogoda-szczegol">
          <dt>Wiatr</dt>
          <dd>
            {t.wiatr} km/h {kierunekNaSkrot(t.kierunekWiatru)}
            {t.wiatrPorywy && t.wiatrPorywy > t.wiatr + 10 ? (
              <span class="pogoda-porywy"> (porywy {t.wiatrPorywy})</span>
            ) : null}
          </dd>
        </div>
        {t.cisnienie !== null ? (
          <div class="pogoda-szczegol">
            <dt>Ciśnienie</dt>
            <dd>{t.cisnienie} hPa</dd>
          </div>
        ) : null}
        {t.zachmurzenie !== null ? (
          <div class="pogoda-szczegol">
            <dt>Zachmurzenie</dt>
            <dd>{t.zachmurzenie}%</dd>
          </div>
        ) : null}
      </dl>

      {powietrze && powietrze.pm25 !== null ? (
        <div class="pogoda-powietrze">
          <span class="pogoda-powietrze-kropka" style={`background:${powietrze.ocenaKolor}`} aria-hidden="true" />
          <span class="pogoda-powietrze-tekst">
            Powietrze: <strong>{powietrze.ocena}</strong> · PM2.5 {powietrze.pm25} µg/m³
            {powietrze.pm10 !== null ? ` · PM10 ${powietrze.pm10}` : ''}
          </span>
          {powietrze.zalecenie ? <p class="pogoda-powietrze-zalecenie">{powietrze.zalecenie}</p> : null}
        </div>
      ) : null}

      <ol class="pogoda-prognoza" aria-label="Prognoza na kolejne dni">
        {dni.map((d) => (
          <li class="pogoda-dzien" key={d.data}>
            <span class="pogoda-dzien-nazwa">{d.dzien}</span>
            <span class="pogoda-dzien-ikona" aria-hidden="true">
              <IkonaPogody ikona={d.ikona} rozmiar={22} />
            </span>
            <span class="pogoda-dzien-temp">
              <strong>{d.tempMax}°</strong>
              <span class="pogoda-dzien-min">{d.tempMin}°</span>
            </span>
            {d.opadPrawdopodobienstwo !== null && d.opadPrawdopodobienstwo > 30 ? (
              <span class="pogoda-dzien-opad" title={`prawdopodobieństwo opadu ${d.opadPrawdopodobienstwo}%`}>
                {d.opadPrawdopodobienstwo}%
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <footer class="pogoda-stopka">
        {/* Podanie źródła jest warunkiem licencji CC-BY 4.0 Open-Meteo. */}
        <span class="pogoda-zrodlo">
          Źródło:{' '}
          <a href={dane.zrodloUrl} rel="noopener nofollow" target="_blank">
            {dane.zrodlo}
          </a>
        </span>
        {pokazWiek ? (
          <span class="pogoda-wiek">
            {dane.nieswieze ? 'dane z pamięci podręcznej, ' : ''}
            aktualizacja {dane.wiekMinut} min temu
          </span>
        ) : null}
      </footer>
    </section>
  )
}
