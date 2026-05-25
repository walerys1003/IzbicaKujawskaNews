CREATE VIRTUAL TABLE IF NOT EXISTS solectwa_fts USING fts5(
  solectwo,
  title,
  excerpt,
  body,
  slug UNINDEXED,
  tokenize='unicode61 remove_diacritics 0'
);
