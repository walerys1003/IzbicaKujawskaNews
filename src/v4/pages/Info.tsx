// ============================================================================
// IZBICA24.PL v4 — STRONY INFORMACYJNE I FORMULARZE PUBLICZNE
// Zastępują niedziałające widoki legacy; utrzymane w szacie v4.
// ============================================================================

import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import { CATEGORIES, SOLECTWA } from '../taxonomy'
import { GMINA } from '../gmina-fakty'
import { Breadcrumbs, SectionHeader } from '../components/Layout'

export interface InfoSection {
  heading: string
  /** HTML — akapity rozdzielane \n zostaną zamienione na <p> */
  body: string
  list?: string[]
  table?: { head: string[]; rows: string[][] }
}

// ─────────────────────────────────────────── GENERYCZNA STRONA INFO
export const InfoPageV4: FC<{
  title: string
  lead: string
  badge?: string
  sections: InfoSection[]
  colorVar?: string
}> = ({ title, lead, badge, sections, colorVar = 'var(--red)' }) => (
  <div class="page">
    <Breadcrumbs items={[{ label: title }]} />

    <header class="cat-hero reveal" style={`--c:${colorVar}`}>
      {badge ? <span class="tag dark">{badge}</span> : null}
      <h1 style={badge ? 'margin-top:12px' : undefined}>{title}</h1>
      <p class="cat-lead">{lead}</p>
    </header>

    <div class="article-wrap reveal">
      <article class="article-main">
        <div class="art-body">
          {sections.map((s) => (
            <>
              <h2>{s.heading}</h2>
              {s.body
                .split('\n')
                .filter((p) => p.trim())
                .map((p) => (
                  <p>{raw(p)}</p>
                ))}
              {s.list ? (
                <ul>
                  {s.list.map((i) => (
                    <li>{raw(i)}</li>
                  ))}
                </ul>
              ) : null}
              {s.table ? (
                <table>
                  <thead>
                    <tr>
                      {s.table.head.map((h) => (
                        <th>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((r) => (
                      <tr>
                        {r.map((cell) => (
                          <td>{raw(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </>
          ))}
        </div>
      </article>

      <aside class="art-side">
        <div class="side-box">
          <div class="side-box-head">Kategorie portalu</div>
          <div class="side-box-body">
            {CATEGORIES.map((c) => (
              <a class="side-num" href={c.path}>
                <span class="n" style={`color:${c.colorVar}`}>
                  ›
                </span>
                <h4>{c.title}</h4>
              </a>
            ))}
          </div>
        </div>
        <div class="side-box">
          <div class="side-box-head">📞 Kontakt z redakcją</div>
          <div class="side-box-body">
            <p style="font:400 13.5px/1.7 var(--serif);color:var(--ink-3)">
              <strong>Izbica24.pl</strong>
              <br />
              ul. Marszałka Piłsudskiego 26
              <br />
              87-865 Izbica Kujawska
              <br />
              tel. +48 502 124 567
              <br />
              <a href="mailto:redakcja@izbica24.pl" style="color:var(--red)">
                redakcja@izbica24.pl
              </a>
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
)

// ═══════════════════════════════════════════════ NEWSLETTER — landing
export const NewsletterPageV4: FC = () => (
  <div class="page">
    <Breadcrumbs items={[{ label: 'Newsletter' }]} />
    <header class="cat-hero reveal" style="--c:var(--red)">
      <span class="tag">Newsletter</span>
      <h1 style="margin-top:12px">„Tydzień w Izbicy”</h1>
      <p class="cat-lead">
        Co tydzień podsumowanie najważniejszych wydarzeń w gminie Izbica Kujawska. Bezpłatnie, bez
        spamu, wyłącznie merytoryczne treści — w piątkowy wieczór, prosto do skrzynki.
      </p>
      <div class="cat-stats">
        <span>
          <strong>2 847</strong> subskrybentów
        </span>
        <span>
          <strong>96%</strong> open rate
        </span>
        <span>
          <strong>5 lat</strong> działalności
        </span>
      </div>
    </header>

    <section class="section reveal">
      <div class="form-box">
        <h1>Zapisz się</h1>
        <p class="fb-lead">
          Podaj adres e-mail. Możesz wybrać, które sekcje portalu Cię interesują — wyślemy tylko to,
          co wybierzesz.
        </p>
        <form action="/api/v1/newsletter/subscribe" method="post">
          <div class="field">
            <label for="nl-email">Adres e-mail</label>
            <input id="nl-email" type="email" name="email" placeholder="twoj@email.pl" required />
          </div>
          <div class="field">
            <label for="nl-name">Imię (opcjonalnie)</label>
            <input id="nl-name" type="text" name="name" placeholder="Jak się do Ciebie zwracać?" />
          </div>
          <div class="field">
            <label>Interesujące mnie sekcje</label>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
              {CATEGORIES.map((c) => (
                <label style="display:flex;align-items:center;gap:7px;font:500 13px var(--body);color:var(--ink-3);text-transform:none;letter-spacing:0">
                  <input type="checkbox" name="sections" value={c.slug} style="width:auto" />
                  {c.navLabel}
                </label>
              ))}
            </div>
          </div>
          <div class="field">
            <label style="display:flex;align-items:flex-start;gap:8px;text-transform:none;letter-spacing:0;font-weight:400">
              <input type="checkbox" name="rodo" required style="width:auto;margin-top:3px" />
              <span style="font:400 12.5px/1.6 var(--body);color:var(--ink-4)">
                Wyrażam zgodę na przetwarzanie mojego adresu e-mail w celu otrzymywania newslettera
                Izbica24.pl. Zgodę mogę wycofać w każdej chwili.
              </span>
            </label>
          </div>
          <button type="submit" class="btn-primary">
            Zapisz się do newslettera
          </button>
        </form>
      </div>
    </section>
  </div>
)

// ══════════════════════════════════════ FORMULARZ DODANIA OGŁOSZENIA
export const AddAnnouncementPageV4: FC = () => {
  const ogl = CATEGORIES.find((c) => c.slug === 'ogloszenia')!
  return (
    <div class="page">
      <Breadcrumbs items={[{ label: 'Ogłoszenia', href: '/ogloszenia' }, { label: 'Dodaj ogłoszenie' }]} />
      <header class="cat-hero reveal" style="--c:var(--ink)">
        <span class="tag dark">Ogłoszenia</span>
        <h1 style="margin-top:12px">Dodaj ogłoszenie</h1>
        <p class="cat-lead">
          Ogłoszenia drobne, praca i usługi są bezpłatne. Nekrologi, rocznice i rozszerzone wizytówki
          firm są płatne — skontaktujemy się w sprawie szczegółów.
        </p>
      </header>

      <section class="section reveal">
        <div class="form-box">
          <form action="/api/v1/announcements" method="post" enctype="multipart/form-data">
            <div class="field">
              <label for="an-type">Kategoria ogłoszenia</label>
              <select id="an-type" name="subcategory" required>
                {ogl.subcategories.map((s) => (
                  <option value={s.slug}>{s.title}</option>
                ))}
              </select>
            </div>
            <div class="field">
              <label for="an-title">Tytuł ogłoszenia</label>
              <input id="an-title" type="text" name="title" maxlength={120} required placeholder="np. Sprzedam ciągnik Ursus C-360" />
              <div class="hint">Maksymalnie 120 znaków. Bez wielkich liter w całym tytule.</div>
            </div>
            <div class="field">
              <label for="an-body">Treść ogłoszenia</label>
              <textarea id="an-body" name="body" required placeholder="Opisz szczegóły — stan, rok, lokalizacja…"></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="an-price">Cena (opcjonalnie)</label>
                <input id="an-price" type="text" name="price" placeholder="np. 12 000 zł / do negocjacji" />
              </div>
              <div class="field">
                <label for="an-solectwo">Sołectwo / miejscowość</label>
                <select id="an-solectwo" name="solectwo">
                  <option value="">Izbica Kujawska (miasto)</option>
                  {SOLECTWA.map((s) => (
                    <option value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="an-contact">Telefon kontaktowy</label>
                <input id="an-contact" type="tel" name="contact" required placeholder="np. 502 145 678" />
              </div>
              <div class="field">
                <label for="an-email">Twój e-mail (nie będzie publikowany)</label>
                <input id="an-email" type="email" name="email" required placeholder="twoj@email.pl" />
              </div>
            </div>
            <div class="field">
              <label for="an-photos">Zdjęcia (do 5 plików, max 5 MB każde)</label>
              <input id="an-photos" type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple />
              <div class="hint">Formaty: JPG, PNG, WEBP. Zdjęcia dobrej jakości zwiększają zainteresowanie.</div>
            </div>
            <div class="field">
              <label style="display:flex;align-items:flex-start;gap:8px;text-transform:none;letter-spacing:0;font-weight:400">
                <input type="checkbox" name="terms" required style="width:auto;margin-top:3px" />
                <span style="font:400 12.5px/1.6 var(--body);color:var(--ink-4)">
                  Akceptuję <a href="/regulamin" style="color:var(--red)">regulamin</a> portalu i
                  potwierdzam, że treść ogłoszenia jest zgodna z prawem.
                </span>
              </label>
            </div>
            <button type="submit" class="btn-primary">
              Wyślij ogłoszenie do weryfikacji
            </button>
            <p style="font:400 11.5px/1.6 var(--body);color:var(--ink-6);margin-top:12px">
              Ogłoszenia są weryfikowane przez redakcję. Publikacja zwykle w ciągu 24 godzin w dni
              robocze.
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}

// ═════════════════════════════════════════════════════ MAPA GMINY
export const MapaGminyPageV4: FC = () => (
  <div class="page">
    <Breadcrumbs items={[{ label: 'Mapa gminy' }]} />
    <header class="cat-hero reveal" style="--c:var(--c-samorzad)">
      <span class="tag samorzad">Gmina Izbica Kujawska</span>
      <h1 style="margin-top:12px">Mapa gminy — instytucje i sołectwa</h1>
      <p class="cat-lead">
        Najważniejsze instytucje publiczne, placówki oświatowe i zdrowotne oraz {SOLECTWA.length} sołectw gminy
        Izbica Kujawska. Powiat włocławski, województwo kujawsko-pomorskie, {GMINA.powierzchnia.tekst}.
      </p>
    </header>

    <section class="section reveal">
      <SectionHeader title="Instytucje w gminie" colorVar="var(--c-samorzad)" />
      <div class="list-grid cols-2">
        {[
          { n: 'Urząd Miejski', a: 'ul. Marszałka Piłsudskiego 32', t: '54 286 50 09', h: 'pon–pt 7:30–15:30, śr do 17:00' },
          { n: 'SPZOZ Izbica Kujawska', a: 'ul. Kolejowa 5', t: '54 286 51 12', h: 'pon–pt 8:00–18:00' },
          { n: 'Posterunek Policji', a: 'ul. Narutowicza 8', t: '47 725 42 30', h: 'pon–pt 8:00–15:00, dyżur 24/7: 112' },
          { n: 'OSP Izbica Kujawska', a: 'ul. Sportowa 2', t: '998 / 112', h: 'gotowość całodobowa' },
          { n: 'MGCK — Centrum Kultury', a: 'ul. Piłsudskiego 26', t: '54 286 50 41', h: 'pon–pt 9:00–19:00' },
          { n: 'Biblioteka Publiczna', a: 'ul. Piłsudskiego 26', t: '54 286 50 42', h: 'pon–pt 10:00–18:00, sob 9:00–13:00' },
          { n: 'MGOPS', a: 'ul. Sportowa 4', t: '54 286 51 45', h: 'pon–pt 7:30–15:30' },
          { n: 'ZGKiW', a: 'ul. Kolejowa 14', t: '54 286 50 88', h: 'pon–pt 7:00–15:00, awarie: 601 445 220' },
        ].map((i) => (
          <article class="lc" style="--c:var(--c-samorzad)">
            <div class="lc-body">
              <span class="tag samorzad">Instytucja</span>
              <h3>{i.n}</h3>
              <p>
                📍 {i.a}
                <br />
                📞 {i.t}
                <br />
                🕘 {i.h}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section class="section reveal">
      <SectionHeader title={`${SOLECTWA.length} sołectw`} moreHref="/solectwa" moreLabel="Zobacz wszystkie" colorVar="var(--c-samorzad)" />
      <div class="sol-page-grid">
        {SOLECTWA.map((s) => (
          <a class="sol-card" href={`/solectwa/${s.slug}`}>
            <h3>{s.name}</h3>
            <div class="sc-count">{s.articleCount} wpisów</div>
          </a>
        ))}
      </div>
    </section>
  </div>
)
