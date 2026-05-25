CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  title,
  lede,
  body,
  category UNINDEXED,
  slug UNINDEXED,
  tokenize='unicode61 remove_diacritics 0'
);
