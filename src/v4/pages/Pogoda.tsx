/**
 * Etap I5 — podstrona /pogoda.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO TU POBIERAMY DANE NA SERWERZE, A W PASKU GÓRNYM NIE
 * ═══════════════════════════════════════════════════════════════════════
 * W pasku górnym pogoda jest dodatkiem widocznym na ~40 podstronach,
 * więc pobieranie jej serwerowo dokładałoby opóźnienie do każdej z nich.
 * Tutaj pogoda JEST treścią strony — czytelnik wszedł wyłącznie po nią.
 * Renderowanie serwerowe daje mu gotową odpowiedź w pierwszym żądaniu,
 * bez pustego prostokąta i bez przeskoku układu.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO STRONA MÓWI WPROST, GDY DANYCH NIE MA
 * ═══════════════════════════════════════════════════════════════════════
 * Do niedawna portal pokazywał temperaturę wpisaną na stałe w szablonie
 * („18 °C"), niezależnie od pory roku. Mieszkaniec, który zaplanował
 * sianokosy albo ubranie dziecka na tej podstawie, został wprowadzony
 * w błąd. Dlatego przy awarii dostawcy ta strona pokazuje komunikat,
 * a nie liczbę — a gdy dane są stare, podaje ich wiek.
 */
import type { FC } from 'hono/jsx'
import { Breadcrumbs, SectionHeader } from '../components/Layout'
import { PogodaKarta, type DanePogody, type DanePowietrza } from '../components/PogodaWidget'
import { GMINA } from '../gmina-fakty'

export const PogodaPageV4: FC<{
  dane: DanePogody | null
  powietrze: DanePowietrza | null
  blad?: string
}> = ({ dane, powietrze, blad }) => (
  <div class="page">
    <Breadcrumbs items={[{ label: 'Pogoda' }]} />

    <header class="cat-hero reveal" style="--c:var(--c-przeglad)">
      <span class="tag przeglad">Prognoza</span>
      <h1 style="margin-top:12px">Pogoda — {GMINA.nazwa}</h1>
      <p class="cat-lead">
        Prognoza dla {GMINA.dopelniacz} oraz aktualna jakość powietrza. Dane pochodzą z modeli
        meteorologicznych Open-Meteo i są odświeżane co 15 minut.
      </p>
    </header>

    <section class="section reveal" aria-labelledby="prognoza-naglowek">
      <SectionHeader
        title="Warunki teraz i prognoza"
        colorVar="var(--c-przeglad)"
        id="prognoza-naglowek"
      />

      {blad ? (
        <div class="pogoda-awaria" role="status">
          <p class="pogoda-awaria-tytul">Serwis pogodowy chwilowo nie odpowiada</p>
          <p class="pogoda-awaria-tresc">
            {blad} Nie pokazujemy w tym miejscu danych zastępczych — temperatura wpisana „na
            zapas" byłaby dla Państwa myląca. Prosimy odświeżyć stronę za kilka minut.
          </p>
        </div>
      ) : (
        <div class="pogoda-szeroka">
          <PogodaKarta dane={dane} powietrze={powietrze} />
        </div>
      )}
    </section>

    {/*
      Objaśnienie skali jakości powietrza. Sam napis „umiarkowana" nic
      nie mówi rodzicowi decydującemu, czy wypuścić dziecko na podwórko;
      progi liczbowe i zalecenia są tu konkretem.
    */}
    <section class="section reveal" aria-labelledby="powietrze-naglowek">
      <SectionHeader
        title="Jak czytać jakość powietrza"
        colorVar="var(--c-zycie)"
        id="powietrze-naglowek"
      />
      <div class="powietrze-skala">
        {[
          { o: 'bardzo dobra', z: '0–10', k: '#50f0e6', c: 'Warunki bez zastrzeżeń.' },
          { o: 'dobra', z: '10–20', k: '#50ccaa', c: 'Aktywność na zewnątrz bez ograniczeń.' },
          {
            o: 'umiarkowana',
            z: '20–25',
            k: '#f0e641',
            c: 'Osoby wrażliwe (astma, choroby serca) powinny ograniczyć długi wysiłek na zewnątrz.',
          },
          {
            o: 'dostateczna',
            z: '25–50',
            k: '#ff5050',
            c: 'Dzieci, osoby starsze i chorzy — ograniczyć przebywanie na zewnątrz.',
          },
          {
            o: 'zła',
            z: '50–75',
            k: '#960032',
            c: 'Unikać wysiłku na zewnątrz. Zajęcia sportowe przenieść do budynku.',
          },
          {
            o: 'bardzo zła',
            z: 'powyżej 75',
            k: '#7d2181',
            c: 'Pozostać w pomieszczeniach, zamknąć okna.',
          },
        ].map((w) => (
          <div class="powietrze-poziom">
            <span class="powietrze-poziom-kolor" style={`background:${w.k}`} aria-hidden="true" />
            <div class="powietrze-poziom-tresc">
              <strong class="powietrze-poziom-nazwa">{w.o}</strong>
              <span class="powietrze-poziom-zakres">PM2.5: {w.z} µg/m³</span>
              <p class="powietrze-poziom-opis">{w.c}</p>
            </div>
          </div>
        ))}
      </div>
      <p class="powietrze-nota">
        Skala według wskaźnika European Air Quality Index (Europejska Agencja Środowiska).
        Ocenę zawsze zaokrąglamy w dół do niższej klasy — przy wartości granicznej wolimy
        ostrzec za mocno niż za słabo, bo po drugiej stronie są dzieci i osoby z astmą.
      </p>
    </section>
  </div>
)
