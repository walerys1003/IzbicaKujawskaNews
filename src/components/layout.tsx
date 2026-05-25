import { SITE, NAV } from '../data'

export const SuperHeader = () => (
  <div id="super-header">
    <div class="sh-inner">
      <div class="sh-left">{SITE.today}</div>
      <div class="sh-mid">
        <span>☀️</span>
        <span class="temp">{SITE.weather.temp}°C</span>
        <span class="sep">·</span>
        <span>{SITE.weather.city}</span>
      </div>
      <div class="sh-right">📧 Newsletter tygodniowy</div>
    </div>
  </div>
)

export const MainNav = () => (
  <header id="main-nav">
    <div class="nav-inner">
      <a id="logo" href="/" aria-label="izbica24.pl">
        <div class="logo-row">
          <span class="logo-main">izbica</span>
          <span class="logo-num">24</span>
          <span class="logo-sub">.pl</span>
        </div>
        <small class="logo-tagline">{SITE.tagline}</small>
      </a>

      <nav class="main-menu" id="mainMenu">
        <ul>
          {NAV.map((item) => (
            <li style={`--cat: ${item.color}`}>
              <a href={item.href}>{item.label}</a>
              <div class="dropdown" role="menu">
                {item.sub.map((s) => (<a href={s.href}>{s.label}</a>))}
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <div class="nav-right">
        <button class="nav-btn" aria-label="Wyszukaj" id="searchBtn">🔍</button>
        <button class="nav-btn bell" aria-label="Powiadomienia">🔔</button>
        <button class="nav-cta">+ Ogłoś</button>
        <button class="hamburger" aria-label="Menu" id="hamburger">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
)

export const DemoStrip = ({ active }: { active: string }) => (
  <div class="demo-pages-strip">
    <a href="/" class={active === 'home' ? 'active' : ''}>🏠 Strona Główna (Makieta)</a>
    <a href="/plan" class={active === 'plan' ? 'active' : ''}>📋 Plan wdrożenia</a>
    <a href="/wiedza" class={active === 'wiedza' ? 'active' : ''}>🧠 Baza wiedzy (RAG)</a>
    <span class="info">izbica24.pl — prototyp v1.0 / 25 maja 2026</span>
  </div>
)

export const Footer = () => (
  <footer id="footer">
    <div class="footer-top-rule"></div>
    <div class="footer-main">
      <div class="footer-col">
        <div class="footer-logo">izbica<span>24</span></div>
        <div class="footer-mission">
          Niezależny portal informacyjny Gminy Izbica Kujawska. Tworzony przez mieszkańców, dla mieszkańców — z pomocą sztucznej inteligencji pod ścisłą kontrolą redakcyjną.
        </div>
        <div class="footer-socials">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="YouTube">▶</a>
          <a href="#" aria-label="Spotify">♫</a>
          <a href="#" aria-label="RSS">⌘</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Kategorie</h4>
        <div class="footer-cats">
          {NAV.map((n) => (<a href={n.href}>{n.label.charAt(0) + n.label.slice(1).toLowerCase()}</a>))}
        </div>
      </div>
      <div class="footer-col footer-info">
        <h4>Informacje</h4>
        <a href="/o-portalu">O portalu</a>
        <a href="/redakcja">Redakcja</a>
        <a href="/kontakt">Kontakt</a>
        <a href="/reklama">Reklama</a>
        <a href="/dolacz">Dołącz do nas</a>
        <a href="/mapa">Mapa gminy</a>
        <a href="/telefony">Ważne telefony</a>
        <a href="/linki">Linki</a>
      </div>
      <div class="footer-col footer-contact">
        <h4>Kontakt</h4>
        <div class="email">redakcja@izbica24.pl</div>
        <div class="addr">
          Redakcja izbica24.pl<br />
          ul. Marszałka Piłsudskiego 32<br />
          87-865 Izbica Kujawska
        </div>
      </div>
    </div>
    <div class="footer-sub">
      <div class="footer-sub-inner">
        <div>
          <a href="/regulamin">Regulamin</a> ·{' '}
          <a href="/polityka-prywatnosci">Polityka prywatności</a> ·{' '}
          <a href="/rodo">RODO</a>
        </div>
        <div class="footer-ai-note">
          Portal używa AI do tworzenia części treści — wszystkie materiały weryfikowane przez redakcję
        </div>
        <span>© 2026 izbica24.pl</span>
      </div>
    </div>
  </footer>
)
