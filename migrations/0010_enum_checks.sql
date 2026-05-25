CREATE TRIGGER IF NOT EXISTS trg_articles_status_guard_insert BEFORE INSERT ON articles
WHEN NEW.status NOT IN ('draft', 'review', 'scheduled', 'published', 'archived')
BEGIN
  SELECT RAISE(ABORT, 'invalid articles.status');
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_status_guard_update BEFORE UPDATE OF status ON articles
WHEN NEW.status NOT IN ('draft', 'review', 'scheduled', 'published', 'archived')
BEGIN
  SELECT RAISE(ABORT, 'invalid articles.status');
END;

CREATE TRIGGER IF NOT EXISTS trg_users_role_guard BEFORE INSERT ON users
WHEN NEW.role NOT IN ('admin', 'editor', 'journalist', 'reader')
BEGIN
  SELECT RAISE(ABORT, 'invalid users.role');
END;

CREATE TRIGGER IF NOT EXISTS trg_comments_status_guard BEFORE INSERT ON comments
WHEN NEW.status NOT IN ('pending', 'approved', 'rejected', 'spam')
BEGIN
  SELECT RAISE(ABORT, 'invalid comments.status');
END;

CREATE TRIGGER IF NOT EXISTS trg_job_offers_type_guard BEFORE INSERT ON job_offers
WHEN NEW.type NOT IN ('full', 'part', 'freelance')
BEGIN
  SELECT RAISE(ABORT, 'invalid job_offers.type');
END;

CREATE TRIGGER IF NOT EXISTS trg_real_estate_type_guard BEFORE INSERT ON real_estate
WHEN NEW.type NOT IN ('dom', 'mieszkanie', 'dzialka', 'lokal') OR NEW."transaction" NOT IN ('sprzedaz', 'wynajem')
BEGIN
  SELECT RAISE(ABORT, 'invalid real_estate enum');
END;
