-- Initial schema: links table, thumbnail_cache, FTS5 search, indexes

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'uncategorized',
  tags TEXT NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  thumbnail_type TEXT DEFAULT 'og',
  favicon_url TEXT,
  domain TEXT,
  click_count INTEGER DEFAULT 0,
  last_clicked TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS thumbnail_cache (
  url TEXT PRIMARY KEY,
  og_image TEXT,
  microlink_image TEXT,
  pagespeed_screenshot TEXT,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE IF NOT EXISTS links_fts USING fts5(
  title, description, url, tags, domain,
  content='links',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS links_ai AFTER INSERT ON links BEGIN
  INSERT INTO links_fts(rowid, title, description, url, tags, domain)
  VALUES (new.id, new.title, new.description, new.url, new.tags, new.domain);
END;

CREATE TRIGGER IF NOT EXISTS links_ad AFTER DELETE ON links BEGIN
  INSERT INTO links_fts(links_fts, rowid, title, description, url, tags, domain)
  VALUES ('delete', old.id, old.title, old.description, old.url, old.tags, old.domain);
END;

CREATE TRIGGER IF NOT EXISTS links_au AFTER UPDATE ON links BEGIN
  INSERT INTO links_fts(links_fts, rowid, title, description, url, tags, domain)
  VALUES ('delete', old.id, old.title, old.description, old.url, old.tags, old.domain);
  INSERT INTO links_fts(rowid, title, description, url, tags, domain)
  VALUES (new.id, new.title, new.description, new.url, new.tags, new.domain);
END;

CREATE INDEX IF NOT EXISTS idx_links_category ON links(category);
CREATE INDEX IF NOT EXISTS idx_links_domain ON links(domain);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
CREATE INDEX IF NOT EXISTS idx_links_click_count ON links(click_count);
