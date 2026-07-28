import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/*
  Ten plik istnieje z powodu defektu wykrytego 2026-07-28.

  W src/renderer.tsx od początku projektu stało:

      <script>
        {`if ('serviceWorker' in navigator) { ... register('/static/sw.js') ... }`}
      </script>

  Hono JSX traktuje dziecko <script> jak zwykły tekst i escapuje apostrofy
  do &#39;. <script> jest jednak elementem typu „raw text" — przeglądarka
  NIE dekoduje w nim encji HTML. Do silnika JavaScript trafiał więc literalny
  ciąg &#39;serviceWorker&#39; i skrypt kończył się SyntaxError.

  Skutek: rejestracja Service Workera nigdy w tym portalu nie zadziałała.
  Audyt oznaczył ją jako gotową, bo sprawdzono OBECNOŚĆ znacznika w kodzie
  źródłowym, a nie WYNIK jego wykonania w przeglądarce. Defekt był
  niewidoczny w kodzie źródłowym i widoczny wyłącznie w wyrenderowanym HTML.

  Test pilnuje reguły na poziomie źródeł: inline JavaScript w komponentach
  JSX musi iść przez dangerouslySetInnerHTML, nigdy jako dziecko <script>.
  Sprawdzam źródła, nie HTML, bo dzięki temu regres jest wykryty przy
  pierwszym uruchomieniu testów, a nie dopiero po wdrożeniu.
*/

const KATALOG_SRC = join(process.cwd(), 'src')

const zbierzPlikiTsx = (katalog: string, zebrane: string[] = []): string[] => {
  for (const wpis of readdirSync(katalog)) {
    const sciezka = join(katalog, wpis)
    if (statSync(sciezka).isDirectory()) {
      zbierzPlikiTsx(sciezka, zebrane)
    } else if (wpis.endsWith('.tsx')) {
      zebrane.push(sciezka)
    }
  }
  return zebrane
}

/*
  Wykrywam wzorzec <script> ... {`  — czyli znacznik script, którego
  dzieckiem jest wyrażenie JSX z szablonem lub literałem. Celowo NIE
  dopasowuję <script src=...>, bo tam nie ma treści do escapowania.
*/
const WZORZEC_TRESCI_W_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>\s*\{\s*[`'"]/

/*
  Komentarze muszą wypaść PRZED dopasowaniem wzorca. Pierwsza wersja tego
  testu tego nie robiła i natychmiast oskarżyła src/v4/renderer.tsx — bo
  w komentarzu OPISUJĄCYM ten defekt stoi jego przykład: <script>{'...'}.
  Test wskazywał plik, w którym defekt był już naprawiony. Dowód, że linter
  oparty na regeksie musi znać granicę między kodem a jego opisem.
*/
const usunKomentarze = (zrodlo: string): string =>
  zrodlo
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // komentarze JSX {/* ... */}
    .replace(/\/\*[\s\S]*?\*\//g, '') // komentarze blokowe
    .replace(/^\s*\/\/.*$/gm, '') // komentarze liniowe

describe('inline JavaScript w komponentach JSX', () => {
  const pliki = zbierzPlikiTsx(KATALOG_SRC)

  it('znajduje pliki .tsx do sprawdzenia', () => {
    /* Gdyby zbieranie plików się zepsuło, pozostałe asercje przechodziłyby
       na pustym zbiorze i test byłby tautologią — dokładnie ten defekt
       naprawiałem w testach newslettera. */
    expect(pliki.length).toBeGreaterThan(10)
  })

  it('nie przekazuje kodu JS jako dziecka <script> (Hono escapuje apostrofy do &#39;)', () => {
    const winne = pliki.filter((plik) => WZORZEC_TRESCI_W_SCRIPT.test(usunKomentarze(readFileSync(plik, 'utf8'))))

    expect(
      winne,
      `Te pliki przekazują JavaScript jako dziecko <script>. Hono zescapuje ` +
        `apostrofy do &#39;, a przeglądarka nie dekoduje encji w <script> — ` +
        `powstanie SyntaxError. Użyj: <script dangerouslySetInnerHTML={{ __html: '...' }} />\n` +
        winne.map((plik) => `  - ${plik.replace(process.cwd(), '.')}`).join('\n'),
    ).toEqual([])
  })

  it('wzorzec detekcji naprawdę rozpoznaje wadliwy zapis (kontrola samego testu)', () => {
    /*
      Bez tej asercji nie wiem, czy powyższy test przechodzi dlatego, że kod
      jest poprawny, czy dlatego, że regeks przestał cokolwiek dopasowywać.
      Dokładnie ten błąd metodologiczny znalazłem w testach newslettera:
      asercje, które nie potrafiły zawieść.
    */
    const wadliwy = "<script>\n  {`if ('serviceWorker' in navigator) { }`}\n</script>"
    const poprawny = "<script dangerouslySetInnerHTML={{ __html: \"if('serviceWorker' in navigator){}\" }} />"
    const zZewnetrznymPlikiem = '<script src="/static/push-client.js" defer></script>'

    expect(WZORZEC_TRESCI_W_SCRIPT.test(wadliwy)).toBe(true)
    expect(WZORZEC_TRESCI_W_SCRIPT.test(poprawny)).toBe(false)
    expect(WZORZEC_TRESCI_W_SCRIPT.test(zZewnetrznymPlikiem)).toBe(false)
  })

  it('renderery rejestrują Service Workera pod adresem o zakresie całej witryny', () => {
    /*
      Zakres Service Workera wynika z katalogu skryptu. /static/sw.js daje
      zakres /static/, który nie kontroluje żadnej strony portalu — handler
      `fetch` nigdy nie dostaje zdarzenia nawigacyjnego, a precache staje się
      martwym transferem. Projekt nie ustawia nagłówka Service-Worker-Allowed,
      więc jedynym rozwiązaniem jest skrypt w katalogu głównym.
    */
    for (const plik of ['src/renderer.tsx', 'src/v4/renderer.tsx']) {
      const tresc = usunKomentarze(readFileSync(join(process.cwd(), plik), 'utf8'))
      const rejestracje = tresc.match(/register\((['"`])([^'"`]+)\1\)/g) ?? []
      for (const rejestracja of rejestracje) {
        expect(rejestracja, `${plik}: rejestracja SW z katalogu /static/ ma zakres /static/ i nie kontroluje stron portalu`).not.toContain('/static/')
      }
    }
  })
})
