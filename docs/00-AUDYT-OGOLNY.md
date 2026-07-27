# 00 — AUDYT OGÓLNY PROJEKTU izbica24.pl

> **Data audytu:** 2026-07-27
> **Metoda:** analiza statyczna kodu (298 plików, 28 143 LOC) + testy HTTP na żywo na działającej instancji + inspekcja renderowanego HTML + weryfikacja bindingów Cloudflare
> **Commit:** `09033d6`
> **Podgląd:** https://3000-i34sx8g8mz1al9v0fgwa6-b9b802c4.sandbox.novita.ai

---

## 1. Metodologia oceny procentowej

Każdy procent w tym dokumencie jest **liczony według jednej reguły**:

```
% = (funkcje sprawdzone jako DZIAŁAJĄCE end-to-end) / (funkcje wymagane w zakresie)
```

Rozróżniam trzy stany kodu — to rozróżnienie jest krytyczne dla zrozumienia liczb:

| Stan | Definicja | Czy liczę do % |
|---|---|---|
| **DZIAŁA** | Wywołane HTTP, zwraca poprawny rezultat, dane przechodzą przez cały cykl | ✅ 100% |
| **SZKIELET** | Kod istnieje, kompiluje się, ale nie jest podłączony albo zwraca mock/fallback | ⚠️ 20–40% |
| **BRAK** | Nie istnieje | ❌ 0% |

**Dlaczego to ważne:** projekt ma 28 143 linii kodu, co sugeruje zaawansowanie. W rzeczywistości **55 plików zawiera `mock`/`placeholder`/`TODO`/`fallback:true`**. Sama objętość kodu nie oznacza działającej funkcjonalności. Poniższe liczby odzwierciedlają stan faktyczny, nie objętość.

---

## 2. TABELA PODSUMOWUJĄCA — stan realizacji

| Obszar | Realizacja | Stan | Uzasadnienie liczby |
|---|---|---|---|
| **FRONT-END (publiczny)** | **88%** | 🟢 prawie gotowy | Szata 1:1 wdrożona, wszystkie widoki 200, 0 błędów konsoli. Brakuje: testy urządzeń mobilnych, a11y, komponenty interaktywne (komentarze, lightbox) |
| **FRONT-END (panel admina)** | **35%** | 🟡 szkielet UI | 9 widoków renderuje się, ale to statyczny HTML — formularz ma `action="#"` |
| **BACK-END** | **12%** | 🔴 brak logiki | 0 tras POST/PUT/DELETE w panelu. Zero zapisu. Auth fail-open |
| **BAZA DANYCH** | **8%** | 🔴 niepodłączona | 51 migracji istnieje, ale **brak bindingu D1** w `wrangler.jsonc`. 13 kolizji numeracji. Zero tabel utworzonych |
| **API** | **25%** | 🟡 częściowo | ~20 tras istnieje, część 200 z `fallback:true` (puste), część 404 (niezamontowane) |
| **INTEGRACJE** | **10%** | 🔴 kod bez kluczy | Kod OpenAI/Anthropic/Resend realny, ale 0 kluczy, 0 bindingów R2/D1 |
| **AI (generowanie artykułów)** | **30%** | 🟡 backend jest, UI nie | 25 akcji AI + 15 promptów + klient dwóch dostawców. **Zero UI w edytorze** — nic tego nie wywołuje |
| **RAZEM (projekt)** | **≈32%** | 🟡 | Ważone udziałem pracy w każdym obszarze |

---

## 3. Co jest naprawdę zrobione i sprawdzone

### 3.1 Szata graficzna — potwierdzona 1:1

Weryfikacja przez porównanie liczby wystąpień każdej klasy CSS w mockupie vs w renderowanym HTML:

```
hero-side-item  4/4    sygnale-big  6/6    sygnale-md   8/8
news-filter     9/9    news-card  10/10    news-feat    2/2
k-tab         12/12    k-panel      5/5    stat         4/4
cult-card       6/6    portrait-card 3/3   media-card 14/14
zycie-card    16/16    sstat        3/3    mm-filter    9/9
pc-ep         13/13    footer-col   4/4
```

**17 z 17 grup komponentów zgodnych.** CSS przeniesiony bez modyfikacji z linii 12–630 mockupu.

### 3.2 Trasy publiczne — wszystkie sprawdzone HTTP 200

| Typ widoku | Liczba | Test |
|---|---|---|
| Strona główna | 1 | ✅ 200 |
| Kategorie | 11 | ✅ 200 |
| Podkategorie | 67 | ✅ 200 |
| Trzeci poziom | 12 | ✅ 200 |
| Artykuły | 58 | ✅ 200 |
| Sołectwa | 34 + 1 | ✅ 200 |
| Galerie, tag, szukaj, 404 | 4 | ✅ 200 |

### 3.3 Mega-menu — rozszerzenie zrealizowane

Weryfikacja skryptem na renderowanym HTML: **67 podkategorii × dokładnie 4 karty × 4 kropki nawigacyjne, 0 braków.**

### 3.4 Jakość techniczna

- Build: ✅ `dist/_worker.js` 629 kB, 276 modułów
- Konsola przeglądarki: ✅ **0 błędów** (po naprawie brakujących wariantów webp/avif)
- Czas odpowiedzi strony głównej: 70 ms
- Obrazy: 20 × jpg + webp + avif = 60 plików

---

## 4. Ustalenia krytyczne — problemy blokujące

Te punkty **blokują jakiekolwiek działanie produkcyjne** i muszą być rozwiązane pierwsze.

### 🔴 K1. Brak bindingu D1 — baza danych fizycznie nie istnieje

```bash
$ grep -c "d1_databases" wrangler.jsonc
0
```

51 plików migracji SQL leży w `migrations/`, ale **nie ma do czego ich zaaplikować**. Cała warstwa `src/db/models/` (17 plików, 1832 LOC) to kod, który nigdy nie został wykonany.

**Konsekwencja:** portal nie może zapisać ani jednego artykułu. Wszystkie 58 materiałów to stałe w plikach TypeScript.

### 🔴 K2. Kolizje numeracji migracji — 13 duplikatów

```
0001 x2   0002 x2   0003 x2   0004 x2   0005 x2   0006 x2   0007 x2
0008 x2   0009 x2   0010 x3   0011 x2   0012 x2   0013 x2
```

Przykład: `0001_initial_schema.sql` i `0001_users.sql`. Wrangler stosuje migracje w kolejności alfabetycznej — przy takich kolizjach kolejność jest nieprzewidywalna, a zależności (klucze obce) mogą się rozjechać. **Migracje w tym stanie nie nadają się do uruchomienia.**

### 🔴 K3. Panel admina nie zapisuje niczego

```bash
$ grep -cE "admin\.(post|put|patch|delete)\(" src/routes/admin.tsx
0                    # ← zero tras zapisujących
$ grep -cE "admin\.get\(" src/routes/admin.tsx
9                    # ← tylko wyświetlanie
```

Formularz artykułu: `<form class="admin-editor-form" method="post" action="#">` — `action="#"` oznacza, że wysłanie formularza nie robi nic.

Panel wyświetla nawet komunikat „Zmiany zapisują się lokalnie" — co jest nieprawdą, nic się nie zapisuje.

### 🔴 K4. Autoryzacja fail-open — panel otwarty dla wszystkich

```typescript
const requireAdmin = async (c: any, next: any) => {
  const secret = c.env?.JWT_SECRET
  if (!secret) {
    c.set('adminRole', 'admin')   // ← BRAK SEKRETU = KAŻDY JEST ADMINEM
    return next()
  }
  ...
}
```

Potwierdzone testem: `curl /admin` bez żadnego tokenu → **HTTP 200**. Po wdrożeniu bez ustawionego `JWT_SECRET` panel redakcji będzie publicznie dostępny. To luka bezpieczeństwa, nie tylko brak funkcji.

### 🔴 K5. Brak bindingów R2 — media nie mają gdzie się zapisać

Kod w `src/lib/media/r2-upload.ts` odwołuje się do `env.R2_ARTICLES_IMAGES`, `env.R2_ARTICLES_VIDEOS`, `env.R2_PODCAST_AUDIO`. **Żaden z tych bucketów nie jest zadeklarowany** w `wrangler.jsonc`. Upload zdjęć, audio i wideo jest niemożliwy.

### 🟡 K6. Placeholdery ID w KV

Wszystkie 15 namespace'ów KV mają `"id": "replace-*-kv"` — to wartości do zamiany. Lokalnie działa (`preview_id: local-dev`), produkcyjnie **wdrożenie się nie uda**.

### 🟡 K7. Część API niezamontowana (404)

```
/api/v1/health/healthz  → 404      /api/v1/version  → 404
/api/v1/video/list      → 404      /api/ai          → 404
```

Pliki tras istnieją w `src/routes/v1/`, ale nie są podłączone do routera albo mają inne ścieżki niż zakładane.

### 🟡 K8. API zwraca puste dane z flagą fallback

```json
GET /api/v1/media/list      → {"total":0,"items":[],"fallback":true}
GET /api/v1/multimedia/recent → {"items":[],"fallback":true}
```

Endpointy odpowiadają 200, ale są puste — bo nie ma D1 ani R2. To nie jest błąd kodu, to konsekwencja K1 i K5.

### 🟡 K9. AI zwraca mocki

```bash
$ curl -X POST /api/newsroom/suggestHeadlines -d '{"text":"Remont ulicy..."}'
{"ok":true,"result":"{\"mock\":true,\"prompt\":\"Zaproponuj 10 mocnych nagłówków...\"}"}
```

Kod jest poprawny — wywołuje realne API OpenAI/Anthropic. Ale bez klucza wpada w gałąź `return JSON.stringify({ mock: true, prompt })`. Potrzebny klucz API.

### 🟡 K10. AI nie ma żadnego interfejsu

```bash
$ grep -rn "api/newsroom\|api/ai" src/components/ public/static/js/
(brak wyników)
```

25 akcji AI działa po stronie API, ale **żaden element interfejsu ich nie wywołuje**. Z punktu widzenia redaktora funkcja AI nie istnieje.

### 🟡 K11. Zdjęcia z Unsplash w kodzie

~30 URL-i `images.unsplash.com` w kodzie źródłowym. Zewnętrzne hotlinkowanie — ryzyko licencyjne i wydajnościowe. Docelowo wszystkie media powinny być w R2.

---

## 5. Struktura kodu — co gdzie leży

| Katalog | Plików | LOC | Ocena stanu |
|---|---|---|---|
| `src/v4/` (szata v4) | 17 | 8 583 | ✅ **DZIAŁA** — front-end v4 |
| `src/components/` | 70 | 6 501 | ⚠️ mieszane — publiczne działają, admin to szkielet |
| `src/db/models/` | 17 | 1 832 | ⚠️ **SZKIELET** — poprawny SQL, nigdy nie wykonany |
| `src/lib/` (kv, r2, media, search) | 78 | 3 012 | ⚠️ **SZKIELET** — brak bindingów |
| `src/routes/` | 66 | 2 748 | ⚠️ mieszane |
| `src/ai/` | 22 | 1 328 | ⚠️ **SZKIELET** — brak kluczy i UI |
| `src/monitoring/` | 10 | 235 | ⚠️ szkielet |
| `migrations/` | 51 | — | 🔴 **NIEUŻYWANE** + kolizje |

---

## 6. Dlaczego 32%, a nie więcej

Warto to nazwać wprost, bo objętość kodu może mylić:

**To, co działa (front-end publiczny), to warstwa prezentacji zasilana stałymi w plikach TS.** Portal wygląda jak działający serwis informacyjny i ma poprawną strukturę 88 widoków, ale:

- nie da się dodać artykułu inaczej niż edytując kod źródłowy i przebudowując projekt
- nie da się wgrać zdjęcia
- nie ma logowania (a panel jest otwarty)
- nie ma komentarzy, newslettera który wysyła, wyszukiwania po bazie
- AI nie jest dostępne dla redaktora

**Innymi słowy: to bardzo dobrze wykonana, kompletna warstwa front-endowa z demonstracyjną treścią, plus obszerny szkielet warstwy serwerowej, który nie został jeszcze podłączony.**

---

## 7. Mapa dokumentów szczegółowych

| Dokument | Zakres |
|---|---|
| `01-FRONTEND.md` | Widoki, komponenty, JS, responsywność, a11y, wydajność — braki i etapy |
| `02-BACKEND.md` | CRUD, autoryzacja, role, workflow publikacji, kolejki — braki i etapy |
| `03-BAZA-DANYCH.md` | D1, naprawa migracji, schemat, seed, FTS5, backupy — braki i etapy |
| `04-API.md` | Inwentarz endpointów, kontrakty, walidacja, wersjonowanie — braki i etapy |
| `05-INTEGRACJE.md` | R2, KV, e-mail, push, pogoda, mapy, social, RSS — braki i etapy |
| `06-AI.md` | Edytor z AI, generowanie artykułów, dostawcy, search web, koszty — projekt i etapy |
| `07-ROADMAP.md` | Wszystkie etapy w kolejności wykonania, zależności, kryteria odbioru |

---

## 8. Trzy rzeczy do zrobienia natychmiast

Kolejność ma znaczenie — każdy punkt jest warunkiem następnego:

1. **Naprawić migracje i podłączyć D1** (K1 + K2) — bez tego żadna funkcja zapisu nie ma sensu
2. **Zamknąć lukę autoryzacji** (K4) — panel nie może być otwarty
3. **Napisać trasy zapisujące dla panelu** (K3) — dopiero wtedy redakcja może pracować

Szczegóły w `07-ROADMAP.md`.
