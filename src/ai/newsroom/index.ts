export type NewsroomBindings = {
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
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

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const systemPrompt = 'Jesteś newsroom AI dla lokalnego portalu informacyjnego. Odpowiadaj po polsku, zwięźle, redakcyjnie i konkretnie. Zwracaj wyłącznie użyteczny wynik dla zadanej funkcji.'

async function callOpenAI(apiKey: string, prompt: string) {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  })
  const json: any = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || 'OPENAI_ERROR')
  return json?.choices?.[0]?.message?.content || ''
}

async function callAnthropic(apiKey: string, prompt: string) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0.4,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const json: any = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || 'ANTHROPIC_ERROR')
  return json?.content?.map((part: any) => part?.text || '').join('\n') || ''
}

async function run(bindings: NewsroomBindings, prompt: string, provider: 'openai' | 'anthropic' = 'openai') {
  if (provider === 'anthropic' && bindings.ANTHROPIC_API_KEY) return callAnthropic(bindings.ANTHROPIC_API_KEY, prompt)
  if (bindings.OPENAI_API_KEY) return callOpenAI(bindings.OPENAI_API_KEY, prompt)
  if (bindings.ANTHROPIC_API_KEY) return callAnthropic(bindings.ANTHROPIC_API_KEY, prompt)
  return JSON.stringify({ mock: true, prompt })
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
