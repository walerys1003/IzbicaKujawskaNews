# 02 — BACK-END: audyt szczegółowy i plan prac

> **Stan realizacji: 12%**
> **Ocena:** obszerny szkielet kodu bez podłączonej logiki zapisu. Zero operacji utrwalających dane.

---

## CZĘŚĆ A — CO ISTNIEJE

### A1. Warstwa modeli danych — SZKIELET (1 832 LOC, nigdy nie wykonany)

`src/db/models/` — 17 plików z poprawnie napisanymi funkcjami dostępu do D1:

| Plik | Zawartość |
|---|---|
`_shared.ts` | `DbContext`, `buildWhere`, `compactRecord`, `toSqlBoolean`, paginacja |
`articles.ts` | `ArticleRow` (21 kolumn), `ArticleFilters`, CRUD, statusy: `draft`/`review`/`scheduled`/`published`/`archived` |
`categories.ts`, `comments.ts`, `users.ts`, `media.ts`, `galleries.ts`, `events.ts`, `solectwa.ts`, `newsletter.ts`, `ogloszenia.ts`, `polls.ts`, `redirects.ts`, `seo.ts`, `versions.ts`, `logs.ts`, `analytics.ts` | analogicznie |

**Model artykułu jest dobrze zaprojektowany** — obsługuje soft delete (`deleted_at`), archiwizację (`archived_at`), planowanie (`scheduled_at`), licznik odsłon, czas czytania, język.

**Problem:** ten kod nigdy nie został wykonany, bo nie ma bindingu D1. Nie jest przetestowany.

### A2. Warstwa repozytorium — SZKIELET

`src/repository/` — 1 plik, 257 LOC.

### A3. Biblioteki pomocnicze — SZKIELET

| Katalog | Plików | LOC | Stan |
|---|---|---|---|
`src/lib/kv/` | 15 | 963 | Kod poprawny (`cache-pages.ts`, `session-store.ts`, …), bindingi mają placeholdery `replace-*-kv` |
`src/lib/r2/` | 21 | 732 | Kod poprawny, **bindingi nie istnieją** |
`src/lib/media/` | 16 | 549 | Upload, warianty, alt-text AI — bez R2 nie działa |
`src/lib/search/` | 7 | 188 | FTS5 — bez D1 nie działa |
`src/lib/backup/` | 7 | 76 | Zrzut KV + D1 |
`src/lib/email/` | 1 | 121 | Resend — **klucz jako placeholder** |
`src/lib/moderation/` | 2 | 52 | Moderacja komentarzy |
`src/lib/privacy/` | 2 | 17 | RODO |
`src/lib/validators/` | 3 | 91 | Walidacja wejścia |

### A4. Middleware — DZIAŁA

| Element | Stan |
|---|---|
Nagłówki bezpieczeństwa (CSP, HSTS, X-Frame-Options, Permissions-Policy) | ✅ potwierdzone w odpowiedzi HTTP |
CORS dla `/api/*` | ✅ |
Middleware wydajności (`<picture>`, minifikacja, ETag) | ✅ działa (i było źródłem błędów 404 — naprawione) |

### A5. Monitoring — SZKIELET

`src/monitoring/` — 10 plików, 235 LOC. Trasy `/admin/logs`, `/admin/errors`, `/admin/slow-queries` zamontowane, ale bez bazy nie mają skąd czytać.

---

## CZĘŚĆ B — CZEGO BRAKUJE

### 🔴 B1. Zero operacji zapisu w panelu — brak krytyczny

```bash
$ grep -cE "admin\.(post|put|patch|delete)\(" src/routes/admin.tsx
0
$ grep -cE "admin\.get\(" src/routes/admin.tsx
9
```

Formularz artykułu: `<form method="post" action="#">`.

**Co to znaczy w praktyce:** redaktor może otworzyć edytor, wpisać tekst, kliknąć „Zapisz" — i nic się nie stanie. Panel wyświetla komunikat „Zmiany zapisują się lokalnie", co jest wprowadzające w błąd.

**Brakujące trasy zapisu (kompletna lista):**

| Zasób | Wymagane operacje |
|---|---|
Artykuły | `POST /admin/articles` · `PUT /admin/articles/:id` · `DELETE /admin/articles/:id` · `POST /admin/articles/:id/publish` · `POST /admin/articles/:id/unpublish` · `POST /admin/articles/:id/schedule` · `POST /admin/articles/:id/archive` · `POST /admin/articles/:id/duplicate` · `POST /admin/articles/:id/restore-version/:v` |
Media | `POST /admin/media/upload` · `PUT /admin/media/:id` (metadane, alt) · `DELETE /admin/media/:id` · `POST /admin/media/bulk-tag` · `POST /admin/media/bulk-delete` |
Galerie | `POST /admin/galleries` · `PUT /admin/galleries/:id` · `POST /admin/galleries/:id/images` · `PUT /admin/galleries/:id/reorder` · `DELETE /admin/galleries/:id/images/:imgId` · `POST /admin/galleries/:id/publish` |
Kategorie | `POST` · `PUT` · `DELETE` · `PUT /reorder` |
Komentarze | `POST /admin/comments/:id/approve` · `/reject` · `/spam` · `DELETE` · `POST /bulk-moderate` |
Użytkownicy | `POST` · `PUT` · `DELETE` · `PUT /:id/role` · `POST /:id/reset-password` |
Ogłoszenia | `POST /approve` · `/reject` · `PUT` · `DELETE` · `POST /:id/extend` |
Newsletter | `POST /admin/newsletter/campaigns` · `PUT` · `POST /:id/send` · `POST /:id/schedule` · `POST /:id/test` |
Wydarzenia | `POST` · `PUT` · `DELETE` |
Ustawienia | `PUT /admin/settings` · `PUT /admin/settings/api-keys` |
Sołectwa | `PUT /admin/solectwa/:slug` (dane, sołtys, kontakt) |

**Razem: ~45 tras zapisu do napisania.**

### 🔴 B2. Autoryzacja fail-open — luka bezpieczeństwa

```typescript
const requireAdmin = async (c: any, next: any) => {
  const secret = c.env?.JWT_SECRET
  if (!secret) {
    c.set('adminRole', 'admin')   // ← BEZ SEKRETU KAŻDY JEST ADMINEM
    return next()
  }
  ...
}
```

Potwierdzone: `curl /admin` bez tokenu → **200**.

**To nie jest brak funkcji, to podatność.** Po wdrożeniu bez `JWT_SECRET` cały panel redakcji jest publiczny.

Wymagane naprawy:
1. Zmiana na **fail-closed** — brak sekretu = odmowa dostępu (503 z komunikatem konfiguracyjnym)
2. Ekran logowania (`/admin/login`) — obecnie nie istnieje
3. Hashowanie haseł (Web Crypto PBKDF2 lub scrypt — **nie** bcrypt, niedostępny w Workers)
4. Sesje w `SESSION_KV` z rotacją, wygasaniem, unieważnianiem
5. Ochrona CSRF dla wszystkich operacji zapisu
6. Ograniczanie liczby prób logowania (`RATE_LIMIT_KV`)
7. 2FA (TOTP) dla roli administratora
8. Dziennik audytu — kto, co, kiedy zmienił

### 🔴 B3. Brak modelu ról i uprawnień

Kod rozpoznaje `admin` i `editor`. Portal redakcyjny potrzebuje pełnej macierzy:

| Rola | Uprawnienia |
|---|---|
**Administrator** | Wszystko + użytkownicy + ustawienia + klucze API |
**Redaktor naczelny** | Publikacja, odrzucanie, wszystkie treści, moderacja |
**Redaktor** | Tworzenie i edycja własnych + zgłaszanie do recenzji |
**Dziennikarz** | Tworzenie szkiców własnych, bez publikacji |
**Moderator** | Wyłącznie komentarze i ogłoszenia |
**Autor zewnętrzny** | Szkice, bez dostępu do panelu ustawień |

Do zaimplementowania: tabela uprawnień, middleware per trasa, ukrywanie elementów UI według roli.

### 🔴 B4. Brak workflow publikacji

Statusy istnieją w modelu (`draft`/`review`/`scheduled`/`published`/`archived`), ale brak logiki przejść:

- Zgłoszenie do recenzji + powiadomienie redaktora naczelnego
- Akceptacja / odrzucenie z komentarzem
- Publikacja natychmiastowa vs planowana (cron istnieje: `*/10 * * * *` — nie ma obsługi)
- Blokada edycji (dwóch redaktorów w tym samym artykule)
- Ścieżka audytu zmian statusu

### 🔴 B5. Brak walidacji danych wejściowych

`src/lib/validators/` — 3 pliki, 91 LOC. To za mało dla ~45 tras zapisu.

Wymagane: schematy walidacji (Zod lub Valibot — lekkie, działają w Workers) dla każdego kształtu danych wejściowych, sanityzacja HTML z edytora (ochrona przed XSS), limity rozmiarów, walidacja typów MIME plików.

### 🔴 B6. Brak obsługi zadań cyklicznych

`wrangler.jsonc` deklaruje crony `*/10 * * * *` i `0 * * * *`, ale **brak handlera `scheduled`**.

Zadania do zaimplementowania:
- Publikacja zaplanowanych artykułów (co 10 min)
- Wygaszanie przedawnionych ogłoszeń (co godzinę)
- Wysyłka newslettera według harmonogramu
- Odświeżanie pogody/jakości powietrza do KV
- Zbieranie RSS z portali regionalnych (przegląd mediów)
- Przeliczanie statystyk „najczęściej czytane"
- Czyszczenie sesji i tokenów
- Zrzut kopii zapasowej do R2

### 🟡 B7. Brak obsługi błędów i logowania

- Brak centralnego rejestrowania błędów (migracja `0066_error_log.sql` istnieje, kod nie)
- Brak korelacji zapytań (request ID)
- Brak alertów przy błędach 5xx

### 🟡 B8. Brak testów

Zero testów jednostkowych, integracyjnych i end-to-end w całym projekcie. Przy ~45 trasach zapisu i logice uprawnień to ryzyko regresji przy każdej zmianie.

---

## CZĘŚĆ C — ETAPY PRAC

### Etap B1 — Bezpieczeństwo i autoryzacja *(3–4 dni)* 🔴 PIERWSZY

**B1.1** Zmiana `requireAdmin` na fail-closed
**B1.2** Ekran logowania `/admin/login` + wylogowanie
**B1.3** Hashowanie haseł (Web Crypto PBKDF2, 100k iteracji, sól per użytkownik)
**B1.4** Sesje w `SESSION_KV` (rotacja, wygasanie 8 h, unieważnianie)
**B1.5** Tokeny CSRF dla operacji zapisu
**B1.6** Ograniczanie prób logowania (5/15 min per IP w `RATE_LIMIT_KV`)
**B1.7** Model ról — 6 poziomów, macierz uprawnień, middleware per trasa
**B1.8** Dziennik audytu (kto/co/kiedy/z jakiego IP)
**B1.9** 2FA TOTP dla administratora

Kryterium odbioru: `curl /admin` bez sesji → 302 na logowanie; próba zapisu bez CSRF → 403; 6. próba logowania → 429.

**Zależność:** wymaga działającej bazy (`03-BAZA-DANYCH.md`, etap D1–D3).

### Etap B2 — CRUD artykułów *(4–5 dni)*

**B2.1** `POST/PUT/DELETE /admin/articles` + walidacja + sanityzacja HTML
**B2.2** Serializacja bloków `ContentBlock` do i z bazy
**B2.3** Automatyczne generowanie slug + obsługa duplikatów
**B2.4** Wyliczanie czasu czytania i liczby słów
**B2.5** Historia wersji przy każdym zapisie + przywracanie
**B2.6** Autozapis (endpoint `PATCH /admin/articles/:id/autosave`)
**B2.7** Blokada współbieżnej edycji
**B2.8** Soft delete + kosz + przywracanie

### Etap B3 — Workflow publikacji *(2–3 dni)*

**B3.1** Przejścia statusów z kontrolą uprawnień
**B3.2** Zgłoszenie do recenzji + powiadomienie
**B3.3** Akceptacja/odrzucenie z komentarzem
**B3.4** Publikacja planowana + handler cron
**B3.5** Archiwizacja i wycofanie publikacji
**B3.6** Ścieżka audytu zmian statusu

### Etap B4 — Media i galerie *(4–5 dni)*

**B4.1** Upload do R2 (multipart, walidacja MIME, limity)
**B4.2** Generowanie wariantów obrazów (miniatura, karta, hero, OG)
**B4.3** Metadane w D1 + powiązania „gdzie użyte"
**B4.4** CRUD galerii + kolejność + okładka
**B4.5** Upload i przetwarzanie audio (podcast)
**B4.6** Upload wideo + transkodowanie (Cloudflare Stream lub HLS)
**B4.7** Alt-text przez AI (kod istnieje w `src/lib/media/alt-text-ai.ts`)
**B4.8** Operacje zbiorcze (tagowanie, usuwanie)

### Etap B5 — Komentarze i moderacja *(2–3 dni)*

**B5.1** `POST /api/comments` z walidacją, honeypot, Turnstile
**B5.2** Kolejka moderacji + akcje (akceptuj/odrzuć/spam)
**B5.3** Moderacja wstępna przez AI (prompt `comments-moderator` istnieje)
**B5.4** Powiadomienia e-mail o odpowiedziach
**B5.5** Zgłaszanie nadużyć + blokowanie użytkowników/IP

### Etap B6 — Pozostałe zasoby *(3–4 dni)*

**B6.1** CRUD kategorii + kolejność
**B6.2** CRUD użytkowników + role
**B6.3** Ogłoszenia — weryfikacja, publikacja, wygaśnięcie, płatne
**B6.4** Wydarzenia — CRUD + kalendarz
**B6.5** Sołectwa — edycja danych, sołtys, kontakt
**B6.6** Ustawienia portalu + bezpieczne przechowywanie kluczy API
**B6.7** Przekierowania (migracja `0017_redirects.sql`)

### Etap B7 — Zadania cykliczne *(2 dni)*

**B7.1** Handler `scheduled` z routingiem po wyrażeniu cron
**B7.2** Publikacja zaplanowanych (co 10 min)
**B7.3** Wygaszanie ogłoszeń (co godzinę)
**B7.4** Kolejka newslettera
**B7.5** Odświeżanie danych zewnętrznych do KV
**B7.6** Zbieranie RSS (przegląd mediów)
**B7.7** Przeliczanie statystyk
**B7.8** Kopie zapasowe do R2

### Etap B8 — Obserwowalność i testy *(3–4 dni)*

**B8.1** Centralne rejestrowanie błędów do D1 + request ID
**B8.2** Metryki wydajności (czasy zapytań, wolne zapytania)
**B8.3** Testy jednostkowe warstwy modeli (Vitest + Miniflare)
**B8.4** Testy integracyjne tras zapisu
**B8.5** Testy end-to-end krytycznych ścieżek redakcyjnych
**B8.6** Testy uprawnień (każda rola × każda trasa)

---

## Szacunek pracy — back-end

| Etap | Dni |
|---|---|
B1 Bezpieczeństwo i autoryzacja | 3–4 |
B2 CRUD artykułów | 4–5 |
B3 Workflow publikacji | 2–3 |
B4 Media i galerie | 4–5 |
B5 Komentarze | 2–3 |
B6 Pozostałe zasoby | 3–4 |
B7 Zadania cykliczne | 2 |
B8 Obserwowalność i testy | 3–4 |
**Razem** | **23–30 dni** |

**Zależność krytyczna:** cały back-end wymaga wcześniejszego ukończenia `03-BAZA-DANYCH.md` (etapy D1–D3). Bez działającego D1 nie ma czego programować.
