// SA8: RODO/GDPR Information Clause page
import { PublicPageLayout } from './PublicPageLayout'

export const RodoPage = () => (
  <PublicPageLayout title="Klauzula informacyjna RODO | izbica24.pl">
    <article class="legal-content">
      <h1>Klauzula informacyjna RODO</h1>
      <p class="legal-date">Obowiązuje od: 1 czerwca 2026</p>

      <section>
        <h2>1. Administrator danych</h2>
        <p>Administratorem Państwa danych osobowych jest redakcja portalu izbica24.pl z siedzibą w Izbicy Kujawskiej. Kontakt: <a href="mailto:iod@izbica24.pl">iod@izbica24.pl</a>.</p>
      </section>

      <section>
        <h2>2. Inspektor Ochrony Danych</h2>
        <p>Wyznaczyliśmy Inspektora Ochrony Danych (IOD). Kontakt: <a href="mailto:iod@izbica24.pl">iod@izbica24.pl</a>.</p>
      </section>

      <section>
        <h2>3. Cele i podstawy przetwarzania</h2>
        <p>Państwa dane osobowe przetwarzane będą w następujących celach:</p>
        <ul>
          <li><strong>Newsletter</strong> — na podstawie zgody (art. 6 ust. 1 lit. a RODO)</li>
          <li><strong>Komentarze</strong> — na podstawie prawnie uzasadnionego interesu administratora (art. 6 ust. 1 lit. f RODO)</li>
          <li><strong>Konto redaktora</strong> — na podstawie umowy (art. 6 ust. 1 lit. b RODO)</li>
          <li><strong>Analityka</strong> — na podstawie prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f RODO)</li>
        </ul>
      </section>

      <section>
        <h2>4. Prawa osób, których dane dotyczą</h2>
        <p>Przysługuje Państwu prawo do:</p>
        <ul>
          <li>Dostępu do swoich danych oraz otrzymania ich kopii</li>
          <li>Sprostowania (poprawiania) swoich danych</li>
          <li>Usunięcia danych („prawo do bycia zapomnianym")</li>
          <li>Ograniczenia przetwarzania danych</li>
          <li>Przenoszenia danych</li>
          <li>Wniesienia sprzeciwu wobec przetwarzania</li>
          <li>Cofnięcia zgody w dowolnym momencie (nie wpływa to na zgodność z prawem przetwarzania przed cofnięciem zgody)</li>
          <li>Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO)</li>
        </ul>
      </section>

      <section>
        <h2>5. Okres przechowywania</h2>
        <p>Dane przechowujemy przez okres niezbędny do realizacji celów:</p>
        <ul>
          <li>Dane newslettera — do momentu cofnięcia zgody</li>
          <li>Komentarze — przez czas istnienia artykułu</li>
          <li>Logi systemowe — 30 dni (adresy IP anonimizowane)</li>
        </ul>
      </section>

      <section>
        <h2>6. Odbiorcy danych</h2>
        <p>Dane mogą być przekazywane podmiotom przetwarzającym na zlecenie administratora:</p>
        <ul>
          <li>Cloudflare Inc. — hosting i CDN (USA, EU-US Data Privacy Framework)</li>
          <li>Dostawca usług email — wyłącznie w zakresie wysyłki newslettera</li>
        </ul>
      </section>

      <section>
        <h2>7. Profilowanie</h2>
        <p>Nie podejmujemy decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby skutki prawne lub w podobny sposób istotnie wpływały na Państwa sytuację.</p>
      </section>
    </article>
  </PublicPageLayout>
)
