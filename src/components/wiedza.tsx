export const WiedzaPage = ({ stats }: { stats: any }) => (
  <div class="subpage-shell">
    <h1>🧠 Baza wiedzy projektu — RAG</h1>
    <p class="subpage-lead">
      Inteligentne wyszukiwanie w 10 dokumentach projektowych portalu izbica24.pl. Pełna struktura kategorii, szata graficzna, specyfikacja UI/UX, architektura workflow, plan 6 sesji backendowych. Indeks BM25 ładowany do przeglądarki (~1 MB JSON) — odpowiedzi w &lt; 100 ms po pierwszym załadowaniu, bez serwerowych zapytań.
    </p>

    <div class="rag-stats">
      <div class="rag-stat">
        <span class="v">{stats?.total_chunks || 459}</span>
        <span class="l">Chunków wiedzy</span>
      </div>
      <div class="rag-stat">
        <span class="v">10</span>
        <span class="l">Dokumentów źródłowych</span>
      </div>
      <div class="rag-stat">
        <span class="v">{(stats?.total_tokens_est || 75000).toLocaleString()}</span>
        <span class="l">Tokenów wiedzy</span>
      </div>
      <div class="rag-stat">
        <span class="v">{(stats?.vocab_size || 6389).toLocaleString()}</span>
        <span class="l">Unikalnych terminów</span>
      </div>
    </div>

    <div class="rag-search-box">
      <input type="text" id="ragQuery" placeholder="Zadaj pytanie... np. Cost Guard, paleta kolorów, mapa sołectw, prompt Claude" />
      <button id="ragBtn">Szukaj</button>
    </div>

    <div class="rag-suggestions">
      <button class="rag-suggestion" data-q="paleta kolorów hero NA SYGNALE">Paleta kolorów i NA SYGNALE</button>
      <button class="rag-suggestion" data-q="34 sołectwa mapa interaktywna SVG">Mapa 34 sołectw</button>
      <button class="rag-suggestion" data-q="Cost Guard limit Claude API n8n">Cost Guard Claude</button>
      <button class="rag-suggestion" data-q="PublishPress redaktor sekcji routing">Routing do redaktora</button>
      <button class="rag-suggestion" data-q="Webhook Pusher instytucje partnerskie">Webhook Pusher</button>
      <button class="rag-suggestion" data-q="moduł Kujawianka tabela wynik granatowy">Moduł Kujawianki</button>
      <button class="rag-suggestion" data-q="A/B test prompt Monaco Editor token counter">A/B testy promptów</button>
      <button class="rag-suggestion" data-q="evergreen AI artykuł sezonowy Dziś w Izbicy">Dziś w Izbicy (AI)</button>
      <button class="rag-suggestion" data-q="hamburger mobile menu breakpoint 768px">Mobile / responsywność</button>
      <button class="rag-suggestion" data-q="koszty miesięczne Hetzner VPS Claude">Koszty miesięczne</button>
    </div>

    <div id="ragResults">
      <p style="color: var(--ink-faint); text-align: center; padding: 32px 0;">
        Wpisz pytanie powyżej, aby przeszukać bazę wiedzy projektu.
      </p>
    </div>

    <h2>📚 Dokumenty źródłowe</h2>
    <ul>
      <li><strong>STRUKTURA_KATEGORII</strong> — 12 kategorii głównych, 52 podkategorie, 12 stron statycznych, plan fazowy uruchamiania</li>
      <li><strong>SZATA_GRAFICZNA</strong> — filozofia projektowa (Reuters + Le Monde + lokalna gazeta papierowa), 14 modułów, paleta, typografia</li>
      <li><strong>SPEC_UI_UX</strong> — specyfikacja implementacyjna piksel-po-pikselu (CSS tokens, breakpointy, animacje)</li>
      <li><strong>WORKFLOW_PORTALU</strong> — 6 warstw architektury, model Webhook Pusher, kalkulacja kosztów</li>
      <li><strong>SESJA_N1_WTYCZKA</strong> — wtyczka izbica24-newsroom: CPT, taksonomie, REST endpoint, security</li>
      <li><strong>SESJA_N2_QUEUE</strong> — admin „Newsroom Queue" z 6 bulk actions, dashboard widget</li>
      <li><strong>SESJA_N3_PUBLISHPRESS</strong> — routing draftów do 12 redaktorów sekcji, custom post statuses</li>
      <li><strong>SESJA_N4_PROMPTS</strong> — 12 promptów AI jako CPT, Monaco Editor, A/B testing engine</li>
      <li><strong>SESJA_N5_N8N</strong> — drugi VPS z n8n, docker-compose, 17 workflowów end-to-end</li>
      <li><strong>SESJA_N6_MONITORING</strong> — Cost Guard multi-tier, Telegram bot, PDF raporty, Grafana</li>
    </ul>
  </div>
)
