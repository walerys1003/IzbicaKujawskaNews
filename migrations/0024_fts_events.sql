CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
  title,
  description,
  location_name,
  location_solectwo,
  category UNINDEXED,
  tokenize='unicode61 remove_diacritics 0'
);
