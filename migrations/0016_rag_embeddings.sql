-- SANDBOX 5 — Faza 4.3: RAG embeddings + documents

CREATE TABLE IF NOT EXISTS rag_documents (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'api',
  chunk_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding BLOB NOT NULL,
  metadata_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slug) REFERENCES rag_documents(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_embeddings_slug ON embeddings(slug);
CREATE INDEX IF NOT EXISTS idx_embeddings_category ON embeddings(category);
CREATE INDEX IF NOT EXISTS idx_embeddings_slug_chunk ON embeddings(slug, chunk_index);
CREATE INDEX IF NOT EXISTS idx_rag_documents_category ON rag_documents(category);
CREATE INDEX IF NOT EXISTS idx_rag_documents_updated_at ON rag_documents(updated_at DESC);
