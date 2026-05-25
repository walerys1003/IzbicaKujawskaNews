CREATE VIRTUAL TABLE IF NOT EXISTS comments_fts USING fts5(
  author_name,
  body,
  status UNINDEXED,
  article_id UNINDEXED,
  tokenize='unicode61 remove_diacritics 0'
);
