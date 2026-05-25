# 📋 izbica24.pl — Pełna lista TODO (590 zadań)

**Stan na**: 2026-05-25 · po commicie `f446a2b` (90-task parallel build merged)
**Cel**: pełnoprawny produkcyjny portal informacyjny + AI newsroom

**Legenda statusu**:
- ✅ DONE (zrobione w poprzednich sesjach)
- 🟡 IN PROGRESS (zaczęte, do dokończenia)
- ⬜ TODO

**Legenda priorytetu**:
- 🔴 P0 — krytyczne (bez tego nie ma produkcji)
- 🟠 P1 — wysokie (potrzebne na MVP/launch)
- 🟡 P2 — średnie (poprawia jakość produktu)
- 🟢 P3 — niskie (nice-to-have, future)

---

## FAZA 1 — Domknięcie prototypu Cloudflare Pages (zadania 1–60) 🔴 P0

### 1.1 Routing & strony — uzupełnienia (1–15)
1. ⬜ 🔴 Strona `/wiadomosci/inwestycje` — podkategoria z filtrem tagów
2. ⬜ 🔴 Strona `/wiadomosci/edukacja` — podkategoria
3. ⬜ 🔴 Strona `/wiadomosci/zdrowie` — podkategoria
4. ⬜ 🔴 Strona `/wiadomosci/spoleczne` — podkategoria
5. ⬜ 🔴 Strona `/wiadomosci/komunikaty` — podkategoria
6. ⬜ 🔴 Strona `/wiadomosci/srodowisko` — podkategoria
7. ⬜ 🔴 Strona `/wiadomosci/rolnictwo` — podkategoria
8. ⬜ 🟠 Strona `/na-sygnale` — kategoria wypadków/pożarów (eyebrow czerwony, ostrzegawcza prezentacja)
9. ⬜ 🟠 Strona `/na-sygnale/wypadki`, `/pozary`, `/interwencje`, `/kronika-policyjna`, `/awarie` (5 podkategorii)
10. ⬜ 🟠 Strona `/ludzie` — wywiady, sylwetki, sukcesy, wspomnienia (4 podkategorie)
11. ⬜ 🟠 Strona `/zycie` — poradnik mieszkańca + 3 podkategorie
12. ⬜ 🟠 Strona `/przeglad` — przegląd mediów (4 podkategorie)
13. ⬜ 🟠 Strona `/multimedia` — wideo/podcast/galerie/infografiki (4 podkategorie)
14. ⬜ 🟠 Strona `/ogloszenia` — nekrologi/praca/sprzedam/nieruchomości/firmy (5 podkategorii)
15. ⬜ 🟡 Tag pages — `/tag/:slug` (np. `/tag/kujawianka`)

### 1.2 Strony statyczne (16–30)
16. ⬜ 🔴 `/o-portalu` — misja, historia, redakcja
17. ⬜ 🔴 `/redakcja` — zespół z avatarami i bio
18. ⬜ 🔴 `/kontakt` — form + dane teleadresowe + mapa
19. ⬜ 🔴 `/reklama` — cennik, mediakit, kontakt sprzedaż
20. ⬜ 🟠 `/dolacz` — zaproszenie do redakcji obywatelskiej
21. ⬜ 🟠 `/mapa-strony` — sitemap HTML dla użytkowników
22. ⬜ 🟠 `/telefony` — ważne numery (OSP/policja/MGOPS/apteka)
23. ⬜ 🟠 `/linki` — przydatne odnośniki (UM, BIP, ePUAP)
24. ⬜ 🔴 `/regulamin` — regulamin serwisu (zgodny z PL prawem)
25. ⬜ 🔴 `/polityka-prywatnosci` — RODO + cookies
26. ⬜ 🔴 `/rodo` — klauzula informacyjna RODO
27. ⬜ 🟠 `/polityka-cookies` — szczegółowa lista
28. ⬜ 🟡 `/faq` — najczęstsze pytania
29. ⬜ 🟡 `/pomoc` — instrukcja korzystania
30. ⬜ 🟢 `/sponsorzy` — patroni i sponsorzy

### 1.3 Komponenty UI — dokończenie (31–45)
31. ⬜ 🟠 Komponent `<Comments />` — full UI dla komentarzy (zamiast stuba)
32. ⬜ 🟠 Komponent `<CommentForm />` — z walidacją po stronie klienta
33. ⬜ 🟠 Komponent `<ShareModal />` — z FB/X/WhatsApp/Email/copy-link
34. ⬜ 🟠 Komponent `<Newsletter />` — wersja inline + modal
35. ⬜ 🟠 Komponent `<SearchModal />` — overlay z autocomplete
36. ⬜ 🟠 Komponent `<Breadcrumb />` — generic dla wszystkich stron
37. ⬜ 🟡 Komponent `<Pagination />` — z numeracją + prev/next
38. ⬜ 🟡 Komponent `<AuthorCard />` — wyniesiony do współdzielonego
39. ⬜ 🟡 Komponent `<RelatedArticles />` — algorytm rekomendacji
40. ⬜ 🟡 Komponent `<TableOfContents />` — auto-generated z H2/H3
41. ⬜ 🟡 Komponent `<ReadingProgress />` — sticky progress bar
42. ⬜ 🟡 Komponent `<ScrollToTop />` — pływający przycisk
43. ⬜ 🟢 Komponent `<DarkModeToggle />` — przełącznik motywu
44. ⬜ 🟢 Komponent `<FontSizeToggle />` — A- A A+ (accessibility)
45. ⬜ 🟢 Komponent `<PrintButton />` — print stylesheet + dedykowany btn

### 1.4 Frontend JavaScript (46–60)
46. ⬜ 🟠 `public/static/app.js` — refaktoryzacja: ES modules
47. ⬜ 🟠 Search modal logic + keyboard shortcuts (Ctrl+K / /)
48. ⬜ 🟠 Newsletter form — fetch POST + success/error states
49. ⬜ 🟠 Comment form — fetch POST + walidacja
50. ⬜ 🟠 Share buttons — Web Share API + fallback
51. ⬜ 🟠 Reading progress bar — IntersectionObserver
52. ⬜ 🟠 Scroll-to-top — show/hide na 400px scroll
53. ⬜ 🟡 Lazy loading obrazów (native `loading="lazy"` + Intersection fallback)
54. ⬜ 🟡 Lightbox dla galerii (vanilla, no jQuery)
55. ⬜ 🟡 Embed handlers (YouTube/Vimeo/Twitter lazy embed)
56. ⬜ 🟡 Mobile menu — hamburger toggle + ESC close
57. ⬜ 🟡 Dropdown menu — keyboard navigation (arrow keys)
58. ⬜ 🟢 Service Worker — basic offline cache (PWA)
59. ⬜ 🟢 Notification API — push notifications opt-in
60. ⬜ 🟢 Theme switcher — light/dark/sepia z localStorage

---

## FAZA 2 — Cloudflare D1 + KV + R2 produkcja (61–130) 🔴 P0

### 2.1 D1 — utworzenie i podpięcie (61–80)
61. ⬜ 🔴 `setup_cloudflare_api_key` — weryfikacja autoryzacji
62. ⬜ 🔴 `npx wrangler d1 create izbica24-production` — utworzenie bazy
63. ⬜ 🔴 Skopiowanie `database_id` do `wrangler.jsonc`
64. ⬜ 🔴 Aktualizacja `wrangler.jsonc` — odkomentowanie `d1_databases`
65. ⬜ 🔴 `wrangler d1 migrations apply izbica24-production --local` — apply local
66. ⬜ 🔴 `wrangler d1 execute izbica24-production --local --file=seed.sql` — seed
67. ⬜ 🔴 Migracja `0003_search_fts.sql` — FTS5 virtual table dla pełnotekstowego wyszukiwania
68. ⬜ 🔴 Migracja `0004_analytics.sql` — tabela `page_views`, `events_log`
69. ⬜ 🟠 Migracja `0005_media.sql` — tabela `media` (zdjęcia/wideo + metadata)
70. ⬜ 🟠 Migracja `0006_authors_profile.sql` — pełne profile autorów
71. ⬜ 🟠 Migracja `0007_categories_hierarchy.sql` — parent_id + tree
72. ⬜ 🟠 Migracja `0008_settings.sql` — key-value settings table
73. ⬜ 🟠 Migracja `0009_audit_log.sql` — pełen audit trail dla GDPR
74. ⬜ 🟠 Migracja `0010_redirects.sql` — tabela 301/302 redirects
75. ⬜ 🔴 Refactor `data-articles.ts` → `repository/articles.ts` z `c.env.DB`
76. ⬜ 🔴 Refactor `api/v1.ts` — wszystkie endpointy używają D1 zamiast mocków
77. ⬜ 🔴 Repository layer `repository/categories.ts`, `comments.ts`, `newsletter.ts`, `alerts.ts`, `events.ts`
78. ⬜ 🟠 Migration runner script — `npm run db:migrate:prod`
79. ⬜ 🟠 Backup script — `npm run db:export` (wrangler d1 export)
80. ⬜ 🟡 D1 console aliases — `db:console:local`, `db:console:prod`

### 2.2 KV Namespace (81–95)
81. ⬜ 🔴 `wrangler kv:namespace create izbica24_KV` — utworzenie KV
82. ⬜ 🔴 `wrangler kv:namespace create izbica24_KV --preview` — preview
83. ⬜ 🔴 Dodanie do `wrangler.jsonc`
84. ⬜ 🔴 KV jako cache layer dla artykułów (TTL 5 min)
85. ⬜ 🔴 KV dla rate limiting (per IP + per endpoint)
86. ⬜ 🟠 KV dla session tokens (wygenerowane przy logowaniu redaktora)
87. ⬜ 🟠 KV dla feature flags (A/B testing, kill switches)
88. ⬜ 🟠 KV dla newsletter unsubscribe tokens
89. ⬜ 🟠 KV dla cache pogody (TTL 10 min)
90. ⬜ 🟠 KV dla cache cen paliw (TTL 30 min)
91. ⬜ 🟠 KV dla cache RSS feeds (TTL 15 min)
92. ⬜ 🟡 KV dla heatmap clicks aggregation
93. ⬜ 🟡 KV dla A/B test variant assignment
94. ⬜ 🟡 KV cleanup cron — usuwanie wygasłych kluczy
95. ⬜ 🟢 KV admin UI w panelu — wgląd w klucze

### 2.3 R2 Storage (96–115)
96. ⬜ 🔴 `wrangler r2 bucket create izbica24-media` — bucket główny
97. ⬜ 🔴 `wrangler r2 bucket create izbica24-backups` — bucket backupów
98. ⬜ 🔴 Custom domain dla R2 (`media.izbica24.pl`)
99. ⬜ 🔴 R2 CORS policy — domena izbica24.pl + redaktor
100. ⬜ 🔴 Upload handler `POST /api/v1/upload` — z presigned URL
101. ⬜ 🔴 Image processing pipeline — resize na 320/640/1280/1920px (Cloudflare Images lub Workers)
102. ⬜ 🔴 WebP + AVIF conversion (lighter format)
103. ⬜ 🟠 Lazy upload progress (chunked upload dla wideo)
104. ⬜ 🟠 R2 Lifecycle rule — backups starsze niż 90 dni → archive
105. ⬜ 🟠 Multi-format response (Accept: image/avif → AVIF)
106. ⬜ 🟠 Watermark overlay (logo izbica24 w prawym dolnym rogu)
107. ⬜ 🟠 EXIF stripping (privacy — usuwanie GPS z fotek)
108. ⬜ 🟠 Image alt-text generator (Vision API → opis dla ARIA)
109. ⬜ 🟠 PDF storage (dokumenty samorządowe, plany budżetu)
110. ⬜ 🟠 Audio storage (podcasty MP3/OGG)
111. ⬜ 🟠 Video storage + HLS manifest generation
112. ⬜ 🟡 Backup DB → R2 — cron Workers Trigger codziennie
113. ⬜ 🟡 Sitemap.xml backup do R2 (snapshot historyczny)
114. ⬜ 🟢 R2 → Cloudflare Stream (dla wideo HLS)
115. ⬜ 🟢 R2 → Cloudflare Pages Functions (static asset delivery)

### 2.4 D1 + FTS5 search (116–130)
116. ⬜ 🔴 Trigger `articles → articles_fts` synchronizacja
117. ⬜ 🔴 Search endpoint refactor — FTS5 zamiast LIKE
118. ⬜ 🔴 Stemming polski (snowball-pl tokenizer lub własna lista końcówek)
119. ⬜ 🟠 Stop words PL — `i, w, na, z, do, że, jest, to`
120. ⬜ 🟠 Highlighting wyników — snippets z `<mark>`
121. ⬜ 🟠 Fuzzy matching — edit distance 2 (typos tolerance)
122. ⬜ 🟠 Search suggestions — top 10 zapytań z `events_log`
123. ⬜ 🟠 Search analytics — co ludzie szukają (top queries)
124. ⬜ 🟡 "Did you mean" — sugestia poprawki literówki
125. ⬜ 🟡 Filter by date range — od/do
126. ⬜ 🟡 Filter by category multiselect
127. ⬜ 🟡 Filter by author
128. ⬜ 🟡 Sort by relevance / date / popularity
129. ⬜ 🟢 Semantic search (embeddings z OpenAI/Cohere → wektor → KV/D1)
130. ⬜ 🟢 RAG endpoint produkcyjny (z Vectorize binding lub Pinecone)

---

## FAZA 3 — Autoryzacja redakcyjna + Admin Panel (131–200) 🟠 P1

### 3.1 Auth system (131–150)
131. ⬜ 🔴 Tabela `users` — rozbudowa o: 2FA secret, last_login, failed_attempts
132. ⬜ 🔴 Endpoint `POST /api/v1/auth/login` — email/password + bcrypt
133. ⬜ 🔴 Endpoint `POST /api/v1/auth/logout`
134. ⬜ 🔴 Endpoint `POST /api/v1/auth/refresh` — JWT refresh
135. ⬜ 🔴 JWT signing z hono/jwt — HS256 + 15 min TTL
136. ⬜ 🔴 Refresh token w KV (TTL 7 dni)
137. ⬜ 🔴 Middleware `auth/*` — sprawdza JWT w cookie
138. ⬜ 🔴 Middleware `roles` — admin/editor/contributor/reader
139. ⬜ 🟠 Endpoint `POST /api/v1/auth/forgot-password` — email reset link
140. ⬜ 🟠 Endpoint `POST /api/v1/auth/reset-password` — z tokenem
141. ⬜ 🟠 Endpoint `POST /api/v1/auth/register` — z email verification
142. ⬜ 🟠 Endpoint `GET /api/v1/auth/verify/:token` — potwierdza email
143. ⬜ 🟠 2FA TOTP — `POST /api/v1/auth/2fa/setup` + `/verify`
144. ⬜ 🟠 Account lockout — 5 nieudanych prób → blokada 30 min
145. ⬜ 🟠 Password strength meter (zxcvbn-equivalent po stronie klienta)
146. ⬜ 🟡 OAuth Google sign-in (dla redaktorów)
147. ⬜ 🟡 OAuth Facebook sign-in (dla komentujących)
148. ⬜ 🟡 Magic link login (passwordless dla autorów)
149. ⬜ 🟡 Session management — wyloguj wszystkie urządzenia
150. ⬜ 🟢 SSO via SAML (na przyszłość — integracja z urzędem)

### 3.2 Admin Panel UI (151–185)
151. ⬜ 🟠 Strona `/admin/login` — formularz logowania (Reuters-tier)
152. ⬜ 🟠 Strona `/admin` — dashboard z KPI (artykuły dziś, pending komentarze, ruch)
153. ⬜ 🟠 Strona `/admin/articles` — lista z filtrami + bulk actions
154. ⬜ 🟠 Strona `/admin/articles/new` — edytor z Markdown/WYSIWYG
155. ⬜ 🟠 Strona `/admin/articles/:id/edit` — edycja istniejącego
156. ⬜ 🟠 Strona `/admin/articles/:id/preview` — preview przed publikacją
157. ⬜ 🟠 Strona `/admin/categories` — CRUD kategorii
158. ⬜ 🟠 Strona `/admin/tags` — CRUD tagów + merge duplicates
159. ⬜ 🟠 Strona `/admin/comments` — moderacja (approve/reject/spam)
160. ⬜ 🟠 Strona `/admin/newsletter` — lista subskrybentów + export CSV
161. ⬜ 🟠 Strona `/admin/newsletter/campaigns` — wysyłki newslettera
162. ⬜ 🟠 Strona `/admin/users` — zarządzanie redaktorami
163. ⬜ 🟠 Strona `/admin/users/:id` — edycja roli + profile
164. ⬜ 🟠 Strona `/admin/media` — biblioteka mediów z R2
165. ⬜ 🟠 Strona `/admin/media/upload` — drag & drop multi-upload
166. ⬜ 🟠 Strona `/admin/analytics` — wykresy ruchu (Plausible-style)
167. ⬜ 🟡 Strona `/admin/seo` — sitemap status + GSC integration
168. ⬜ 🟡 Strona `/admin/redirects` — CRUD 301/302
169. ⬜ 🟡 Strona `/admin/queue` — kolejka z n8n (incoming_queue)
170. ⬜ 🟡 Strona `/admin/prompts` — biblioteka promptów AI
171. ⬜ 🟡 Strona `/admin/alerts` — CRUD alertów (awarie, drogi)
172. ⬜ 🟡 Strona `/admin/events` — CRUD wydarzeń kalendarza
173. ⬜ 🟡 Strona `/admin/audit-log` — pełen audit trail
174. ⬜ 🟡 Strona `/admin/settings` — globalne ustawienia portalu
175. ⬜ 🟡 Strona `/admin/settings/seo` — meta tags defaults
176. ⬜ 🟡 Strona `/admin/settings/social` — linki FB/IG/YT
177. ⬜ 🟡 Strona `/admin/settings/integrations` — API keys (OpenAI, n8n, etc.)
178. ⬜ 🟡 Strona `/admin/settings/billing` — koszty AI per miesiąc
179. ⬜ 🟢 Strona `/admin/profile` — profil redaktora + avatar
180. ⬜ 🟢 Strona `/admin/notifications` — powiadomienia w admin
181. ⬜ 🟢 Sidebar admin — collapsible nav z 25+ pozycjami
182. ⬜ 🟢 Topbar admin — search + user menu + notifications bell
183. ⬜ 🟢 Dark mode dla całego admina
184. ⬜ 🟢 Keyboard shortcuts w admin (cmd+s zapisz, cmd+k search)
185. ⬜ 🟢 Onboarding tour (nowy redaktor — interactive tutorial)

### 3.3 WYSIWYG Editor (186–200)
186. ⬜ 🟠 Wybór: Tiptap / Lexical / ProseMirror / Markdown-it
187. ⬜ 🟠 Bloki: heading, paragraph, list, blockquote, code
188. ⬜ 🟠 Bloki: image embed z R2 picker
189. ⬜ 🟠 Bloki: YouTube/Vimeo/Twitter embed
190. ⬜ 🟠 Bloki: callout (info/warning/danger)
191. ⬜ 🟠 Bloki: gallery (multi-image grid)
192. ⬜ 🟠 Bloki: divider, button, CTA
193. ⬜ 🟠 Bloki: table (z headers + sortowanie)
194. ⬜ 🟠 Bloki: poll (ankieta dla czytelników)
195. ⬜ 🟠 Autosave co 30s (draft do D1)
196. ⬜ 🟠 Version history (każdy save = nowa wersja)
197. ⬜ 🟠 Restore from version
198. ⬜ 🟡 Collaborative editing (Y.js + WebSocket — wymaga Durable Objects)
199. ⬜ 🟡 Spellcheck PL (Hunspell w Workerze?)
200. ⬜ 🟢 AI assistant w edytorze (popraw stylistykę, skróć, rozwiń)

---

## FAZA 4 — AI / Newsroom automation (201–280) 🟠 P1

### 4.1 OpenAI / Anthropic integration (201–215)
201. ⬜ 🔴 Endpoint `POST /api/v1/ai/generate` — generowanie artykułu
202. ⬜ 🔴 Endpoint `POST /api/v1/ai/summarize` — streszczenie TL;DR
203. ⬜ 🔴 Endpoint `POST /api/v1/ai/title` — propozycje tytułów (5 wariantów)
204. ⬜ 🔴 Endpoint `POST /api/v1/ai/lede` — generowanie ledu
205. ⬜ 🔴 Endpoint `POST /api/v1/ai/tags` — auto-tagging
206. ⬜ 🔴 Endpoint `POST /api/v1/ai/category` — auto-klasyfikacja kategorii
207. ⬜ 🟠 Endpoint `POST /api/v1/ai/seo` — generowanie meta description
208. ⬜ 🟠 Endpoint `POST /api/v1/ai/translate` — PL↔EN (dla turystów)
209. ⬜ 🟠 Endpoint `POST /api/v1/ai/proofread` — sprawdzenie ortografii i stylu
210. ⬜ 🟠 Endpoint `POST /api/v1/ai/fact-check` — sprawdzanie faktów (RAG)
211. ⬜ 🟠 Endpoint `POST /api/v1/ai/image-prompt` — prompty do generowania ilustracji
212. ⬜ 🟠 Endpoint `POST /api/v1/ai/alt-text` — opisy alt dla zdjęć
213. ⬜ 🟠 Streaming responses (Server-Sent Events) dla długich generacji
214. ⬜ 🟡 Token usage tracking (per user, per article)
215. ⬜ 🟡 Cost guard — limit dzienny/miesięczny PLN

### 4.2 Prompts library (216–230)
216. ⬜ 🟠 Prompt: "Artykuł z notki PAP" (input: TXT → output: 600 słów)
217. ⬜ 🟠 Prompt: "Komunikat samorządowy → artykuł"
218. ⬜ 🟠 Prompt: "Raport sportowy Kujawianka" (z wynikiem meczu)
219. ⬜ 🟠 Prompt: "Nekrolog na podstawie informacji rodzinnej"
220. ⬜ 🟠 Prompt: "Wywiad z surowego transcript audio"
221. ⬜ 🟠 Prompt: "Relacja z wydarzenia kulturalnego"
222. ⬜ 🟠 Prompt: "Historia lokalna — research z RAG"
223. ⬜ 🟠 Prompt: "Edukacja — szkoła, konkursy, sukcesy"
224. ⬜ 🟠 Prompt: "Zdrowie — porady na podstawie NFZ"
225. ⬜ 🟠 Prompt: "Środowisko — analiza danych GIOŚ"
226. ⬜ 🟠 Prompt: "Rolnictwo — komunikaty ARiMR"
227. ⬜ 🟠 Prompt: "Newsletter tygodniowy z 10 artykułów"
228. ⬜ 🟡 Prompt: "Social media post z artykułu (FB/X/IG)"
229. ⬜ 🟡 Prompt: "Podcast script z artykułu"
230. ⬜ 🟡 Prompt: "Quiz z artykułu (5 pytań)"

### 4.3 RAG Knowledge Base (231–250)
231. ⬜ 🟠 Dataset historyczny — `rag-historia-izbica.json` (dzieje miasta)
232. ⬜ 🟠 Dataset Wietrzychowice — "Polskie Piramidy" (archeologia)
233. ⬜ 🟠 Dataset społeczność żydowska Izbicy (memoriał)
234. ⬜ 🟠 Dataset Kujawianka (kronika klubu od założenia)
235. ⬜ 🟠 Dataset zabytki gminy (architektura + lokalizacja)
236. ⬜ 🟠 Dataset samorząd (uchwały, budżet 2020-2026)
237. ⬜ 🟠 Dataset rolnictwo (specyfika kujawska, plony, ARiMR)
238. ⬜ 🟠 Dataset osoby zasłużone gminy
239. ⬜ 🟠 Embeddings generation (text-embedding-3-small)
240. ⬜ 🟠 Vector storage — Cloudflare Vectorize lub Pinecone free tier
241. ⬜ 🟠 Cosine similarity search endpoint
242. ⬜ 🟠 Hybrid search (BM25 + cosine) — re-ranking
243. ⬜ 🟠 RAG admin UI — przeglądarka źródeł
244. ⬜ 🟡 Chunk size optimization (256/512/1024 tokens)
245. ⬜ 🟡 Re-indexing CLI command
246. ⬜ 🟡 Citation generator (źródła w artykułach)
247. ⬜ 🟡 Confidence score per odpowiedź
248. ⬜ 🟡 Fallback do web search (DuckDuckGo API)
249. ⬜ 🟢 Chat z RAG — interaktywny widget na `/wiedza`
250. ⬜ 🟢 RAG benchmarks — accuracy testing

### 4.4 n8n workflows (251–280) — istnieje jako tar.gz, do produkcji
251. ⬜ 🟠 VPS Hetzner CX22 — provisioning (Ansible playbook)
252. ⬜ 🟠 Docker compose stack — n8n + 2 workery + Postgres + Redis + Caddy
253. ⬜ 🟠 SSL Let's Encrypt via Caddy
254. ⬜ 🟠 Caddy reverse proxy `n8n.izbica24.pl`
255. ⬜ 🟠 Postgres backup — pg_dump codziennie do R2
256. ⬜ 🟠 Workflow 1: RSS poller — Wikipedia changes (Izbica Kujawska)
257. ⬜ 🟠 Workflow 2: RSS poller — gov.pl ogłoszenia
258. ⬜ 🟠 Workflow 3: RSS poller — Gazeta Pomorska Włocławek
259. ⬜ 🟠 Workflow 4: Facebook Graph API — UM Izbica posty
260. ⬜ 🟠 Workflow 5: Email parser — komunikaty z urzędu (IMAP)
261. ⬜ 🟠 Workflow 6: Pogoda — IMGW API → KV cache
262. ⬜ 🟠 Workflow 7: Ceny paliw — petrol.com.pl scraping
263. ⬜ 🟠 Workflow 8: Awarie energetyczne — Energa API
264. ⬜ 🟠 Workflow 9: Drogi — GDDKiA + ITS
265. ⬜ 🟠 Workflow 10: Kujawianka — Łączą.pl API (wyniki meczów)
266. ⬜ 🟠 Workflow 11: Dyżury aptek — wzpalacz.pl
267. ⬜ 🟠 Workflow 12: Tłumaczenie automatyczne EN/UA newsów
268. ⬜ 🟠 Workflow 13: AI generation — surowy news → artykuł
269. ⬜ 🟠 Workflow 14: AI proofreading przed publikacją
270. ⬜ 🟠 Workflow 15: SEO meta generation
271. ⬜ 🟠 Workflow 16: Cross-posting → FB/X/Telegram
272. ⬜ 🟠 Workflow 17: Newsletter cotygodniowy (poniedziałek 7:00)
273. ⬜ 🟡 Workflow 18: Comment moderation (OpenAI moderation API)
274. ⬜ 🟡 Workflow 19: Spam detection (Bayesian + AI)
275. ⬜ 🟡 Workflow 20: Image generation (Replicate/SDXL dla ilustracji)
276. ⬜ 🟡 Workflow 21: Audio generation — podcast z artykułu (ElevenLabs)
277. ⬜ 🟡 Workflow 22: Video shorts dla TikTok/Reels (Remotion)
278. ⬜ 🟡 Workflow 23: Daily digest dla redakcji (Telegram bot)
279. ⬜ 🟡 Workflow 24: Cost reporting (miesięczny PDF)
280. ⬜ 🟡 Workflow 25: Backup do offsite S3 (Wasabi/Backblaze)

---

## FAZA 5 — Integracje zewnętrzne (281–340) 🟡 P2

### 5.1 Social media (281–300)
281. ⬜ 🟠 Facebook Pages API — cross-posting
282. ⬜ 🟠 Facebook Comments plugin (zamiast custom — opcjonalnie)
283. ⬜ 🟠 Open Graph debugger — test każdego artykułu
284. ⬜ 🟠 X (Twitter) API v2 — autopost
285. ⬜ 🟠 X Cards validator
286. ⬜ 🟠 Instagram Graph API — autopost (wymaga business)
287. ⬜ 🟠 YouTube Data API — embed playlist
288. ⬜ 🟠 TikTok upload API (jeśli dostępne)
289. ⬜ 🟠 Telegram channel `@izbica24` — autopost
290. ⬜ 🟠 Telegram bot `/start` — subskrypcja
291. ⬜ 🟠 Signal — group/channel (opcjonalne)
292. ⬜ 🟠 WhatsApp Business API — newsletter
293. ⬜ 🟡 Discord webhook — autopost
294. ⬜ 🟡 Mastodon `@izbica24@social.kujawy.pl` (federated)
295. ⬜ 🟡 Bluesky AT Protocol
296. ⬜ 🟡 RSS reader integrations (Feedly, Inoreader)
297. ⬜ 🟢 Pinterest auto-pin
298. ⬜ 🟢 LinkedIn Pages (dla biznesowych artykułów)
299. ⬜ 🟢 Reddit auto-post na r/Poland (z moderacją)
300. ⬜ 🟢 Nostr (cenzurooporne — backup)

### 5.2 Analytics (301–315)
301. ⬜ 🔴 Cloudflare Web Analytics — wpięcie skryptu
302. ⬜ 🟠 Plausible (self-hosted lub cloud)
303. ⬜ 🟠 Google Search Console — site verification + sitemap submit
304. ⬜ 🟠 Bing Webmaster Tools
305. ⬜ 🟠 Custom analytics endpoint `/api/v1/analytics/event`
306. ⬜ 🟠 Tracking: page_view, scroll_depth, time_on_page, share_click
307. ⬜ 🟠 Tracking: newsletter_signup, comment_post, article_complete_read
308. ⬜ 🟠 Heatmaps — Cloudflare Turnstile + custom hotjar-like
309. ⬜ 🟡 A/B testing infrastructure (KV-based variants)
310. ⬜ 🟡 Funnel analysis (homepage → category → article → share)
311. ⬜ 🟡 Cohort analysis (returning visitors)
312. ⬜ 🟡 Real-time dashboard (active users now)
313. ⬜ 🟢 Recommendation engine (collaborative filtering)
314. ⬜ 🟢 Predictive analytics (które artykuły będą popularne)
315. ⬜ 🟢 GDPR-compliant consent management (Cookiebot or custom)

### 5.3 Komunikacja zewnętrzna (316–330)
316. ⬜ 🟠 SendGrid / Mailgun / Resend — wybór provider
317. ⬜ 🟠 Transactional emails (welcome, comment notif, password reset)
318. ⬜ 🟠 Newsletter sender (Mailchimp/ConvertKit/własny + SES)
319. ⬜ 🟠 Email templates — MJML + responsive
320. ⬜ 🟠 SPF / DKIM / DMARC records DNS
321. ⬜ 🟠 Email warmup (powolne zwiększanie wolumenu)
322. ⬜ 🟠 Bounce handling + suppression list
323. ⬜ 🟠 Unsubscribe one-click (RFC 8058)
324. ⬜ 🟠 List-Unsubscribe header
325. ⬜ 🟡 SMS notifications (Twilio/Vonage — alerty krytyczne)
326. ⬜ 🟡 Push notifications (web push API + VAPID keys)
327. ⬜ 🟡 Slack webhook (alerty redakcji)
328. ⬜ 🟡 In-app notifications dla zalogowanych
329. ⬜ 🟢 Comment reply notifications (email + push)
330. ⬜ 🟢 "Newsletter daily/weekly" wybór częstotliwości

### 5.4 Payments + monetyzacja (331–340)
331. ⬜ 🟡 Stripe integration — donations
332. ⬜ 🟡 PayPal donate button
333. ⬜ 🟡 Tipping system — autorzy
334. ⬜ 🟡 Patronite link integration
335. ⬜ 🟡 Buy Me a Coffee link
336. ⬜ 🟡 Reklamy — własny ad server (banery)
337. ⬜ 🟢 Google AdSense (jeśli akceptują)
338. ⬜ 🟢 Affiliate links (lokalne firmy)
339. ⬜ 🟢 Premium content (paywall — soft, dla wybranych)
340. ⬜ 🟢 Sponsored articles z disclosure

---

## FAZA 6 — SEO / Performance / Accessibility (341–410) 🟠 P1

### 6.1 SEO Technical (341–365)
341. ⬜ 🔴 Title tag templates per kategorii (60 chars)
342. ⬜ 🔴 Meta description templates (155 chars)
343. ⬜ 🔴 Canonical URLs (każda strona)
344. ⬜ 🔴 Open Graph tags (article, profile, website)
345. ⬜ 🔴 Twitter Cards (summary_large_image)
346. ⬜ 🔴 JSON-LD Article schema (każdy artykuł)
347. ⬜ 🔴 JSON-LD BreadcrumbList
348. ⬜ 🔴 JSON-LD NewsArticle z author + publisher
349. ⬜ 🔴 JSON-LD Organization
350. ⬜ 🟠 JSON-LD Event (kalendarz tygodnia)
351. ⬜ 🟠 JSON-LD Person (autorzy)
352. ⬜ 🟠 JSON-LD FAQPage
353. ⬜ 🟠 JSON-LD HowTo (poradniki)
354. ⬜ 🟠 hreflang dla wersji EN/UA (na przyszłość)
355. ⬜ 🟠 Pagination rel="next"/"prev"
356. ⬜ 🟠 noindex/nofollow dla `/admin/*`, `/api/*`
357. ⬜ 🟠 Mobile-first responsive (Lighthouse > 90)
358. ⬜ 🟠 Structured data testing — Rich Results validator
359. ⬜ 🟠 Internal linking strategy (related articles, tag clouds)
360. ⬜ 🟠 Anchor text optimization
361. ⬜ 🟡 URL structure audit (kategorie + slugi PL)
362. ⬜ 🟡 301 redirects mapping (jeśli zmieniamy strukturę)
363. ⬜ 🟡 404 monitoring + fix
364. ⬜ 🟡 Core Web Vitals — RUM monitoring
365. ⬜ 🟡 Mobile usability errors (GSC alerts)

### 6.2 Performance (366–385)
366. ⬜ 🔴 Cache-Control headers (immutable static, 5min HTML)
367. ⬜ 🔴 Brotli compression (Cloudflare auto)
368. ⬜ 🔴 HTTP/3 + QUIC (Cloudflare auto)
369. ⬜ 🔴 Preload critical fonts (Inter 400, Source Serif 4 400/600)
370. ⬜ 🔴 Preconnect: fonts.googleapis.com, fonts.gstatic.com
371. ⬜ 🔴 Font-display: swap
372. ⬜ 🟠 Subset fonts (tylko PL chars)
373. ⬜ 🟠 Self-host fonts z R2 (zamiast Google CDN)
374. ⬜ 🟠 CSS minification + critical CSS inline
375. ⬜ 🟠 JS minification + tree-shaking (Vite robi)
376. ⬜ 🟠 Code splitting per route
377. ⬜ 🟠 Image optimization (WebP/AVIF + responsive srcset)
378. ⬜ 🟠 Lazy loading wszystkich obrazków poniżej fold
379. ⬜ 🟠 Resource hints (dns-prefetch, prefetch dla next page)
380. ⬜ 🟠 Service Worker — runtime cache strategy
381. ⬜ 🟡 PWA install prompt
382. ⬜ 🟡 Offline page (gdy brak netu)
383. ⬜ 🟡 Bundle size budget (warning > 200kb)
384. ⬜ 🟡 Lighthouse CI w GitHub Actions
385. ⬜ 🟡 WebPageTest weekly audits

### 6.3 Accessibility (386–410)
386. ⬜ 🟠 Semantic HTML5 — landmarks (header, nav, main, aside, footer)
387. ⬜ 🟠 ARIA labels dla buttons + linków bez tekstu
388. ⬜ 🟠 Alt text dla wszystkich obrazków
389. ⬜ 🟠 Keyboard navigation — wszystkie interakcje
390. ⬜ 🟠 Focus indicators (visible outline)
391. ⬜ 🟠 Skip to main content link
392. ⬜ 🟠 Color contrast WCAG AA (4.5:1 dla text)
393. ⬜ 🟠 Form labels + error messages
394. ⬜ 🟠 Heading hierarchy (h1 → h2 → h3, no skip)
395. ⬜ 🟠 Lang attribute (lang="pl")
396. ⬜ 🟠 Reduced motion (prefers-reduced-motion)
397. ⬜ 🟠 Print stylesheet (czytelne wydruki)
398. ⬜ 🟡 Screen reader testing (NVDA + VoiceOver)
399. ⬜ 🟡 Captions dla wideo
400. ⬜ 🟡 Transcripts dla podcastów
401. ⬜ 🟡 Audio descriptions (opcjonalne)
402. ⬜ 🟡 Sign language video dla kluczowych komunikatów
403. ⬜ 🟡 Easy-read version (uproszczony język)
404. ⬜ 🟡 Polski Język Migowy (PJM) — link do tłumacza
405. ⬜ 🟡 Wysokie kontrasty (toggle)
406. ⬜ 🟡 Dyslexia-friendly font option
407. ⬜ 🟢 ARIA live regions dla updates
408. ⬜ 🟢 Modal focus trap
409. ⬜ 🟢 Loading states z aria-busy
410. ⬜ 🟢 WCAG 2.1 AA audit — zewnętrzny

---

## FAZA 7 — Security + GDPR + Legal (411–470) 🔴 P0/P1

### 7.1 Security (411–435)
411. ⬜ 🔴 HTTPS everywhere (Cloudflare auto)
412. ⬜ 🔴 HSTS header (max-age=31536000)
413. ⬜ 🔴 CSP (Content-Security-Policy) — strict
414. ⬜ 🔴 X-Frame-Options: SAMEORIGIN (lub frame-ancestors w CSP)
415. ⬜ 🔴 X-Content-Type-Options: nosniff
416. ⬜ 🔴 Referrer-Policy: strict-origin-when-cross-origin
417. ⬜ 🔴 Permissions-Policy (camera, microphone, geolocation off)
418. ⬜ 🔴 CSRF tokens (per form)
419. ⬜ 🔴 XSS protection — escape wszystkie user inputs
420. ⬜ 🔴 SQL injection — prepared statements (D1 prepare bind)
421. ⬜ 🔴 Rate limiting per IP (KV-based)
422. ⬜ 🔴 Rate limiting per user account
423. ⬜ 🔴 Cloudflare Turnstile — comments + newsletter
424. ⬜ 🔴 Honeypot fields (anti-bot)
425. ⬜ 🟠 Cloudflare WAF rules — custom
426. ⬜ 🟠 Cloudflare Bot Management
427. ⬜ 🟠 IP allowlisting dla `/admin/*`
428. ⬜ 🟠 Audit log każdej akcji admina
429. ⬜ 🟠 Failed login monitoring + alerts
430. ⬜ 🟠 Password policy (min 12 chars, mixed)
431. ⬜ 🟠 Secret rotation (API keys monthly)
432. ⬜ 🟠 Dependencies audit (npm audit weekly)
433. ⬜ 🟡 Penetration testing (zewnętrzne)
434. ⬜ 🟡 Bug bounty program (na security.txt)
435. ⬜ 🟢 SOC2 / ISO27001 framework (na przyszłość)

### 7.2 GDPR / RODO (436–455)
436. ⬜ 🔴 Klauzula informacyjna RODO (`/rodo`)
437. ⬜ 🔴 Cookie consent banner (essential / analytics / marketing)
438. ⬜ 🔴 Cookie policy szczegółowy (`/polityka-cookies`)
439. ⬜ 🔴 Right to access — `/api/v1/gdpr/export`
440. ⬜ 🔴 Right to deletion — `/api/v1/gdpr/delete`
441. ⬜ 🔴 Right to rectification — edit profile
442. ⬜ 🔴 Data Processing Agreement (DPA) — dla podwykonawców
443. ⬜ 🔴 Privacy by design — minimization of data
444. ⬜ 🔴 IP anonymization (last octet → 0 w logach)
445. ⬜ 🔴 Newsletter — double opt-in
446. ⬜ 🔴 Newsletter — consent timestamp + IP w bazie
447. ⬜ 🔴 Newsletter — consent_version (jeśli zmienia się policy)
448. ⬜ 🟠 Comment forms — checkbox zgody
449. ⬜ 🟠 Children — bez konta poniżej 16 lat (KIDS act)
450. ⬜ 🟠 Audit log dla GDPR requests
451. ⬜ 🟠 Data breach notification procedure (72h)
452. ⬜ 🟠 DPO (Data Protection Officer) — kontakt
453. ⬜ 🟡 Rejestr czynności przetwarzania
454. ⬜ 🟡 DPIA (Data Protection Impact Assessment)
455. ⬜ 🟡 Współpraca z UODO (gotowy template odpowiedzi)

### 7.3 Legal (456–470)
456. ⬜ 🔴 Regulamin serwisu (`/regulamin`) — prawnik PL
457. ⬜ 🔴 Polityka prywatności (`/polityka-prywatnosci`) — prawnik PL
458. ⬜ 🔴 Polityka komentarzy (`/regulamin-komentarzy`)
459. ⬜ 🔴 Disclaimer AI — "część treści wygenerowana przez AI, zweryfikowana przez redakcję"
460. ⬜ 🔴 Copyright notice (footer)
461. ⬜ 🔴 Press card autorów
462. ⬜ 🔴 Rejestr dzienników (sąd okręgowy Włocławek)
463. ⬜ 🟠 Stopka redakcyjna (impressum) — wymagana prawem prasowym
464. ⬜ 🟠 Korekta i prostowanie — formularz
465. ⬜ 🟠 Prawo do odpowiedzi (art. 31 PrPr)
466. ⬜ 🟠 Autorytety i źródła — disclosure
467. ⬜ 🟡 Ubezpieczenie OC dziennikarskie
468. ⬜ 🟡 Współpraca z Press Club
469. ⬜ 🟡 Akredytacja prasowa (urząd, KGW, Kujawianka)
470. ⬜ 🟢 Press releases — `/dla-mediow`

---

## FAZA 8 — DevOps / Monitoring / Backup (471–520) 🟠 P1

### 8.1 CI/CD (471–490)
471. ⬜ 🔴 GitHub Actions workflow `.github/workflows/ci.yml`
472. ⬜ 🔴 Lint (ESLint + Prettier check)
473. ⬜ 🔴 Type check (tsc --noEmit)
474. ⬜ 🔴 Build verification
475. ⬜ 🔴 Unit tests (Vitest)
476. ⬜ 🔴 Integration tests (API endpoints)
477. ⬜ 🔴 E2E tests (Playwright)
478. ⬜ 🔴 Lighthouse CI (performance budget)
479. ⬜ 🔴 Wrangler dry-run deploy on PR
480. ⬜ 🔴 Auto-deploy na merge do `main` (production)
481. ⬜ 🔴 Auto-deploy na merge do `staging` (preview env)
482. ⬜ 🟠 Slack/Discord notifications po deploy
483. ⬜ 🟠 Rollback workflow (revert + redeploy)
484. ⬜ 🟠 Migration runner w CI (automatyczne `db:migrate:prod`)
485. ⬜ 🟠 Secret scanning (gitleaks)
486. ⬜ 🟠 Dependency updates (Dependabot/Renovate)
487. ⬜ 🟡 Visual regression testing (Percy/Chromatic)
488. ⬜ 🟡 Performance regression alerts
489. ⬜ 🟡 Bundle size alerts (size-limit)
490. ⬜ 🟢 Code coverage reports (Codecov)

### 8.2 Monitoring + alerting (491–510)
491. ⬜ 🔴 Cloudflare Analytics — wpięty
492. ⬜ 🔴 Uptime monitoring — UptimeRobot lub Better Stack
493. ⬜ 🔴 Status page — `status.izbica24.pl`
494. ⬜ 🔴 Error tracking — Sentry
495. ⬜ 🔴 Log aggregation — Cloudflare Logpush → R2
496. ⬜ 🔴 Performance monitoring — Web Vitals RUM
497. ⬜ 🟠 D1 query performance — slow query log
498. ⬜ 🟠 R2 usage monitoring (storage + bandwidth)
499. ⬜ 🟠 KV usage monitoring (reads/writes)
500. ⬜ 🟠 Workers CPU time monitoring (alert > 10ms p99)
501. ⬜ 🟠 Cost monitoring — Cloudflare bill + AI providers
502. ⬜ 🟠 Alert: 5xx errors > 1% — Telegram
503. ⬜ 🟠 Alert: response time p99 > 1s — Telegram
504. ⬜ 🟠 Alert: D1 errors — Slack/Email
505. ⬜ 🟠 Alert: AI cost > 80% miesięcznego limitu
506. ⬜ 🟡 Synthetic monitoring (Playwright runner)
507. ⬜ 🟡 RUM percentiles dashboard
508. ⬜ 🟡 Custom Grafana (jeśli logi → InfluxDB)
509. ⬜ 🟢 Anomaly detection (ML-based)
510. ⬜ 🟢 SLO dashboard (availability 99.9%, latency)

### 8.3 Backup + Disaster Recovery (511–520)
511. ⬜ 🔴 D1 daily backup (wrangler d1 export → R2)
512. ⬜ 🔴 D1 weekly snapshot → offsite (Wasabi)
513. ⬜ 🔴 R2 cross-region replication
514. ⬜ 🔴 KV backup (per namespace export)
515. ⬜ 🔴 Git → GitHub (już jest) + GitLab mirror
516. ⬜ 🟠 Restore procedure — udokumentowana + przetestowana
517. ⬜ 🟠 RTO (Recovery Time Objective) — 4h
518. ⬜ 🟠 RPO (Recovery Point Objective) — 24h
519. ⬜ 🟡 DR drill — kwartalne testy
520. ⬜ 🟡 Multi-region failover (Workers global by default — OK)

---

## FAZA 9 — Treść + Launch (521–570) 🟠 P1

### 9.1 Content seed (521–545)
521. ⬜ 🟠 50 artykułów historycznych Izbicy (z istniejących źródeł)
522. ⬜ 🟠 30 artykułów o Wietrzychowicach (Polskie Piramidy)
523. ⬜ 🟠 20 artykułów o społeczności żydowskiej
524. ⬜ 🟠 100 artykułów aktualnych (3 tygodnie produkcji n8n)
525. ⬜ 🟠 50 sylwetek mieszkańców
526. ⬜ 🟠 30 wywiadów z lokalnymi liderami
527. ⬜ 🟠 200 wpisów kalendarza wydarzeń (kwartał)
528. ⬜ 🟠 100 zdjęć archiwalnych Izbicy (digitalizacja)
529. ⬜ 🟠 50 fotek Wietrzychowic + drone
530. ⬜ 🟠 100 fotek z meczów Kujawianki
531. ⬜ 🟠 20 wideo (montaż z FB UM Izbica)
532. ⬜ 🟠 10 odcinków podcastu "Głos Izbicy"
533. ⬜ 🟠 5 infografik (budżet gminy, demografia, etc.)
534. ⬜ 🟠 Mapa interaktywna gminy (Leaflet + dane GIS)
535. ⬜ 🟠 Lista sołectw + radni + sołtysi
536. ⬜ 🟠 Katalog 100 lokalnych firm (z opt-in)
537. ⬜ 🟠 Galeria zabytków (architektura + opisy)
538. ⬜ 🟠 Słownik gwarowy kujawski (50 słów)
539. ⬜ 🟡 Przepisy kulinarne kujawskie (KGW)
540. ⬜ 🟡 Tradycje (kolędowanie, dożynki, odpust)
541. ⬜ 🟡 Trasy turystyczne i rowerowe
542. ⬜ 🟡 Lista sportowców z gminy (Kujawianka + inni)
543. ⬜ 🟢 Quizy o Izbicy (history, geografia)
544. ⬜ 🟢 Mini-gry edukacyjne dla dzieci
545. ⬜ 🟢 Mapa "miejsca filmowe" (jeśli kręcono)

### 9.2 Pre-launch (546–560)
546. ⬜ 🔴 Domena `izbica24.pl` — zakup + DNS na Cloudflare
547. ⬜ 🔴 SSL aktywny (Cloudflare Universal SSL)
548. ⬜ 🔴 DNS records: A/AAAA/CNAME/MX/TXT (SPF/DKIM/DMARC)
549. ⬜ 🔴 Subdomeny: www, api, media, status, n8n
550. ⬜ 🔴 Page Rules / Configuration Rules
551. ⬜ 🔴 Workers Routes
552. ⬜ 🔴 Beta test — 20 zaproszonych mieszkańców (feedback)
553. ⬜ 🔴 Fix krytycznych bugów z bety
554. ⬜ 🟠 Press release (lokalne media)
555. ⬜ 🟠 Spot wideo (30s — TVK / FB Ads)
556. ⬜ 🟠 Plakaty A2 w urzędzie + szkołach + KGW
557. ⬜ 🟠 Ulotki — 1000 szt. w skrzynkach
558. ⬜ 🟠 Spotkanie launchowe (MGCK, otwarte)
559. ⬜ 🟡 Partnerstwa — UM, parafia, OSP, Kujawianka
560. ⬜ 🟡 Akredytacje — sesje rady, mecze, kościół

### 9.3 Launch + post-launch (561–570)
561. ⬜ 🔴 D-Day launch — 1 lipca 2026 (planowane)
562. ⬜ 🔴 24h monitoring on-call
563. ⬜ 🔴 Press release distribution
564. ⬜ 🔴 Social media announcement (FB, X, Telegram)
565. ⬜ 🟠 Reklama Google Ads (lokalna)
566. ⬜ 🟠 Reklama FB Ads (geo-targeted Izbica)
567. ⬜ 🟠 Tydzień intensywnej produkcji treści (codziennie 10+ artykułów)
568. ⬜ 🟡 Analiza pierwszych 30 dni
569. ⬜ 🟡 Iteracja na podstawie feedbacku
570. ⬜ 🟡 Roadmap Q4 2026

---

## FAZA 10 — Long-term roadmap (571–590) 🟢 P3

### 10.1 Expansion (571–585)
571. ⬜ 🟢 Wersja EN — dla turystów + diaspory
572. ⬜ 🟢 Wersja UA — dla uchodźców
573. ⬜ 🟢 Mobile app (React Native / Flutter)
574. ⬜ 🟢 Smart speaker briefings (Alexa, Google Home)
575. ⬜ 🟢 Watch face dla Apple Watch / Wear OS
576. ⬜ 🟢 Newsletter premium (subskrypcja 10 PLN/mc)
577. ⬜ 🟢 Audiobooki artykułów (TTS ElevenLabs)
578. ⬜ 🟢 NFT historyczne (numered series Izbica heritage)
579. ⬜ 🟢 VR/AR — wirtualny spacer Wietrzychowice
580. ⬜ 🟢 Marketplace ogłoszeń (płatne)
581. ⬜ 🟢 Lokalna giełda pracy
582. ⬜ 🟢 Crowdsourcing dziennikarstwa (mieszkańcy reporterzy)
583. ⬜ 🟢 Citizen journalism platform
584. ⬜ 🟢 Live streaming sesji rady (YouTube + embed)
585. ⬜ 🟢 Aukcje charytatywne na portalu

### 10.2 AI Frontier (586–590)
586. ⬜ 🟢 Agent AI — autonomous reporter (z fact-checkingiem)
587. ⬜ 🟢 Voice AI — telefoniczny "Asystent izbica24" (dla starszych)
588. ⬜ 🟢 Predictive content — co warto napisać w danym dniu
589. ⬜ 🟢 AI-generated podcasts (NotebookLM-style)
590. ⬜ 🟢 Federated learning z innymi portalami lokalnymi (model PL)

---

## 📊 Statystyki listy

| Faza | Zadań | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|-----|
| 1. Cloudflare Prototype | 60 | ~30 | ~20 | ~10 | — |
| 2. D1 + KV + R2 | 70 | ~40 | ~25 | ~5 | — |
| 3. Auth + Admin Panel | 70 | ~8 | ~50 | ~12 | — |
| 4. AI / Newsroom | 80 | ~5 | ~55 | ~20 | — |
| 5. Integracje | 60 | ~1 | ~30 | ~25 | ~4 |
| 6. SEO/Perf/A11y | 70 | ~15 | ~35 | ~20 | — |
| 7. Security/GDPR/Legal | 60 | ~35 | ~20 | ~5 | — |
| 8. DevOps/Monitoring | 50 | ~20 | ~25 | ~5 | — |
| 9. Treść + Launch | 50 | ~10 | ~30 | ~10 | — |
| 10. Long-term | 20 | — | — | — | ~20 |
| **TOTAL** | **590** | **~164** | **~290** | **~112** | **~24** |

## 🎯 Rekomendowana sekwencja realizacji

**Sprint 1 — 2 tygodnie (zadania ~150 sztuk)**:
- Faza 1 (60) — domknięcie prototypu
- Faza 2 części 2.1–2.2 (~35) — D1 produkcyjny + KV
- Faza 6 części 6.1 (25) — SEO podstawy
- Faza 7 części 7.1–7.2 (30) — security + GDPR base

**Sprint 2 — 3 tygodnie (zadania ~180 sztuk)**:
- Faza 2 reszta — R2 + FTS5 (35)
- Faza 3 — Admin Panel (70)
- Faza 4 części 4.1–4.2 — AI core (30)
- Faza 8 części 8.1 — CI/CD (20)
- Faza 7 części 7.3 — Legal (15)

**Sprint 3 — 3 tygodnie (zadania ~150 sztuk)**:
- Faza 4 reszta — RAG + n8n (50)
- Faza 5 — Integracje (60)
- Faza 8 reszta — monitoring + backup (30)
- Faza 6 reszta — perf + a11y (10)

**Sprint 4 — 2 tygodnie (zadania ~110 sztuk)**:
- Faza 9 — content seed + launch (50)
- Pozostałe P0/P1 (40)
- Faza 10 — początki (20)

**Total: 10 tygodni do launchu** (1 lipca 2026).
