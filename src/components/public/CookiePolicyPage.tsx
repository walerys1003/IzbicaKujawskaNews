// SA4 + SA8: Cookie Policy + RODO pages
import { PublicPageLayout } from './PublicPageLayout'

export const CookiePolicyPage = () => (
  <PublicPageLayout title="Polityka cookies | izbica24.pl">
    <article class="legal-content">
      <h1>Polityka plików cookies</h1>
      <p class="legal-date">Obowiązuje od: 1 czerwca 2026</p>

      <section>
        <h2>1. Czym są pliki cookies?</h2>
        <p>Pliki cookies (ciasteczka) to niewielkie pliki tekstowe zapisywane na urządzeniu użytkownika podczas przeglądania strony internetowej. Służą one do zapamiętywania preferencji użytkownika, ułatwiania nawigacji oraz zbierania danych analitycznych.</p>
      </section>

      <section>
        <h2>2. Jakie cookies stosujemy?</h2>
        <h3>2.1. Niezbędne (essential)</h3>
        <p>Cookies techniczne niezbędne do prawidłowego działania portalu. Bez nich strona może nie działać poprawnie. Nie wymagają zgody użytkownika.</p>
        <ul>
          <li><code>cookie-consent</code> — przechowuje zgodę na cookies (12 miesięcy)</li>
          <li><code>session</code> — identyfikator sesji zalogowanego redaktora (sesja)</li>
          <li><code>csrf_token</code> — token zabezpieczający przed atakami CSRF (sesja)</li>
        </ul>

        <h3>2.2. Analityczne (analytics)</h3>
        <p>Służą do zbierania anonimowych statystyk odwiedzin. Korzystamy z Cloudflare Web Analytics i Plausible — oba rozwiązania są zgodne z RODO i nie używają śledzenia międzydomenowego.</p>
        <ul>
          <li><code>_cf_*</code> — Cloudflare Analytics (30 dni)</li>
        </ul>

        <h3>2.3. Marketingowe (marketing)</h3>
        <p>Obecnie NIE stosujemy cookies marketingowych ani reklamowych stron trzecich.</p>
      </section>

      <section>
        <h2>3. Jak zarządzać cookies?</h2>
        <p>Większość przeglądarek umożliwia zarządzanie plikami cookies poprzez ustawienia. Możesz zablokować wszystkie cookies lub tylko wybrane kategorie. Poniżej linki do instrukcji:</p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" rel="noopener">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/pl/kb/ciasteczka" rel="noopener">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/pl-pl/guide/safari/sfri11471/mac" rel="noopener">Safari</a></li>
          <li><a href="https://support.microsoft.com/pl-pl/microsoft-edge/usuwanie-plikow-cookie-w-programie-microsoft-edge" rel="noopener">Microsoft Edge</a></li>
        </ul>
      </section>

      <section>
        <h2>4. Zmiany w polityce</h2>
        <p>Zastrzegamy sobie prawo do aktualizacji niniejszej polityki. Wszelkie zmiany będą publikowane na tej stronie.</p>
      </section>

      <section>
        <h2>5. Kontakt</h2>
        <p>W sprawach związanych z polityką cookies prosimy o kontakt: <a href="mailto:iod@izbica24.pl">iod@izbica24.pl</a></p>
      </section>
    </article>
  </PublicPageLayout>
)
