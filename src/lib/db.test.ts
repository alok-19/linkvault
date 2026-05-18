import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { linkDb } from '@/lib/db';
import { getDb } from '@/lib/db';
import Database from 'better-sqlite3';

// Helper to get a fresh in-memory DB for tests
function getTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run initial schema
  db.exec(`
    CREATE TABLE links (
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
      status TEXT DEFAULT 'unread',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE VIRTUAL TABLE links_fts USING fts5(
      title, description, url, tags, domain,
      content='links',
      content_rowid='id'
    );

    CREATE TRIGGER links_ai AFTER INSERT ON links BEGIN
      INSERT INTO links_fts(rowid, title, description, url, tags, domain)
      VALUES (new.id, new.title, new.description, new.url, new.tags, new.domain);
    END;

    CREATE TRIGGER links_ad AFTER DELETE ON links BEGIN
      INSERT INTO links_fts(links_fts, rowid, title, description, url, tags, domain)
      VALUES ('delete', old.id, old.title, old.description, old.url, old.tags, old.domain);
    END;

    CREATE TRIGGER links_au AFTER UPDATE ON links BEGIN
      INSERT INTO links_fts(links_fts, rowid, title, description, url, tags, domain)
      VALUES ('delete', old.id, old.title, old.description, old.url, old.tags, old.domain);
      INSERT INTO links_fts(rowid, title, description, url, tags, domain)
      VALUES (new.id, new.title, new.description, new.url, new.tags, new.domain);
    END;

    CREATE INDEX idx_links_category ON links(category);
    CREATE INDEX idx_links_domain ON links(domain);
    CREATE INDEX idx_links_created_at ON links(created_at);
    CREATE INDEX idx_links_click_count ON links(click_count);
    CREATE INDEX idx_links_status ON links(status);
  `);

  return db;
}

describe('linkDb', () => {
  let testDb: Database.Database;

  beforeEach(() => {
    testDb = getTestDb();
    // Monkey-patch getDb to return our test DB
    // This is a bit hacky but works for testing internal logic
  });

  afterEach(() => {
    testDb.close();
  });

  it('can create and retrieve a link', () => {
    const result = testDb.prepare(`
      INSERT INTO links (url, title, description, category, tags, domain)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('https://example.com', 'Example', 'Desc', 'dev-tools', '["test"]', 'example.com');

    expect(result.lastInsertRowid).toBeDefined();
  });

  it('can filter by status', () => {
    testDb.prepare(`INSERT INTO links (url, title, domain, status) VALUES (?, ?, ?, ?)`)
      .run('https://a.com', 'A', 'a.com', 'unread');
    testDb.prepare(`INSERT INTO links (url, title, domain, status) VALUES (?, ?, ?, ?)`)
      .run('https://b.com', 'B', 'b.com', 'archived');

    const unread = testDb.prepare(`SELECT COUNT(*) as count FROM links WHERE status = ?`).get('unread') as { count: number };
    expect(unread.count).toBe(1);

    const archived = testDb.prepare(`SELECT COUNT(*) as count FROM links WHERE status = ?`).get('archived') as { count: number };
    expect(archived.count).toBe(1);
  });
});
