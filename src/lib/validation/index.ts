/**
 * FAZA 2 / B5 — Publiczny punkt wejścia warstwy walidacji
 *
 * Trasy importują wyłącznie z tego pliku:
 *
 *   import { parseJson, articleCreateSchema } from '../../lib/validation'
 *
 * Dzięki temu przeniesienie schematu między plikami nie wymaga zmiany
 * importów w kilkudziesięciu trasach.
 *
 * Rejestr `SCHEMA_REGISTRY` na końcu pliku jest wystawiany pod
 * `GET /api/v1/schemas` jako samodokumentacja API — integrator (n8n,
 * aplikacja mobilna) widzi wprost, czego oczekuje każdy endpoint,
 * bez czytania kodu.
 */

export * from './core'
export * from './primitives'
export * from './blocks'
export * from './schemas/articles'
export * from './schemas/comments'
export * from './schemas/media'
export * from './schemas/misc'

import { z, type ZodTypeAny } from 'zod'
import * as articles from './schemas/articles'
import * as comments from './schemas/comments'
import * as media from './schemas/media'
import * as misc from './schemas/misc'
import { BLOCK_TYPES } from './blocks'
import { SOLECTWA, PUBLISH_STATUSES, CONTENT_TYPES, COMMENT_STATUSES, USER_ROLES } from './primitives'

export interface SchemaEntry {
  /** Metoda i ścieżka, dla których schemat obowiązuje. */
  endpoint: string
  /** Gdzie w żądaniu leżą dane. */
  target: 'json' | 'query' | 'param' | 'form' | 'multipart'
  /** Nazwa schematu — do wyszukania w kodzie. */
  schema: string
  opis: string
}

/**
 * Mapa endpoint → schemat. Utrzymywana ręcznie, bo Hono nie udostępnia
 * introspekcji tras z powiązanymi schematami. Rozbieżność między tą mapą
 * a rzeczywistością wyłapuje test `scripts/verify-validation.mjs`, który
 * sprawdza, czy każdy wymieniony tu schemat naprawdę istnieje.
 */
export const SCHEMA_REGISTRY: SchemaEntry[] = [
  // ── Artykuły (A4) ───────────────────────────────────────────────────────
  { endpoint: 'POST /api/v1/articles', target: 'json', schema: 'articleCreateSchema', opis: 'Utworzenie artykułu jako szkic lub do recenzji.' },
  { endpoint: 'GET /api/v1/articles', target: 'query', schema: 'articleListQuerySchema', opis: 'Lista artykułów z filtrowaniem i stronicowaniem.' },
  { endpoint: 'GET /api/v1/articles/:id', target: 'param', schema: 'articleIdParamSchema', opis: 'Pojedynczy artykuł po identyfikatorze.' },
  { endpoint: 'PUT /api/v1/articles/:id', target: 'json', schema: 'articleUpdateSchema', opis: 'Nadpisanie całego artykułu.' },
  { endpoint: 'PATCH /api/v1/articles/:id', target: 'json', schema: 'articlePatchSchema', opis: 'Zapis częściowy — autozapis edytora.' },
  { endpoint: 'PUT /api/v1/articles/:id/blocks', target: 'json', schema: 'articleBlocksSchema', opis: 'Zapis samych bloków treści.' },
  { endpoint: 'POST /api/v1/articles/:id/publish', target: 'json', schema: 'articlePublishSchema', opis: 'Publikacja — poprzedzona bramą jakościową.' },
  { endpoint: 'POST /api/v1/articles/:id/unpublish', target: 'json', schema: 'articleUnpublishSchema', opis: 'Wycofanie z publikacji, powód wymagany.' },
  { endpoint: 'POST /api/v1/articles/:id/schedule', target: 'json', schema: 'articleScheduleSchema', opis: 'Zaplanowanie publikacji na przyszłość.' },
  { endpoint: 'POST /api/v1/articles/:id/status', target: 'json', schema: 'articleStatusSchema', opis: 'Zmiana stanu w przepływie redakcyjnym (B4).' },
  { endpoint: 'POST /api/v1/articles/:id/duplicate', target: 'json', schema: 'articleDuplicateSchema', opis: 'Powielenie artykułu.' },
  { endpoint: 'POST /api/v1/articles/:id/restore', target: 'json', schema: 'articleRestoreSchema', opis: 'Przywrócenie wcześniejszej wersji (D9).' },

  // ── Komentarze (A6) ─────────────────────────────────────────────────────
  { endpoint: 'POST /api/v1/articles/:slug/comments', target: 'json', schema: 'commentCreateSchema', opis: 'Dodanie komentarza czytelnika.' },
  { endpoint: 'GET /api/v1/comments', target: 'query', schema: 'commentListQuerySchema', opis: 'Kolejka moderacyjna i listy komentarzy.' },
  { endpoint: 'POST /api/v1/comments/:id/moderate', target: 'json', schema: 'commentModerateSchema', opis: 'Zatwierdzenie, odrzucenie lub oznaczenie jako spam.' },
  { endpoint: 'POST /api/v1/comments/bulk-moderate', target: 'json', schema: 'commentBulkModerateSchema', opis: 'Moderacja zbiorcza.' },
  { endpoint: 'PUT /api/v1/comments/:id', target: 'json', schema: 'commentEditSchema', opis: 'Redakcyjna zmiana treści komentarza z uzasadnieniem.' },
  { endpoint: 'POST /api/v1/comments/:id/report', target: 'json', schema: 'commentReportSchema', opis: 'Zgłoszenie komentarza przez czytelnika.' },

  // ── Media (A5, I11) ─────────────────────────────────────────────────────
  { endpoint: 'POST /api/v1/media/upload', target: 'multipart', schema: 'mediaUploadMetaSchema', opis: 'Wgranie pliku wraz z danymi o prawach autorskich.' },
  { endpoint: 'GET /api/v1/media/list', target: 'query', schema: 'mediaListQuerySchema', opis: 'Biblioteka mediów.' },
  { endpoint: 'PUT /api/v1/media/:id', target: 'json', schema: 'mediaUpdateSchema', opis: 'Zmiana opisu i danych licencyjnych.' },
  { endpoint: 'POST /api/v1/media/tag', target: 'json', schema: 'mediaTagSchema', opis: 'Dodanie i usunięcie znaczników.' },
  { endpoint: 'POST /api/v1/media/bulk', target: 'json', schema: 'mediaBulkSchema', opis: 'Operacje zbiorcze na plikach.' },
  { endpoint: 'POST /api/v1/media/multipart/init', target: 'json', schema: 'multipartInitSchema', opis: 'Rozpoczęcie wgrywania pliku powyżej 100 MB.' },
  { endpoint: 'PUT /api/v1/media/multipart/part', target: 'query', schema: 'multipartPartSchema', opis: 'Przesłanie jednej części.' },
  { endpoint: 'POST /api/v1/media/multipart/complete', target: 'json', schema: 'multipartCompleteSchema', opis: 'Złożenie części w jeden obiekt R2.' },
  { endpoint: 'POST /api/v1/galleries/create', target: 'json', schema: 'galleryCreateSchema', opis: 'Utworzenie galerii.' },
  { endpoint: 'POST /api/v1/galleries/add-image', target: 'json', schema: 'galleryAddImageSchema', opis: 'Dodanie zdjęć do galerii.' },
  { endpoint: 'POST /api/v1/galleries/reorder', target: 'json', schema: 'galleryReorderSchema', opis: 'Zmiana kolejności zdjęć.' },
  { endpoint: 'POST /api/v1/galleries/publish', target: 'json', schema: 'galleryPublishSchema', opis: 'Publikacja galerii.' },
  { endpoint: 'POST /api/v1/videos/upload', target: 'multipart', schema: 'videoMetaSchema', opis: 'Wgranie materiału wideo.' },
  { endpoint: 'POST /api/v1/audio/upload', target: 'multipart', schema: 'audioMetaSchema', opis: 'Wgranie nagrania audio lub odcinka podcastu.' },

  // ── Newsletter, kontakt ─────────────────────────────────────────────────
  { endpoint: 'POST /api/v1/newsletter/subscribe', target: 'json', schema: 'newsletterSubscribeSchema', opis: 'Zapis na newsletter z jawną zgodą.' },
  { endpoint: 'POST /api/v1/newsletter/confirm', target: 'json', schema: 'newsletterConfirmSchema', opis: 'Potwierdzenie adresu (double opt-in).' },
  { endpoint: 'POST /api/v1/newsletter/unsubscribe', target: 'json', schema: 'newsletterUnsubscribeSchema', opis: 'Rezygnacja na podstawie tokenu.' },
  { endpoint: 'POST /api/v1/newsletter/send', target: 'json', schema: 'newsletterSendSchema', opis: 'Wysyłka wydania.' },
  { endpoint: 'POST /api/v1/contact', target: 'json', schema: 'contactSchema', opis: 'Formularz kontaktowy.' },
  { endpoint: 'POST /api/v1/sprostowanie', target: 'json', schema: 'correctionRequestSchema', opis: 'Wniosek o sprostowanie (art. 31a prawa prasowego).' },

  // ── Wyszukiwanie ────────────────────────────────────────────────────────
  { endpoint: 'GET /api/v1/search', target: 'query', schema: 'searchQuerySchema', opis: 'Wyszukiwanie pełnotekstowe (FTS5).' },
  { endpoint: 'GET /api/v1/search/suggest', target: 'query', schema: 'suggestQuerySchema', opis: 'Podpowiedzi wyszukiwania.' },

  // ── Ogłoszenia i wydarzenia ─────────────────────────────────────────────
  { endpoint: 'POST /api/v1/nekrologi', target: 'json', schema: 'obituarySchema', opis: 'Zgłoszenie nekrologu.' },
  { endpoint: 'POST /api/v1/praca', target: 'json', schema: 'jobOfferSchema', opis: 'Zgłoszenie oferty pracy.' },
  { endpoint: 'POST /api/v1/nieruchomosci', target: 'json', schema: 'realEstateSchema', opis: 'Zgłoszenie ogłoszenia nieruchomości.' },
  { endpoint: 'GET /api/v1/ogloszenia', target: 'query', schema: 'announcementListQuerySchema', opis: 'Lista ogłoszeń.' },
  { endpoint: 'POST /api/v1/events', target: 'json', schema: 'eventSchema', opis: 'Dodanie wydarzenia do kalendarza.' },
  { endpoint: 'GET /api/v1/events', target: 'query', schema: 'eventListQuerySchema', opis: 'Kalendarz wydarzeń.' },

  // ── Powiadomienia ───────────────────────────────────────────────────────
  { endpoint: 'POST /api/v1/push/subscribe', target: 'json', schema: 'pushSubscribeSchema', opis: 'Rejestracja urządzenia do powiadomień.' },
  { endpoint: 'POST /api/v1/push/send', target: 'json', schema: 'pushSendSchema', opis: 'Wysłanie powiadomienia.' },

  // ── Panel administracyjny ───────────────────────────────────────────────
  { endpoint: 'POST /api/v1/admin/users', target: 'json', schema: 'userCreateSchema', opis: 'Utworzenie konta redakcyjnego.' },
  { endpoint: 'PUT /api/v1/admin/users/:id', target: 'json', schema: 'userUpdateSchema', opis: 'Zmiana danych i roli użytkownika.' },
  { endpoint: 'GET /api/v1/admin/users', target: 'query', schema: 'userListQuerySchema', opis: 'Lista użytkowników.' },
  { endpoint: 'PUT /api/v1/admin/settings', target: 'json', schema: 'settingsUpdateSchema', opis: 'Zapis ustawień portalu.' },

  // ── Integracje ──────────────────────────────────────────────────────────
  { endpoint: 'POST /api/v1/incoming', target: 'json', schema: 'incomingSchema', opis: 'Mostek n8n — zamknięta lista źródeł.' },
]

/** Wszystkie eksportowane schematy — do sprawdzenia spójności rejestru. */
export const ALL_SCHEMAS: Record<string, ZodTypeAny> = {
  ...(articles as unknown as Record<string, ZodTypeAny>),
  ...(comments as unknown as Record<string, ZodTypeAny>),
  ...(media as unknown as Record<string, ZodTypeAny>),
  ...(misc as unknown as Record<string, ZodTypeAny>),
}

/**
 * Dane wystawiane pod `GET /api/v1/schemas`. Nie zawierają samych schematów
 * (Zod nie serializuje się do JSON), lecz opis endpointów i listy słowników,
 * których wartości klient musi znać, żeby wysłać poprawne żądanie.
 */
export const validationManifest = () => ({
  liczbaEndpointow: SCHEMA_REGISTRY.length,
  endpointy: SCHEMA_REGISTRY,
  slowniki: {
    statusyPublikacji: PUBLISH_STATUSES,
    typyTresci: CONTENT_TYPES,
    typyBlokow: BLOCK_TYPES,
    statusyKomentarzy: COMMENT_STATUSES,
    roleUzytkownikow: USER_ROLES,
    solectwa: SOLECTWA,
    licencjeMediow: media.MEDIA_LICENSES,
    zrodlaIntegracji: misc.INCOMING_SOURCES,
    dozwoloneFormatyPlikow: Object.keys(media.ALLOWED_MIME),
  },
  kontraktBledu: {
    kod: 'validation_error',
    status: 400,
    kształt: {
      ok: false,
      error: { code: 'validation_error', message: 'string', details: { pola: [{ pole: 'string', problem: 'string' }] } },
      requestId: 'string',
    },
  },
})

/** Sprawdzenie spójności rejestru — używane przez skrypt weryfikacyjny. */
export const registryProblems = (): string[] => {
  const problems: string[] = []
  for (const entry of SCHEMA_REGISTRY) {
    const schema = ALL_SCHEMAS[entry.schema]
    if (!schema) {
      problems.push(`Rejestr wskazuje schemat „${entry.schema}” (${entry.endpoint}), którego nie ma w eksportach.`)
      continue
    }
    if (!(schema instanceof z.ZodType)) {
      problems.push(`Wpis „${entry.schema}” (${entry.endpoint}) nie jest schematem Zod.`)
    }
  }
  return problems
}
