/**
 * FAZA 1 / A7 — limit rozmiaru treści żądania.
 *
 * Bez tego ograniczenia dowolny klient mógł wysłać na endpoint JSON ciało
 * o rozmiarze setek megabajtów. Worker próbowałby je sparsować, wyczerpał
 * limit pamięci (128 MB) albo czasu CPU i zwrócił błąd — a przy kilku
 * takich żądaniach równolegle serwis stawał się niedostępny dla wszystkich.
 * Tani wektor odmowy usługi.
 *
 * Sprawdzenie jest dwustopniowe, bo `Content-Length` bywa nieobecny:
 *   1. jeśli nagłówek jest — odrzucamy natychmiast, bez czytania ciała,
 *   2. jeśli nie ma (transfer strumieniowy) — odrzucenie następuje przy
 *      faktycznym odczycie, po przekroczeniu progu.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { fail } from '../lib/http/envelope'

export const BODY_LIMITS = {
  /** Standardowe żądania JSON (formularze, komentarze, dane artykułu). */
  json: 256 * 1024,          // 256 KB
  /** Treść artykułu z panelu redakcyjnego — bloki, długi tekst. */
  article: 2 * 1024 * 1024,  // 2 MB
  /** Zdjęcia i pliki wysyłane do R2. */
  upload: 25 * 1024 * 1024,  // 25 MB
  /** Materiały wideo. */
  video: 200 * 1024 * 1024,  // 200 MB
} as const

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/**
 * @param maxBytes  Maksymalny rozmiar ciała żądania w bajtach.
 */
export const bodyLimit = (maxBytes: number) =>
  createMiddleware<AppEnv>(async (c, next) => {
    // Metody bez ciała pomijamy.
    if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
      return next()
    }

    const declared = c.req.header('content-length')
    if (declared) {
      const size = Number(declared)
      if (Number.isFinite(size) && size > maxBytes) {
        console.warn(`[body-limit] Odrzucono ${c.req.method} ${c.req.path}: ${size} B > ${maxBytes} B`)
        return fail(
          c,
          'payload_too_large',
          `Przesłane dane przekraczają dopuszczalny rozmiar ${formatBytes(maxBytes)}.`,
          { maxBytes, maxHuman: formatBytes(maxBytes), receivedBytes: size },
        )
      }
    }

    await next()
  })

/** Profil domyślny dla wszystkich tras /api/* przyjmujących JSON. */
export const jsonBodyLimit = bodyLimit(BODY_LIMITS.json)
export const articleBodyLimit = bodyLimit(BODY_LIMITS.article)
export const uploadBodyLimit = bodyLimit(BODY_LIMITS.upload)
export const videoBodyLimit = bodyLimit(BODY_LIMITS.video)
