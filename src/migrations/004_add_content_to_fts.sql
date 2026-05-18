-- Rebuild FTS5 index to include article content column
-- Enables full-text search across saved article bodies, not just metadata

DROP TRIGGER IF EXISTS links_ai;
DROP TRIGGER IF EXISTS links_ad;
DROP TRIGGER IF EXISTS links_au;
DROP TABLE IF EXISTS links_fts;

CREATE VIRTUAL TABLE links_fts USING fts5(
  title, description, url, tags, domain, content,
  content='links',
  content_rowid='id'
);

INSERT INTO links_fts(rowid, title, description, url, tags, domain, content)
SELECT id, title, description, url, tags, domain, COALESCE(content, '') FROM links;

CREATE TRIGGER links_ai AFTER INSERT ON links BEGIN
  INSERT INTO links_fts(rowid, title, description, url, tags, domain, content)
  VALUES (new.id, new.title, new.description, new.url, new.tags, new.domain, COALESCE(new.content, ''));
END;

CREATE TRIGGER links_ad AFTER DELETE ON links BEGIN
  INSERT INTO links_fts(links_fts, rowid, title, description, url, tags, domain, content)
  VALUES ('delete', old.id, old.title, old.description, old.url, old.tags, old.domain, COALESCE(old.content, ''));
END;

CREATE TRIGGER links_au AFTER UPDATE ON links BEGIN
  INSERT INTO links_fts(links_fts, rowid, title, description, url, tags, domain, content)
  VALUES ('delete', old.id, old.title, old.description, old.url, old.tags, old.domain, COALESCE(old.content, ''));
  INSERT INTO links_fts(rowid, title, description, url, tags, domain, content)
  VALUES (new.id, new.title, new.description, new.url, new.tags, new.domain, COALESCE(new.content, ''));
END;
