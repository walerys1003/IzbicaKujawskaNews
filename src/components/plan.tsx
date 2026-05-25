export const PlanPage = () => (
  <div class="subpage-shell">
    <h1>📋 Plan wdrożenia portalu izbica24.pl</h1>
    <p class="subpage-lead">
      Roadmapa wdrożenia zintegrowanego portalu informacyjnego z silnikiem AI-newsroom. Plan obejmuje 6 sesji backendowych (N1-N6) + frontend + integracje. Czas realizacji: 16–24 tygodnie. Architektura: WordPress + wtyczka <code>izbica24-newsroom</code> + n8n na osobnym VPS + Claude API + Perplexity.
    </p>

    <h2>🎯 Wizja i cele</h2>
    <p>
      Portal <strong>izbica24.pl</strong> ma sprawić, by mieszkaniec Izbicy Kujawskiej (gmina 5 400 osób) otwierał stronę rano z kawą zamiast Facebooka. <strong>50–60% treści generuje AI</strong> pod ścisłym nadzorem redakcyjnym. Cel: 12 kategorii, 52 podkategorie, 34 sołectwa, wieloletnia żywotność.
    </p>

    <h2>🏗️ Architektura — 6 warstw</h2>
    <ul>
      <li><strong>Warstwa 1 — Źródła:</strong> Webhook Pusher (instytucje partnerskie pushują), Perplexity API (research portali regionalnych), scraping wybiórczy (BIP), e-mail forwarding, formularze, YouTube API, Sofascore/regiowyniki dla Kujawianki.</li>
      <li><strong>Warstwa 2 — Pobieranie:</strong> n8n na Hetzner CX22 (22 PLN/mies), normalizacja JSON, deduplikacja (hash + Levenshtein + embeddings), zapis do CPT <code>iz24_raw_item</code>.</li>
      <li><strong>Warstwa 3 — AI:</strong> Claude API (klasyfikacja, rewrite, evergreen, fact-check), Perplexity, LanguageTool dla korekty.</li>
      <li><strong>Warstwa 4 — Redakcja:</strong> PublishPress + custom workflow, role: naczelny, redaktorzy sekcji, kontrybutorzy instytucjonalni (16 kont).</li>
      <li><strong>Warstwa 5 — Publikacja:</strong> WordPress, frontend wg specyfikacji UI/UX, RSS, newsletter (cotygodniowy „Tydzień w Izbicy"), social media.</li>
      <li><strong>Warstwa 6 — Monitoring:</strong> Cost Guard ($5/dzień, $100/mies), Telegram alerty, dashboardy, raporty miesięczne PDF.</li>
    </ul>

    <div class="phase-strip">
      <div class="num">A</div>
      <h2 style="color: white;">Faza 0 — Przygotowanie infrastruktury (1–2 tyg.)</h2>
    </div>
    <ul>
      <li>Domena izbica24.pl + DNS (Cloudflare)</li>
      <li>VPS #1 — Hetzner CX31 (hosting WordPress) — ~44 PLN/mies.</li>
      <li>VPS #2 — Hetzner CX22 (n8n orchestrator) — ~22 PLN/mies.</li>
      <li>WordPress + motyw bazowy + PublishPress Free + Yoast SEO</li>
      <li>Konta API: Anthropic Claude, Perplexity, Telegram Bot, SendGrid</li>
    </ul>

    <div class="phase-strip">
      <div class="num">B</div>
      <h2 style="color: white;">Faza 1 — Backend Newsroom (sesje N1-N6, 6-8 tyg.)</h2>
    </div>

    <div class="session-card">
      <div class="head">
        <div class="session-num">N1</div>
        <div class="session-meta">
          <h3>Wtyczka izbica24-newsroom: szkielet, CPT, taksonomie, REST endpoint</h3>
          <div class="when">⏱ 1 dzień pracy · komponent fundamentalny</div>
        </div>
      </div>
      <div class="session-body">
        <p>Wtyczka WP w wersji 0.1.0: CPT <code>iz24_raw_item</code> z 24 meta-fieldami, taksonomie <code>iz24_source</code> i <code>iz24_status</code>, REST endpoint <code>POST /v1/incoming</code> z Bearer auth, rate limiterem (60/h, 500/d per token), idempotency keys, deduplikacja (hash + Levenshtein).</p>
        <div class="session-tags">
          <span class="session-tag">PHP 8.2</span>
          <span class="session-tag">WP REST</span>
          <span class="session-tag">CPT</span>
          <span class="session-tag">PSR-4</span>
          <span class="session-tag">PHPUnit</span>
        </div>
      </div>
    </div>

    <div class="session-card">
      <div class="head">
        <div class="session-num">N2</div>
        <div class="session-meta">
          <h3>Admin „Newsroom Queue" + Dashboard Widget</h3>
          <div class="when">⏱ 1 dzień pracy · UX redakcji</div>
        </div>
      </div>
      <div class="session-body">
        <p>Panel kolejkowy w wp-admin (jak Gmail Inbox dla newsów): 7 kolumn, 5 filtrów, 6 bulk actions (approve / reject / convert / merge / change status / delete), dashboard widget z metrykami, JSON viewer z Prism.js, Alpine.js dla reaktywności.</p>
        <div class="session-tags">
          <span class="session-tag">WP Admin</span>
          <span class="session-tag">WP_List_Table</span>
          <span class="session-tag">Alpine.js</span>
          <span class="session-tag">AJAX</span>
        </div>
      </div>
    </div>

    <div class="session-card">
      <div class="head">
        <div class="session-num">N3</div>
        <div class="session-meta">
          <h3>Integracja z PublishPress — automatyczne kierowanie draftów</h3>
          <div class="when">⏱ 1 dzień pracy · workflow redakcyjny</div>
        </div>
      </div>
      <div class="session-body">
        <p>Routing draftów do redaktorów sekcji: mapowanie kategoria → redaktor (12 sekcji), custom post statuses (pitch, assigned, in_progress, awaiting_review, ready_to_publish), kalkulacja deadline'ów priority-based, integracja z PublishPress Notifications, fallback editor.</p>
        <div class="session-tags">
          <span class="session-tag">PublishPress</span>
          <span class="session-tag">Editorial Workflow</span>
          <span class="session-tag">Slack/Email</span>
        </div>
      </div>
    </div>

    <div class="session-card">
      <div class="head">
        <div class="session-num">N4</div>
        <div class="session-meta">
          <h3>Szablony promptów Claude jako CPT iz24_prompt_template</h3>
          <div class="when">⏱ 1 dzień pracy · edytowalne AI bez deploya</div>
        </div>
      </div>
      <div class="session-body">
        <p>Edytowalny system promptów AI bez deploya. 12 pre-loaded promptów (rewrite-news, na-sygnale, evergreen, fact-check, headline, SEO meta, social snippet, etc.), Monaco Editor (silnik VS Code), token counter (tiktoken), wersjonowanie z diff, A/B testing engine, quality scoring (5 metryk: cost, latency, accept rate, edit distance, reject rate), REST endpoint <code>GET /v1/prompts/{'{slug}'}</code> z eTag cache.</p>
        <div class="session-tags">
          <span class="session-tag">Monaco Editor</span>
          <span class="session-tag">A/B Testing</span>
          <span class="session-tag">Mustache</span>
          <span class="session-tag">tiktoken</span>
          <span class="session-tag">Claude API</span>
        </div>
      </div>
    </div>

    <div class="session-card">
      <div class="head">
        <div class="session-num">N5</div>
        <div class="session-meta">
          <h3>Instalacja n8n na drugim VPS + import 17 workflowów end-to-end</h3>
          <div class="when">⏱ 2 dni pracy · największa sesja techniczna</div>
        </div>
      </div>
      <div class="session-body">
        <p>Druga maszyna jako 24/7 orchestrator AI: docker-compose (n8n + Postgres + Redis + Caddy reverse proxy z auto-SSL), 17 workflowów: 6 ingestion (RSS DDWłocławek, NWłocławek, generic, Perplexity, FB Graph OSP, e-mail IMAP), 5 processing (classifier, rewrite, na-sygnale formatter, evergreen, fact-check), dedup, 4 publication, 1 monitoring (cost). Każdy workflow z error handlerem i Telegram alertami.</p>
        <div class="session-tags">
          <span class="session-tag">n8n</span>
          <span class="session-tag">Docker</span>
          <span class="session-tag">Caddy</span>
          <span class="session-tag">PostgreSQL</span>
          <span class="session-tag">Redis</span>
          <span class="session-tag">RSS</span>
          <span class="session-tag">Perplexity</span>
        </div>
      </div>
    </div>

    <div class="session-card">
      <div class="head">
        <div class="session-num">N6</div>
        <div class="session-meta">
          <h3>Monitoring: Cost Guard, Telegram alerts, dashboards, raporty</h3>
          <div class="when">⏱ 1 dzień pracy · must-have przed produkcją</div>
        </div>
      </div>
      <div class="session-body">
        <p>Newsroom Operations Center — centralny dashboard. Multi-tier Cost Guard (daily/weekly/monthly), predictive budget forecaster, anomaly detector, Telegram bot z komendami <code>/status</code>, <code>/budget</code>, anti-spam throttling, miesięczne raporty PDF (mpdf), eksport CSV, opcjonalnie Prometheus endpoint dla Grafany.</p>
        <div class="session-tags">
          <span class="session-tag">Cost Guard</span>
          <span class="session-tag">Telegram Bot</span>
          <span class="session-tag">mpdf</span>
          <span class="session-tag">Prometheus</span>
          <span class="session-tag">Grafana</span>
        </div>
      </div>
    </div>

    <div class="phase-strip">
      <div class="num">C</div>
      <h2 style="color: white;">Faza 2 — Frontend portalu (3–4 tyg.)</h2>
    </div>
    <ul>
      <li><strong>Motyw WordPress</strong> (lub headless Hono+Cloudflare) wg pełnej specyfikacji UI/UX — 14 modułów strony głównej</li>
      <li>Implementacja pikselowa wg dokumentu specyfikacji (paleta papier+czerwień, Playfair+Source Serif+DM Sans)</li>
      <li>Mapa sołectw SVG z interakcją hover/tooltip</li>
      <li>Widget Kujawianki (wynik + tabela + scorers + countdown)</li>
      <li>Strony statyczne (12 stron: O portalu, Redakcja, Kontakt, Ważne telefony, etc.)</li>
      <li>RWD: 4 breakpointy (1280/1024/768/480)</li>
      <li>Animacje wejścia: Intersection Observer + prefers-reduced-motion</li>
    </ul>

    <div class="phase-strip">
      <div class="num">D</div>
      <h2 style="color: white;">Faza 3 — Onboarding kontrybutorów (4 tyg.)</h2>
    </div>
    <ul>
      <li>16 kont kontrybutorskich: szkoły (5), Urząd, parafie (3+1 dekanat), OSP, MGCK, Biblioteka, Kujawianka, MGOPS</li>
      <li>Porozumienia o współpracy — wzory dokumentów</li>
      <li>Webhook Pusher: gotowe templaty Make.com / Zapier dla każdego typu instytucji</li>
      <li>Krótki kurs „Jak dodać artykuł" (PDF + wideo)</li>
      <li>Pilot 2-tyg. z 4-5 instytucjami przed pełnym uruchomieniem</li>
    </ul>

    <div class="phase-strip">
      <div class="num">E</div>
      <h2 style="color: white;">Faza 4 — Multimedia (miesiąc 5+)</h2>
    </div>
    <ul>
      <li>Wideo: YouTube embed + sekcja reportaży/relacji/wywiadów</li>
      <li>Galerie zdjęć (zasilane od fazy 1, ale dedykowana sekcja w fazie 4)</li>
      <li>Podcast „Głos Izbicy" — Spotify + Apple Podcasts (od miesiąca 9)</li>
      <li>Infografiki AI (Canva API + ręczne)</li>
    </ul>

    <h2>💰 Koszty miesięczne (PLN)</h2>
    <ul>
      <li>VPS #1 (WordPress) Hetzner CX31 — <strong>44 PLN</strong></li>
      <li>VPS #2 (n8n) Hetzner CX22 — <strong>22 PLN</strong></li>
      <li>Claude API (Sonnet + Haiku mix) — <strong>~130 PLN</strong> (limit $30/mies.)</li>
      <li>Perplexity API — <strong>~80 PLN</strong> (zapytania research)</li>
      <li>SendGrid (newsletter) — <strong>0 PLN</strong> (do 100/dzień)</li>
      <li>Domeny + SSL — <strong>~10 PLN</strong></li>
      <li>Backupy (Backblaze B2) — <strong>~15 PLN</strong></li>
      <li>Razem: <strong>~300 PLN/miesiąc</strong> (przy ostrym Cost Guard)</li>
    </ul>

    <h2>⚠️ Krytyczne ryzyka i mitygacje</h2>
    <ul>
      <li><strong>Halucynacje AI w Na Sygnale:</strong> twardy obowiązek human review dla każdego incydentu z ofiarami/kontekstem kryminalnym. Auto-publikacja tylko dla rutynowych komunikatów.</li>
      <li><strong>Łamanie ToS Mety przez scraping FB:</strong> rezygnacja ze scrapingu, model Webhook Pusher dla instytucji (oficjalne integracje).</li>
      <li><strong>Eksplozja kosztów Claude:</strong> Cost Guard multi-tier ($5/dzień, $100/mies), throttling, fallback na Haiku przy zbliżaniu się do limitu.</li>
      <li><strong>Awaria n8n:</strong> n8n na osobnym VPS od WordPressa — awaria orchestratora nie kładzie portalu. Codzienne backupy.</li>
      <li><strong>RODO/AI Act UE:</strong> oznaczanie wszystkich treści AI jako „opracowanie AI, weryfikacja redakcji", polityka prywatności rozbudowana.</li>
    </ul>

    <h2>🎓 Harmonogram (16-24 tyg.)</h2>
    <ul>
      <li>Tygodnie 1-2: Faza 0 (infra)</li>
      <li>Tygodnie 3-10: Faza 1 (sesje N1-N6)</li>
      <li>Tygodnie 8-12 (równolegle): Faza 2 (frontend)</li>
      <li>Tygodnie 12-16: Faza 3 (onboarding kontrybutorów + pilot)</li>
      <li>Tydzień 17-20: <strong>SOFT LAUNCH</strong> (zaproszeni mieszkańcy)</li>
      <li>Tydzień 20+: <strong>PUBLICZNY START</strong></li>
      <li>Miesiąc 5+: Faza 4 (multimedia, podcast)</li>
    </ul>

    <h2>✅ Co już zostało zrobione w tej sesji</h2>
    <ul>
      <li>Wczytanie wszystkich 10 dokumentów projektowych (DOCX → Markdown)</li>
      <li>Budowa bazy wiedzy: <strong>459 chunków</strong>, indeks BM25 (~6 400 unikalnych terminów)</li>
      <li>Implementacja pełnej szaty graficznej portalu (14 modułów strony głównej) wg specyfikacji UI/UX</li>
      <li>Wszystkie placeholdery z prawdziwymi danymi lokalnymi (34 sołectwa, OSP Izbica, MGCK, MGOPS, ZGKiW, KMP Włocławek, Kujawianka, parafie)</li>
      <li>Działający RAG: zapytanie w naturalnym języku → przeszukanie bazy wiedzy</li>
    </ul>
  </div>
)
