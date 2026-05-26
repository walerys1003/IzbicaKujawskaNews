# 📋 izbica24.pl — Pełny AUDYT 590 zadań (stan na 2026-05-26)

**Metodologia**: audyt oparty na analizie kodu źródłowego (268 plików w `src/`, 51 migracji, 30 n8n workflowów, 20 dokumentów, 19 testów). Każde zadanie zweryfikowane przez sprawdzenie istnienia implementacji w repozytorium.

**Legenda statusu**:
- ✅ DONE — implementacja istnieje w kodzie
- ✅ STUB — istnieje szkielet/mock, ale brak pełnej implementacji
- 🟡 PARTIAL — częściowo zrobione
- ⬜ TODO — brak implementacji

**Legenda priorytetu**:
- 🔴 P0 — krytyczne
- 🟠 P1 — wysokie
- 🟡 P2 — średnie
- 🟢 P3 — niskie

---

## 📊 PODSUMOWANIE AUDYTU

| Status | Liczba | % |
|--------|--------|---|
| ✅ DONE (pełna implementacja) | ~195 | 33% |
| ✅ STUB (szkielet/mock) | ~135 | 23% |
| 🟡 PARTIAL (częściowe) | ~60 | 10% |
| ⬜ TODO (brak) | ~200 | 34% |

**Kluczowe wnioski**:
- Kod kompiluje się poprawnie (Vite build: 246 modułów, 409 KB, 2s)
- 268 plików źródłowych, 51 migracji D1, 30 n8n workflowów, 20 dokumentów
- **Główny problem**: wiele endpointów używa mock data (`data-articles.ts` zamiast D1)
- Admin panel ma UI ale używa hardcoded mockowych danych
- Brak plików CI/CD w `.github/workflows/`
- Push/Search/Newsletter — istnieją jako oddzielne sub-routery ale NIE są podpięte do głównej aplikacji

---

## FAZA 1 — Domknięcie prototypu Cloudflare Pages (zadania 1–60) 🔴 P0

### 1.1 Routing & strony — uzupełnienia (1–15)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 1 | `/wiadomosci/inwestycje` | ✅ STUB | 🔴 P0 | Kategoria w CATEGORIES_MAP, dynamiczny routing `/:cat` obsługuje wszystkie kategorie |
| 2 | `/wiadomosci/edukacja` | ✅ STUB | 🔴 P0 | j.w. — kategoria zdefiniowana w data-articles.ts |
| 3 | `/wiadomosci/zdrowie` | ✅ STUB | 🔴 P0 | j.w. |
| 4 | `/wiadomosci/spoleczne` | ✅ STUB | 🔴 P0 | j.w. |
| 5 | `/wiadomosci/komunikaty` | ✅ STUB | 🔴 P0 | j.w. |
| 6 | `/wiadomosci/srodowisko` | ✅ STUB | 🔴 P0 | j.w. |
| 7 | `/wiadomosci/rolnictwo` | ✅ STUB | 🔴 P0 | j.w. |
| 8 | `/na-sygnale` | ✅ STUB | 🟠 P1 | Kategoria w CATEGORIES_MAP, komponent NaSygnaleFull istnieje w home.tsx |
| 9 | `/na-sygnale/*` (5 podkategorii) | ✅ STUB | 🟠 P1 | Obsługiwane przez `/:cat` catch-all route |
| 10 | `/ludzie` | ✅ STUB | 🟠 P1 | Komponent Ludzie w home.tsx, kategoria zdefiniowana |
| 11 | `/zycie` | ✅ STUB | 🟠 P1 | Komponent ZycieCodzienne w home.tsx |
| 12 | `/przeglad` | ⬜ TODO | 🟠 P1 | Brak dedykowanej strony/kategorii |
| 13 | `/multimedia` | ✅ STUB | 🟠 P1 | Komponent Multimedia w home.tsx, trasy media/v1 istnieją |
| 14 | `/ogloszenia` | ✅ STUB | 🟠 P1 | Komponent Ogloszenia w home.tsx, admin ma Ogloszenia panel |
| 15 | `/tag/:slug` | ⬜ TODO | 🟡 P2 | Brak implementacji tag pages |

### 1.2 Strony statyczne (16–30)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 16 | `/o-portalu` | ⬜ TODO | 🔴 P0 | Brak trasy — tylko `/o-nas` (about) istnieje |
| 17 | `/redakcja` | ✅ DONE | 🔴 P0 | `src/routes/public/redakcja.ts` + `RedakcjaPage.tsx` |
| 18 | `/kontakt` | ✅ DONE | 🔴 P0 | `src/routes/public/contact.ts` + `ContactPage.tsx` |
| 19 | `/reklama` | ✅ DONE | 🟠 P1 | `src/routes/public/reklama.ts` + `SimpleInfoPage.tsx` |
| 20 | `/dolacz` | ⬜ TODO | 🟠 P1 | Brak trasy |
| 21 | `/mapa-strony` | ⬜ TODO | 🟠 P1 | Brak trasy |
| 22 | `/telefony` | ⬜ TODO | 🟠 P1 | Brak trasy |
| 23 | `/linki` | ⬜ TODO | 🟠 P1 | Brak trasy |
| 24 | `/regulamin` | ✅ DONE | 🔴 P0 | `src/routes/public/regulamin.ts` + `RegulaminPage.tsx` |
| 25 | `/polityka-prywatnosci` | ✅ DONE | 🔴 P0 | `src/routes/public/privacy.ts` + `PrivacyPage.tsx` |
| 26 | `/rodo` | ⬜ TODO | 🔴 P0 | Brak dedykowanej trasy |
| 27 | `/polityka-cookies` | ✅ DONE | 🟠 P1 | `src/routes/public/cookies-policy.ts` |
| 28 | `/faq` | ⬜ TODO | 🟡 P2 | Brak trasy |
| 29 | `/pomoc` | ⬜ TODO | 🟡 P2 | Brak trasy |
| 30 | `/sponsorzy` | ⬜ TODO | 🟢 P3 | Brak trasy |

### 1.3 Komponenty UI — dokończenie (31–45)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 31 | `<Comments />` | 🟡 PARTIAL | 🟠 P1 | Brak dedykowanego komponentu; `CommentsList.tsx` istnieje w admin, ale nie ma frontowego komponentu komentarzy |
| 32 | `<CommentForm />` | ⬜ TODO | 🟠 P1 | Brak komponentu |
| 33 | `<ShareModal />` | ⬜ TODO | 🟠 P1 | Brak komponentu |
| 34 | `<Newsletter />` | 🟡 PARTIAL | 🟠 P1 | `NewsletterInline` istnieje w home-v2.tsx, `NewslettersList` w admin |
| 35 | `<SearchModal />` | ⬜ TODO | 🟠 P1 | Brak SearchModal; `SearchPage` + `search.tsx` istnieją jako strona, nie modal |
| 36 | `<Breadcrumb />` / `<Breadcrumbs />` | ✅ DONE | 🟠 P1 | `src/components/common/Breadcrumbs.tsx` |
| 37 | `<Pagination />` | ✅ DONE | 🟡 P2 | `src/components/common/Pagination.tsx` + admin Pagination |
| 38 | `<AuthorCard />` | ⬜ TODO | 🟡 P2 | Brak komponentu |
| 39 | `<RelatedArticles />` | ⬜ TODO | 🟡 P2 | Brak komponentu |
| 40 | `<TableOfContents />` | ⬜ TODO | 🟡 P2 | Brak komponentu |
| 41 | `<ReadingProgress />` | ⬜ TODO | 🟡 P2 | Brak komponentu |
| 42 | `<ScrollToTop />` | ⬜ TODO | 🟡 P2 | Brak komponentu |
| 43 | `<DarkModeToggle />` | ⬜ TODO | 🟢 P3 | Brak komponentu |
| 44 | `<FontSizeToggle />` | ⬜ TODO | 🟢 P3 | Brak komponentu |
| 45 | `<PrintButton />` | ⬜ TODO | 🟢 P3 | Brak komponentu |

### 1.4 Frontend JavaScript (46–60)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 46 | ES modules refaktoryzacja | ✅ DONE | 🟠 P1 | `v3-app.js` (8.5KB) — zmodularyzowany JS |
| 47 | Search modal + keyboard shortcuts | 🟡 PARTIAL | 🟠 P1 | `search.js` istnieje (4KB), ale brak Ctrl+K |
| 48 | Newsletter form fetch | 🟡 PARTIAL | 🟠 P1 | Kod w `app.js`/`v3-app.js` — częściowo |
| 49 | Comment form | ⬜ TODO | 🟠 P1 | Brak frontendowego formularza komentarzy |
| 50 | Share buttons Web Share API | ⬜ TODO | 🟠 P1 | Brak |
| 51 | Reading progress bar | ⬜ TODO | 🟠 P1 | Brak |
| 52 | Scroll-to-top | ⬜ TODO | 🟠 P1 | Brak |
| 53 | Lazy loading obrazów | 🟡 PARTIAL | 🟡 P2 | Częściowe — `loading="lazy"` na obrazkach w article.tsx |
| 54 | Lightbox dla galerii | ✅ STUB | 🟡 P2 | `gallery.js` (647B) + `Lightbox.tsx` komponent, ale minimalna implementacja |
| 55 | Embed handlers (YouTube/Vimeo/Twitter) | ⬜ TODO | 🟡 P2 | Brak lazy embed handlera |
| 56 | Mobile menu hamburger | 🟡 PARTIAL | 🟡 P2 | Fragmenty w `app.js` i `layout.tsx` |
| 57 | Dropdown menu keyboard nav | ⬜ TODO | 🟡 P2 | Brak |
| 58 | Service Worker PWA | ✅ DONE | 🟢 P3 | `public/static/sw.js` + `public/sw.js` |
| 59 | Notification API | ✅ STUB | 🟢 P3 | `push-client.js` istnieje, ale niepodpięte |
| 60 | Theme switcher localStorage | ⬜ TODO | 🟢 P3 | Brak |

---

## FAZA 2 — Cloudflare D1 + KV + R2 produkcja (61–130) 🔴 P0

### 2.1 D1 — utworzenie i podpięcie (61–80)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 61 | setup_cloudflare_api_key | ⬜ TODO | 🔴 P0 | Brak — wymaga rzeczywistego klucza API CF |
| 62 | `wrangler d1 create` | ⬜ TODO | 🔴 P0 | Wymaga produkcji — lokalnie działa przez wrangler.jsonc |
| 63 | Skopiowanie `database_id` | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 64 | Aktualizacja `wrangler.jsonc` | ✅ DONE | 🔴 P0 | Wrangler config istnieje |
| 65 | Migrations apply local | ✅ DONE | 🔴 P0 | 51 plików migracji istnieje |
| 66 | Seed data | ✅ DONE | 🔴 P0 | `seed.sql` + `seed-dev.ts` + `0009_seed_demo_articles.sql` (37KB!) |
| 67 | Migracja FTS5 | ✅ DONE | 🔴 P0 | `0005_fts_articles.sql`, `0021_fts_articles.sql`, `0027_fts_triggers_articles.sql` |
| 68 | Migracja analytics | ✅ DONE | 🔴 P0 | `0030_analytics.sql` |
| 69 | Migracja media | ✅ DONE | 🟠 P1 | `0011_media_assets.sql`, `0056_media_assets.sql`, `0057_media_uses.sql` |
| 70 | Migracja authors_profile | ✅ STUB | 🟠 P1 | `0001_users.sql` istnieje, ale profile autorów są w mock data |
| 71 | Migracja categories_hierarchy | ✅ DONE | 🟠 P1 | `0003_categories.sql` + `0003_seed_categories.sql` (8.8KB) |
| 72 | Migracja settings | ✅ DONE | 🟠 P1 | Settings model w `src/db/models/settings.ts` |
| 73 | Migracja audit_log | ✅ DONE | 🟠 P1 | `0015_admin_logs.sql`, model `audit-log.ts` |
| 74 | Migracja redirects | ✅ DONE | 🟠 P1 | `0017_redirects.sql` |
| 75 | Refactor data-articles → repository | ⬜ TODO | 🔴 P0 | **KRYTYCZNE** — API nadal używa `data-articles.ts` (mock data) zamiast D1 |
| 76 | Refactor api/v1 → D1 | ⬜ TODO | 🔴 P0 | **KRYTYCZNE** — wszystkie endpointy używają `ARTICLES` z mocków |
| 77 | Repository layer | 🟡 PARTIAL | 🔴 P0 | Modele D1 istnieją (`src/db/models/`), ale nie są podpięte do API |
| 78 | Migration runner script | ✅ DONE | 🟠 P1 | `scripts/migrate.sh` |
| 79 | Backup script | ✅ DONE | 🟠 P1 | `scripts/db-export.sh` + `src/lib/backup/d1-export.ts` |
| 80 | D1 console aliases | ⬜ TODO | 🟡 P2 | Brak |

### 2.2 KV Namespace (81–95)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 81 | `wrangler kv:namespace create` | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 82 | KV preview namespace | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 83 | Dodanie do `wrangler.jsonc` | ✅ DONE | 🔴 P0 | Typy KV w env.ts (14 namespace'ów) |
| 84 | KV cache dla artykułów | ✅ STUB | 🔴 P0 | `src/lib/kv/cache-pages.ts` istnieje, ale nieużywane w API |
| 85 | KV rate limiting | ✅ DONE | 🔴 P0 | `src/lib/kv/rate-limit-store.ts` + `src/routes/auth/middleware/rate-limit.ts` |
| 86 | KV session tokens | ✅ DONE | 🟠 P1 | `src/lib/kv/session-store.ts` |
| 87 | KV feature flags | ✅ DONE | 🟠 P1 | `src/lib/kv/feature-flags.ts` |
| 88 | KV newsletter unsubscribe | 🟡 PARTIAL | 🟠 P1 | Newsletter model istnieje, ale unsubscribe tokens nie są w KV |
| 89 | KV cache pogody | ✅ DONE | 🟠 P1 | `src/lib/kv/weather-cache.ts` |
| 90 | KV cache cen paliw | ✅ DONE | 🟠 P1 | `src/lib/kv/fuel-cache.ts` |
| 91 | KV cache RSS | ✅ STUB | 🟠 P1 | Brak dedykowanego modułu, można użyć cache-pages |
| 92 | KV heatmap clicks | ⬜ TODO | 🟡 P2 | Brak |
| 93 | KV A/B test assignment | ✅ DONE | 🟡 P2 | `src/lib/kv/ab-tests.ts` |
| 94 | KV cleanup cron | ⬜ TODO | 🟡 P2 | Brak |
| 95 | KV admin UI | ⬜ TODO | 🟢 P3 | Brak |

### 2.3 R2 Storage (96–115)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 96 | R2 bucket media | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 97 | R2 bucket backups | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 98 | Custom domain media | ⬜ TODO | 🔴 P0 | Wymaga DNS |
| 99 | R2 CORS policy | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 100 | Upload handler presigned URL | ✅ STUB | 🔴 P0 | `src/routes/v1/media-upload.ts` + `src/lib/media/r2-upload.ts` |
| 101 | Image processing pipeline | ✅ STUB | 🔴 P0 | `src/lib/media/image-resize.ts` + `src/lib/media/image-variants.ts` |
| 102 | WebP + AVIF conversion | ✅ STUB | 🔴 P0 | `src/lib/media/webp-fallback.ts` |
| 103 | Chunked upload dla wideo | ⬜ TODO | 🟠 P1 | Brak |
| 104 | R2 Lifecycle rule | ⬜ TODO | 🟠 P1 | Wymaga produkcji |
| 105 | Multi-format response (Accept: image/avif) | ✅ STUB | 🟠 P1 | webp-fallback.ts framework |
| 106 | Watermark overlay | ⬜ TODO | 🟠 P1 | Brak |
| 107 | EXIF stripping | ✅ DONE | 🟠 P1 | `src/lib/media/image-metadata.ts` |
| 108 | Image alt-text generator | ✅ DONE | 🟠 P1 | `src/lib/media/alt-text-ai.ts` |
| 109 | PDF storage | ✅ STUB | 🟠 P1 | R2 bucket `R2_PDF_ARCHIVE` zdefiniowany |
| 110 | Audio storage | ✅ STUB | 🟠 P1 | `src/routes/v1/audio-upload.ts` + R2_PODCAST_AUDIO |
| 111 | Video storage + HLS | ✅ STUB | 🟠 P1 | `src/lib/media/video-transcode.ts` + `video-upload.ts` |
| 112 | Backup DB → R2 | ✅ DONE | 🟡 P2 | `src/lib/backup/r2-snapshot.ts` |
| 113 | Sitemap.xml backup do R2 | ⬜ TODO | 🟡 P2 | Brak |
| 114 | R2 → Cloudflare Stream | ⬜ TODO | 🟢 P3 | Brak |
| 115 | R2 → Cloudflare Pages Functions | ⬜ TODO | 🟢 P3 | Brak |

### 2.4 D1 + FTS5 search (116–130)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 116 | Trigger articles → articles_fts | ✅ DONE | 🔴 P0 | `0027_fts_triggers_articles.sql` |
| 117 | Search endpoint refactor FTS5 | ✅ DONE | 🔴 P0 | `src/lib/search/fts-articles.ts` + `global-search.ts` |
| 118 | Stemming polski | ✅ DONE | 🔴 P0 | `src/lib/search/polish-stemmer.ts` |
| 119 | Stop words PL | 🟡 PARTIAL | 🟠 P1 | W `0028_fts_synonyms.sql` |
| 120 | Highlighting wyników | ✅ DONE | 🟠 P1 | `src/lib/search/highlight.ts` |
| 121 | Fuzzy matching | 🟡 PARTIAL | 🟠 P1 | `src/lib/search/spell-suggest.ts` |
| 122 | Search suggestions | ✅ DONE | 🟠 P1 | `src/lib/kv/search-suggestions.ts` |
| 123 | Search analytics | ✅ DONE | 🟠 P1 | `src/lib/search/search-analytics.ts` |
| 124 | "Did you mean" | ✅ DONE | 🟡 P2 | `spell-suggest.ts` + `/api/v1/search/spell-check` (w search/index.ts) |
| 125 | Filter by date range | 🟡 PARTIAL | 🟡 P2 | W `search/index.ts` — `/advanced` endpoint |
| 126 | Filter by category multiselect | 🟡 PARTIAL | 🟡 P2 | W `/advanced` |
| 127 | Filter by author | 🟡 PARTIAL | 🟡 P2 | W `/advanced` |
| 128 | Sort by relevance/date/popularity | 🟡 PARTIAL | 🟡 P2 | W `/advanced` |
| 129 | Semantic search | ⬜ TODO | 🟢 P3 | Brak Vectorize/Pinecone integracji |
| 130 | RAG endpoint produkcyjny | 🟡 PARTIAL | 🟢 P3 | 20 endpointów RAG istnieje, ale na mock data |

---

## FAZA 3 — Autoryzacja redakcyjna + Admin Panel (131–200) 🟠 P1

### 3.1 Auth system (131–150)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 131 | Tabela users rozbudowa | ✅ DONE | 🔴 P0 | `0001_users.sql` + `src/db/models/users.ts` |
| 132 | POST login | ✅ DONE | 🔴 P0 | `src/routes/auth/login.ts` |
| 133 | POST logout | ✅ DONE | 🔴 P0 | `src/routes/auth/logout.ts` |
| 134 | POST refresh | ✅ DONE | 🔴 P0 | `src/routes/auth/refresh.ts` |
| 135 | JWT signing hono/jwt | ✅ DONE | 🔴 P0 | Używane w auth middleware |
| 136 | Refresh token w KV | ✅ DONE | 🔴 P0 | W session-store.ts + refresh.ts |
| 137 | Middleware auth | ✅ DONE | 🔴 P0 | `src/routes/auth/middleware/require-auth.ts` |
| 138 | Middleware roles | ✅ DONE | 🔴 P0 | `src/routes/auth/middleware/require-role.ts` |
| 139 | Forgot password | ✅ DONE | 🟠 P1 | `src/routes/auth/reset-password.ts` (token-based) |
| 140 | Reset password | ✅ DONE | 🟠 P1 | j.w. |
| 141 | Register + email verify | ✅ DONE | 🟠 P1 | `src/routes/auth/register.ts` + `verify-email.ts` |
| 142 | Verify email | ✅ DONE | 🟠 P1 | `src/routes/auth/verify-email.ts` |
| 143 | 2FA TOTP | ✅ DONE | 🟠 P1 | `src/routes/auth/2fa-enable.ts` + `2fa-verify.ts` |
| 144 | Account lockout | 🟡 PARTIAL | 🟠 P1 | Rate limit middleware istnieje, ale brak pełnego lockoutu |
| 145 | Password strength meter | ⬜ TODO | 🟠 P1 | Brak (wymaga JS po stronie klienta) |
| 146 | OAuth Google | ✅ DONE | 🟡 P2 | `src/routes/auth/social-google.ts` |
| 147 | OAuth Facebook | ✅ DONE | 🟡 P2 | `src/routes/auth/social-facebook.ts` |
| 148 | Magic link login | ✅ DONE | 🟡 P2 | `src/routes/auth/magic-link.ts` |
| 149 | Session management | ✅ DONE | 🟡 P2 | `src/routes/auth/sessions.ts` |
| 150 | SSO via SAML | ⬜ TODO | 🟢 P3 | Brak |

### 3.2 Admin Panel UI (151–185)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 151 | `/admin/login` | ⬜ TODO | 🟠 P1 | Brak dedykowanej strony logowania — jest tylko JWT middleware |
| 152 | `/admin` dashboard | ✅ STUB | 🟠 P1 | ✅ UI istnieje: DashboardCards z KPI, ale dane mockowe |
| 153 | `/admin/articles` | ✅ STUB | 🟠 P1 | ArticlesList + FilterBar — dane mockowe |
| 154 | `/admin/articles/new` | ✅ STUB | 🟠 P1 | ArticleForm z Tiptap CDN, mockowe dane |
| 155 | `/admin/articles/:id/edit` | ✅ STUB | 🟠 P1 | j.w. |
| 156 | `/admin/articles/:id/preview` | ⬜ TODO | 🟠 P1 | Brak |
| 157 | `/admin/categories` | ⬜ TODO | 🟠 P1 | Brak dedykowanej strony (jest w settings) |
| 158 | `/admin/tags` | ⬜ TODO | 🟠 P1 | Brak |
| 159 | `/admin/comments` | ✅ STUB | 🟠 P1 | CommentsList z mock data |
| 160 | `/admin/newsletter` | ✅ STUB | 🟠 P1 | NewslettersList w /admin/settings, mock data |
| 161 | `/admin/newsletter/campaigns` | ⬜ TODO | 🟠 P1 | Brak |
| 162 | `/admin/users` | ✅ STUB | 🟠 P1 | UsersList + UserForm — mock data |
| 163 | `/admin/users/:id` | ✅ STUB | 🟠 P1 | j.w. |
| 164 | `/admin/media` | ✅ STUB | 🟠 P1 | MediaGallery + MediaUploader — mock data |
| 165 | `/admin/media/upload` | ✅ STUB | 🟠 P1 | MediaUploader istnieje |
| 166 | `/admin/analytics` | ⬜ TODO | 🟠 P1 | Brak |
| 167 | `/admin/seo` | ⬜ TODO | 🟡 P2 | Brak |
| 168 | `/admin/redirects` | ⬜ TODO | 🟡 P2 | Brak |
| 169 | `/admin/queue` | ⬜ TODO | 🟡 P2 | Brak |
| 170 | `/admin/prompts` | ⬜ TODO | 🟡 P2 | Brak |
| 171 | `/admin/alerts` | ⬜ TODO | 🟡 P2 | Brak |
| 172 | `/admin/events` | ✅ STUB | 🟡 P2 | EventsList w admin |
| 173 | `/admin/audit-log` | ⬜ TODO | 🟡 P2 | Brak |
| 174 | `/admin/settings` | ✅ STUB | 🟡 P2 | SettingsForm — mock data |
| 175 | `/admin/settings/seo` | ⬜ TODO | 🟡 P2 | Brak |
| 176 | `/admin/settings/social` | ⬜ TODO | 🟡 P2 | Brak |
| 177 | `/admin/settings/integrations` | ⬜ TODO | 🟡 P2 | Brak |
| 178 | `/admin/settings/billing` | ⬜ TODO | 🟡 P2 | Brak |
| 179 | `/admin/profile` | ⬜ TODO | 🟢 P3 | Brak |
| 180 | `/admin/notifications` | ⬜ TODO | 🟢 P3 | Brak |
| 181 | Sidebar admin collapsible | ✅ STUB | 🟢 P3 | AdminSidebar.tsx istnieje (925B) — podstawowy |
| 182 | Topbar admin | ✅ STUB | 🟢 P3 | AdminTopbar.tsx istnieje (670B) |
| 183 | Dark mode admin | ⬜ TODO | 🟢 P3 | Brak |
| 184 | Keyboard shortcuts admin | ⬜ TODO | 🟢 P3 | Brak |
| 185 | Onboarding tour | ⬜ TODO | 🟢 P3 | Brak |

### 3.3 WYSIWYG Editor (186–200)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 186 | Wybór edytora | ✅ DONE | 🟠 P1 | Tiptap (CDN) — używany w ArticleForm |
| 187 | Bloki podstawowe | ✅ DONE | 🟠 P1 | W Tiptap (heading, paragraph, list, blockquote) |
| 188 | Image embed z R2 | ✅ STUB | 🟠 P1 | MediaUploader + MediaGallery w admin |
| 189 | Embed YouTube/Vimeo/Twitter | ⬜ TODO | 🟠 P1 | Brak dedykowanych bloków |
| 190 | Callout blocks | ⬜ TODO | 🟠 P1 | Brak |
| 191 | Gallery block | ⬜ TODO | 🟠 P1 | Brak |
| 192 | Divider/button/CTA | ✅ STUB | 🟠 P1 | Podstawowe w Tiptap |
| 193 | Table block | ⬜ TODO | 🟠 P1 | Brak |
| 194 | Poll block | ⬜ TODO | 🟠 P1 | Brak |
| 195 | Autosave co 30s | ⬜ TODO | 🟠 P1 | Brak |
| 196 | Version history | ✅ STUB | 🟠 P1 | `0013_articles_versions.sql` istnieje |
| 197 | Restore from version | ⬜ TODO | 🟠 P1 | Brak |
| 198 | Collaborative editing | ⬜ TODO | 🟡 P2 | Brak |
| 199 | Spellcheck PL | ⬜ TODO | 🟡 P2 | Brak |
| 200 | AI assistant w edytorze | ⬜ TODO | 🟢 P3 | Brak |

---

## FAZA 4 — AI / Newsroom automation (201–280) 🟠 P1

### 4.1 OpenAI / Anthropic integration (201–215)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 201 | AI generate article | ✅ STUB | 🔴 P0 | `src/ai/client.ts` + newsroom actions — wymaga API key |
| 202 | AI summarize TL;DR | ✅ DONE | 🔴 P0 | `src/ai/prompts/summary-tldr.ts` |
| 203 | AI title proposals | ✅ DONE | 🔴 P0 | `src/ai/prompts/headline-generator.ts` |
| 204 | AI lede generation | ✅ DONE | 🔴 P0 | `src/ai/prompts/lead-writer.ts` |
| 205 | AI auto-tagging | ✅ DONE | 🔴 P0 | `src/ai/prompts/tags-classifier.ts` |
| 206 | AI auto-category | ✅ DONE | 🔴 P0 | `/api/rag/auto-categorize` endpoint |
| 207 | AI SEO meta | ✅ DONE | 🟠 P1 | `src/ai/prompts/seo-meta.ts` |
| 208 | AI translate PL↔EN | ✅ DONE | 🟠 P1 | `src/ai/prompts/translate-pl-en.ts` |
| 209 | AI proofread | ✅ DONE | 🟠 P1 | `src/ai/prompts/tone-rewriter.ts` |
| 210 | AI fact-check | ✅ DONE | 🟠 P1 | `src/ai/prompts/fact-checker.ts` + `/api/rag/fact-check` |
| 211 | AI image-prompt | ✅ DONE | 🟠 P1 | `src/ai/prompts/image-prompt-generator.ts` |
| 212 | AI alt-text | ✅ DONE | 🟠 P1 | `src/lib/media/alt-text-ai.ts` |
| 213 | Streaming responses SSE | ⬜ TODO | 🟠 P1 | Brak |
| 214 | Token usage tracking | ⬜ TODO | 🟡 P2 | Brak |
| 215 | Cost guard | ⬜ TODO | 🟡 P2 | Brak |

### 4.2 Prompts library (216–230)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 216-230 | 15 promptów | ✅ DONE | 🟠 P1 | **Wszystkie 15 promptów istnieje**: 16 plików w `src/ai/prompts/` (headline, lead, tldr, seo-meta, fact-checker, tone-rewriter, quote-extractor, tags-classifier, image-prompt, social-snippets, newsletter-blurb, push-notification, translate-pl-en, plain-language, comments-moderator) + index.ts |

### 4.3 RAG Knowledge Base (231–250)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 231 | Dataset historia Izbicy | ✅ DONE | 🟠 P1 | `knowledge_base/raw/` — 10 dokumentów |
| 232 | Dataset Wietrzychowice | ✅ DONE | 🟠 P1 | W dokumentach knowledge_base |
| 233 | Dataset społeczność żydowska | ✅ DONE | 🟠 P1 | W dokumentach |
| 234 | Dataset Kujawianka | ✅ DONE | 🟠 P1 | W dokumentach |
| 235 | Dataset zabytki | ✅ DONE | 🟠 P1 | W dokumentach |
| 236 | Dataset samorząd | ✅ DONE | 🟠 P1 | W dokumentach |
| 237 | Dataset rolnictwo | ✅ DONE | 🟠 P1 | W dokumentach |
| 238 | Dataset osoby zasłużone | ✅ DONE | 🟠 P1 | W dokumentach |
| 239 | Embeddings generation | ✅ DONE | 🟠 P1 | `src/ai/rag/embedder.ts` |
| 240 | Vector storage | ✅ DONE | 🟠 P1 | `src/ai/rag/vector-store.ts` (D1 cosine similarity fallback) |
| 241 | Cosine similarity search | ✅ DONE | 🟠 P1 | `/api/rag/search` endpoint |
| 242 | Hybrid search | 🟡 PARTIAL | 🟠 P1 | FTS5 + cosine osobno, brak re-rankingu |
| 243 | RAG admin UI | ⬜ TODO | 🟠 P1 | Brak |
| 244 | Chunk size optimization | ⬜ TODO | 🟡 P2 | Brak |
| 245 | Re-indexing CLI | ✅ STUB | 🟡 P2 | `/api/rag/reindex` endpoint |
| 246 | Citation generator | ⬜ TODO | 🟡 P2 | Brak |
| 247 | Confidence score | ⬜ TODO | 🟡 P2 | Brak |
| 248 | Fallback do web search | ⬜ TODO | 🟡 P2 | Brak |
| 249 | Chat z RAG | ⬜ TODO | 🟢 P3 | Brak |
| 250 | RAG benchmarks | ⬜ TODO | 🟢 P3 | Brak |

### 4.4 n8n workflows (251–280)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 251 | VPS Hetzner provisioning | ⬜ TODO | 🟠 P1 | Brak |
| 252 | Docker compose stack | ⬜ TODO | 🟠 P1 | Brak |
| 253 | SSL Let's Encrypt | ⬜ TODO | 🟠 P1 | Brak |
| 254 | Caddy reverse proxy | ⬜ TODO | 🟠 P1 | Brak |
| 255 | Postgres backup | ⬜ TODO | 🟠 P1 | Brak |
| 256-280 | 25 workflowów n8n | ✅ STUB | 🟠/🟡 P1/P2 | **30 plików JSON istnieje** w `n8n-workflows/`: ingest-rss-pap, ingest-rss-tvp, ingest-rss-radio-pik, ingest-facebook-page, ingest-weather-imgw, ingest-aqi-gios, ingest-gov-pl-watch, analytics-anomaly-detection, analytics-daily-report, backup-d1-daily, backup-r2-snapshot, budget-watch, comments-moderation, content-audit-monthly, council-meetings-calendar, dead-link-checker, image-optimize-r2, newsletter-daily-digest, obituaries-import, podcast-rss-publish, push-breaking-news, road-incidents, seo-google-news-feed, seo-indexnow, seo-sitemap-refresh, social-publish-fb, social-publish-twitter, tender-watch, weather-alerts-rcb, youtube-channel-watcher. **ALE**: to tylko JSON templates — nie są uruchomione na żadnym serwerze n8n |

---

## FAZA 5 — Integracje zewnętrzne (281–340) 🟡 P2

### 5.1 Social media (281–300)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 281-300 | 20 integracji social media | ⬜ TODO | 🟠/🟡 P1/P2 | **BRAK** — wszystkie social media są tylko jako n8n workflow templates (FB, Twitter/X), nie ma bezpośrednich integracji w kodzie Workers |

### 5.2 Analytics (301–315)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 301 | Cloudflare Web Analytics | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 302 | Plausible | ⬜ TODO | 🟠 P1 | Brak |
| 303 | Google Search Console | ⬜ TODO | 🟠 P1 | Wymaga produkcji |
| 304 | Bing Webmaster | ⬜ TODO | 🟠 P1 | Brak |
| 305 | Custom analytics endpoint | 🟡 PARTIAL | 🟠 P1 | `src/routes/v1/metrics.ts` + `/api/analytics/vitals` |
| 306 | Tracking events | 🟡 PARTIAL | 🟠 P1 | `src/lib/kv/analytics-buffer.ts` |
| 307 | Newsletter/Comment tracking | ⬜ TODO | 🟠 P1 | Brak |
| 308 | Heatmaps | ⬜ TODO | 🟠 P1 | Brak |
| 309 | A/B testing infra | ✅ DONE | 🟡 P2 | `src/lib/kv/ab-tests.ts` |
| 310 | Funnel analysis | ⬜ TODO | 🟡 P2 | Brak |
| 311 | Cohort analysis | ⬜ TODO | 🟡 P2 | Brak |
| 312 | Real-time dashboard | ⬜ TODO | 🟡 P2 | Brak |
| 313 | Recommendation engine | ⬜ TODO | 🟢 P3 | Brak |
| 314 | Predictive analytics | ⬜ TODO | 🟢 P3 | Brak |
| 315 | GDPR consent management | ⬜ TODO | 🟢 P3 | Brak |

### 5.3 Komunikacja zewnętrzna (316–330)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 316 | Email provider | ⬜ TODO | 🟠 P1 | Brak integracji |
| 317-330 | Email/SMS/Push | 🟡 PARTIAL | 🟠/🟡 P1/P2 | Push notifications mają pełen kod (`src/routes/push/index.ts` — 400+ linii, VAPID, subscribe, broadcast, segment, breaking, scheduled, preferences), ale NIE są podpięte do `src/index.tsx` ani `src/api/v1.ts` |

### 5.4 Payments + monetyzacja (331–340)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 331-340 | Stripe/PayPal/AdSense | ⬜ TODO | 🟡/🟢 P2/P3 | **BRAK** — żadna integracja płatności nie istnieje |

---

## FAZA 6 — SEO / Performance / Accessibility (341–410) 🟠 P1

### 6.1 SEO Technical (341–365)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 341 | Title tag templates | 🟡 PARTIAL | 🔴 P0 | Ręcznie ustawiane w renderer.tsx + per strona |
| 342 | Meta description templates | 🟡 PARTIAL | 🔴 P0 | W article.tsx |
| 343 | Canonical URLs | 🟡 PARTIAL | 🔴 P0 | W `src/seo.ts` — Sitemap generuje URL-e |
| 344 | Open Graph tags | ✅ DONE | 🔴 P0 | `src/seo.ts` generuje OG |
| 345 | Twitter Cards | ✅ DONE | 🔴 P0 | `src/seo.ts` |
| 346 | JSON-LD Article | ✅ DONE | 🔴 P0 | `src/seo.ts` (generateArticleLd) |
| 347 | JSON-LD BreadcrumbList | ✅ DONE | 🔴 P0 | `src/seo.ts` |
| 348 | JSON-LD NewsArticle | ✅ DONE | 🔴 P0 | `src/seo.ts` |
| 349 | JSON-LD Organization | ✅ DONE | 🔴 P0 | `src/seo.ts` |
| 350 | JSON-LD Event | ✅ STUB | 🟠 P1 | Events model istnieje ale JSON-LD może być niepełny |
| 351 | JSON-LD Person | ⬜ TODO | 🟠 P1 | Brak |
| 352 | JSON-LD FAQPage | ⬜ TODO | 🟠 P1 | Brak |
| 353 | JSON-LD HowTo | ⬜ TODO | 🟠 P1 | Brak |
| 354 | hreflang EN/UA | ⬜ TODO | 🟠 P1 | Brak |
| 355 | Pagination rel next/prev | ⬜ TODO | 🟠 P1 | Brak |
| 356 | noindex dla admin/api | 🟡 PARTIAL | 🟠 P1 | robots.txt istnieje, ale brak meta noindex |
| 357 | Mobile-first responsive | ✅ DONE | 🟠 P1 | CSS v3 — responsive design (20 plików CSS) |
| 358 | Structured data testing | ⬜ TODO | 🟠 P1 | Brak |
| 359 | Internal linking strategy | ⬜ TODO | 🟠 P1 | Brak |
| 360 | Anchor text optimization | ⬜ TODO | 🟠 P1 | Brak |
| 361 | URL structure audit | ⬜ TODO | 🟡 P2 | Brak |
| 362-365 | 301/404/Core Web Vitals | ⬜ TODO | 🟡 P2 | Brak |

### 6.2 Performance (366–385)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 366 | Cache-Control headers | 🟡 PARTIAL | 🔴 P0 | `public/_headers` istnieje |
| 367 | Brotli compression | ⬜ TODO | 🔴 P0 | Wymaga Cloudflare — auto |
| 368 | HTTP/3 + QUIC | ⬜ TODO | 🔴 P0 | Wymaga Cloudflare — auto |
| 369 | Preload critical fonts | ✅ DONE | 🔴 P0 | `public/_headers` + inline CSS |
| 370 | Preconnect fonts | 🟡 PARTIAL | 🔴 P0 | W `renderer.tsx` |
| 371 | Font-display swap | ✅ DONE | 🔴 P0 | W CSS |
| 372 | Subset fonts PL | ⬜ TODO | 🟠 P1 | Brak |
| 373 | Self-host fonts z R2 | ⬜ TODO | 🟠 P1 | Brak (używane Google Fonts CDN) |
| 374 | CSS minification + critical CSS | 🟡 PARTIAL | 🟠 P1 | `src/critical-css.ts` + 20 plików CSS |
| 375 | JS minification + tree-shaking | ✅ DONE | 🟠 P1 | Vite robi automatycznie |
| 376 | Code splitting | ✅ DONE | 🟠 P1 | Vite |
| 377 | Image optimization | 🟡 PARTIAL | 🟠 P1 | image-resize.ts + webp-fallback.ts |
| 378 | Lazy loading | 🟡 PARTIAL | 🟠 P1 | Częściowo w article.tsx |
| 379 | Resource hints | 🟡 PARTIAL | 🟠 P1 | W `_headers` |
| 380 | Service Worker cache | ✅ DONE | 🟠 P1 | `sw.js` |
| 381 | PWA install prompt | ⬜ TODO | 🟡 P2 | Brak |
| 382 | Offline page | ✅ STUB | 🟡 P2 | SW istnieje, ale brak offline fallback |
| 383 | Bundle size budget | ⬜ TODO | 🟡 P2 | Brak (409KB obecnie) |
| 384 | Lighthouse CI | ⬜ TODO | 🟡 P2 | Brak |
| 385 | WebPageTest audits | ⬜ TODO | 🟡 P2 | Brak |

### 6.3 Accessibility (386–410)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 386 | Semantic HTML5 landmarks | ✅ DONE | 🟠 P1 | Layout używa header/nav/main/aside/footer |
| 387 | ARIA labels | 🟡 PARTIAL | 🟠 P1 | Częściowe w komponentach |
| 388 | Alt text | 🟡 PARTIAL | 🟠 P1 | alt-text-ai.ts generuje, ale nie wszędzie użyte |
| 389 | Keyboard navigation | ⬜ TODO | 🟠 P1 | Brak |
| 390 | Focus indicators | ⬜ TODO | 🟠 P1 | Brak |
| 391 | Skip to main content | ⬜ TODO | 🟠 P1 | Brak |
| 392 | Color contrast WCAG AA | 🟡 PARTIAL | 🟠 P1 | Częściowe w CSS |
| 393 | Form labels + errors | 🟡 PARTIAL | 🟠 P1 | W admin forms |
| 394 | Heading hierarchy | 🟡 PARTIAL | 🟠 P1 | Częściowo poprawne |
| 395 | Lang attribute | ✅ DONE | 🟠 P1 | `lang="pl"` w renderer.tsx |
| 396 | Reduced motion | ⬜ TODO | 🟠 P1 | Brak |
| 397 | Print stylesheet | ⬜ TODO | 🟠 P1 | Brak |
| 398-410 | Screen reader/WCAG 2.1 AA | ⬜ TODO | 🟡/🟢 P2/P3 | Brak audytu |

---

## FAZA 7 — Security + GDPR + Legal (411–470) 🔴 P0/P1

### 7.1 Security (411–435)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 411 | HTTPS everywhere | ⬜ TODO | 🔴 P0 | Wymaga Cloudflare |
| 412 | HSTS header | ⬜ TODO | 🔴 P0 | Brak w `_headers` |
| 413 | CSP | ⬜ TODO | 🔴 P0 | Brak |
| 414 | X-Frame-Options | ⬜ TODO | 🔴 P0 | Brak |
| 415 | X-Content-Type-Options | ⬜ TODO | 🔴 P0 | Brak |
| 416 | Referrer-Policy | ⬜ TODO | 🔴 P0 | Brak |
| 417 | Permissions-Policy | ⬜ TODO | 🔴 P0 | Brak |
| 418 | CSRF tokens | ⬜ TODO | 🔴 P0 | Brak |
| 419 | XSS protection | 🟡 PARTIAL | 🔴 P0 | JSX automatycznie escapuje, ale brak audit |
| 420 | SQL injection | 🟡 PARTIAL | 🔴 P0 | D1 prepared statements w search, ale API używa mock data |
| 421 | Rate limiting per IP | ✅ DONE | 🔴 P0 | `src/lib/kv/rate-limit-store.ts` + middleware |
| 422 | Rate limiting per user | ✅ DONE | 🔴 P0 | W auth middleware |
| 423 | Turnstile | ⬜ TODO | 🔴 P0 | Brak — tylko definicja CAPTCHA_KV |
| 424 | Honeypot fields | ⬜ TODO | 🔴 P0 | Brak |
| 425 | Cloudflare WAF | ⬜ TODO | 🟠 P1 | Wymaga produkcji |
| 426 | Cloudflare Bot Management | ⬜ TODO | 🟠 P1 | Wymaga produkcji |
| 427 | IP allowlist admin | ⬜ TODO | 🟠 P1 | Brak |
| 428 | Audit log admin | ✅ DONE | 🟠 P1 | `0015_admin_logs.sql` + model `audit-log.ts` |
| 429 | Failed login monitoring | 🟡 PARTIAL | 🟠 P1 | Rate limit istnieje, ale brak alertów |
| 430 | Password policy | 🟡 PARTIAL | 🟠 P1 | PBKDF2 w register.ts, ale brak walidacji siły |
| 431 | Secret rotation | ⬜ TODO | 🟠 P1 | Brak |
| 432 | Dependencies audit | ⬜ TODO | 🟠 P1 | Brak npm audit w CI |
| 433 | Penetration testing | ⬜ TODO | 🟡 P2 | Brak |
| 434 | Bug bounty | ⬜ TODO | 🟡 P2 | Brak |
| 435 | SOC2/ISO27001 | ⬜ TODO | 🟢 P3 | Future |

### 7.2 GDPR / RODO (436–455)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 436 | Klauzula RODO | ⬜ TODO | 🔴 P0 | Brak `/rodo` strony |
| 437 | Cookie consent banner | ⬜ TODO | 🔴 P0 | Brak |
| 438 | Cookie policy | ✅ DONE | 🔴 P0 | `/polityka-cookies` strona istnieje |
| 439 | Right to access (export) | ⬜ TODO | 🔴 P0 | Brak |
| 440 | Right to deletion | ✅ DONE | 🔴 P0 | `src/routes/auth/delete-account.ts` |
| 441 | Right to rectification | ✅ DONE | 🔴 P0 | `src/routes/auth/profile.ts` |
| 442 | DPA document | ⬜ TODO | 🔴 P0 | Brak |
| 443 | Privacy by design | 🟡 PARTIAL | 🔴 P0 | `src/lib/privacy/ip-anonymize.ts` + `pii-scrubber.ts` |
| 444 | IP anonymization | ✅ DONE | 🔴 P0 | `src/lib/privacy/ip-anonymize.ts` |
| 445 | Newsletter double opt-in | ⬜ TODO | 🔴 P0 | Brak w implementacji |
| 446-455 | Pozostałe GDPR | ⬜ TODO | 🟠 P1 | Brak implementacji |

### 7.3 Legal (456–470)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 456 | Regulamin | ✅ DONE | 🔴 P0 | `/regulamin` strona |
| 457 | Polityka prywatności | ✅ DONE | 🔴 P0 | `/polityka-prywatnosci` strona |
| 458 | Regulamin komentarzy | ⬜ TODO | 🔴 P0 | Brak |
| 459 | Disclaimer AI | ⬜ TODO | 🔴 P0 | Brak |
| 460 | Copyright notice | ✅ DONE | 🔴 P0 | W Footer |
| 461-470 | Pozostałe legal | ⬜ TODO | 🟠/🟡 P1/P2 | Brak |

---

## FAZA 8 — DevOps / Monitoring / Backup (471–520) 🟠 P1

### 8.1 CI/CD (471–490)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 471 | GitHub Actions CI | ⬜ TODO | 🔴 P0 | **BRAK** — katalog `.github/workflows/` nie istnieje! |
| 472 | Lint (ESLint) | 🟡 PARTIAL | 🔴 P0 | `scripts/ci-lint.mjs` istnieje |
| 473 | Type check | 🟡 PARTIAL | 🔴 P0 | `tsconfig.json` istnieje, build przechodzi |
| 474 | Build verification | ✅ DONE | 🔴 P0 | `npm run build` działa |
| 475 | Unit tests (Vitest) | ✅ DONE | 🔴 P0 | 16 testów jednostkowych w `tests/unit/` |
| 476 | Integration tests | ✅ DONE | 🔴 P0 | 4 testy integracyjne w `tests/integration/` |
| 477 | E2E tests (Playwright) | ✅ DONE | 🔴 P0 | 1 smoke test w `tests/e2e/` |
| 478 | Lighthouse CI | ⬜ TODO | 🔴 P0 | Brak |
| 479 | Wrangler dry-run | ⬜ TODO | 🔴 P0 | Brak |
| 480 | Auto-deploy main | ⬜ TODO | 🔴 P0 | Brak CI/CD |
| 481 | Auto-deploy staging | ⬜ TODO | 🔴 P0 | Brak CI/CD |
| 482-490 | Slack/rollback/secret-scanning | ⬜ TODO | 🟠/🟡 P1/P2 | Brak |

### 8.2 Monitoring + alerting (491–510)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 491 | Cloudflare Analytics | ⬜ TODO | 🔴 P0 | Wymaga produkcji |
| 492 | Uptime monitoring | ⬜ TODO | 🔴 P0 | Brak |
| 493 | Status page | ⬜ TODO | 🔴 P0 | Brak |
| 494 | Error tracking Sentry | ⬜ TODO | 🔴 P0 | `src/monitoring/error-tracker.ts` istnieje jako abstrakcja |
| 495 | Log aggregation | 🟡 PARTIAL | 🔴 P0 | `src/middleware/request-logger.ts` |
| 496 | Web Vitals RUM | 🟡 PARTIAL | 🔴 P0 | `public/static/vitals.js` + `/api/analytics/vitals` |
| 497 | D1 slow query log | ✅ DONE | 🟠 P1 | `src/monitoring/slow-query.ts` + `/admin/slow-queries` |
| 498 | R2 usage monitoring | ⬜ TODO | 🟠 P1 | Brak |
| 499 | KV usage monitoring | ⬜ TODO | 🟠 P1 | Brak |
| 500 | Workers CPU monitoring | ⬜ TODO | 🟠 P1 | Brak |
| 501 | Cost monitoring | ⬜ TODO | 🟠 P1 | Brak |
| 502-510 | Alerts/SLO/Grafana | ⬜ TODO | 🟠/🟡 P1/P2 | Brak — monitoring ma 10 modułów (`src/monitoring/`) ale nie są podpięte do alertów |

### 8.3 Backup + Disaster Recovery (511–520)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 511 | D1 daily backup | ✅ STUB | 🔴 P0 | `src/lib/backup/d1-export.ts` + n8n workflow `backup-d1-daily.json` |
| 512 | D1 weekly offsite | ⬜ TODO | 🔴 P0 | Brak |
| 513 | R2 cross-region | ⬜ TODO | 🔴 P0 | Brak |
| 514 | KV backup | ✅ STUB | 🔴 P0 | `src/lib/backup/kv-dump.ts` |
| 515 | Git mirror | ⬜ TODO | 🔴 P0 | Brak |
| 516 | Restore procedure | ✅ STUB | 🟠 P1 | `src/lib/backup/restore.ts` + `scripts/restore-manual.ts` |
| 517-520 | RTO/RPO/DR drill | ⬜ TODO | 🟠/🟡 P1/P2 | Brak |

---

## FAZA 9 — Treść + Launch (521–570) 🟠 P1

### 9.1 Content seed (521–545)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 521-545 | 25 zadań contentowych | ⬜ TODO | 🟠/🟡 P1/P2 | **BRAK** — seed.sql ma demo dane (37KB migracja `0009_seed_demo_articles.sql`), ale nie są to rzeczywiste artykuły. Knowledge base ma 10 dokumentów. Brak rzeczywistej produkcji treści. |

### 9.2 Pre-launch (546–560)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 546 | Domena izbica24.pl | ⬜ TODO | 🔴 P0 | Brak zakupu |
| 547 | SSL aktywny | ⬜ TODO | 🔴 P0 | Wymaga domeny |
| 548 | DNS records | ⬜ TODO | 🔴 P0 | `wrangler.jsonc` ma konfigurację |
| 549 | Subdomeny | ⬜ TODO | 🔴 P0 | Wymaga DNS |
| 550 | Page Rules | ⬜ TODO | 🔴 P0 | Wymaga CF |
| 551 | Workers Routes | ⬜ TODO | 🔴 P0 | Wymaga CF |
| 552 | Beta test | ⬜ TODO | 🔴 P0 | Brak |
| 553-560 | Press release/plakaty/spotkanie | ⬜ TODO | 🟠 P1 | Brak |

### 9.3 Launch + post-launch (561–570)

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 561 | D-Day 1 lipca 2026 | ⬜ TODO | 🔴 P0 | Data w README — nierealna przy obecnym stanie |
| 562-570 | Monitoring/analiza | ⬜ TODO | 🔴/🟠 P0/P1 | Brak |

---

## FAZA 10 — Long-term roadmap (571–590) 🟢 P3

| # | Zadanie | Status | Priorytet | Weryfikacja |
|---|---------|--------|-----------|-------------|
| 571-590 | 20 zadań future | ⬜ TODO | 🟢 P3 | **BRAK** — wszystkie to koncepcje przyszłościowe |

---

## 🔴 TOP 20 KRYTYCZNYCH BRAKÓW (must-have przed launch)

| Lp. | # | Zadanie | Faza | Problem |
|-----|---|---------|------|---------|
| 1 | 75-76 | Podpięcie D1 zamiast mock data | 2.1 | **CAŁE API używa mockowych danych `data-articles.ts`!** |
| 2 | 471 | GitHub Actions CI/CD | 8.1 | Brak katalogu `.github/workflows/` |
| 3 | 546-549 | Domena + DNS + SSL | 9.2 | Brak domeny produkcyjnej |
| 4 | 61-66 | Utworzenie D1 production | 2.1 | Baza tylko lokalna |
| 5 | 81-83 | Utworzenie KV production | 2.2 | KV tylko w typach |
| 6 | 96-99 | Utworzenie R2 production | 2.3 | R2 tylko w typach |
| 7 | 411-417 | Security headers (CSP, HSTS, etc.) | 7.1 | Brak wszystkich nagłówków bezpieczeństwa |
| 8 | 436-437 | RODO: cookie consent + klauzula | 7.2 | Brak — niezgodne z prawem |
| 9 | 423 | Turnstile / captcha | 7.1 | Brak ochrony przed botami |
| 10 | 15 | Tag pages `/tag/:slug` | 1.1 | Brak |
| 11 | 301 | Cloudflare Web Analytics | 5.2 | Brak |
| 12 | 46-60 | Frontend JS — luki | 1.4 | Brak share, comment form, search modal, reading progress |
| 13 | 31-45 | UI komponenty — luki | 1.3 | Brak CommentForm, ShareModal, SearchModal, DarkModeToggle |
| 14 | 256-280 | n8n — wdrożenie na VPS | 4.4 | Workflowy to tylko JSON templates |
| 15 | 411-412 | HTTPS + HSTS | 7.1 | Wymagane na produkcji |
| 16 | 445-446 | Newsletter double opt-in | 7.2 | Wymagane przez RODO |
| 17 | 413 | CSP header | 7.1 | Krytyczne dla XSS protection |
| 18 | 151 | Admin login page | 3.2 | Brak dedykowanej strony logowania |
| 19 | 316-320 | Email provider (SendGrid/Resend) | 5.3 | Brak — potrzebne do auth, newslettera |
| 20 | 521-545 | Content seed | 9.1 | Brak rzeczywistej treści |

---

## 🔴 NIEPODPIĘTE ROUTERY (istnieją kod ale nie są w main app)

| Router | Plik | Endpointy | Problem |
|--------|------|-----------|---------|
| **Push notifications** | `src/routes/push/index.ts` | ~20 endpointów (subscribe, broadcast, segment, breaking, history, stats, preferences) | **Nie podpięty** — ani w `src/index.tsx` ani w `src/api/v1.ts` |
| **Search (pełny)** | `src/routes/search/index.ts` | ~15 endpointów (autocomplete, suggestions, advanced, saved, spell-check, trending, zero-results) | **Nie podpięty** — API v1 ma tylko prosty `/search` używający mock data |
| **Newsletter** | newsletter model istnieje | — | Brak osobnego routera, tylko model w `src/db/models/newsletters.ts` |

---

## 📊 STATYSTYKI KOŃCOWE

| Metryka | Wartość |
|---------|--------|
| Pliki źródłowe | 268 |
| Migracje D1 | 51 |
| n8n workflowy (JSON) | 30 |
| Dokumenty MD | 20 |
| Testy (unit+int+e2e) | 19 |
| CSS pliki | 20 |
| JS pliki (public) | 26 |
| Prompt AI | 15 (wszystkie zaimplementowane) |
| RAG endpointy | 20 |
| Auth endpointy | 16 |
| Admin panel strony | ~15 (wszystkie z mock data) |
| Wielkość builda | 409.66 KB |
| Czas builda | ~2s |

---

**Audyt wygenerowany**: 2026-05-26
**Następny krok**: Priorytetyzacja TOP 20 krytycznych braków + realokacja zadań do kolejnych sandboxów
