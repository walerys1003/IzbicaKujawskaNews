-- Migracja bootstrap. Włącza egzekwowanie kluczy obcych dla całej sesji
-- migracyjnej i stanowi punkt zerowy numeracji (0001-0044, ciągłej).
--
-- Schemat kanoniczny znajduje się w 0002_core_schema.sql. Wcześniejsze,
-- kolidujące definicje tabel (users/articles/categories/comments/media_assets/events
-- w osobnych plikach z tą samą numeracją) zostały usunięte, ponieważ
-- wygrywały sortowanie alfabetyczne i tworzyły schemat niezgodny z modelami
-- w src/db/models/.
PRAGMA foreign_keys = ON;

SELECT '0001 bootstrap ok' AS status;
