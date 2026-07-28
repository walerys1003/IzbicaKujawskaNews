/*
  Pełna kontrola przed wdrożeniem — `npm run test:ci`.

  CO BYŁO TU WCZEŚNIEJ (stan do 2026-07-28)
  -----------------------------------------
  Skrypt nazywał się „test", ale NIE URUCHAMIAŁ ANI JEDNEGO TESTU.
  Sprawdzał obecność pięciu plików dokumentacji i dwóch ciągów znaków
  w docs/API.md. Przechodził więc niezależnie od tego, czy aplikacja
  działa, czy w ogóle się kompiluje. W praktyce zielony `test:ci` niczego
  nie gwarantował — a to najgroźniejszy rodzaj kontroli, bo daje pewność
  bez pokrycia.

  CO ROBI TERAZ
  -------------
  Uruchamia po kolei trzy rzeczy, które mogą naprawdę zawieść:
    1. lint + sprawdzanie typów,
    2. pełny zestaw testów (vitest run),
    3. budowanie produkcyjne.

  Kolejność jest istotna: typy są najszybsze i najczęściej wychwytują
  błąd, budowanie jest najdroższe. Przerwanie na pierwszym niepowodzeniu
  oszczędza czas i wskazuje właściwą przyczynę, a nie jej następstwo.
*/
import { spawnSync } from 'node:child_process'

const etapy = [
  { nazwa: 'lint + typy', polecenie: 'npm', argumenty: ['run', 'lint'] },
  { nazwa: 'testy', polecenie: 'npx', argumenty: ['vitest', 'run'] },
  { nazwa: 'budowanie', polecenie: 'npm', argumenty: ['run', 'build'] },
]

for (const etap of etapy) {
  console.log(`\n=== ${etap.nazwa} ===`)
  const wynik = spawnSync(etap.polecenie, etap.argumenty, { stdio: 'inherit' })
  if (wynik.status !== 0) {
    console.error(`\n[test:ci] NIEPOWODZENIE na etapie: ${etap.nazwa} (kod ${wynik.status})`)
    process.exit(wynik.status ?? 1)
  }
}

console.log('\n[test:ci] Wszystkie etapy przeszły: typy, testy, budowanie.')
