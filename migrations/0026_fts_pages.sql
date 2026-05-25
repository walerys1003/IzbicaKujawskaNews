CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
  slug UNINDEXED,
  title,
  body,
  page_type UNINDEXED,
  tokenize='unicode61 remove_diacritics 0'
);
