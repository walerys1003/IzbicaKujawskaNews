/**
 * FAZA 3 / AI1 — 25 akcji redakcyjnych na wspolnym adapterze dostawcy.
 *
 * CO ZMIENIONO
 * ────────────
 * 1. Adresy `https://api.openai.com` i `https://api.anthropic.com` byly wpisane
 *    na stale (linie 23-24 poprzedniej wersji), wiec dostawca pod wlasnym
 *    adresem nie mial jak zostac uzyty — nawet gdy klucz byl poprawny.
 *
 * 2. Funkcja `run()` przy braku klucza konczyla sie tak:
 *
 *        return JSON.stringify({ mock: true, prompt })
 *
 *    Redaktor, ktory kliknal „Zaproponuj naglowki", dostawal wtedy w polu
 *    wynikow napis z wlasnym poleceniem w srodku. To lepsze niz zmyslona tresc
 *    (`mock: true` jest widoczne), ale nadal odpowiedz o statusie sukcesu —
 *    panel nie mial powodu pokazac bledu konfiguracji. Teraz `complete()`
 *    podnosi `AiProviderError('brak_konfiguracji')`, a trasa odpowiada 503.
 *
 * 3. Wybor dostawcy: `run(..., 'anthropic')` przy czterech akcjach wymagajacych
 *    ostrozniejszej oceny (`checkFacts`, `detectDuplicate`, `compareArticles`)
 *    zostal zachowany jako PODPOWIEDZ, nie wymog. Jesli administrator
 *    skonfigurowal jednego dostawce, wszystkie akcje ida do niego — wczesniej
 *    `checkFacts` przy samym kluczu OpenAI cicho zmienialo dostawce, a przy
 *    braku obu zwracalo `mock`.
 */

import type { Bindings } from '../../types/env'
import { complete, type ProviderConfig } from '../providers'

export type NewsroomBindings = {
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_BASE_URL?: string
  OPENAI_BASE_URL?: string
  AI_DEFAULT_PROVIDER?: string
  AI_DEFAULT_MODEL?: string
}

export type NewsroomInput = {
  text?: string
  title?: string
  category?: string
  tags?: string[]
  language?: string
  articleA?: string
  articleB?: string
  articles?: Array<{ title?: string; text?: string; date?: string; url?: string }>
  comment?: string
  facts?: string[]
  quotes?: string[]
  keywords?: string[]
  audience?: string
  context?: string
}

const systemPrompt = 'Jesteś newsroom AI dla lokalnego portalu informacyjnego. Odpowiadaj po polsku, zwięźle, redakcyjnie i konkretnie. Zwracaj wyłącznie użyteczny wynik dla zadanej funkcji.'

/**
 * Jedno wejscie dla wszystkich 25 akcji.
 *
 * `preferowanyDostawca` jest podpowiedzia: uzywamy go tylko wtedy, gdy jego
 * klucz jest dostepny ORAZ administrator nie wskazal dostawcy wprost przez
 * `AI_DEFAULT_PROVIDER`. Konfiguracja czlowieka ma pierwszenstwo nad nazwa
 * zapisana w kodzie — inaczej wpisany w panelu klucz bylby pomijany.
 *
 * Brak dostawcy = wyjatek `AiProviderError('brak_konfiguracji')`, nigdy
 * odpowiedz zastepcza. Wolant (`src/routes/ai-newsroom.ts`) zamienia go na 503.
 */
async function run(
  bindings: NewsroomBindings,
  prompt: string,
  preferowanyDostawca?: 'openai' | 'anthropic',
): Promise<string> {
  const env = bindings as unknown as Bindings

  let override: Partial<ProviderConfig> | undefined
  if (preferowanyDostawca === 'anthropic' && bindings.ANTHROPIC_API_KEY && !bindings.AI_DEFAULT_PROVIDER) {
    override = { kind: 'anthropic' }
  }

  const result = await complete(
    env,
    {
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      maxTokens: 1200,
    },
    override,
  )
  return result.text
}

const toBlock = (input: NewsroomInput) => JSON.stringify(input || {}, null, 2)

export const suggestHeadlines = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Zaproponuj 10 mocnych nagłówków dla materiału. Dane:
${toBlock(i)}`)
export const generateLead = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Napisz 3 wersje leadu do artykułu. Dane:
${toBlock(i)}`)
export const improveText = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Ulepsz tekst zachowując fakty, skróć powtórzenia i popraw rytm. Dane:
${toBlock(i)}`)
export const proofread = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Skoryguj błędy językowe i interpunkcyjne. Zwróć poprawioną wersję oraz krótką listę zmian. Dane:
${toBlock(i)}`)
export const expandStub = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Rozwiń szkic artykułu do pełnego materiału lokalnego. Dane:
${toBlock(i)}`)
export const summarize = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Stwórz zwięzłe streszczenie tekstu w 5 punktach i 1 akapicie. Dane:
${toBlock(i)}`)
export const extractKeywords = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Wyciągnij 15 słów kluczowych SEO oraz 5 entity. Dane:
${toBlock(i)}`)
export const classifyCategory = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Przypisz najlepszą kategorię i 3 alternatywne sekcje redakcyjne. Dane:
${toBlock(i)}`)
export const suggestTags = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Zaproponuj 15 tagów portalu wraz z priorytetem. Dane:
${toBlock(i)}`)
export const generateSeoMeta = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Przygotuj SEO title, meta description, OG title, OG description. Dane:
${toBlock(i)}`)
export const translateToEN = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Przetłumacz materiał na angielski w stylu newsroomowym. Dane:
${toBlock(i)}`)
export const simplifyB1 = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Uprość tekst do poziomu B1 bez utraty sensu. Dane:
${toBlock(i)}`)
export const suggestImage = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Opisz 5 propozycji ilustracji/zdjęć do artykułu z briefem dla fotoreportera lub generatora. Dane:
${toBlock(i)}`)
export const moderateComment = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Oceń komentarz pod kątem mowy nienawiści, spamu i ryzyka prawnego. Zwróć werdykt i uzasadnienie. Dane:
${toBlock(i)}`)
export const checkFacts = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Wypisz twierdzenia wymagające weryfikacji i poziom ryzyka halucynacji. Dane:
${toBlock(i)}`, 'anthropic')
export const extractQuotes = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Wyodrębnij cytaty, mówców i kontekst. Dane:
${toBlock(i)}`)
export const socialSnippets = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Przygotuj posty social dla Facebooka, X i Instagramu. Dane:
${toBlock(i)}`)
export const newsletterBlurb = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Napisz krótki teaser newsletterowy do wydania tygodniowego. Dane:
${toBlock(i)}`)
export const pushNotification = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Stwórz 5 wersji web push max 90 znaków + CTA. Dane:
${toBlock(i)}`)
export const suggestRelated = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Zaproponuj 8 linków powiązanych i uzasadnij powiązania. Dane:
${toBlock(i)}`)
export const detectDuplicate = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Porównaj materiały i oceń, czy są duplikatem, follow-upem lub nowym wątkiem. Dane:
${toBlock(i)}`, 'anthropic')
export const generateFAQ = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Wygeneruj FAQ na podstawie treści artykułu. Dane:
${toBlock(i)}`)
export const timelineFromArticles = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Ułóż chronologiczną oś czasu na podstawie artykułów. Dane:
${toBlock(i)}`)
export const compareArticles = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Porównaj dwa artykuły: podobieństwa, różnice, luki, propozycja scalonego angle. Dane:
${toBlock(i)}`, 'anthropic')
export const autoTitle = (b: NewsroomBindings, i: NewsroomInput) => run(b, `Wygeneruj finalny tytuł główny, SEO i social title. Dane:
${toBlock(i)}`)

export const newsroomActions = {
  suggestHeadlines,
  generateLead,
  improveText,
  proofread,
  expandStub,
  summarize,
  extractKeywords,
  classifyCategory,
  suggestTags,
  generateSeoMeta,
  translateToEN,
  simplifyB1,
  suggestImage,
  moderateComment,
  checkFacts,
  extractQuotes,
  socialSnippets,
  newsletterBlurb,
  pushNotification,
  suggestRelated,
  detectDuplicate,
  generateFAQ,
  timelineFromArticles,
  compareArticles,
  autoTitle,
}

export type NewsroomActionName = keyof typeof newsroomActions
