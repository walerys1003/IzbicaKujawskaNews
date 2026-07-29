/**
 * Kujawianka — dane statyczne dla strony kategorii.
 *
 * Dlaczego osobny plik: w renderze strony `/kujawianka` (CategoryPageV4)
 * nie mamy zakładek k-tabs (zostały usunięte z landing page), ale użytkownik
 * oczekuje na dedykowanej stronie kategorii tabeli ligowej i terminarza.
 * Dane są wydzielone z `Home.tsx` (gdzie były kiedyś renderowane w panelach
 * `data-kpanel="tabela"` i `data-kpanel="mecze"`), żeby:
 *  - nie powielać kodu,
 *  - móc je rozwinąć o D1 / zewnętrzny feed bez ruszania reszty renderu,
 *  - zachować to samo źródło prawdy dla LP i strony kategorii.
 *
 * Tabela jest w pełni statyczna (sezon 2025/26, stan na 22 maja 2026).
 * Docelowo może być pobierana z D1 lub z zewnętrznego API (regiowyniki.pl).
 */

export interface LeagueRow {
  pos: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goals: string // "54:18"
  points: number
  highlight?: boolean // wyróżnij Kujawiankę
}

export const KUJAWIANKA_LEAGUE: LeagueRow[] = [
  { pos: 1, team: 'Pogoń Łabiszyn', played: 25, won: 20, drawn: 2, lost: 3, goals: '54:18', points: 62 },
  { pos: 2, team: 'Sparta Brześć', played: 25, won: 18, drawn: 3, lost: 4, goals: '48:24', points: 57 },
  { pos: 3, team: 'Kujawianka Izbica', played: 25, won: 17, drawn: 3, lost: 5, goals: '45:28', points: 54, highlight: true },
  { pos: 4, team: 'KS Polonia Bydgoszcz', played: 25, won: 15, drawn: 4, lost: 6, goals: '42:31', points: 49 },
  { pos: 5, team: 'Mień Lipno', played: 25, won: 14, drawn: 4, lost: 7, goals: '40:34', points: 46 },
  { pos: 6, team: 'Włocłavia II', played: 25, won: 13, drawn: 3, lost: 9, goals: '38:38', points: 42 },
  { pos: 7, team: 'Promień Aleksandrów', played: 25, won: 11, drawn: 5, lost: 9, goals: '35:42', points: 38 },
  { pos: 8, team: 'GKS Chocień', played: 25, won: 10, drawn: 2, lost: 13, goals: '28:48', points: 32 },
  { pos: 9, team: 'Zawisza Rypin', played: 25, won: 8, drawn: 4, lost: 13, goals: '26:44', points: 28 },
  { pos: 10, team: 'Cuiavia Inowrocław', played: 25, won: 6, drawn: 3, lost: 16, goals: '22:52', points: 21 },
]

export const KUJAWIANKA_LEAGUE_META = {
  league: 'Klasa Okręgowa, grupa 2',
  season: 'Sezon 2025/26',
  updated: '22 maja 2026',
  source: 'regiowyniki.pl',
} as const

export interface MatchRow {
  date: string // dd
  month: string // skrót miesiąca
  description: string
  result: string // "3:1", "1:1", "vs" (gdy nadchodzący)
  /** true jeśli mecz się jeszcze nie odbył */
  upcoming?: boolean
  /** true jeśli wyjazd */
  away?: boolean
  /** wynik: 'win' | 'draw' | 'loss' | undefined (gdy upcoming) */
  outcome?: 'win' | 'draw' | 'loss'
}

export const KUJAWIANKA_RECENT_MATCHES: MatchRow[] = [
  { date: '21', month: 'maj', description: 'Kujawianka — Sparta Brześć · 25. kolejka · dom · Stadion Miejski', result: '3:1', outcome: 'win' },
  { date: '14', month: 'maj', description: 'Mień Lipno — Kujawianka · 24. kolejka · wyjazd', result: '1:1', outcome: 'draw' },
  { date: '07', month: 'maj', description: 'Kujawianka — Włocłavia II · 23. kolejka · dom', result: '2:0', outcome: 'win' },
  { date: '30', month: 'kwi', description: 'GKS Chocień — Kujawianka · 22. kolejka · wyjazd', result: '0:2', outcome: 'win' },
  { date: '23', month: 'kwi', description: 'Kujawianka — Pogoń Łabiszyn · 21. kolejka · dom · hit sezonu', result: '1:1', outcome: 'draw' },
]

export const KUJAWIANKA_UPCOMING_MATCHES: MatchRow[] = [
  { date: '28', month: 'maj', description: 'KS Polonia Bydgoszcz — Kujawianka · 26. kolejka · wyjazd', result: 'vs', upcoming: true, away: true },
  { date: '04', month: 'cze', description: 'Kujawianka — Promień Aleksandrów · 27. kolejka · dom · sobota 17:00', result: 'vs', upcoming: true },
  { date: '11', month: 'cze', description: 'Kujawianka — GKS Chocień · 28. kolejka · dom · niedziela 15:00', result: 'vs', upcoming: true },
]
