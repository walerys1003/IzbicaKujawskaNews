/*
  Kontrola statyczna projektu — uruchamiana przez `npm run lint`.

  CO BYŁO TU WCZEŚNIEJ (stan do 2026-07-28)
  -----------------------------------------
  Skrypt sprawdzał wyłącznie ISTNIENIE pięciu plików i obecność trzech nazw
  skryptów w package.json. Nie analizował ani jednej linii kodu — nazwa
  „lint" była myląca. Co gorsza, sam był zepsuty: wymagał
  `.github/workflows/ci.yml`, który usunięto w commicie 8aeca3b (brak
  uprawnienia `workflows` dla GitHub App). `npm run lint` kończył się
  wyjątkiem ENOENT, więc kontrola nie działała w ogóle.

  CO ROBI TERAZ
  -------------
  1. Sprawdza typy kompilatorem TypeScript (tsc --noEmit). To jedyna
     kontrola, która wykryła błąd składni w src/db/models/_shared.ts —
     `vite build` go nie widział, bo nie sprawdza typów i pomija martwy kod.
  2. Weryfikuje kontrakt repozytorium, ale wyłącznie dla plików, które
     naprawdę są wymagane do działania aplikacji.

  PROGI BŁĘDÓW — ŚWIADOMY KOMPROMIS
  ---------------------------------
  Projekt ma obecnie 374 błędy typów, narosłe przez cały czas, gdy nic ich
  nie sprawdzało. Ustawienie progu na zero zablokowałoby każdy commit i
  skrypt zostałby wyłączony — czyli wrócilibyśmy do stanu bez kontroli.
  Dlatego działa RATCHET: próg jest zapisany w pliku i nie może wzrosnąć.
  Każda naprawa obniża próg, każdy regres zatrzymuje lint. Liczba może iść
  tylko w dół.
*/
import { access, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const PLIK_PROGU = 'scripts/.prog-bledow-typow.json'

/* Pliki, bez których aplikacja nie działa. Celowo NIE ma tu
   .github/workflows/ci.yml — workflowy są usunięte z powodu braku
   uprawnienia GitHub App, co nie ma wpływu na poprawność kodu. */
const WYMAGANE = ['src/index.tsx', 'wrangler.jsonc', 'package.json', 'tsconfig.json']

let bledy = 0
const zglos = (komunikat) => {
  console.error(`  ✗ ${komunikat}`)
  bledy += 1
}

console.log('[lint] Kontrakt repozytorium')
for (const plik of WYMAGANE) {
  try {
    await access(plik)
  } catch {
    zglos(`brak wymaganego pliku: ${plik}`)
  }
}

const pakiet = JSON.parse(await readFile('package.json', 'utf8'))
for (const skrypt of ['build', 'lint', 'test', 'typecheck']) {
  if (!pakiet.scripts?.[skrypt]) zglos(`brak skryptu npm: ${skrypt}`)
}
/* TypeScript musi być zależnością, nie założeniem. Jego brak był powodem,
   dla którego typy nie były sprawdzane przez cały czas trwania projektu. */
if (!pakiet.devDependencies?.typescript) zglos('typescript nie jest zależnością — typy nie będą sprawdzane')

console.log('[lint] Sprawdzanie typów (tsc --noEmit)')
const tsc = spawnSync('npx', ['tsc', '--noEmit'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
const wyjscie = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`
const liniiBledow = wyjscie.split('\n').filter((linia) => /error TS\d+/.test(linia))

/* Błędy składni (TS1xxx) są nieprzekraczalne — plik z takim błędem
   nie kompiluje się w ogóle i żaden próg nie może tego usprawiedliwiać. */
const skladnia = liniiBledow.filter((linia) => /error TS1\d{3}:/.test(linia))
if (skladnia.length > 0) {
  console.error('  ✗ BŁĘDY SKŁADNI — plik nie kompiluje się:')
  skladnia.slice(0, 10).forEach((linia) => console.error(`      ${linia.trim()}`))
  bledy += 1
}

let prog = Number.POSITIVE_INFINITY
try {
  prog = JSON.parse(await readFile(PLIK_PROGU, 'utf8')).maksymalnieBledow
} catch {
  console.log(`  · brak pliku progu — zapisuję obecny stan (${liniiBledow.length}) jako punkt odniesienia`)
  await writeFile(PLIK_PROGU, `${JSON.stringify({ maksymalnieBledow: liniiBledow.length }, null, 2)}\n`)
  prog = liniiBledow.length
}

console.log(`  · błędów typów: ${liniiBledow.length} (próg: ${prog})`)

if (liniiBledow.length > prog) {
  zglos(
    `liczba błędów typów wzrosła: ${liniiBledow.length} > ${prog}. ` +
      `Napraw nowe błędy albo wyjaśnij, dlaczego próg ma wzrosnąć — ` +
      `ten licznik może iść tylko w dół.`,
  )
  /* Pokazuję różnicę, żeby autor zmiany wiedział, czego szukać. */
  liniiBledow.slice(0, 15).forEach((linia) => console.error(`      ${linia.trim()}`))
} else if (liniiBledow.length < prog) {
  console.log(`  ✓ próg obniżony: ${prog} → ${liniiBledow.length}`)
  await writeFile(PLIK_PROGU, `${JSON.stringify({ maksymalnieBledow: liniiBledow.length }, null, 2)}\n`)
}

if (bledy > 0) {
  console.error(`\n[lint] NIEPOWODZENIE — ${bledy} problem(ów).`)
  process.exit(1)
}

console.log('\n[lint] OK')
