/**
 * FAZA 1 / B3 — model rol i macierz uprawnien.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANA NIESPOJNOSC
 * ══════════════════════════════════════════════════════════════════════════
 * Przed ta zmiana istnialy w projekcie DWA rozne zestawy rol:
 *
 *   tabela users (CHECK):  admin, editor, journalist, reader
 *   typ UserRole (TS):     admin, editor, author, editor, commenter, reader
 *
 * Zapis uzytkownika z rola 'author' — nadawana przez kod przy rejestracji
 * autora — konczyl sie naruszeniem ograniczenia CHECK i bledem bazy,
 * bo baza takiej wartosci nie znala. Rola 'commenter' rowniez nie istniala
 * w bazie, a 'journalist' nie istniala w kodzie.
 *
 * Ten plik jest teraz JEDYNYM zrodlem prawdy o rolach i uprawnieniach.
 * Migracja 0047 dostosowuje ograniczenie CHECK do tej samej listy.
 */

/** Szesc rol wymaganych w FAZIE 1 (roadmapa, etap B3). */
export const ROLES = ['admin', 'editor', 'author', 'moderator', 'contributor', 'viewer'] as const
export type Role = (typeof ROLES)[number]

/**
 * Hierarchia rol — wyzsza wartosc oznacza szersze uprawnienia.
 * Sluzy do porownan typu „co najmniej redaktor”, nie zastepuje jednak
 * macierzy uprawnien: moderator ma wysokie uprawnienia do komentarzy,
 * ale zadnych do publikacji artykulow, wiec porzadek liniowy nie wystarcza.
 */
export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  contributor: 1,
  author: 2,
  moderator: 3,
  editor: 4,
  admin: 5,
}

/** Opis kazdej roli — uzywany w panelu przy nadawaniu uprawnien. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Administrator — pelny dostep, zarzadzanie uzytkownikami, ustawieniami i integracjami.',
  editor: 'Redaktor naczelny — publikuje i archiwizuje artykuly, zatwierdza teksty autorow.',
  author: 'Autor — tworzy i edytuje wlasne artykuly, wysyla je do recenzji (nie publikuje).',
  moderator: 'Moderator — zatwierdza i odrzuca komentarze oraz ogloszenia mieszkancow.',
  contributor: 'Wspolpracownik — zglasza propozycje tresci, ktore wymagaja akceptacji redakcji.',
  viewer: 'Czytelnik — konto zalogowane, bez uprawnien redakcyjnych.',
}

// ══════════════════════════════════════════════════════════════════════════
// Uprawnienia
// ══════════════════════════════════════════════════════════════════════════
//
// Nazwa uprawnienia ma postac `zasob:czynnosc`. Rozdzielenie na wlasne
// i cudze tresci (`article:update:own` vs `article:update:any`) jest
// konieczne, bo autor moze poprawiac wlasny tekst, ale nie cudzy.

export const PERMISSIONS = [
  // Artykuly
  'article:read:unpublished',
  'article:create',
  'article:update:own',
  'article:update:any',
  'article:delete:own',
  'article:delete:any',
  'article:submit-review',   // draft -> review
  'article:publish',         // review/scheduled -> published
  'article:unpublish',
  'article:schedule',
  'article:archive',
  'article:restore-version',

  // Komentarze
  'comment:moderate',
  'comment:delete',

  // Media
  'media:upload',
  'media:delete:own',
  'media:delete:any',

  // Ogloszenia mieszkancow (nekrologi, praca, nieruchomosci)
  'listing:moderate',

  // Newsletter — lista adresow e-mail mieszkancow to dane osobowe.
  // GET /api/v1/newsletter/subscribers nie mial ZADNEJ ochrony: kazdy
  // niezalogowany zapytaniem HTTP dostawal pelną liste adresow wraz ze
  // statusem subskrypcji. To wyciek danych osobowych (RODO) i gotowa lista
  // do spamu. Uprawnienie jest osobne od 'user:read', bo zapisany na
  // newsletter mieszkaniec nie jest uzytkownikiem systemu.
  'newsletter:read',

  // Uzytkownicy i konfiguracja
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'user:change-role',
  'settings:read',
  'settings:update',

  // Narzedzia AI
  'ai:use',
  'ai:configure',

  // Podglad danych operacyjnych
  'analytics:read',
  'logs:read',
  'backup:manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

/**
 * Macierz uprawnien. Kazda rola ma jawnie wyliczony zestaw — bez
 * dziedziczenia po hierarchii, zeby zadne uprawnienie nie trafilo do roli
 * przypadkiem przy zmianie rankingu.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS, // administrator ma wszystkie uprawnienia

  editor: [
    'article:read:unpublished',
    'article:create',
    'article:update:own',
    'article:update:any',
    'article:delete:own',
    'article:delete:any',
    'article:submit-review',
    'article:publish',
    'article:unpublish',
    'article:schedule',
    'article:archive',
    'article:restore-version',
    'comment:moderate',
    'comment:delete',
    'media:upload',
    'media:delete:own',
    'media:delete:any',
    'listing:moderate',
    'newsletter:read',
    'user:read',
    'settings:read',
    'ai:use',
    'analytics:read',
  ],

  author: [
    'article:read:unpublished',
    'article:create',
    'article:update:own',
    'article:delete:own',
    'article:submit-review',
    'media:upload',
    'media:delete:own',
    'ai:use',
  ],

  moderator: [
    'article:read:unpublished',
    'comment:moderate',
    'comment:delete',
    'listing:moderate',
    'analytics:read',
  ],

  contributor: [
    'article:create',        // powstaje wylacznie szkic
    'article:update:own',
    'article:submit-review',
    'media:upload',
  ],

  viewer: [],
}

/** Czy rola posiada dane uprawnienie. */
export const hasPermission = (role: Role | undefined, permission: Permission): boolean => {
  if (!role) return false
  const granted = ROLE_PERMISSIONS[role]
  return granted ? granted.includes(permission) : false
}

/** Czy rola posiada wszystkie wymienione uprawnienia. */
export const hasAllPermissions = (role: Role | undefined, permissions: Permission[]): boolean =>
  permissions.every((permission) => hasPermission(role, permission))

/** Czy rola posiada co najmniej jedno z wymienionych uprawnien. */
export const hasAnyPermission = (role: Role | undefined, permissions: Permission[]): boolean =>
  permissions.some((permission) => hasPermission(role, permission))

/** Czy rola jest co najmniej na poziomie wskazanym w hierarchii. */
export const isAtLeast = (role: Role | undefined, minimum: Role): boolean => {
  if (!role) return false
  return ROLE_RANK[role] >= ROLE_RANK[minimum]
}

/** Bezpieczna konwersja dowolnej wartosci na role (nieznana -> viewer). */
export const toRole = (value: unknown): Role => {
  const text = String(value || '').toLowerCase()
  // Zgodnosc ze starymi nazwami, ktore moga jeszcze wystepowac w tokenach
  // wydanych przed migracja 0047.
  if (text === 'journalist') return 'author'
  if (text === 'reader') return 'viewer'
  if (text === 'commenter') return 'contributor'
  return (ROLES as readonly string[]).includes(text) ? (text as Role) : 'viewer'
}

/**
 * Uprawnienie do zmiany statusu artykulu.
 * Wykorzystywane przez workflow redakcyjny (FAZA 2 / B4) oraz przez
 * kontrole przejsc w endpointach artykulow.
 */
export const canTransitionArticle = (
  role: Role | undefined,
  from: string,
  to: string,
): { allowed: boolean; reason?: string } => {
  const permissionByTarget: Record<string, Permission> = {
    review: 'article:submit-review',
    published: 'article:publish',
    scheduled: 'article:schedule',
    archived: 'article:archive',
    draft: 'article:update:own',
  }

  const required = permissionByTarget[to]
  if (!required) return { allowed: false, reason: `Nieznany status docelowy: ${to}` }

  // Cofniecie z publikacji wymaga osobnego uprawnienia.
  if (from === 'published' && to !== 'archived' && to !== 'published') {
    if (!hasPermission(role, 'article:unpublish')) {
      return { allowed: false, reason: 'Brak uprawnienia do wycofania publikacji.' }
    }
  }

  if (!hasPermission(role, required)) {
    return { allowed: false, reason: `Rola "${role ?? 'brak'}" nie ma uprawnienia ${required}.` }
  }

  return { allowed: true }
}

/** Zestawienie macierzy do wystawienia w API i w panelu. */
export const permissionMatrix = () =>
  ROLES.map((role) => ({
    role,
    rank: ROLE_RANK[role],
    description: ROLE_DESCRIPTIONS[role],
    permissions: ROLE_PERMISSIONS[role],
    permissionCount: ROLE_PERMISSIONS[role].length,
  }))
