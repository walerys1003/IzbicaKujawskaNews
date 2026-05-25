CREATE VIRTUAL TABLE IF NOT EXISTS ogloszenia_fts USING fts5(
  title,
  excerpt,
  location,
  ad_type UNINDEXED,
  price UNINDEXED,
  slug UNINDEXED,
  tokenize='unicode61 remove_diacritics 0'
);
