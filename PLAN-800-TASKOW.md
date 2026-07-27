# PLAN 800 ZADAŃ — 4 partie po 200 zadań

**Cel:** domknięcie FAZY 2, domknięcie FAZY 3, wykonanie CAŁEJ FAZY 4.
**Źródło zakresu:** `docs/07-ROADMAP.md` (52 etapy).
**Tryb pracy:** równoległe strumienie — pliki rozłączne, jeden build na partię.

---

## PARTIA 1 (zadania 001–200) — DOMKNIĘCIE FAZY 2

| Strumień | Etap | Zakres | Zadań |
|---|---|---|---|
| 1A | **A5** | Media: sniff MIME, multipart >100 MB, warianty webp/avif, dedupe `content_hash`, galerie CRUD+reorder, wideo, audio, podcast RSS, `MediaUploader` z `action` | 001–080 |
| 1B | **I11** | 51 obrazów zewnętrznych → R2; kolumny `author`/`license`/`source`; reguła CI blokująca hotlinki | 081–140 |
| 1C | **I9** | Weryfikacja Turnstile po stronie serwera + 7 formularzy publicznych | 141–170 |
| 1D | **D4-seed** | Konwerter `ARTICLES_V4[]`→SQL, seed 58 artykułów / 4 autorów / 3 galerii / 34 sołectw | 171–200 |

**Kryterium wyjścia:** 5/5 punktów kryterium FAZY 2.

---

## PARTIA 2 (zadania 201–400) — DOMKNIĘCIE FAZY 3

| Strumień | Etap | Zakres | Zadań |
|---|---|---|---|
| 2A | **AI3** 🔴 | Panel AI w edytorze: panel boczny, menu zaznaczenia, komenda `/ai`, 25 akcji, podgląd różnicowy, cofanie, historia z kosztem | 201–280 |
| 2B | **AI4 + AI5** | `POST /ai/write-article` → `ContentBlock[]`, 2–3 warianty, 8 presetów, suwaki | 281–330 |
| 2C | **AI9** | Fact-check, kontrola 34 sołectw, weryfikacja liczb/dat, plagiat, czytelność, blokada publikacji | 331–370 |
| 2D | **AI2/AI10/AI11/AI12** | `/admin/settings/ai`, AES-GCM, `/admin/ai/usage`, nota AI + polityka + schema.org, backoff + fallback + kill switch | 371–400 |

**Kryterium wyjścia:** 5/5 punktów kryterium FAZY 3 (AI6/AI7 wymagają kluczy — realizowane jako gotowy kod + flaga).

---

## PARTIA 3 (zadania 401–600) — FAZA 4, część 1

| Strumień | Etap | Zakres | Zadań |
|---|---|---|---|
| 3A | **I7** | E-mail Resend, SPF/DKIM/DMARC, 6 szablonów HTML, podwójna zgoda, wysyłka wsadowa, odbicia, naprawa 500 na `/newsletter/subscribe` | 401–460 |
| 3B | **D5** | FTS5 polski, indeks artykułów, rozstrzygnięcie FTS vs `polish-stemmer.ts`, podłączenie `/szukaj`, hybryda | 461–510 |
| 3C | **I8** | Push: Service Worker, VAPID przez Web Crypto, preferencje kategorii, segmentacja, zabezpieczenie `/send-broadcast` | 511–560 |
| 3D | **I5** | Pogoda/powietrze: Open-Meteo, IMGW-PIB, GIOŚ, cache 10 min, ostrzeżenia → „Na sygnale", usunięcie wartości pozornych | 561–600 |

---

## PARTIA 4 (zadania 601–800) — FAZA 4, część 2

| Strumień | Etap | Zakres | Zadań |
|---|---|---|---|
| 4A | **I6** | Agregator RSS: `external_sources` + `external_items`, parser RSS/Atom, 7 źródeł, filtr po 34 sołectwach, ocena AI, kolejka zatwierdzania | 601–670 |
| 4B | **D7** | Backup: bucket `izbica24-system`, `d1-export` → `encrypt` → `r2-snapshot`, retencja 7/4/12, test odtworzenia | 671–710 |
| 4C | **I12** | Cloudflare Web Analytics, uptime monitor, Sentry, alerty, `ip-anonymize`, baner cookies blokujący | 711–750 |
| 4D | **I10** | Mapy: lat/lng 34 sołectw, MapLibre GL + OSM, mapa gminy, geolokalizacja „Na sygnale", mapa inwestycji | 751–800 |

**Kryterium wyjścia:** cała FAZA 4 wykonana.
