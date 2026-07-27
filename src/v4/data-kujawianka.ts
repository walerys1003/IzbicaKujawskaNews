// ============================================================================
// IZBICA24.PL v4 — DANE STRUKTURALNE MGKS KUJAWIANKA IZBICA KUJAWSKA
// Dane 1:1 z szaty graficznej. W back-endzie edytowalne w module „Kujawianka”.
// ============================================================================

export interface TableRow {
  pos: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goals: string
  points: number
  highlight?: boolean
}

export interface Match {
  day: string
  month: string
  home: string
  away: string
  note: string
  score?: string
  result?: 'win' | 'draw' | 'lose'
  upcoming?: boolean
}

export interface Player {
  num: string
  name: string
  role: string
}

export interface SquadSection {
  label: string
  players: Player[]
  staff?: boolean
}

export interface JuniorTeam {
  name: string
  description: string
  meta: Array<{ label: string; value: string }>
}

/** Ostatni mecz — panel „Aktualności” */
export const LAST_MATCH = {
  round: '25. kolejka',
  homeTeam: 'KUJAWIANKA',
  homeScore: 3,
  awayScore: 1,
  awayTeam: 'SPARTA BRZEŚĆ',
  headline: 'Hat-trick Adamiaka! Kujawianka rozbija Spartę i atakuje awans',
  lede:
    'Adam Adamiak zdobył wszystkie trzy bramki dla gospodarzy. Trener Kaczor: „Forma wzrasta — wierzymy w awans do IV ligi”.',
  resultLabel: '● Zwycięstwo',
  image: '/static/img/v4/04-kujawianka-celebracja.jpg',
  articleUrl: '/kujawianka/mecze/kujawianka-sparta-brzesc-3-1',
}

/** Pasek „Następny mecz” */
export const NEXT_MATCH = {
  dateLabel: 'Następny mecz: 28 maja · 16:00',
  opponentLabel: 'vs KS Polonia Bydgoszcz (wyjazd)',
}

/** Mini-tabela w panelu „Aktualności” (6 pozycji) */
export const TABLE_MINI: Array<{ pos: number; team: string; points: number; highlight?: boolean }> = [
  { pos: 1, team: 'Pogoń Łabiszyn', points: 62 },
  { pos: 2, team: 'Sparta Brześć', points: 57 },
  { pos: 3, team: 'Kujawianka', points: 54, highlight: true },
  { pos: 4, team: 'Polonia Bydgoszcz', points: 49 },
  { pos: 5, team: 'Mień Lipno', points: 46 },
  { pos: 6, team: 'Włocłavia II', points: 42 },
]

/** Strzelcy sezonu */
export const SCORERS: Array<{ name: string; goals: number }> = [
  { name: 'Adam Adamiak', goals: 14 },
  { name: 'Marcin Wójcicki', goals: 9 },
  { name: 'K. Lewandowski', goals: 7 },
  { name: 'Paweł Nowak', goals: 5 },
]

/** Pełna tabela — panel „Tabela” */
export const TABLE_FULL: TableRow[] = [
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

export const TABLE_META = {
  title: 'Klasa Okręgowa, grupa 2 · Sezon 2025/26',
  updated: 'Aktualizacja: 22 maja 2026 · źródło: regiowyniki.pl',
}

/** Ostatnie 5 spotkań */
export const RECENT_MATCHES: Match[] = [
  { day: '21', month: 'maj', home: 'Kujawianka', away: 'Sparta Brześć', note: '25. kolejka · dom · Stadion Miejski', score: '3:1', result: 'win' },
  { day: '14', month: 'maj', home: 'Mień Lipno', away: 'Kujawianka', note: '24. kolejka · wyjazd', score: '1:1', result: 'draw' },
  { day: '07', month: 'maj', home: 'Kujawianka', away: 'Włocłavia II', note: '23. kolejka · dom', score: '2:0', result: 'win' },
  { day: '30', month: 'kwi', home: 'GKS Chocień', away: 'Kujawianka', note: '22. kolejka · wyjazd', score: '1:4', result: 'win' },
  { day: '23', month: 'kwi', home: 'Kujawianka', away: 'Pogoń Łabiszyn', note: '21. kolejka · dom · hit sezonu', score: '0:2', result: 'lose' },
]

/** Terminarz — najbliższe 3 mecze */
export const UPCOMING_MATCHES: Match[] = [
  { day: '28', month: 'maj', home: 'KS Polonia Bydgoszcz', away: 'Kujawianka', note: '26. kolejka · wyjazd · sobota 16:00', upcoming: true },
  { day: '04', month: 'cze', home: 'Kujawianka', away: 'Promień Aleksandrów', note: '27. kolejka · dom · sobota 17:00', upcoming: true },
  { day: '11', month: 'cze', home: 'Kujawianka', away: 'GKS Chocień', note: '28. kolejka · dom · niedziela 15:00', upcoming: true },
]

/** Kadra — panel „Kadra” */
export const SQUAD: SquadSection[] = [
  {
    label: 'Bramkarze',
    players: [
      { num: '1', name: 'Tomasz Wiśniewski', role: 'Kpt.' },
      { num: '12', name: 'Mateusz Malinowski', role: 'Rez.' },
    ],
  },
  {
    label: 'Obrońcy',
    players: [
      { num: '2', name: 'Bartosz Jankowski', role: 'PO' },
      { num: '3', name: 'Piotr Zieliński', role: 'ŚO' },
      { num: '4', name: 'Rafał Kowalczyk', role: 'ŚO' },
      { num: '5', name: 'Kamil Nowak', role: 'LO' },
      { num: '15', name: 'Damian Szymański', role: 'PO' },
      { num: '21', name: 'Jakub Wójcik', role: 'ŚO' },
    ],
  },
  {
    label: 'Pomocnicy',
    players: [
      { num: '6', name: 'Marcin Wójcicki', role: 'DP' },
      { num: '8', name: 'Krzysztof Lewandowski', role: 'ŚP' },
      { num: '10', name: 'Paweł Nowak', role: 'OP' },
      { num: '14', name: 'Michał Kowalski', role: 'LP' },
      { num: '17', name: 'Łukasz Duda', role: 'PP' },
      { num: '18', name: 'Adrian Krawczyk', role: 'DP' },
    ],
  },
  {
    label: 'Napastnicy',
    players: [
      { num: '7', name: 'Adam Adamiak', role: '14g' },
      { num: '9', name: 'Sebastian Głowacki', role: '3g' },
      { num: '11', name: 'Filip Zawadzki', role: '2g' },
      { num: '19', name: 'Konrad Baran', role: '1g' },
    ],
  },
  {
    label: 'Sztab szkoleniowy',
    staff: true,
    players: [
      { num: 'T', name: 'Mariusz Kaczor', role: 'Trener' },
      { num: 'A', name: 'Robert Sikora', role: 'Asyst.' },
    ],
  },
]

/** Junior — panel „Junior” */
export const JUNIOR_HEADING = 'Drużyny młodzieżowe · sezon 2025/26'

export const JUNIOR_TEAMS: JuniorTeam[] = [
  {
    name: 'Juniorzy U-15 · Trampkarze',
    description:
      'Zwycięzcy turnieju „Puchar Kujaw” w Aleksandrowie Kujawskim (18 maja 2026). Awans do finału wojewódzkiego w czerwcu.',
    meta: [
      { label: '', value: '<strong>18</strong> zawodników' },
      { label: 'Trener: ', value: '<strong>Adam Krawczyk</strong>' },
      { label: 'Treningi: ', value: '<strong>wt, czw, sb</strong>' },
    ],
  },
  {
    name: 'Juniorzy U-13 · Młodzicy',
    description:
      'Drużyna gra w Lidze Młodzików Wojewódzkich. Aktualnie 4. miejsce w tabeli. Trener zapowiada walkę o podium do końca sezonu.',
    meta: [
      { label: '', value: '<strong>22</strong> zawodników' },
      { label: 'Trener: ', value: '<strong>Tomasz Grzybowski</strong>' },
      { label: 'Treningi: ', value: '<strong>pon, śr, pt</strong>' },
    ],
  },
  {
    name: 'Szkółka piłkarska U-9 / U-11',
    description:
      'Najmłodsza grupa Kujawianki. Zajęcia rekreacyjne z elementami techniki. Nabór ciągły — chłopcy i dziewczynki w wieku 6-11 lat.',
    meta: [
      { label: '', value: '<strong>34</strong> dzieci' },
      { label: 'Trener: ', value: '<strong>Piotr Wiśniewski</strong>' },
      { label: 'Treningi: ', value: '<strong>wt, czw 17:00</strong>' },
      { label: 'Zapisy: ', value: '<strong>502 145 892</strong>' },
    ],
  },
]

/** Zakładki panelu Kujawianka (5 tabów jak w szacie) */
export const K_TABS: Array<{ id: string; label: string; count?: string }> = [
  { id: 'aktualnosci', label: 'Aktualności', count: '12' },
  { id: 'mecze', label: 'Mecze', count: '8' },
  { id: 'tabela', label: 'Tabela' },
  { id: 'kadra', label: 'Kadra', count: '23' },
  { id: 'junior', label: 'Junior', count: '3' },
]
