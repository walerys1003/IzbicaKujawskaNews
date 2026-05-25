/** =============================================================================
 *  izbica24 — Home v2 modules
 *
 *  10 nowych komponentów zaprojektowanych na podstawie krytycznej analizy
 *  potrzeb mieszkańca gminy 5400-osobowej (Izbica Kujawska):
 *
 *   1. SkrotDnia        — data-dashboard z 6 KPI na 1 ekran (pogoda, prąd, drogi…)
 *   2. AwarieIUtrudnienia — Energa + wodociągi + ciepło, status live
 *   3. DrogiKomunikacja — DK62, S10, korek, wypadek, remont
 *   4. DyzuryGodziny    — apteka dyżurna, lekarz, urząd, MGOPS
 *   5. CenyPaliw        — Orlen, BP, Circle K — ranking lokalny
 *   6. PomagamyRazem    — zbiórki OSP, MGOPS, apele lokalne
 *   7. KronikaRodzinna  — narodziny, śluby, jubileusze, nekrologi
 *   8. KalendarzTygodnia — 7-dniowy event-grid (msze, sport, kultura)
 *   9. TopTygodnia      — najczęściej czytane (algorytm BM25)
 *  10. MowiaMieszkancy  — głosy z FB / komentarze (moderowane)
 *
 *  Każdy moduł:
 *   • używa reuters-tier estetyki (monochrome + #fa6400)
 *   • ma eyebrow + dateline + ikonę SVG
 *   • renderuje się responsywnie (mobile-first)
 *   • zawiera dane przykładowe ze świata Izbicy
 * ============================================================================= */

import { Icon } from './icons';

/** Dynamiczna mapa kluczy → Icon.Xxx (dla danych przekazywanych z arrayów). */
const IconByKey = (props: { name: string; size?: number }) => {
  const map: Record<string, any> = {
    'cloud-sun': Icon.CloudSun,
    'bolt': Icon.Bolt,
    'truck': Icon.Car,
    'clipboard': Icon.Clipboard,
    'calendar': Icon.Calendar,
    'heart': Icon.Star,
    'hospital': Icon.Hospital,
    'building': Icon.Building,
    'shield': Icon.Shield,
    'flame': Icon.Fire,
    'phone': Icon.Phone,
    'fuel': Icon.Car,
    'cake': Icon.Cake,
    'graduation': Icon.Graduation,
    'dove': Icon.Dove,
    'chat': Icon.Megaphone,
    'chart': Icon.Newspaper,
    'mail': Icon.Mail,
  };
  const Cmp = map[props.name] || Icon.Star;
  return <Cmp size={props.size || 18} />;
};

/* ============================================================================
 *  1. SKRÓT DNIA — 6 KPI w jednej linii
 * ============================================================================ */
export const SkrotDnia = () => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  const kpis = [
    { icon: 'cloud-sun', label: 'Pogoda', value: '14°C', sub: 'częściowe zachmurzenie', accent: false },
    { icon: 'bolt', label: 'Awarie prądu', value: '0', sub: 'aktywne na obszarze gminy', accent: false },
    { icon: 'truck', label: 'Drogi', value: '1', sub: 'utrudnienie DK62', accent: true },
    { icon: 'clipboard', label: 'Dziś dyżur', value: 'Pod Wagą', sub: 'apteka, ul. Rynek 4', accent: false },
    { icon: 'calendar', label: 'Sesja Rady', value: 'śr 18:00', sub: '6 punktów porządku', accent: false },
    { icon: 'heart', label: 'Zbiórki', value: '2', sub: 'aktywne, łącznie 4 380 zł', accent: false },
  ];

  return (
    <section class="modv2 skrot-dnia" aria-labelledby="skrot-dnia-h">
      <header class="modv2-head">
        <span class="eyebrow">IZBICA — {dateStr.toUpperCase()}</span>
        <h2 id="skrot-dnia-h" class="modv2-title">Skrót dnia</h2>
        <p class="modv2-lede">Sześć kluczowych liczb dla mieszkańca — sprawdzone dziś rano.</p>
      </header>
      <div class="kpi-strip">
        {kpis.map((k) => (
          <div class={`kpi-cell ${k.accent ? 'is-accent' : ''}`}>
            <div class="kpi-cell-icon"><IconByKey name={k.icon} size={20} /></div>
            <div class="kpi-cell-body">
              <div class="kpi-cell-label">{k.label}</div>
              <div class="kpi-cell-value">{k.value}</div>
              <div class="kpi-cell-sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ============================================================================
 *  2. AWARIE I UTRUDNIENIA
 * ============================================================================ */
export const AwarieIUtrudnienia = () => {
  const items = [
    {
      kind: 'Prąd',
      status: 'ok',
      title: 'Brak planowanych wyłączeń',
      detail: 'Energa-Operator nie zgłasza prac w gminie do 28 maja.',
      time: 'sprawdzono 06:00',
      tag: 'Energa',
    },
    {
      kind: 'Woda',
      status: 'warn',
      title: 'Płukanie sieci — Smolsk, Naczachowo',
      detail: 'Możliwe zmętnienie 9:00–13:00. ZGK informuje o pracach konserwacyjnych.',
      time: '25.05 · 9:00–13:00',
      tag: 'ZGK',
    },
    {
      kind: 'Ciepło',
      status: 'ok',
      title: 'Sezon grzewczy zakończony',
      detail: 'Standardowy harmonogram letni od 15 maja.',
      time: '—',
      tag: 'MEC',
    },
    {
      kind: 'Internet',
      status: 'warn',
      title: 'Słaby zasięg LTE — Modzerowo',
      detail: 'Operatorzy potwierdzają lokalne problemy, naprawa do 27.05.',
      time: 'zgłoszone 24.05',
      tag: 'T-Mobile/Plus',
    },
  ];

  return (
    <section class="modv2 awarie" aria-labelledby="awarie-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Bolt size={20} /> AWARIE I UTRUDNIENIA</span>
        <h2 id="awarie-h" class="modv2-title">Co dziś nie działa</h2>
        <a href="/awarie" class="modv2-more">Pełna mapa awarii →</a>
      </header>
      <div class="awarie-list">
        {items.map((it) => (
          <article class={`awarie-row status-${it.status}`}>
            <div class="awarie-kind">{it.kind}</div>
            <div class="awarie-body">
              <h3 class="awarie-title">{it.title}</h3>
              <p class="awarie-detail">{it.detail}</p>
              <div class="awarie-meta">
                <span class="awarie-tag">{it.tag}</span>
                <span class="awarie-time">{it.time}</span>
              </div>
            </div>
            <div class={`awarie-dot dot-${it.status}`} aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
};

/* ============================================================================
 *  3. DROGI I KOMUNIKACJA
 * ============================================================================ */
export const DrogiKomunikacja = () => {
  const incidents = [
    { road: 'DK62', desc: 'Remont nawierzchni na odc. Izbica–Lubraniec', severity: 'high', km: 'km 18+200', eta: 'do 5 czerwca' },
    { road: 'S10', desc: 'Utrudnienia węzeł Włocławek-Wschód', severity: 'med', km: '—', eta: 'po godz. 16:00' },
    { road: 'DW270', desc: 'Otwarte bez utrudnień', severity: 'ok', km: '—', eta: '—' },
    { road: 'PKS', desc: 'Linia Izbica–Włocławek — opóźnienia 10–15 min', severity: 'med', km: 'kurs 7:35', eta: 'sytuacja zmienna' },
  ];

  return (
    <section class="modv2 drogi" aria-labelledby="drogi-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Car size={20} /> DROGI &amp; KOMUNIKACJA</span>
        <h2 id="drogi-h" class="modv2-title">Co na trasie</h2>
        <a href="/drogi" class="modv2-more">Wszystkie utrudnienia →</a>
      </header>
      <ul class="drogi-list">
        {incidents.map((i) => (
          <li class={`drogi-item sev-${i.severity}`}>
            <span class="drogi-road">{i.road}</span>
            <span class="drogi-desc">{i.desc}</span>
            <span class="drogi-meta">{i.km} {i.eta && i.eta !== '—' ? '· ' + i.eta : ''}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

/* ============================================================================
 *  4. DYŻURY I GODZINY
 * ============================================================================ */
export const DyzuryGodziny = () => {
  const duties = [
    { type: 'Apteka dyżurna', name: '„Pod Wagą"', addr: 'ul. Rynek 4', hours: 'całodobowo dziś', phone: '54 286 12 34', icon: 'clipboard' },
    { type: 'Lekarz POZ', name: 'NZOZ „Medikus"', addr: 'ul. Kościelna 7', hours: '8:00–18:00', phone: '54 286 22 11', icon: 'hospital' },
    { type: 'Urząd Miejski', name: 'UM Izbica Kujawska', addr: 'ul. Marszałka Piłsudskiego 32', hours: 'pon–pt 7:30–15:30 · czw 9:00–17:00', phone: '54 286 50 09', icon: 'building' },
    { type: 'MGOPS', name: 'Pomoc Społeczna', addr: 'ul. Narutowicza 1', hours: 'pon–pt 7:30–15:30', phone: '54 286 50 30', icon: 'heart' },
    { type: 'Posterunek Policji', name: 'KPP Włocławek – posterunek Izbica', addr: 'ul. 1-go Maja 9', hours: 'całodobowo · interwencje 112', phone: '47 752 19 00', icon: 'shield' },
    { type: 'Straż Pożarna', name: 'JRG / OSP Izbica Kujawska', addr: 'ul. Kazimierza Wielkiego 28', hours: 'całodobowo · 998', phone: '998', icon: 'flame' },
  ];

  return (
    <section class="modv2 dyzury" aria-labelledby="dyzury-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Clipboard size={20} /> WAŻNE TELEFONY &amp; DYŻURY</span>
        <h2 id="dyzury-h" class="modv2-title">Komu zadzwonić</h2>
        <a href="/wazne-telefony" class="modv2-more">Pełny spis →</a>
      </header>
      <div class="dyzury-grid">
        {duties.map((d) => (
          <article class="dyzury-card">
            <div class="dyzury-icon"><IconByKey name={d.icon} size={22} /></div>
            <div class="dyzury-type">{d.type}</div>
            <div class="dyzury-name">{d.name}</div>
            <div class="dyzury-addr">{d.addr}</div>
            <div class="dyzury-hours">{d.hours}</div>
            <a class="dyzury-phone" href={`tel:${d.phone.replace(/\s+/g, '')}`}>
              <Icon.Phone size={14} /> {d.phone}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
};

/* ============================================================================
 *  5. CENY PALIW
 * ============================================================================ */
export const CenyPaliw = () => {
  const stations = [
    { brand: 'Orlen', addr: 'ul. Włocławska 18', pb95: 6.42, pb98: 7.09, on: 6.59, lpg: 2.99, trend: 'down' },
    { brand: 'BP', addr: 'DK62 — Lubraniec', pb95: 6.49, pb98: 7.15, on: 6.61, lpg: 3.05, trend: 'same' },
    { brand: 'Circle K', addr: 'Włocławek, ul. Toruńska', pb95: 6.38, pb98: 7.04, on: 6.55, lpg: 2.95, trend: 'down' },
    { brand: 'Niezależna', addr: 'Topólka, DW270', pb95: 6.45, pb98: '—', on: 6.58, lpg: 2.97, trend: 'up' },
  ];

  return (
    <section class="modv2 ceny" aria-labelledby="ceny-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Car size={20} /> CENY PALIW W OKOLICY</span>
        <h2 id="ceny-h" class="modv2-title">Gdzie zatankujesz taniej</h2>
        <span class="modv2-sub">aktualizacja 25.05 · 7:30</span>
      </header>
      <div class="ceny-table-wrap">
        <table class="ceny-table">
          <thead>
            <tr>
              <th>Stacja</th>
              <th class="num">PB95</th>
              <th class="num">PB98</th>
              <th class="num">ON</th>
              <th class="num">LPG</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr>
                <td>
                  <strong>{s.brand}</strong>
                  <div class="ceny-addr">{s.addr}</div>
                </td>
                <td class="num">{typeof s.pb95 === 'number' ? s.pb95.toFixed(2) : s.pb95}</td>
                <td class="num">{typeof s.pb98 === 'number' ? s.pb98.toFixed(2) : s.pb98}</td>
                <td class="num">{typeof s.on === 'number' ? s.on.toFixed(2) : s.on}</td>
                <td class="num">{typeof s.lpg === 'number' ? s.lpg.toFixed(2) : s.lpg}</td>
                <td>
                  <span class={`trend trend-${s.trend}`}>
                    {s.trend === 'down' ? '↓' : s.trend === 'up' ? '↑' : '→'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="ceny-note">Ceny zgłaszane przez mieszkańców i bot LiveData. Najtaniej dziś: <strong>Circle K Toruńska — PB95 6,38 zł/l</strong>.</p>
    </section>
  );
};

/* ============================================================================
 *  6. POMAGAMY RAZEM
 * ============================================================================ */
export const PomagamyRazem = () => {
  const causes = [
    { title: 'Dla 6-letniej Hani', desc: 'Operacja kardiologiczna w Berlinie. Cel: 280 000 zł.', raised: 184700, goal: 280000, days: 23, type: 'siepomaga' },
    { title: 'Remont remizy OSP Naczachowo', desc: 'Wymiana bramy garażowej po zniszczeniach lutowej wichury.', raised: 18200, goal: 35000, days: 41, type: 'osp' },
    { title: 'Karma dla schroniska w Warzynie', desc: 'Zbiórka żywności i koców — zima już blisko.', raised: 0, goal: 0, days: null, type: 'rzeczowa' },
  ];

  return (
    <section class="modv2 pomagamy" aria-labelledby="pomagamy-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Star size={20} /> POMAGAMY RAZEM</span>
        <h2 id="pomagamy-h" class="modv2-title">Aktywne zbiórki w gminie</h2>
        <a href="/pomagamy" class="modv2-more">Wszystkie akcje →</a>
      </header>
      <div class="pomagamy-grid">
        {causes.map((c) => {
          const pct = c.goal > 0 ? Math.min(100, (c.raised / c.goal) * 100) : null;
          return (
            <article class="pomagamy-card">
              <div class="pomagamy-tag">{c.type}</div>
              <h3 class="pomagamy-title">{c.title}</h3>
              <p class="pomagamy-desc">{c.desc}</p>
              {pct !== null && (
                <div class="pomagamy-prog">
                  <div class="bar"><div class="fill" style={`width:${pct.toFixed(1)}%`} /></div>
                  <div class="meta">
                    <strong>{c.raised.toLocaleString('pl-PL')} zł</strong>
                    <span>z {c.goal.toLocaleString('pl-PL')} zł · {c.days} dni</span>
                  </div>
                </div>
              )}
              <a class="pomagamy-cta" href="#">Wesprzyj <Icon.Pin size={12} /></a>
            </article>
          );
        })}
      </div>
    </section>
  );
};

/* ============================================================================
 *  7. KRONIKA RODZINNA
 * ============================================================================ */
export const KronikaRodzinna = () => {
  const items = [
    { type: 'narodziny', icon: 'cake', text: 'Witamy na świecie: <strong>Antoni</strong>, syn Anny i Tomasza (Izbica)', date: '24 maja' },
    { type: 'narodziny', icon: 'cake', text: 'Witamy na świecie: <strong>Maja</strong>, córka Pauliny i Marcina (Świętosławice)', date: '23 maja' },
    { type: 'slub', icon: 'heart', text: 'Sakrament małżeństwa: <strong>Karolina i Łukasz</strong>, par. św. Antoniego', date: '24 maja' },
    { type: 'jubileusz', icon: 'graduation', text: '<strong>50-lecie pożycia</strong>: Barbara i Henryk Kowalscy', date: '22 maja' },
    { type: 'nekrolog', icon: 'dove', text: 'Z żalem żegnamy <strong>Ś.P. Stanisława Wiśniewskiego</strong> (l. 79). Pogrzeb: czwartek 9:00, par. św. Antoniego', date: '23 maja' },
    { type: 'nekrolog', icon: 'dove', text: 'Z żalem żegnamy <strong>Ś.P. Janinę Mazur</strong> (l. 84). Pogrzeb: piątek 11:00, cmentarz parafialny Lubraniec', date: '22 maja' },
  ];

  return (
    <section class="modv2 kronika" aria-labelledby="kronika-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Dove size={18} /> KRONIKA RODZINNA</span>
        <h2 id="kronika-h" class="modv2-title">Narodziny · śluby · pożegnania</h2>
        <a href="/kronika" class="modv2-more">Pełna kronika →</a>
      </header>
      <ul class="kronika-list">
        {items.map((it) => (
          <li class={`kronika-row kr-${it.type}`}>
            <span class="kronika-icon"><IconByKey name={it.icon} size={16} /></span>
            <span class="kronika-text" dangerouslySetInnerHTML={{ __html: it.text }} />
            <span class="kronika-date">{it.date}</span>
          </li>
        ))}
      </ul>
      <p class="kronika-note">
        Zgłoszenia kierować przez parafię, USC lub formularz <a href="/kronika/zglos">/kronika/zgłoś</a>. Treść moderowana.
      </p>
    </section>
  );
};

/* ============================================================================
 *  8. KALENDARZ TYGODNIA — 7-dniowy event grid
 * ============================================================================ */
export const KalendarzTygodnia = () => {
  const dni = [
    { dayLabel: 'PN', dateLabel: '26.V', events: [{ time: '18:00', title: 'Sesja Rady Miejskiej', loc: 'sala UM', tag: 'samorząd' }] },
    { dayLabel: 'WT', dateLabel: '27.V', events: [{ time: '17:00', title: 'Klub seniora — spotkanie', loc: 'MGCK', tag: 'kultura' }] },
    { dayLabel: 'ŚR', dateLabel: '28.V', events: [{ time: '18:00', title: 'Próba chóru parafialnego', loc: 'par. św. Antoniego', tag: 'parafia' }, { time: '19:30', title: 'Mecz Kujawianki — sparing z Mienią Lubraniec', loc: 'stadion', tag: 'sport' }] },
    { dayLabel: 'CZ', dateLabel: '29.V', events: [{ time: '10:00', title: 'Dzień Dziecka — przedszkole nr 1', loc: 'plac przy MGCK', tag: 'dzieci' }] },
    { dayLabel: 'PT', dateLabel: '30.V', events: [{ time: '20:00', title: 'Koncert „Wieczór z gitarą"', loc: 'MGCK', tag: 'kultura' }] },
    { dayLabel: 'SO', dateLabel: '31.V', events: [{ time: '15:00', title: 'Festyn rodzinny — sołectwo Smolsk', loc: 'remiza OSP', tag: 'festyn' }, { time: '17:00', title: 'Kujawianka vs Pomorzanin Sierpc', loc: 'stadion', tag: 'sport' }] },
    { dayLabel: 'ND', dateLabel: '01.VI', events: [{ time: '11:30', title: 'Suma z procesją', loc: 'par. św. Antoniego', tag: 'parafia' }] },
  ];

  return (
    <section class="modv2 kalendarz" aria-labelledby="kalendarz-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Calendar size={20} /> KALENDARZ TYGODNIA</span>
        <h2 id="kalendarz-h" class="modv2-title">Najbliższych 7 dni w gminie</h2>
        <a href="/kalendarz" class="modv2-more">Pełny kalendarz →</a>
      </header>
      <div class="kalendarz-week">
        {dni.map((d) => (
          <div class="kalendarz-day">
            <div class="kalendarz-dayhead">
              <span class="kalendarz-daylabel">{d.dayLabel}</span>
              <span class="kalendarz-datelabel">{d.dateLabel}</span>
            </div>
            <ul class="kalendarz-events">
              {d.events.map((e) => (
                <li class={`kalendarz-event tag-${e.tag}`}>
                  <span class="kalendarz-time">{e.time}</span>
                  <strong class="kalendarz-title2">{e.title}</strong>
                  <span class="kalendarz-loc">{e.loc}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ============================================================================
 *  9. TOP TYGODNIA — najczęściej czytane
 * ============================================================================ */
export const TopTygodnia = () => {
  const items = [
    { rank: 1, title: 'Zamknięcie DK62 na 3 dni — objazdy i utrudnienia dla mieszkańców', cat: 'Wiadomości', views: '4 280' },
    { rank: 2, title: 'Pożar stodoły w Naczachowie — interwencja 6 zastępów OSP', cat: 'Na Sygnale', views: '3 117' },
    { rank: 3, title: 'Sesja Rady: budżet na boisko, dotacja dla MGCK, dyskusja o oświetleniu', cat: 'Samorząd', views: '2 654' },
    { rank: 4, title: 'Kujawianka awansuje — 2:1 z Bzurą Chodecz', cat: 'Sport', views: '2 188' },
    { rank: 5, title: 'Konsultacje społeczne — co z parkingiem przy szkole?', cat: 'Samorząd', views: '1 920' },
  ];

  return (
    <section class="modv2 top-tygodnia" aria-labelledby="top-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Newspaper size={18} /> TOP TYGODNIA</span>
        <h2 id="top-h" class="modv2-title">Najczęściej czytane</h2>
        <span class="modv2-sub">dane redakcji · ostatnie 7 dni</span>
      </header>
      <ol class="top-list">
        {items.map((it) => (
          <li class="top-item">
            <span class="top-rank">{String(it.rank).padStart(2, '0')}</span>
            <div class="top-body">
              <a class="top-title" href="#">{it.title}</a>
              <div class="top-meta">
                <span class="top-cat">{it.cat}</span>
                <span class="top-views">{it.views} odsłon</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

/* ============================================================================
 *  10. MÓWIĄ MIESZKAŃCY — głosy z FB / komentarzy (moderowane)
 * ============================================================================ */
export const MowiaMieszkancy = () => {
  const quotes = [
    { who: 'Jan K., Modzerowo', when: '24.05', text: 'Brawo dla OSP za błyskawiczną reakcję przy pożarze stodoły. 11 minut od zgłoszenia — to standard zachodu!', source: 'FB' },
    { who: 'Beata M., Smolsk', when: '23.05', text: 'Wreszcie ktoś pisze o tych drogach. Od pół roku zgłaszam dziurę na zakręcie przy szkole.', source: 'komentarz' },
    { who: 'Marek S., Izbica', when: '22.05', text: 'Festyn sołectwa to był sukces. Frekwencja największa od lat — pewnie dlatego, że pogoda dopisała.', source: 'FB' },
    { who: 'Halina W., Naczachowo', when: '21.05', text: 'Chciałabym więcej informacji o sesjach Rady — kiedy są, gdzie można posłuchać.', source: 'mail' },
  ];

  return (
    <section class="modv2 mowia" aria-labelledby="mowia-h">
      <header class="modv2-head">
        <span class="eyebrow"><Icon.Megaphone size={18} /> MÓWIĄ MIESZKAŃCY</span>
        <h2 id="mowia-h" class="modv2-title">Głosy z gminy</h2>
        <span class="modv2-sub">moderowane przez redakcję</span>
      </header>
      <div class="mowia-grid">
        {quotes.map((q) => (
          <figure class="mowia-quote">
            <blockquote class="mowia-text">„{q.text}"</blockquote>
            <figcaption class="mowia-meta">
              <strong>{q.who}</strong>
              <span>{q.source} · {q.when}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p class="mowia-note">
        Chcesz coś dodać? Napisz: <a href="mailto:redakcja@izbica24.pl">redakcja@izbica24.pl</a> lub komentuj na FB.
      </p>
    </section>
  );
};

/* ============================================================================
 *  11. NEWSLETTER INLINE — szybki zapis
 * ============================================================================ */
export const NewsletterInline = () => (
  <section class="modv2 newsletter-inline">
    <div class="nl-inner">
      <div class="nl-icon"><Icon.Mail size={18} /></div>
      <div class="nl-text">
        <h3 class="nl-title">Tydzień w Izbicy</h3>
        <p class="nl-desc">Co tydzień podsumowanie: samorząd, Kujawianka, kultura, ważne ogłoszenia. Bez spamu — 1 mail w każdy piątek 17:00.</p>
      </div>
      <form class="nl-form" onsubmit="event.preventDefault();this.querySelector('button').textContent='✓ Zapisano';">
        <input type="email" placeholder="twój@email.pl" required class="nl-input" />
        <button type="submit" class="nl-btn">Zapisz się</button>
      </form>
    </div>
  </section>
);
