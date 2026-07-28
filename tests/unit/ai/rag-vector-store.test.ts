import { describe, expect, it } from 'vitest'
import { RagVectorStore, chunkText, cosineSimilarity } from '../../../src/ai/rag/vector-store'
import { MockD1Database } from '../../fixtures/mock-d1'

/**
 * RagVectorStore — test powstal z WLASNEGO REGRESU, nie z planu.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CO SIE STALO
 * ══════════════════════════════════════════════════════════════════════════
 * Usuwajac 16 zgloszen tsc z tego pliku (`DB` opcjonalne, uzywane bez
 * sprawdzenia), wprowadzilem jeden straznik `private get db()`. Zamiana
 * napisow objela jednak takze wnetrze samego gettera:
 *
 *     private get db() { const db = this.db; ... }   // ← rekurencja
 *
 * Skutek: `RangeError: Maximum call stack size exceeded` przy KAZDYM uzyciu
 * bazy w tej klasie. `GET /api/rag/stats` spadlo z 200 na 500.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO TO WAZNE — CO NIE ZLAPALO TEGO BLEDU
 * ══════════════════════════════════════════════════════════════════════════
 *   • `tsc --noEmit` — PRZESZEDL. Typ zwracany gettera jest poprawny;
 *     rekurencja to blad wykonania, nie typowania. Liczba bledow spadla
 *     z 207 na 191, co wygladalo jak czysty sukces.
 *   • `npm run build` — PRZESZEDL. Vite transpiluje, nie uruchamia.
 *   • Wszystkie 126 istniejacych testow — PRZESZLY. Zadny nie dotykal
 *     tej klasy.
 *
 * Znalazl go dopiero POMIAR dzialajacej trasy. To jest dokladnie ten wzorzec,
 * ktory audyt zdiagnozowal jako wade projektu: „zielony kompilator” brany za
 * dowod dzialania. Redukcja liczby bledow typow NIE jest dowodem, ze kod
 * dziala — moze byc dowodem, ze przestal.
 *
 * Dlatego ten plik istnieje: sonda, ktora wykryla regres, byla tymczasowa
 * i zniknelaby wraz z konsola. Ponizsze przypadki zostaja w repozytorium.
 */

const bazaZDokumentami = () => {
  const db = new MockD1Database()
  // Atrapa nie zna tabel RAG, wiec rejestrujemy odpowiedzi jawnie —
  // interesuje nas przeplyw przez klase, nie wierność silnika SQL.
  //
  // UWAGA na KOLEJNOSC i PRECYZJE regul: reguly sa sprawdzane w kolejnosci
  // rejestracji, po fragmencie napisu. Pierwsza wersja tego testu uzywala
  // fragmentu `count(*) as count from rag_documents`, ktory pasuje ROWNIEZ do
  // zapytania o kategorie (`SELECT category, COUNT(*) ... FROM rag_documents
  // GROUP BY category`) — wiec kategorie wracaly jako `[{ count: 3 }]`.
  // Test to wychwycil. Zapytanie o kategorie rejestrujemy pierwsze i po
  // fragmencie, ktory wystepuje TYLKO w nim.
  db.on('select category, count(*)', () => [{ category: 'wiadomosci', count: 3 }])
  db.on('select count(*) as count from rag_documents', () => ({ count: 3 }))
  db.on('select count(*) as count from embeddings', () => ({ count: 12 }))
  return db
}

describe('RagVectorStore — dostep do bazy', () => {
  it('czyta statystyki, gdy wiazanie DB istnieje', async () => {
    const store = new RagVectorStore({ DB: bazaZDokumentami() as never })

    // Gdyby getter `db` wolal sam siebie (moj regres), ta linia rzucilaby
    // RangeError zamiast zwrocic wynik. Kompilator tego nie widzi.
    const stats = await store.stats()

    expect(stats.documents).toBe(3)
    expect(stats.chunks).toBe(12)
    expect(stats.categories).toEqual([{ category: 'wiadomosci', count: 3 }])
    expect(stats.vectorizeEnabled).toBe(false)
  })

  it('nie wpada w rekurencje — wielokrotne uzycie bazy w jednym wywolaniu', async () => {
    // `stats()` siega do bazy trzy razy. `getChunksBySlug` — raz, ale przez
    // ten sam getter. Sprawdzamy oba, bo regres objawial sie przy KAZDYM
    // uzyciu, a chcemy test, ktory pada natychmiast, nie przypadkiem.
    const store = new RagVectorStore({ DB: new MockD1Database() as never })

    await expect(store.stats()).resolves.toBeDefined()
    await expect(store.getChunksBySlug('dowolny-slug')).resolves.toEqual([])
  })

  it('zglasza ZROZUMIALY blad, gdy wiazania DB brakuje', async () => {
    // Bez straznika bylo tu `TypeError: Cannot read properties of undefined
    // (reading 'prepare')` — komunikat, ktory nie mowi, ze chodzi
    // o konfiguracje wdrozenia.
    const store = new RagVectorStore({})

    await expect(store.stats()).rejects.toThrow(/brak wiazania D1/)
    await expect(store.stats()).rejects.toThrow(/wrangler\.jsonc/)
  })
})

/**
 * Funkcje czyste tej samej jednostki. Nie byly objete zadnym testem, a
 * `cosineSimilarity` decyduje o doborze kontekstu dla modelu jezykowego —
 * cichy blad w niej daje odpowiedzi „z archiwum” niezwiazane z pytaniem,
 * co jest gorsze od braku odpowiedzi, bo wyglada wiarygodnie.
 */
describe('cosineSimilarity', () => {
  it('zwraca 1 dla wektorow identycznych', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10)
  })

  it('zwraca 0 dla wektorow prostopadlych', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
  })

  it('zwraca 0 dla wektora zerowego zamiast NaN', () => {
    // Dzielenie przez zerowa norme daloby NaN, a NaN w sortowaniu wynikow
    // zachowuje sie nieprzewidywalnie — kolejnosc trafien stalaby sie losowa.
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
    expect(Number.isNaN(cosineSimilarity([0, 0], [1, 1]))).toBe(false)
  })
})

describe('chunkText', () => {
  it('zwraca pusta liste dla tekstu bez tresci', () => {
    expect(chunkText('   ')).toEqual([])
    expect(chunkText('<p></p>')).toEqual([])
  })

  it('usuwa znaczniki HTML zamiast wpychac je do zanurzenia', () => {
    const chunks = chunkText('<p>Remont ulicy <strong>Koscielnej</strong>.</p>')
    expect(chunks.join(' ')).not.toContain('<')
    expect(chunks.join(' ')).toContain('Koscielnej')
  })

  it('dzieli dlugi tekst na fragmenty w granicach limitu', () => {
    const zdanie = 'To jest zdanie o dlugosci wystarczajacej do podzialu tekstu. '
    const chunks = chunkText(zdanie.repeat(20), 200)
    expect(chunks.length).toBeGreaterThan(1)
    // Limit jest miekki (dzielimy po zdaniach), ale nie moze byc ignorowany:
    // fragment wielokrotnie wiekszy od limitu przekroczyloby okno modelu.
    for (const chunk of chunks) expect(chunk.length).toBeLessThan(400)
  })
})
