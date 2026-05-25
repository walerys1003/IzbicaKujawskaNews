// =========================================================================
// RAG metadata (server-side) — pełny indeks ładowany przez klienta
// =========================================================================
// Stats jest mały (1 KB) — możemy zaimportować go statycznie.

import statsData from './rag-stats.json'
export const ragStats = statsData as any
