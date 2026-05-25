# WORKFLOW PORTALU IZBICA24.PL Pełna, zintegrowana architektura agregacji, przetwarzania i publikacji treści
Wersja 2.0 — produkcyjna. Niniejszy dokument zastępuje wcześniejsze wersje koncepcyjne. Uwzględnia krytyczną analizę pierwotnego planu, model „Webhook Pusher" zamiast scrapingu Facebooka, realistyczną kalkulację kosztów oraz konkretne instytucje partnerskie z gminy Izbica Kujawska. Stanowi jednolity dokument operacyjny, na podstawie którego można rozpocząć implementację.

## SPIS TREŚCI
Filozofia projektu i fundamentalne decyzje architektoniczne
Architektura ogólna — sześć warstw systemu
Warstwa 1 — Źródła treści (model hybrydowy)
Warstwa 2 — Pobieranie, normalizacja, deduplikacja
Warstwa 3 — Przetwarzanie AI (Claude + Perplexity)
Warstwa 4 — Redakcja, role, obieg pracy
Warstwa 5 — Publikacja i dystrybucja
Warstwa 6 — Monitoring, bezpieczeństwo, utrzymanie
Model „Webhook Pusher" — partnerstwa z instytucjami
Stack techniczny i koszty miesięczne (PLN)
Plan implementacji etapowej (24 miesiące)
Ryzyka, mitygacje, awaryjne ścieżki
Załączniki — specyfikacje, prompty, schematy

## 1. FILOZOFIA PROJEKTU I FUNDAMENTALNE DECYZJE ARCHITEKTONICZNE
Portal Izbica24.pl zostaje zbudowany jako hybryda automatycznej infrastruktury AI i ludzkiej redakcji. AI pokrywa 50–60% objętości treści, ale w ramach ścisłego nadzoru redakcyjnego. Każda istotna decyzja architektoniczna podporządkowana jest trzem zasadom: legalności (RODO, AI Act UE, ToS Mety i innych platform), wiarygodności (zero halucynacji w warstwie publikacyjnej, wyraźne oznaczanie AI) oraz długowieczności (model utrzymania na lata, a nie miesiące).
W stosunku do pierwotnej koncepcji wprowadzono cztery kluczowe zmiany. Po pierwsze, zrezygnowano ze scrapingu Facebooka jako mechanizmu domyślnego — łamie ToS Mety, jest technicznie kruche i jurydycznie wątpliwe. Zastąpiony został modelem Webhook Pusher, w którym instytucje dobrowolnie i oficjalnie wysyłają swoje treści do portalu poprzez gotowe integracje (Make.com, Zapier, e-mail forwarding). Po drugie, scraping portali regionalnych zredukowano do roli uzupełniającej (~20%), a główną rolę agregatora wiadomości przejął Perplexity API — taniej, stabilniej, legalniej. Po trzecie, dla wszystkich zdarzeń typu „Na Sygnale" wprowadzono twardy obowiązek human review — auto-publikacja dotyczy wyłącznie rutynowych komunikatów bez ofiar i kontekstu kryminalnego. Po czwarte, n8n został odseparowany od WordPressa na drugi VPS, by awaria orkiestratora nie kładła portalu.
Wszystkie te zmiany czynią plan prostszym, tańszym, legalnym i odporniejszym niż wersja oryginalna.

## 2. ARCHITEKTURA OGÓLNA — SZEŚĆ WARSTW SYSTEMU
System składa się z sześciu warstw funkcjonalnych. Każda działa niezależnie i komunikuje się z pozostałymi przez wyraźnie zdefiniowane interfejsy (REST API, baza danych, kolejka). To pozwala wymieniać poszczególne komponenty bez przebudowy całości.
┌─────────────────────────────────────────────────────────────────┐
│ WARSTWA 1: ŹRÓDŁA TREŚCI                                        │
│ • Webhook Pusher (instytucje partnerskie — push)                │
│ • Perplexity API (research portali regionalnych)                │
│ • Scraping wybranych źródeł (BIP, kalendarze)                   │
│ • E-mail forwarding (instytucje nietechniczne)                  │
│ • Formularze manualne (mieszkańcy, wolontariusze)               │
│ • YouTube Data API (multimedia)                                 │
│ • Sofascore + regiowyniki (Kujawianka)                          │
└─────────────────────────────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────┐
│ WARSTWA 2: POBIERANIE I MAGAZYNOWANIE                           │
│ • n8n na osobnym VPS (Hetzner CX22, 22 PLN/mies.)               │
│ • Scheduler (cron, sloty dzienne)                               │
│ • Normalizacja do JSON schema                                   │
│ • Deduplikacja (content_hash + Levenshtein + embeddings)        │
│ • Zapis do CPT iz24_raw_item w WordPress                        │
└─────────────────────────────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────┐
│ WARSTWA 3: PRZETWARZANIE AI                                     │
│ • Claude API (klasyfikacja, rewrite, evergreen, fact-check)     │
│ • Perplexity API (research uzupełniający)                       │
│ • LanguageTool (korekta językowa)                               │
│ • Knowledge base (GitHub, plain Markdown, wersjonowane)         │
└─────────────────────────────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────┐
│ WARSTWA 4: REDAKCJA I MODERACJA                                 │
│ • WordPress + PublishPress Pro                                  │
│ • Role: Administrator, Naczelny, Sekcji, Kontrybutorzy          │
│ • Kolejka draftów z priority_score                              │
│ • Human review obowiązkowy dla zdarzeń wrażliwych               │
└─────────────────────────────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────┐
│ WARSTWA 5: PUBLIKACJA I DYSTRYBUCJA                             │
│ • Portal WordPress (Kadence + child theme + 24 bloki)           │
│ • Social Media (FB, Instagram, Telegram)                        │
│ • Newsletter (MailPoet, niedziela 18:00)                        │
│ • Podcast „Głos Izbicy" (Spotify for Podcasters)                │
│ • YouTube (audiogramy + reportaże)                              │
└─────────────────────────────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────┐
│ WARSTWA 6: MONITORING I UTRZYMANIE                              │
│ • Dashboard redakcyjny (custom widget WP)                       │
│ • Cost Guard (próg kosztów Claude/Perplexity)                   │
│ • Alerty Telegram (martwe sloty, priorytetowe newsy)            │
│ • Backup, security audit, knowledge base refresh                │
└─────────────────────────────────────────────────────────────────┘


## 3. WARSTWA 1 — ŹRÓDŁA TREŚCI
W modelu zrewidowanym źródła dzielą się na sześć kategorii o różnych mechanizmach pobierania i różnym stopniu zaufania do jakości danych. Każde źródło ma przypisany typ pobierania, częstotliwość, priorytet i poziom human-review.
### A. Instytucje partnerskie — model Webhook Pusher (PRIMARY)
To jest fundament Twojego newsroom’u. Zamiast scrapować Facebooka instytucji (nielegalne, niestabilne), oferujesz im trzy poziomy partnerstwa, z których same wybierają najwygodniejszy. Filozofia: instytucje publikują na FB, bo chcą dotrzeć do mieszkańców — Twój portal to drugi kanał dotarcia, dla nich za darmo. Mówisz prezesowi OSP „opublikuj raz, my opublikujemy automatycznie u nas, dotrzesz do +3000 osób więcej". Sens biznesowy dla obu stron: instytucja zyskuje zasięg, Ty treść.
Poziom 1 — Webhook automatyczny przez Make.com / Zapier (dla najaktywniejszych): instytucja konfiguruje raz scenariusz „nowy post na FB → POST do izbica24.pl/wp-json/iz24/v1/incoming", potem działa wieczność. Pod spodem oficjalne Graph API Mety, w pełni legalnie.
Poziom 2 — E-mail forwarding (dla instytucji bez aktywnego FB lub komunikujących się głównie mailem): każda dostaje dedykowany adres <slug>@in.izbica24.pl, dodaje go do BCC swoich newsletterów lub przesyła komunikaty. n8n parsuje wiadomość i tworzy raw_item.
Poziom 3 — Manualny formularz (dla małych instytucji z 1 osobą obsługującą komunikację): wchodzą na izbica24.pl/dolacz/wyslij, wypełniają formularz w 2 minuty. Każda treść trafia w ten sam endpoint REST.
W praktyce większość instytucji zacznie od Poziomu 3, część przejdzie do 2 po miesiącu, a 4–6 najaktywniejszych dojdzie do 1. To jest OK — model jest skalowalny niezależnie od poziomu adopcji. Mapa instytucji partnerskich z preferowanym poziomem znajduje się w Sekcji 9.
### B. Perplexity API — wirtualny dziennikarz śledczy (PRIMARY dla portali regionalnych)
W pierwotnym planie zakładano scraping dziewięciu portali regionalnych (ddwloclawek.pl, nwloclawek.pl, pomorska.pl itd.). To okazało się ślepą uliczką: większość z nich nie ma stabilnego RSS-a, scraping HTML łamie się przy każdym redesignie, jest w szarej strefie prawa autorskiego i wymaga utrzymania osobnych selektorów CSS. Zastąpione: Perplexity API jako główny agregator wiadomości regionalnych.
Codziennie o 7:00 n8n wysyła do Perplexity trzy zapytania bazowe:
„Najnowsze wiadomości Izbica Kujawska z ostatnich 24 godzin. Przeszukaj portale: ddwloclawek.pl, nwloclawek.pl, pomorska.pl, portalwloclawek.pl, kujawy.info, naszemiasto.pl, gloswloclawianina.pl, bydgoszcz.tvp.pl, radiopik.pl. Zwróć tytuł, lead, datę, URL źródłowy i nazwę portalu w formacie JSON."
„Najnowsze wydarzenia w powiecie włocławskim dotyczące gminy Izbica Kujawska. Szczególnie: inwestycje drogowe, decyzje powiatu, edukacja ponadpodstawowa, służby ratunkowe. Format JSON z linkami."
„Najnowsze wyniki, transfery, terminarz MGKS Kujawianka Izbica Kujawska. Klasa Okręgowa grupa 2 województwo kujawsko-pomorskie. Format JSON."
Perplexity zwraca 5–8 prawdziwych linków per zapytanie z metadanymi. Koszt: ~0,003 USD per zapytanie = grosze. 80% pokrycia portali regionalnych przy zerowym ryzyku scrapingowym.
Pozostałe 20% — wybrane stabilne sekcje portali (np. dedykowane podstrony Izbicy w ddwloclawek.pl i nwloclawek.pl, jeśli mają stabilny URL) pobierane przez prosty HTTP fetch + cheerio parsing. Tylko dla tych, które naprawdę mają sekcję „Izbica" jako trwały element struktury.
Co 2 dni Perplexity dostaje również zapytania tematyczne: „Inwestycje drogowe powiat włocławski 2026", „Dotacje unijne kujawsko-pomorskie gminy", „Pogoda Włocławek prognoza", „Rolnictwo Kujawy [aktualny sezon]". To zasila warstwę evergreen.
### C. Strony instytucjonalne i BIP — scraping zmian (SECONDARY)
Niektóre źródła nie wejdą do partnerstwa Webhook Pusher (BIP urzędu, BIP starostwa, strony szkół z prostym CMS-em) i tu legalny lekki scraping ma sens, bo strony są publiczne, a my linkujemy do oryginału. Mechanizm: n8n raz dziennie pobiera HTML, ekstrahuje listę artykułów, porównuje hash tytułów z poprzednim stanem, nowe wpisy → raw_items.
Lista źródeł scrapingowych:
BIP Urzędu Miejskiego Izbica Kujawska (bip.izbicakuj.pl/aktualnosci/) — zarządzenia burmistrza, ogłoszenia, przetargi. Częstotliwość: raz dziennie 8:00. Obsługa PDF: nowe zarządzenia w PDF → ekstrakcja tekstu (pdfplumber) → Claude streszcza w 200 słowach z linkiem do oryginału. To jest złoto SEO — nikt z mieszkańców nie czyta uchwał, a Ty serwujesz im streszczenie.
BIP Starostwa Powiatowego Włocławek (bip.wloclawski.pl) — filtr na uchwały dotyczące gminy Izbica. Raz dziennie.
Strona Urzędu Miejskiego (izbicakuj.pl/aktualnosci/) — backup do Webhook Pushera. Raz dziennie.
MGCK Izbica (mgck-izbicakujawska.net.pl) — co 12 godzin.
Biblioteka Publiczna (bibliotekaizbica.wordpress.com/feed/) — natywny RSS WordPress. Raz dziennie.
ZGKiW (zgkiw-izbica-kujawska.pl + BIP) — raz dziennie. Kluczowe: awarie, harmonogramy odbioru odpadów.
MGOPS (mgopsizbica.naszops.pl) — raz na tydzień.
MGKS Kujawianka strona oficjalna (mgkskujawianka.pl) — co 12 godzin w sezonie, raz dziennie poza sezonem.
Diecezja Włocławska (diecezja.wloclawek.pl) — raz dziennie, filtr Dekanat Izbicki.
LGD Dorzecza Zgłowiączki (kujawiaki.pl) — raz na tydzień.
Strony szkół (SP1, SP2, SP Błenna, SP Sarnowo, ZS Kasprowicza, Przedszkole, Żłobek) — w idealnym świecie wszystkie wejdą w Webhook Pusher Poziom 2 (e-mail forwarding); fallback raz dziennie scraping.
Parafia Wniebowzięcia NMP (parafiaizbica.pl) — sobota i poniedziałek (ogłoszenia parafialne).
rejestrmedyczny.pl SPZOZ Izbica — raz na tydzień, sprawdzanie zmian godzin lekarzy.
Scraping ma fallback na Perplexity: jeśli selektor CSS się złamie (n8n wykryje to przez puste raw_items przez 48h), workflow wysyła zapytanie do Perplexity „Co nowego na stronie X w ostatnich 7 dniach?" i alert do Telegrama redaktora.
### D. Sport — Kujawianka (Sofascore + regiowyniki + futbolowo)
Dla Kujawianki Izbica Kujawska pełne źródła sportowe:
regiowyniki.pl — automatyczna tabela Klasy Okręgowej grupa 2, terminarz, wyniki. Scraping co 6 godzin w sezonie.
Sofascore — live score w dniu meczu. API call co 5 minut od 15:00 do końca meczu.
kujawiankaizbica.futbolowo.pl — szczegóły, składy. Scraping po meczu.
Webhook Pusher z fanpage’a klubu — relacje, transfery, treningi.
W dniu meczu (sobota/niedziela 15:00–17:00): Sofascore scraper pobiera wynik → Claude generuje krótką relację (200–300 słów) na podstawie wyniku, składu (jeśli dostępny), tabeli i kontekstu (miejsce w tabeli, seria wyników). Status = draft z flagą urgent_review — redaktor sportowy zatwierdza w ciągu 30 minut.
### E. Multimedia — YouTube Data API
Monitorowane kanały YouTube przez API (darmowy limit 10 000 jednostek/dzień):
Telewizja Kujawy (@powiatwloclawskipl) — co 6 godzin
MGKS Kujawianka (@Bizon717) — co 6 godzin
TVP3 Bydgoszcz — wyszukiwanie „Izbica Kujawska" w Search API, raz dziennie
Nowe filmy → raw_items typu video z embeddem YouTube (lazy load przez blok izbica24/embed-wideo-lazy).
### F. Mieszkańcy i wolontariusze — kanały bezpośrednie
Trzy kanały do treści od mieszkańców:
Formularz „Masz temat?" na każdej stronie portalu — anonimowy lub z kontaktem
Wolontariusz-moderator grup FB (Spotted Izbica, Izbica i okolice) — raz dziennie przegląda i przesyła wartościowe tematy przez wewnętrzny formularz redakcyjny
WhatsApp redakcyjny — numer kontaktowy w stopce, mieszkańcy mogą wysyłać zdjęcia/info
Grupy Facebookowe nie są scrapowane automatycznie — to źródło szumu, plotek i fake newsów. Tylko ludzka kuracja.

## 4. WARSTWA 2 — POBIERANIE, NORMALIZACJA, DEDUPLIKACJA
### Architektura: dwa VPS
Krytyczna decyzja: n8n nie żyje na tym samym serwerze co WordPress. To jest klasyczny błąd projektowy — jeśli n8n zaciągnie pamięć przy scrapingu lub batch AI, kładzie portal. Dlatego:
VPS #1: izbica24.pl                    VPS #2: workflows.izbica24.pl
(Cloudways/mydevil ~110 PLN)            (Hetzner CX22 ~22 PLN)
├── WordPress 6.7+                      ├── n8n self-hosted (Docker)
├── Kadence Theme + child theme         ├── PostgreSQL (n8n state)
├── Wtyczka izbica24-blocks             ├── Redis (rate limiting, cache)
└── Wtyczka izbica24-newsroom           └── Workflows (~15 scenariuszy)
▲                                       ▲
└─── HTTPS Bearer token auth ───────────┘

Komunikacja: n8n pisze do WordPressa wyłącznie przez REST API z bearer token. Dzięki temu można restartować/migrować n8n niezależnie od portalu.
### Scheduler — sloty dzienne
Pięć slotów dziennych, każdy uruchamia konkretne workflow:
Webhook Pusher działa w czasie rzeczywistym — nie ma slotu, każdy POST do /v1/incoming przetwarzany natychmiast.
### Normalizacja — wspólny JSON schema
Każdy raw_item, niezależnie od źródła, jest sprowadzony do tej samej struktury JSON:
{
"source_id": "osp-izbica",
"source_type": "facebook_page | email | website | manual_form | rss | youtube | api",
"external_id": "1234567890_9876543210",
"external_url": "https://...",
"title": "Zdarzenie 27/2026 — pożar stodoły",
"content": "Tekst treści...",
"content_html": "<p>...</p>",
"lead": "Pierwsze 2-3 zdania",
"published_at": "2026-05-07T14:30:00+02:00",
"fetched_at": "2026-05-07T14:32:11+02:00",
"author_name": "OSP Izbica Kujawska",
"media": [
{"type": "image", "url": "...", "alt": "...", "width": 1200, "height": 800},
{"type": "video", "url": "...", "duration_sec": 47}
],
"category_hint": "na-sygnale",
"subcategory_hint": "pozary",
"tags": ["pożar", "OSP", "Pasieka"],
"priority_hint": "high",
"permission": {
"publish_full_text": true,
"publish_media": true,
"credit_name": "OSP Izbica Kujawska",
"credit_link": "https://facebook.com/..."
},
"metadata": {
"geolocation": {"lat": 52.41, "lng": 18.77, "place_name": "..."},
"incident_number": "27/2026",
"units_dispatched": ["GBA OSP Izbica", "GBA OSP Pasieka"]
},
"content_hash": "sha256...",
"status": "raw"
}

### Deduplikacja — trzystopniowa
Stopień 1 — content_hash exact match: SHA-256 z lowercased(title + content). Jeśli istnieje w bazie → skip, log jako duplicate_idempotency.
Stopień 2 — Levenshtein similarity ≥ 85%: jeśli tytuły są podobne, ale nie identyczne (np. ta sama informacja z dwóch portali), oznacz nowy element jako possible_duplicate, dołącz jako related_source do istniejącego rekordu. Daje to bogatszą perspektywę dla Claude’a przy rewrite.
Stopień 3 — semantyczne embeddings (OpenAI text-embedding-3-small lub Voyage-3): dla treści dłuższych niż 200 znaków obliczany jest embedding 1536-wymiarowy, zapisywany w PostgreSQL z rozszerzeniem pgvector. Cosine similarity ≥ 0.92 = duplikat semantyczny (np. ten sam wypadek opisany różnymi słowami). Koszt embeddings: ~5 PLN/mies. dla 100 raw_items dziennie.
### Zapis do bazy — CPT iz24_raw_item
Wbrew pierwotnemu planowi (osobna tabela raw_items w MySQL), rekomendowane jest stworzenie Custom Post Type iz24_raw_item w WordPress. Korzyści: zarządzanie z wp-admin (filtrowanie, przeszukiwanie, akcje masowe), natywne ACL przez role WP, łatwy dostęp z poziomu wtyczek WP, brak potrzeby drugiego ORM. Stopni przechowywania surowych danych nie ma istotnie więcej niż wp_posts, a integracja z workflow redakcyjnym (Warstwa 4) staje się trywialna.
CPT iz24_raw_item ma:
Pola standardowe: post_title (tytuł źródłowy), post_content (treść), post_date (published_at z źródła)
Meta-fields: wszystkie pola z JSON schema (z prefiksem _iz24_)
Taksonomie: iz24_source (z którego źródła), iz24_status (raw, candidate, draft, review, published, rejected)
Custom kolumny w listach: Źródło, Priorytet, Status, Confidence, Powiązany post

## 5. WARSTWA 3 — PRZETWARZANIE AI
### 5.1. Knowledge base — żywy dokument w Git
Pierwotny plik izbica_knowledge.md (~3000 tokenów) zostaje rozbity na modułową strukturę w prywatnym repozytorium GitHub:
knowledge-base/
├── institutions.md                  # adresy, telefony, skład
├── people-current.md                # burmistrz, radni, sołtysi, proboszcze
├── kujawianka-season.md             # aktualny sezon, kadra, trener
├── infrastructure.md                # ulice, drogi, inwestycje bieżące
├── solectwa.md                      # 34 sołectwa + sołtysi
├── history-facts.md                 # daty, fakty historyczne
├── glossary.md                      # nazwy własne, akronimy lokalne
└── editorial-guidelines.md          # styl pisania, oznaczanie AI, RODO

Każdy redaktor sekcji ma obowiązek aktualizacji swojego pliku raz na miesiąc — to jest zapisane w jego umowie współpracy. Workflow przy każdym uruchomieniu Claude pobiera świeżą wersję z GitHub-RAW (cache 1h przez Redis). Pre-prompt: „Korzystaj z poniższej knowledge base — jest aktualna na DATA ostatniego commit’a. Jeśli pytanie dotyczy faktów spoza tej bazy, oznacz to flagą knowledge_gap w odpowiedzi."
Bez tego procesu po 6 miesiącach Claude zacznie halucynować, że burmistrzem jest osoba sprzed 2 lat, a Kujawianka gra w lidze, w której już nie gra. Knowledge base to nie statyczny plik — to żywy dokument.
### 5.2. Klasyfikacja i priorytetyzacja (Claude Sonnet 4.6)
O 7:30 (po slocie porannym) n8n uruchamia node „Classify". Pobiera raw_items o statusie raw z ostatnich 24h, wysyła do Claude w batchach po 10. Prompt systemowy:
„Jesteś redaktorem portalu informacyjnego Izbica24.pl obsługującego gminę Izbica Kujawska (5 400 mieszkańców, powiat włocławski, woj. kujawsko-pomorskie). Dla każdego elementu przypisz: (a) kategorię główną z listy [Wiadomości, Na Sygnale, Samorząd, Kujawianka, Kultura, Historia, Ludzie, Życie Codzienne, Przegląd Mediów]; (b) podkategorię z listy podkategorii w danej kategorii; © priority_score 1–10 (10 = najwyższa: wypadek z ofiarami, decyzja rady gminy, awaria krytyczna; 1 = ogłoszenie rutynowe); (d) suggested_type z listy [link, rewrite, original, skip]; (e) requires_human_review (boolean) — TRUE zawsze dla zdarzeń z ofiarami, śmierciami, zatrzymaniami, oskarżeniami, sporami politycznymi, nawet jeśli system jest dojrzały; (f) confidence_score 1–10 (jak pewny jesteś tej klasyfikacji). Zwróć JSON array."
Dołączony kontekst: knowledge base (cache z GitHuba, ~3000 tokenów) + listę dotychczas opublikowanych artykułów z ostatnich 24h (do unikania powielania tematów).
### 5.3. Generator artykułów AI (AI Autor)
O 9:00. Pobiera raw_items z suggested_type ∈ {rewrite, original} i priority_score ≥ 5.
Dla typu rewrite (artykuł z istniejącego źródła) — prompt:
„Na podstawie poniższego artykułu źródłowego napisz autorski artykuł informacyjny dla portalu Izbica24.pl. Wymagania: 300–500 słów; lokalny kontekst (odwołania do instytucji, ulic, osób z gminy z knowledge base); ton lokalnego dziennikarza, rzetelny, bez sensacji; nie kopiuj fragmentów dosłownie; tytuł chwytliwy ale uczciwy; meta-description max 155 znaków; sugerowane tagi SEO; źródło na końcu w formacie ‘Źródło: [nazwa portalu], [data] — link’. Zwróć JSON: {title, lead, body, meta_description, tags[], source_attribution}."
Dla typu original — Perplexity najpierw zbiera dodatkowe dane („Co więcej można powiedzieć o X w kontekście Izbicy?"), potem Claude pisze artykuł z rozszerzonym briefem.
Zawsze: drugi pass przez Claude z fact-checkiem (sekcja 5.5), potem zapis jako WP draft z meta-fields: _iz24_ai_generated=true, _iz24_source_raw_item_id, _iz24_confidence_score, _iz24_requires_human_review.
### 5.4. Evergreen Generator
Co 2 dni o 11:00. Tablica 52 tygodni × 8 kategorii tematycznych. Przykład: tydzień 16 (kwiecień) → „Wiosenne prace w ogrodzie i na działce — poradnik dla mieszkańców gminy Izbica Kujawska". Perplexity zbiera aktualne porady → Claude pisze 400–700 słów z lokalnym kontekstem (oferta sklepu ogrodniczego w Izbicy, harmonogram odbioru odpadów zielonych ZGKiW, wskazówka KGW Notecianki). Draft do redaktora sekcji Życie Codzienne.
### 5.5. Fact-checking — drugi pass Claude
Krytyczna warstwa, której brakowało w pierwotnym planie. Po wygenerowaniu artykułu, drugie wywołanie Claude z promptem:
„Zweryfikuj poniższy artykuł pod kątem: (1) zgodność dat, liczb, kwot z artykułem źródłowym; (2) poprawność nazwisk, nazw instytucji wg knowledge base — flag każdą rozbieżność; (3) brak halucynowanych faktów (cytatów, wydarzeń niewspomnianych w źródle); (4) brak kontrowersyjnych twierdzeń bez oparcia w źródle; (5) zgodność z polityką redakcyjną (oznaczanie AI, źródła). Zwróć JSON: {issues: [{severity: low/medium/high, description, suggestion}], verdict: pass/needs_review/reject}."
Koszt: +30% tokenów do całego pipeline’u. Zysk: szacunkowo 80% mniej żenujących pomyłek na portalu. Dla portalu informacyjnego to fundament, nie luksus.
### 5.6. Korekta językowa — LanguageTool
Po fact-checku, przed zapisaniem draftu — pass przez LanguageTool API (self-hosted darmowo lub cloud 5 EUR/mies. ≈ 21 PLN). Zwraca błędy interpunkcji, gramatyki, stylu. Polszczyzna Claude jest dobra, ale nie idealna — LanguageTool dopina detale.
### 5.7. Auto-news „Na Sygnale" — z guardrails
Pierwotny plan zakładał auto-publish postów OSP po 3-miesięcznym okresie testowym. Zrewidowane: dla zdarzeń z ofiarami, śmierciami, zatrzymaniami, oskarżeniami zawsze human review, niezależnie od dojrzałości systemu. OSP może opublikować post „Pożar ul. X 12, 1 ofiara śmiertelna" — Claude przepisze, zostanie automatycznie opublikowane, a okazuje się że to dezinformacja, błąd identyfikacji ofiary albo informacja niewrażliwa (ofiarą jest dziecko, którego rodzina jeszcze nie wie). Jeden taki post niszczy portal na lata.
Content guardrails w prompcie klasyfikatora: jeśli zdarzenie zawiera słowa kluczowe [„śmierć", „ofiara", „zarzut", „nietrzeźwy + nazwa", „zatrzymany", „pożar + dom", „wypadek + osoba", „dziecko"] → flag requires_human_review = TRUE, zawsze.
Auto-publish OK dla rutynowych zdarzeń: alarmów fałszywych, pomocy zwierzętom, wyłączenia drogi po wypadku bez ofiar, ćwiczeń, akcji promocyjnych jednostki, zabezpieczeń imprez. Te po 3-miesięcznym okresie testowym mogą iść automatycznie z flagą „AI-generated" i opcją szybkiego wycofania jednym kliknięciem.
### 5.8. Cost Guard — bezpiecznik kosztów
Przed każdym wywołaniem Claude/Perplexity API, n8n sprawdza sumaryczne zużycie z bieżącego miesiąca przez Anthropic Usage API i Perplexity Billing API. Jeśli przekroczył próg (np. 30 USD = ~125 PLN), workflow zatrzymuje się i wysyła alert na Telegram. Bez tego literówka w pętli (np. retry przy timeoucie bez backoffu) może zjeść 200 USD w noc. Próg ustawiony konserwatywnie na 150% średniego miesięcznego zużycia.

## 6. WARSTWA 4 — REDAKCJA I MODERACJA
### 6.1. Role użytkowników (PublishPress Pro)
Każdy redaktor i kontrybutor ma obowiązek 2FA (wtyczka Two Factor) — to nie jest opcja.
### 6.2. Obieg redakcyjny
[raw_item w iz24_newsroom]
│
│ Claude Classify + AI Autor + Fact-Check
▼
[WP Draft, status="pending", assigned_to=redaktor sekcji X]
│
│ Redaktor sekcji: weryfikacja faktów,
│ korekta stylu, dodanie zdjęcia, edycja
▼
┌───────┴───────┐
▼               ▼
ZATWIERDŹ         ODRZUĆ
│               │
│               ▼
│         [archive z notatką dlaczego]
▼
[status="pending_review", redaktor naczelny]
│
│ Final check, ewentualna ostatnia korekta
▼
[PUBLISHED]
│
│ + auto-actions (sekcja 7)
▼
[Social, Newsletter queue, RSS, sitemap]

Dla artykułów urgent_review (np. relacja meczowa po Kujawiance, news „Na Sygnale" wymagający szybkiej publikacji) — pomijany jest redaktor naczelny, redaktor sekcji publikuje bezpośrednio. Po publikacji naczelny dostaje notyfikację i może wprowadzić korektę post-publish.
Artykuł kontrybutora instytucjonalnego: bezpośrednio do redaktora sekcji → korekta → naczelny → publish.
### 6.3. Harmonogram publikacji — rytm tygodnia
### 6.4. Polityka oznaczania AI — wymóg AI Act i Helpful Content
Każdy artykuł wygenerowany przez AI lub z istotnym udziałem AI nosi oznaczenie w stopce:
„Ten artykuł został przygotowany z wykorzystaniem narzędzi AI i zweryfikowany przez redakcję Izbica24.pl. Źródło: [link]."
Jest to wymóg etyczny (transparentność wobec czytelników), prawny (AI Act UE — art. 50, transparency obligations) i SEO (Google Helpful Content Guidelines preferują wyraźne oznaczanie pochodzenia treści).
Dodatkowo na stronie „O portalu" — sekcja „Jak korzystamy z AI" z transparentnym opisem:
Które typy treści są generowane przez AI (Przegląd Mediów, Komunikaty, Tego dnia, część Wiadomości, Evergreen)
Które są pisane wyłącznie przez ludzi (Wywiady, Sylwetki, Komentarze redakcyjne, Sukcesy, Wspomnienia)
Jak działa weryfikacja (klasyfikacja → fact-check → redaktor → naczelny)
Co robić, jeśli zauważysz błąd faktyczny (link do formularza zgłoszeń)

## 7. WARSTWA 5 — PUBLIKACJA I DYSTRYBUCJA
### 7.1. Portal WordPress — automatyczne akcje po publikacji
Po zmianie statusu artykułu na publish, WordPress hook publish_post uruchamia kaskadę:
Generowanie miniaturki (jeśli brak _thumbnail_id → fallback placeholder z nazwą kategorii)
Walidacja meta-description i schema NewsArticle (Rank Math) — alert do redaktora jeśli puste
Kompresja obrazków przez ShortPixel → AVIF/WebP
Dodanie wpisu do sitemap.xml i Google News sitemap
Ping IndexNow do Google Search Console + Bing
Wstawienie do kolejki social media (sekcja 7.2)
Jeśli dzień tygodnia = niedziela → dodanie do bazy artykułów newslettera tygodniowego
Inwalidacja cache (WP Rocket → flush + Cloudflare → purge URL)
Tagowanie w Google Analytics 4 (custom event iz24_publish z meta category, source_type, ai_generated)
### 7.2. Social Media — kolejka z anti-flooding
Wtyczka Social Auto Poster Pro (~250 PLN/rok) lub własny node w n8n publikuje na:
Facebook fanpage Izbica24: link + miniatura + lead + 2–3 hashtagi. Limit: max 5 postów/dzień (algorytm FB karze za flooding). Kolejka FIFO z priorytetami (priority_score ≥ 8 → publikacja natychmiast).
Instagram Izbica24: zdjęcie + skrócony tekst (~200 znaków) + hashtagi. Stories dla zdarzeń „Na Sygnale" z geo-tagiem. Reels dla relacji wideo z imprez (faza 2).
Telegram kanał Izbica24 (opcjonalnie, dla power users): pełny tekst + link. Bez limitu, bo Telegram nie ma anti-spam.
Twitter/X (opcjonalnie): lead + link + hashtagi.
Kolejka social wykonuje się przez n8n co 30 minut (cron), z respektem rytmu publikacji portalu (nie ma sensu wysyłać 5 postów FB w 5 minut).
### 7.3. Newsletter „Tydzień w Izbicy"
Każda niedziela 18:00. n8n workflow:
Pobierz top 10 artykułów tygodnia po pageviews (GA4 API) z filtrem na opublikowane w ostatnich 7 dniach
Pobierz upcoming events na nadchodzący tydzień (The Events Calendar)
Wyślij do Claude z promptem: „Stwórz cotygodniowy newsletter dla mieszkańców gminy Izbica Kujawska. Format: krótki wstęp redakcji (2 zdania), ‘Najważniejsze tego tygodnia’ (5 artykułów z linkami i 1-zdaniowym opisem każdy), ‘Przed nami’ (3 wydarzenia w nadchodzącym tygodniu), ‘Z głębi szuflady’ (1 artykuł historyczny lub ciekawostka). Ton: ciepły, lokalny, nie korporacyjny."
Render HTML w MailPoet template z brandingiem Izbica24
Wyślij do listy subskrybentów przez Amazon SES (~5 PLN/mies. za 50 000 e-maili)
Zapisz statystyki (open rate, click rate) do dashboardu
Baza subskrybentów budowana przez:
Pop-up po 30 sekundach na portalu (z opt-out na 30 dni)
Stały widget w sidebarze
Footer każdego artykułu („Otrzymuj cotygodniowe podsumowanie — zapisz się")
Strona dedykowana /newsletter
Cross-promo w podcaście („Po szczegóły zapisz się do newslettera")
Cel: 500 subskrybentów po 6 miesiącach, 1500 po 12 miesiącach, 3000 po 24 miesiącach.
### 7.4. Podcast „Głos Izbicy"
Cotygodniowy odcinek nagrywany piątek rano, publikowany piątek 12:00. Format 15–20 minut:
Przegląd tygodnia (5 min): skrypt generowany przez Claude z 10 najważniejszych artykułów tygodnia. Czytany przez redaktora (lub TTS w wersji eksperymentalnej).
Wywiad z lokalnym gościem (10 min): nagranie telefoniczne/Zoom z mieszkańcem, sołtysem, dyrektorem szkoły, działaczem KGW. Rotacja gości — zapraszamy raz na 3 miesiące tę samą instytucję.
Zapowiedzi na nadchodzący tydzień (2–3 min): wydarzenia kultury, mecz Kujawianki, sesja rady, ciekawostki.
Hosting: Spotify for Podcasters (darmowy, generuje RSS automatycznie). Dystrybucja: embed na portalu (sekcja Multimedia/Podcast przez blok izbica24/embed-podcast), Spotify, Apple Podcasts, Google Podcasts (deprecated, ale RSS jest), Pocket Casts.
Statystyki: Seriously Simple Podcasting Stats (~410 PLN/rok) — dashboard w wp-admin z liczbą odsłuchów, top odcinkami, geo, urządzeniami.
### 7.5. YouTube — audiogramy + reportaże
Faza 1 (od 6. miesiąca): replikacja podcastów jako audiogramy (nieruchomy obraz z falą dźwiękową) generowane przez Headliner (~40 USD/rok ≈ 165 PLN) lub Canva Pro (~120 USD/rok ≈ 495 PLN). Upload przez YouTube API z n8n.
Faza 2 (od 12. miesiąca): krótkie reportaże wideo (1–3 min) z imprez, sesji rady, meczów Kujawianki — nagrywane telefonem przez redaktora lub wolontariusza. Edycja w CapCut (darmowe) lub DaVinci Resolve. Publikacja jako YouTube Shorts dla zwiększenia zasięgu.
### 7.6. Galerie zdjęć
Każdy artykuł z więcej niż 3 zdjęciami → automatyczna galeria przez Modula (~290 PLN/rok) lub natywną Gutenberg Gallery z lightboxem przez blok izbica24/galeria-lightbox. Watermark „izbica24.pl" dodawany automatycznie do prawego dolnego rogu (Imsanity/EWWW config). Pełne reportaże fotograficzne z Dni Izbicy, dożynek, meczów — osobne galerie tematyczne w sekcji Multimedia/Galerie.

## 8. WARSTWA 6 — MONITORING I UTRZYMANIE
### 8.1. Dashboard redakcyjny (custom widget WP)
W ramach wtyczki izbica24-newsroom powstaje custom widget dashboardu wp-admin „Status Newsroom" pokazujący:
Dziś / tydzień / miesiąc: liczba opublikowanych artykułów z podziałem (AI / kontrybutorzy / redaktor naczelny)
Kolejka: liczba raw_items oczekujących na klasyfikację, draftów na human review, draftów na final review naczelnego
Top 5 artykułów po pageviews (GA4 API, real-time)
Status workflow n8n: zielone/czerwone światło dla każdego z 8 głównych workflow’ów (z timestampem ostatniego uruchomienia)
Cost Guard: zużycie Claude/Perplexity w bieżącym miesiącu (USD i PLN, % progu)
Webhook Pusher activity: liczba odebranych webhooków per instytucja w ostatnich 24h (z alertem dla instytucji nieaktywnej >7 dni)
### 8.2. Alerty Telegram
Bot Telegram „Izbica24 Watcher" wysyła do redaktora naczelnego alerty:
Workflow nie wykonał się w zaplanowanym czasie (np. Perplexity poll o 7:00 nie odpalił)
Żaden artykuł nie został opublikowany do 12:00 (ryzyko „martwego dnia")
Raw_item z priority_score ≥ 8 (pilna wiadomość — wymaga natychmiastowej decyzji redaktora)
Cost Guard zbliżający się do progu (warning na 80%, blokada na 100%)
Webhook Pusher institution down (instytucja X nie wysłała nic od 7 dni — sprawdzić, czy Make się wyłączył)
Schema validation error (artykuł publikowany bez schema NewsArticle — alert do redaktora technicznego)
### 8.3. Konserwacja techniczna
Cotygodniowe zadania (automatyczne):
Backup bazy i plików (UpdraftPlus → Google Drive, niedziela 3:00)
Aktualizacja WP core, wtyczek, motywu (ManageWP cron, środa 4:00 — po peak’u poniedziałkowym)
Sprawdzenie broken links (Broken Link Checker, raport e-mail)
Health check scrapingowych selektorów CSS (n8n test workflow, alert jeśli któryś source nie zwrócił danych w 7 dni)
Comiesięczne zadania (ręczne):
Audyt SEO (Rank Math raport, Google Search Console review)
Przegląd kosztów API z trendem (czy nie rosną nieproporcjonalnie?)
Knowledge base refresh — comiesięczne spotkanie redakcji online (1h), każdy redaktor sekcji prezentuje zmiany w swoim pliku
Stress test endpointu /v1/incoming (sztuczne 100 requestów/min — czy rate limit działa?)
Penetration test podstawowy (npm audit, wp-cli core verify-checksums, Wordfence scan)
Co kwartalnie:
Pełen audyt bezpieczeństwa (rotacja tokenów Webhook Pusher, rotacja API keys Anthropic/Perplexity, review uprawnień użytkowników)
Audyt jakości artykułów AI (próbka 50 losowych — ile potrzebowało korekt redakcyjnych? czy fact-check łapie błędy?)
Review umów partnerstwa (czy wszystkie aktywne instytucje mają ważne regulaminy?)

## 9. MODEL WEBHOOK PUSHER — PARTNERSTWA Z INSTYTUCJAMI
### 9.1. Dlaczego to działa i dlaczego jest legalne
Pomysł polega na odwróceniu kierunku przepływu informacji. Zamiast Ty „kradniesz" treści z fanpage’ów (co jest prawnie wątpliwe i technicznie kruche), to instytucje same dobrowolnie wysyłają Ci swoje publikacje w momencie ich wystąpienia. Ty dostarczasz im narzędzie, które robi to automatycznie i bezboleśnie. Wszystko legalne, oficjalne, zgodne z RODO i ToS Mety.
W modelu pull (scraping FB), Meta uznaje cię za bota łamiącego ToS, plus wątpliwe prawo autorskie (post należy do autora). W modelu push, instytucja świadomie i dobrowolnie wysyła Ci treść — jest to oficjalne udostępnienie z domniemaną zgodą na publikację (umocowane regulaminem partnerstwa, który podpisuje). To jest model identyczny jak każda agencja prasowa (PAP, Reuters) od dekad.
### 9.2. Mapa instytucji partnerskich z preferowanym poziomem
Priorytet onboardingu (kolejność realna):
OSP Izbica (miesiąc 1) — bo to silnik sekcji „Na Sygnale", najważniejsza dla ruchu
MGCK (miesiąc 1) — bo wydarzenia kulturalne to regularny strumień treści
MGKS Kujawianka (miesiąc 2) — bo sport buduje engagement i tożsamość
Miasto i Gmina Izbica (miesiąc 2) — bo komunikaty oficjalne to filar wiarygodności
Biblioteka + Parafia NMP (miesiąc 3) — łatwe wdrożenia e-mail forwarding
ZGKiW (miesiąc 3) — bo awarie to pilna informacja dla mieszkańców
Szkoły aktywne (miesiąc 4) — zaczynając od SP nr 2
Reszta (miesiąc 5+) — w ramach zwykłej rozbudowy
### 9.3. Endpoint REST /v1/incoming — specyfikacja kontraktu
Wszystkie trzy poziomy (Webhook auto, E-mail forwarding, Manualny formularz) trafiają do tego samego endpointu — różni się tylko source_type. Pełna specyfikacja:
POST https://izbica24.pl/wp-json/iz24/v1/incoming

Headers:
Authorization: Bearer <institution_token>
Content-Type: application/json
X-Idempotency-Key: <unique_id_from_source>

Body: [JSON schema z sekcji 4 — Normalizacja]

Odpowiedzi:
HTTP 201 Created  — nowy raw_item utworzony, w kolejce
HTTP 200 OK       — duplikat, zwrócone ID istniejącego rekordu
HTTP 401          — błędny lub wygasły token
HTTP 400          — niepoprawny JSON, brakujące required
HTTP 429          — przekroczony rate limit (60/h, 500/24h per token)
HTTP 422          — content nie przeszedł filtrów (spam, blacklist)

### 9.4. Bezpieczeństwo — token per instytucja
Każda instytucja dostaje unikalny token Bearer wygenerowany podczas onboardingu (64-znakowy random hex, zhashowany bcrypt w meta-fieldzie taksonomii iz24_source). Plain text widoczny tylko raz przy generacji.
Funkcjonalności bezpieczeństwa:
Rate limit: 60/h, 500/24h. Implementacja przez Redis lub Transient API.
Token rotation: ważność 12 miesięcy, auto-mail 30 dni przed wygaśnięciem
Token revocation: w wp-admin → Newsroom → Instytucje → Cofnij token
IP allowlist (opcjonalne): dla Urzędu Miejskiego i ZGKiW — wymuszamy IP Make.com
HMAC signing (opcjonalne, zaawansowane): drugi sekret + podpis HMAC-SHA256 body
### 9.5. Konfiguracja po stronie instytucji (Make.com — wariant rekomendowany)
Dokumentacja PDF wysyłana każdej instytucji + sesja Zoom 15–20 min:
Wejść na make.com, założyć darmowe konto (lub zalogować się przez Google).
Create new scenario → Search apps → „Facebook Pages".
Wybrać trigger „Watch Posts".
Autoryzować konto FB (osoba musi mieć rolę Editor/Admin na fanpage’u — Meta nie pozwala autoryzować bezpośrednio Page).
Wybrać fanpage z listy, ustawić filtr „All posts", limit 10 ostatnich, częstotliwość 15 min.
Dodać moduł HTTP → Make a request.
Konfiguracja:
URL: https://izbica24.pl/wp-json/iz24/v1/incoming
Method: POST
Headers: Authorization: Bearer <token>, Content-Type: application/json, X-Idempotency-Key: {{1.id}}
Body: szablon JSON (różny per instytucja — z source_id, category_hint, priority_hint, credit_name)
Run once → test → sprawdzić w wp-admin → Newsroom czy raw_item dotarł
Włączyć scenariusz (ON)
Koszt po stronie instytucji: 0 PLN — opłacasz wspólne konto Make.com Core z Twojego budżetu (9 EUR/mies. ≈ 38 PLN, 10 000 ops/mies. wystarcza dla wszystkich 16 instytucji łącznie).
### 9.6. Plakietka „Partner Izbica24.pl" i regulamin partnerstwa
Plakietka — prosty grafik SVG/PNG z brandingiem Izbica24, gotowy do wstawienia na stronę instytucji albo wydrukowania jako naklejka. Daje instytucji status („oficjalny partner regionalnego portalu") i buduje rozpoznawalność Twojej marki.
<a href="https://izbica24.pl/partnerzy" target="_blank" rel="noopener">
<img src="https://izbica24.pl/badges/partner-2026.svg"
alt="Oficjalny partner Izbica24.pl"
width="180" height="60" loading="lazy" />
</a>

Strona izbica24.pl/partnerzy listuje wszystkie aktywne instytucje partnerskie z logiem, krótkim opisem i linkiem — to zwrot wartości dla instytucji (PR-owo cenne).
Regulamin partnerstwa (2 strony PDF, podpis odręczny lub Autenti 1 PLN/podpis) — kluczowe punkty:
Definicja przekazywanych treści — typy (komunikaty, posty FB, zdjęcia z wydarzeń) i potwierdzenie praw autorskich
Licencja dla Izbica24.pl — niewyłączna, nieograniczona czasowo, na publikację z podaniem źródła, bezpłatna
Prawo redakcji do edycji — skracanie, redagowanie, rewrite z zachowaniem sensu
Klauzula AI — instytucja przyjmuje, że treści mogą być przetwarzane przez AI; każdy artykuł AI oznaczony zgodnie z polityką
Klauzula RODO — instytucja przekazuje dane osobowe wyłącznie z odpowiednią podstawą prawną; Izbica24 staje się odrębnym administratorem
Wycofanie — każda strona z dnia na dzień; instytucja może żądać usunięcia konkretnych artykułów
Token bezpieczeństwa — odpowiedzialność za poufność po stronie instytucji
Wzajemność promocji — Izbica24 publikuje treści instytucji ≥ raz/tydzień (jeśli dostarczone) i wystawia plakietkę; instytucja umieszcza plakietkę na swojej stronie
Wzór regulaminu generowany przez Claude (osobny prompt) i weryfikowany przez prawnika (jednorazowo 300–500 PLN). Dla 16 instytucji wartych roczne ~5000 PLN reklamy organicznej, 400 PLN za poprawny dokument to nic.
### 9.7. Onboarding instytucji — proces praktyczny (~30 min/instytucja)
Spotkanie / telefon (15 min) — koncepcja, mockup portalu, plakietka, propozycja partnerstwa
Podpis regulaminu (PDF lub Autenti, archiwum w Google Drive)
Generacja tokenu w wp-admin → Newsroom → Instytucje (kopiujesz do Bitwarden, wysyłasz Signal/ProtonMail)
Sesja konfiguracji Make (15–20 min, Zoom z share screen)
Test (publikacja testowego posta na FB instytucji, weryfikacja w wp-admin, usunięcie testu)
Plakietka (3 wersje SVG: poziomo, pionowo, kwadratowo + instrukcja wstawienia)
Pierwsze 7 dni — monitoring (codzienny check, czy posty wpadają — typowy problem: Make wymaga reauth co 60 dni)
Po miesiącu — review (telefon, feedback, ewentualne dodatkowe typy treści)
### 9.8. Plan adopcji — realistyczna dynamika
Webhook Pusher to model trzyletni, nie trzymiesięczny.
Miesiąc 1–2: 3–4 instytucje (OSP, MGCK, jedna szkoła, parafia). Pierwsze ~30 raw_items dziennie.
Miesiąc 3–4: +4–6 (urząd, biblioteka, Kujawianka, druga szkoła). ~80 raw_items dziennie.
Miesiąc 6: ~10 partnerów. Pojawiają się problemy operacyjne — 30% Twojego czasu na utrzymanie.
Miesiąc 12: 14–15 partnerów, ~150 raw_items/dzień, ~70% treści automatyczne.
Miesiąc 24: standard regionalny. Plakietka „Partner Izbica24.pl" symbolem cyfrowej obecności gminy.
To jest realny dług czasowy każdej infrastruktury społecznej. Webhook Pusher daje skalowalność, ale nie automatyzuje relacji ludzkich — te zawsze pozostaną ludzkie.

## 10. STACK TECHNICZNY I KOSZTY MIESIĘCZNE (PLN)
### 10.1. Infrastruktura
### 10.2. Wtyczki WordPress (uśrednione PLN/mies. z rocznych licencji)
Tier 1 — Niezbędne (~163 PLN/mies.):
Kadence Theme + Kadence Blocks (free)
Kadence Blocks Pro (~530 PLN/rok)
Rank Math Pro (~410 PLN/rok)
WP Rocket (~245 PLN/rok)
UpdraftPlus Premium (~290 PLN/rok)
Wordfence Premium (~490 PLN/rok)
Tier 2 — Bardzo zalecane (~217 PLN/mies.):
PublishPress Pro (~530 PLN/rok)
ACF Pro (~200 PLN/rok)
The Events Calendar Pro (~410 PLN/rok)
Presto Player Pro (~410 PLN/rok)
Seriously Simple Podcasting Stats (~410 PLN/rok)
MailPoet Premium (~640 PLN/rok)
Tier 3 — Opcjonalne (~50 PLN/mies. wybranych):
Fluent Forms Pro (~245 PLN/rok)
Modula galerie (~290 PLN/rok)
Two Factor + Limit Login + Web Stories (free)
Razem wtyczki: ~430 PLN/mies. (Tier 1 + 2 + część Tier 3)
### 10.3. AI i API
### 10.4. Narzędzia dodatkowe
### 10.5. Suma całkowita
Wariant ekonomiczny startowy (miesiące 1–6): ~600 PLN/mies.
Hosting Cloudways (~110), n8n VPS (22), Make (38), Postmark (41), domena (4), SES (5)
Tier 1 wtyczek (~163)
AI/API (~102)
Narzędzia podstawowe (~34)
Wariant pełny produkcyjny (od miesiąca 7+): ~870–950 PLN/mies.
Pełna infrastruktura z Cloudflare Pro
Tier 1 + 2 + część 3 wtyczek
Pełne AI/API
Narzędzia + Workspace
Plus jednorazowo: regulamin partnerstwa weryfikacja prawnik (~400 PLN), brand identity (logo, kolory, plakietka — Canva, ~0 PLN przy DIY lub ~1500 PLN agencji).
Próg samofinansowania: realnie 10–18 miesięcy. Trzy źródła przychodów łącznie po 18 miesiącach powinny pokrywać miesięczny budżet:
Reklama lokalna — 5–8 stałych reklamodawców × 150 PLN/mies. = 750–1200 PLN
Nekrologi i ogłoszenia płatne — 8–15/mies. × 50–100 PLN = 400–1500 PLN
Artykuły sponsorowane (oznaczone) — 2–3/mies. × 200–400 PLN = 400–1200 PLN
Katalog firm — pakiet rozszerzony — 10–20 firm × 30 PLN/mies. = 300–600 PLN
Przewidywane przychody miesiąc 18: 1850–4500 PLN/mies. — nadwyżka pozwala na zatrudnienie redaktora sekcji na pół etatu (1500–2500 PLN/mies.).

## 11. PLAN IMPLEMENTACJI ETAPOWEJ (24 MIESIĄCE)
### Faza 0 — Fundament (miesiąc 0, przed startem)
Kontekst środowiskowy:
Instalacja WordPress Studio lokalnie (Mac/Windows/Linux) — środowisko dev na 6 miesięcy intensywnej pracy
Instancja izbica24-dev z Kadence Theme + Kadence Blocks
Inicjalizacja prywatnego repo GitHub izbica24/portal z trzema głównymi katalogami: theme/izbica24-child/, plugin/izbica24-blocks/, plugin/izbica24-newsroom/, knowledge-base/
Instalacja Claude Code z aktywnym Skillem izbica24-portal (z poprzednich rozmów)
Na produkcji izbica24.pl: tylko pusty WordPress + Kadence + minimum bezpieczeństwa (Wordfence, Limit Login, 2FA). Czekamy z fronton’em do końca developmentu lokalnego.
### Faza 1 — Front portalu (miesiące 1–2)
7 sesji Claude Code z poprzedniego planu:
Inicjalizacja child theme + szkielet wtyczki bloków
 2–3. Template parts (header z mega-menu, footer, sidebary, hero)
Templates archiwów dla 12 kategorii (z różnicowaniem wizualnym Na Sygnale, Historia, Kujawianka, Kultura)
 5–6. Custom plugin izbica24-blocks z 24 blokami
Strony statyczne (12), formularze, optymalizacja CWV, schema markup
Deploy na produkcję: spakowanie ZIP-ów child theme i wtyczki, upload przez wp-admin lub GitHub Actions auto-deploy przez SFTP.
### Faza 2 — Newsroom plugin + pierwsze treści ręczne (miesiące 2–3)
Sesje N1–N3:
Wtyczka izbica24-newsroom: CPT iz24_raw_item, taksonomie, REST endpoint /v1/incoming, generator tokenów
Strona admin „Newsroom Queue" z filtrami i akcjami masowymi
Integracja z PublishPress: routing draftów do redaktora sekcji
Równolegle: redaktor naczelny ręcznie publikuje 20–30 artykułów (testy ręczne, kalibracja stylu redakcyjnego, walidacja UX). Bez tego automatyzacja zbuduje potwora.
### Faza 3 — Pierwsze partnerstwa (miesiąc 3)
Onboarding 3 partnerów: OSP Izbica + MGCK + 1 szkoła. Każdy z osobna konfigurowany przez Webhook Pusher (Make.com). Stress test endpointu, iteracje na podstawie problemów, dopracowanie templates JSON dla każdej instytucji.
### Faza 4 — Workflow agregacji n8n (miesiące 3–4)
Sesje N4–N6:
Szablony promptów Claude jako CPT iz24_prompt_template (edytowalne z wp-admin, wersjonowane)
Instalacja n8n na drugim VPS-ie (Hetzner CX22), import workflow’ów: Slot poranny, Instytucjonalny, Sportowy, Multimedia, Cost Guard, Fact-Check
Test end-to-end: Perplexity → n8n → Claude → WP draft → Redaktor → Publish
### Faza 5 — Skalowanie partnerstw + automatyzacja społeczna (miesiące 4–6)
Onboarding kolejnych 6 partnerów (Kujawianka, urząd, biblioteka, ZGKiW, druga szkoła, parafia NMP)
Newsletter automatyczny (MailPoet + Claude generator)
Social Auto Poster — auto-publikacja na FB/Instagram
Web Stories dla Google Discover
### Faza 6 — Multimedia (miesiące 6–9)
Sekcja Wideo (embed YouTube przez Presto Player)
Galerie zdjęć z systemem watermark
Pierwszy odcinek podcastu „Głos Izbicy" (testowy)
Audiogramy YouTube generowane przez Headliner
### Faza 7 — Stabilizacja i monetyzacja (miesiące 9–12)
Pierwsi reklamodawcy lokalni (apteka, sklep, warsztat) — AdRotate
Katalog firm z planami płatnymi
System nekrologów płatnych
Dashboard kosztów i przychodów (custom widget)
### Faza 8 — Rozwój społeczności (miesiące 12–24)
Pełna sekcja Podcast (cotygodniowe odcinki)
Reportaże wideo własne (faza 2 YouTube)
Wybory samorządowe 2028 (jeśli w okresie) — sekcja dedykowana
Cross-promo z portalami sąsiednich gmin
Możliwe zatrudnienie redaktora sekcji na pół etatu

## 12. RYZYKA, MITYGACJE, AWARYJNE ŚCIEŻKI

## 13. ZAŁĄCZNIKI
### Załącznik A — Mapa przepływu danych (uproszczona)
[16 instytucji partnerskich — Webhook Pusher]
│ (push, real-time)
[Perplexity API × 3 zapytania bazowe]
│ (poll, slot poranny)
[Strony BIP + 12 instytucji — scraping]
│ (poll, slot instytucjonalny)
[E-mail forwarding inbox]
│ (IMAP, 3× dziennie)
[YouTube API × 3 kanały]
│ (poll, 12:00)
[Sofascore + regiowyniki — Kujawianka]
│ (poll w dniu meczu)
▼
POST /wp-json/iz24/v1/incoming
│
▼
[iz24_raw_item w WP]
│
▼
[n8n: Claude Classify]
│
┌──────────────────┼──────────────────┐
▼                  ▼                  ▼
typ=link            typ=rewrite          typ=skip
│                  │                  │
▼                  ▼                  ▼
Przegląd Mediów   [n8n: Claude Write]      /dev/null
(auto-publish)    [+ fact-check pass]
│       [+ LanguageTool]
│                  │
│                  ▼
│            [WP Draft pending]
│                  │
│                  ▼
│       [Redaktor sekcji review]
│       [+ Naczelny final check]
│                  │
▼                  ▼
[PUBLISHED na izbica24.pl]
│
┌──────────────────────────────┼──────────────────────────────┐
▼              ▼               ▼              ▼               ▼
Auto-thumbnail  Schema NewsArticle  IndexNow     Social queue   Newsletter queue
Sitemap update                                   (FB, IG, TG)   (niedziela 18:00)

### Załącznik B — Lista kompletna scenariuszy n8n
iz24-perplexity-morning — slot 7:00, 3 zapytania bazowe
iz24-perplexity-thematic — co 2 dni, evergreen tematyczny
iz24-scraping-bip — slot 8:00, BIP urzędu i starostwa, ekstrakcja PDF
iz24-scraping-institutions — slot 8:30, strony 12 instytucji
iz24-email-poll — 3× dziennie IMAP poll
iz24-youtube-multimedia — slot 12:00
iz24-sport-kujawianka — w dniu meczu, Sofascore + regiowyniki
iz24-claude-classify — slot 7:30, batch klasyfikacja
iz24-claude-rewrite — slot 9:00, generator artykułów
iz24-claude-evergreen — co 2 dni, slot 11:00
iz24-claude-factcheck — trigger po każdym rewrite
iz24-languagetool-polish — trigger po factcheck
iz24-social-publisher — co 30 min, kolejka FB/IG/TG
iz24-newsletter-weekly — niedziela 18:00
iz24-cost-guard — co 15 min, sprawdzanie progu
iz24-health-check — codziennie 5:00, walidacja selektorów + alerty
iz24-knowledge-refresh — codziennie 4:00, pull GitHub knowledge base do Redis cache
### Załącznik C — Kontakt i co dalej
W następnym kroku rekomenduję wybór jednej z dwóch ścieżek:
Ścieżka technologiczna (kontynuacja developmentu): Konkretny prompt Claude Code do Sesji N1 — szkielet wtyczki izbica24-newsroom z CPT iz24_raw_item, taksonomiami, endpointem /v1/incoming, generatorem tokenów dla instytucji, podstawowym admin UI. Po tej sesji masz fundament backendu newsroom’u i możesz onboardować pierwszą instytucję w trybie testowym.
Ścieżka organizacyjna (przygotowanie partnerstw): Wzór regulaminu partnerstwa w formacie Markdown gotowy do walidacji prawnika, plus checklist’a onboardingu instytucji (PDF dla każdej z 16), plus 3 wersje plakietki „Partner Izbica24.pl" (SVG poziomy, pionowy, kwadratowy z trzema wariantami kolorystycznymi do dopasowania).
Daj znać, którą ścieżkę aktywujemy w następnej iteracji — albo czy chcesz najpierw wrócić do Sesji 2 frontu portalu (template parts header z mega-menu, footer, sidebary).


| Slot | Godziny | Co robi |
| --- | --- | --- |
| Poranny | 6:00–7:00 | Perplexity research (3 zapytania bazowe) + scraping BIP + RSS biblioteki |
| Instytucjonalny | 8:00–9:00 | Scraping stron instytucji (urząd, MGCK, ZGKiW, parafia, szkoły, LGD) |
| E-mail | 9:00, 14:00, 19:00 | IMAP poll skrzynki in.izbica24.pl (e-mail forwarding instytucji) |
| Multimedia | 12:00 | YouTube API (3 kanały) |
| Sport | 15:00, 18:00, 21:00 (sb/nd) | Sofascore + regiowyniki w dniu meczu Kujawianki |
| Wieczorny | 20:00 | Perplexity tematyczne (raz na 2 dni) + research evergreen |


| Rola | Liczba kont | Uprawnienia |
| --- | --- | --- |
| Administrator | 1 (właściciel) | Pełny dostęp do WP, n8n, baza, API keys, billing |
| Redaktor naczelny | 1 | Zatwierdza wszystkie drafty, publikuje, edytuje, usuwa, widzi panel statystyk |
| Redaktor sekcji | 3–4 | Po jednym na: (1) Wiadomości+Samorząd, (2) Kujawianka+Sport, (3) Kultura+Historia, (4) Na Sygnale; zatwierdzają drafty w swojej sekcji |
| Kontrybutor instytucjonalny | 10–15 | Po jednym dla każdej instytucji partnerskiej (sekcja 9); tworzą posty contributor_draft, widoczne tylko dla swojego redaktora sekcji i naczelnego |
| Autor AI | 1 systemowe | „Redakcja Izbica24" — pod tym profilem publikowane są artykuły AI po human review |


| Godzina | Sekcja | Częstotliwość |
| --- | --- | --- |
| 7:00 | Przegląd Mediów (linki + opisy, automatycznie) | Codziennie |
| 8:00–9:00 | Na Sygnale (zdarzenia nocne) | W razie potrzeby |
| 10:00–11:00 | Wiadomości (drafty AI po human review) | Codziennie |
| 13:00 | Kujawianka (zapowiedź / relacja po meczu) | Pn–Pt zapowiedzi, So/Nd relacje |
| 15:00 | Kultura, Życie Codzienne, Evergreen | Pn–Pt |
| 18:00 | Samorząd (uchwały po godzinach pracy urzędu) | Wt, Cz |
| Niedziela 18:00 | Newsletter „Tydzień w Izbicy" | Co tydzień |
| Piątek 12:00 | Podcast „Głos Izbicy" — nowy odcinek | Co tydzień |


| Instytucja | Aktywność FB | Preferowany poziom | Domyślna kategoria | Domyślny priorytet |
| --- | --- | --- | --- | --- |
| OSP Izbica Kujawska | Bardzo wysoka (interwencje numerowane) | 1 — Webhook auto | Na Sygnale | high |
| MGKS Kujawianka | Wysoka (sezon) | 1 — Webhook auto | Kujawianka | normal |
| Miasto i Gmina Izbica (oficjalny) | Średnia | 1 — Webhook auto | Samorząd | normal |
| MGCK Izbica | Średnia (wydarzenia) | 1 — Webhook auto | Kultura | normal |
| Biblioteka Publiczna | Niska–średnia | 2 — E-mail forwarding | Kultura/Biblioteka | low |
| Parafia NMP Izbica | Niska (ogłoszenia) | 2 — E-mail forwarding | Kultura/Parafie | low |
| Parafia Błenna | Bardzo niska | 3 — Manualny formularz | Kultura/Parafie | low |
| Parafia Modzerowo | Bardzo niska | 3 — Manualny formularz | Kultura/Parafie | low |
| Urząd Miejski (komunikacja) | Średnia | 2 — E-mail forwarding + scraping BIP | Samorząd/Urząd | normal |
| Starostwo Powiatowe | Niska (relevant) | Scraping BIP + manualne | Samorząd/Powiat | normal |
| SP nr 1 Izbica | Niska | 3 — Manualny + scraping | Wiadomości/Edukacja | low |
| SP nr 2 Izbica | Średnia (aktywna FB) | 2 — E-mail lub 1 — Webhook | Wiadomości/Edukacja | low |
| SP Błenna | Bardzo niska | 3 — Manualny | Wiadomości/Edukacja | low |
| SP Sarnowo | Bardzo niska | 3 — Manualny | Wiadomości/Edukacja | low |
| ZS Kasprowicza | Niska–średnia | 2 — E-mail forwarding | Wiadomości/Edukacja | low |
| Przedszkole Miejskie | Bardzo niska | 3 — Manualny | Wiadomości/Edukacja | low |
| MGOPS | Bardzo niska | 2 — E-mail forwarding | Wiadomości/Społeczne | low |
| ZGKiW | Niska (komunikaty awaryjne) | 1 — Webhook auto + scraping | Na Sygnale/Awarie | high |
| SPZOZ | Brak FB | 2 — E-mail forwarding | Wiadomości/Zdrowie | normal |
| Orioniści / DPS | Niska | 2 — E-mail forwarding | Kultura/Orioniści | low |
| LGD Dorzecza Zgłowiączki | Niska | 3 — Manualny | Wiadomości/Społeczne | low |
| KGW (5 kół) | Bardzo niska | 3 — Manualny | Kultura/KGW | low |


| Pozycja | Koszt PLN/mies. |
| --- | --- |
| Hosting WP (Cloudways Vultr 2GB lub mydevil Premium) | 25–110 |
| VPS n8n (Hetzner CX22) | 22 |
| Domena izbica24.pl (~50 PLN/rok) | 4 |
| Cloudflare (Free na start, Pro od 6 mies.) | 0 lub 105 |
| Postmark Inbound (e-mail forwarding) | 41 |
| Make.com Core (Webhook Pusher dla instytucji) | 38 |
| Amazon SES (newsletter) | 5 |
| Razem infrastruktura | 135–325 PLN/mies. |


| Pozycja | Koszt PLN/mies. |
| --- | --- |
| Claude API (Sonnet 4.6, klasyfikacja + rewrite + fact-check + evergreen) | 50–75 |
| Perplexity API (~50 zapytań/dzień) | 21 |
| Embeddings (OpenAI text-embedding-3-small) | 10 |
| LanguageTool Cloud | 21 |
| YouTube Data API + Open-Meteo | 0 (free tier) |
| Razem AI/API | 102–127 PLN/mies. |


| Pozycja | Koszt PLN/mies. |
| --- | --- |
| Headliner audiogramy / Canva Pro | 0–40 |
| Bitwarden Premium (password mgmt) | 4 |
| Google Workspace (e-maile @izbica24.pl, 1 user) | 30 |
| Spotify for Podcasters | 0 |
| Razem narzędzia | 34–74 PLN/mies. |


| Ryzyko | Prawdopodobieństwo | Mitygacja |
| --- | --- | --- |
| Selektor CSS scrapingu się łamie | Wysokie (raz na 2–3 mies.) | Health check workflow, fallback Perplexity, alert Telegram |
| Make.com instytucji wyłącza się (reauth co 60 dni) | Wysokie (typowe) | Monitoring activity per instytucja, alert >7 dni nieaktywności, telefon do kontaktu |
| Niska jakość artykułu AI (halucynacja) | Średnie | Obowiązkowy fact-check pass, human review przez 6+ miesięcy, knowledge base aktualna |
| Wypalenie kontrybutorów | Średnie | AI pokrywa 50–60%, miesięczne online spotkania redakcji, jasne granice oczekiwań |
| Cost Guard nie zatrzymuje pętli kosztowej | Niskie ale krytyczne | Hard limit budgetu w Anthropic Console (USD/mies.), cron sprawdza co 15 min |
| Awaria n8n VPS | Średnie | Backup workflow’ów co tydzień, status page, fallback ręczna publikacja |
| Atak DDoS na portal | Niskie | Cloudflare Pro od miesiąca 6, rate limit endpointów REST |
| Wyciek tokenu instytucji | Niskie | Token rotation 12 mies., revocation w wp-admin, log każdego incoming |
| RODO incident (publikacja danych osobowych bez zgody) | Średnie | Klauzula RODO w regulaminie partnerstwa, fact-check pass z ostrzeżeniem o danych osobowych, formularz „zgłoś usunięcie" |
| Problem prawno-autorski (reklamacja portalu źródłowego) | Niskie | Polityka oryginalnych przeróbek, clear źródło + link, regulamin Izbica24 z procedurą reklamacji |
| Spadek aktywności instytucji | Średnie | Comiesięczne review per instytucja, propozycja przejścia na łatwiejszy poziom (1→2→3), wdzięczność wyrażana publicznie |
