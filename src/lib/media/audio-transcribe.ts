import type { Bindings } from '../../types/env'

/**
 * Transkrypcja nagrania — STAN: NIEZREALIZOWANA, i tak jest zapisywana.
 *
 * DLACZEGO USUNIETO POPRZEDNIA IMPLEMENTACJE
 * ──────────────────────────────────────────
 * Poprzednia wersja robila to:
 *
 *     const prompt = `Przygotuj roboczą transkrypcję audio po polsku na
 *       podstawie metadanych pliku ${filename}...`
 *     return callTextModel(env, prompt, ...)
 *
 * Model jezykowy nie dostawal nagrania — dostawal NAZWE PLIKU. Nie da sie
 * odtworzyc tresci wypowiedzi z napisu „sesja-rady-2026-03.mp3": model mogl
 * jedynie napisac, co prawdopodobnie zostalo powiedziane na sesji rady gminy.
 * Wynik szedl do kolumny `audios.transcript_text` i byl odtad traktowany jak
 * transkrypcja — czyli jak zapis tego, co ktos naprawde powiedzial.
 *
 * Dla portalu informacyjnego to najgrozniejszy rodzaj bledu, jaki znalazl sie
 * w tym projekcie: zmyslone cytaty przypisane rzeczywistym radnym, mieszkancom
 * i urzednikom, opublikowane pod nagraniem jako jego zapis. Nazwa pliku
 * z data i tematem sprawia, ze taki tekst brzmi wiarygodnie, a wiec nikt go
 * nie sprawdza.
 *
 * CO ZAMIAST TEGO
 * ───────────────
 * Zwracamy `null`. Kolumna zostaje pusta, a panel pokazuje „brak transkrypcji" —
 * stan zgodny z rzeczywistoscia. Puste pole widac i da sie uzupelnic; pole
 * wypelnione zmyslona trescia wyglada na gotowe.
 *
 * Prawidlowa realizacja wymaga modelu mowa-na-tekst (Whisper przez OpenAI
 * `/v1/audio/transcriptions` albo Workers AI `@cf/openai/whisper`), do ktorego
 * trafia ZAWARTOSC pliku, nie jego nazwa. To zadanie osobne od FAZY 3 —
 * `providers.ts` obsluguje uzupelnianie tekstu, a nie przesylanie nagran,
 * i dodanie tego kanalu wymaga wlasnego adaptera oraz limitu rozmiaru
 * (nagranie sesji rady to kilkadziesiat MB, a Worker ma limit czasu procesora).
 */

export interface TranscriptionResult {
  /** Tekst transkrypcji albo `null`, gdy nie zostala wykonana. */
  text: string | null
  /** Powod braku — trafia do odpowiedzi API, zeby panel mial co pokazac. */
  reason: 'niezaimplementowano' | null
}

export const transcribeAudio = async (
  _env: Bindings,
  _filename: string,
  _context = '',
): Promise<TranscriptionResult> => ({
  text: null,
  reason: 'niezaimplementowano',
})
