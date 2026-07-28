/**
 * AI10 — wspólny rejestr zużycia modeli i dzienny limit tokenów.
 *
 * DLACZEGO OSOBNY PLIK
 * ────────────────────
 * Audyt z 27.07.2026 wykazał, że `recordUsage` i `checkBudget` istniały
 * wyłącznie wewnątrz `src/routes/v1/ai.ts` jako funkcje prywatne. Skutek:
 * trzy pozostałe trasy wywołujące płatne modele (`/api/newsroom`, `/api/ai`,
 * `/api/rag`) nie zapisywały ani jednego wywołania. Panel „Zużycie AI"
 * pokazywałby zero przy realnym rachunku u dostawcy — a dzienny limit,
 * liczony z tabeli `ai_generations`, nie widziałby tych wywołań i nigdy by
 * się nie wyczerpał.
 *
 * Limit oparty na niepełnych danych jest groźniejszy od braku limitu, bo
 * daje fałszywe poczucie kontroli. Dlatego pomiar musi być w jednym miejscu
 * i obowiązywać każdą trasę, która dotyka modelu.
 *
 * PROJEKT ODPORNY NA BRAK BAZY
 * ────────────────────────────
 * Zapis błędu nie może przerwać pracy redakcji: gdy `DB` nie jest podpięte
 * (test jednostkowy, awaria bindingu), `recordUsage` milczy, a `checkBudget`
 * przepuszcza. Ta decyzja jest świadoma — alternatywa (blokada przy braku
 * bazy) zatrzymałaby cały newsroom przy awarii warstwy pomiarowej.
 */

import type { Context } from 'hono'

/**
 * Dzienny limit tokenów wspólny dla wszystkich tras AI.
 *
 * Wartość jest nadpisywalna zmienną `AI_DAILY_TOKEN_LIMIT`, bo próg zależy
 * od cennika dostawcy i wielkości redakcji — twarda liczba w kodzie
 * wymuszałaby wdrożenie przy każdej zmianie planu.
 */
export const DEFAULT_DAILY_TOKEN_LIMIT = 200_000

type MinimalStatement = {
  bind(...values: unknown[]): {
    first<T>(): Promise<T | null>
    run(): Promise<unknown>
  }
}

type MinimalDb = { prepare(query: string): MinimalStatement }

const dbOf = (c: Context): MinimalDb | undefined => {
  const env = (c as unknown as { env?: Record<string, unknown> }).env
  return (env?.DB as MinimalDb | undefined) ?? undefined
}

const limitOf = (c: Context): number => {
  const env = (c as unknown as { env?: Record<string, unknown> }).env
  const raw = env?.AI_DAILY_TOKEN_LIMIT
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_TOKEN_LIMIT
}

export interface UsageRecord {
  userId: number | null
  provider: string
  model: string
  /** Operacja w formie „obszar:akcja", np. `newsroom:autoTitle`, `rag:ask`. */
  action: string
  inputTokens: number
  outputTokens: number
  ms: number
  ok: boolean
  error?: string
  articleId?: number | null
}

/**
 * Zapisuje jedno wywołanie modelu do `ai_generations`.
 *
 * Wywołania nieudane zapisujemy również — bez nich nie da się odpowiedzieć
 * na pytanie „czy dostawca odrzuca nasze żądania", a część dostawców
 * nalicza opłatę także za żądanie zakończone błędem po stronie modelu.
 */
export const recordAiUsage = async (c: Context, data: UsageRecord): Promise<void> => {
  const db = dbOf(c)
  if (!db) return
  try {
    await db
      .prepare(
        `INSERT INTO ai_generations
           (user_id, provider, model, action, input_tokens, output_tokens,
            duration_ms, outcome, error_message, article_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.userId,
        data.provider,
        data.model,
        data.action,
        data.inputTokens,
        data.outputTokens,
        data.ms,
        data.ok ? 'ok' : 'error',
        data.error ?? null,
        data.articleId ?? null,
      )
      .run()
  } catch (error) {
    console.error('[ai] nie zapisano zuzycia:', error)
  }
}

export interface BudgetState {
  allowed: boolean
  used: number
  limit: number
  percent: number
}

/** Stan dziennego limitu tokenów liczony z `ai_generations`. */
export const checkAiBudget = async (c: Context): Promise<BudgetState> => {
  const limit = limitOf(c)
  const db = dbOf(c)
  if (!db) return { allowed: true, used: 0, limit, percent: 0 }

  try {
    const row = await db
      .prepare(
        `SELECT COALESCE(SUM(input_tokens + output_tokens), 0) AS n
           FROM ai_generations
          WHERE created_at >= date('now', 'start of day')`,
      )
      .bind()
      .first<{ n: number }>()
    const used = row?.n ?? 0
    return {
      allowed: used < limit,
      used,
      limit,
      percent: limit > 0 ? Math.round((used / limit) * 100) : 0,
    }
  } catch {
    // Brak tabeli nie może blokować pracy redakcji.
    return { allowed: true, used: 0, limit, percent: 0 }
  }
}

/**
 * Przybliżona liczba tokenów tekstu, gdy dostawca nie zwrócił `usage`.
 *
 * Nie udajemy dokładności: dla polszczyzny stosunek znaków do tokenów mieści
 * się w okolicach 3,2–4,0. Bierzemy 3,5. Wartość szacunkowa jest lepsza od
 * zapisanego zera, które zaniżałoby wykorzystanie limitu i czyniło go
 * bezużytecznym właśnie u tych dostawców, którzy nie raportują tokenów.
 */
export const estimateTokens = (text: string): number =>
  text ? Math.max(1, Math.ceil(text.length / 3.5)) : 0
