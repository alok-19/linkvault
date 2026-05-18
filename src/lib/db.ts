import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';

function getProjectRoot(): string {
  const cwd = process.cwd();
  if (cwd.includes('.next/standalone')) {
    return path.resolve(cwd, '..', '..');
  }
  return cwd;
}

const DB_PATH = process.env.DATABASE_PATH || path.join(getProjectRoot(), 'data', 'links.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;
let stmts: ReturnType<typeof prepareStatements>;

function prepareStatements(database: Database.Database) {
  return {
    getById: database.prepare('SELECT * FROM links WHERE id = ?'),
    getByUrl: database.prepare('SELECT * FROM links WHERE url = ?'),
    insert: database.prepare(`
      INSERT INTO links (url, title, description, category, tags, thumbnail_url, thumbnail_type, favicon_url, domain, content, reading_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    incrementClick: database.prepare(`
      UPDATE links SET click_count = click_count + 1, last_clicked = datetime('now') WHERE id = ?
    `),
    getCategories: database.prepare(`
      SELECT category, COUNT(*) as count FROM links GROUP BY category ORDER BY count DESC
    `),
    getTotal: database.prepare('SELECT COUNT(*) as count FROM links'),
    getTotalClicks: database.prepare('SELECT SUM(click_count) as count FROM links'),
    getBrokenCount: database.prepare('SELECT COUNT(*) as count FROM links WHERE is_broken = 1'),
    getTopDomains: database.prepare(`
      SELECT domain, COUNT(*) as count FROM links WHERE domain != '' GROUP BY domain ORDER BY count DESC LIMIT 10
    `),
    getRecent: database.prepare('SELECT * FROM links ORDER BY created_at DESC LIMIT 5'),
    getBrokenLinks: database.prepare('SELECT * FROM links WHERE is_broken = 1 ORDER BY last_checked DESC'),
    updateBrokenStatus: database.prepare(`
      UPDATE links SET is_broken = ?, last_checked = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `),
    getStatusCounts: database.prepare(`
      SELECT status, COUNT(*) as count FROM links GROUP BY status
    `),
    deleteById: database.prepare('DELETE FROM links WHERE id = ?'),
  };
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('cache_size = -64000');
    db.pragma('temp_store = MEMORY');
    db.pragma('synchronous = NORMAL');
    runMigrations(db);
    stmts = prepareStatements(db);
  }
  return db;
}

function ensureStmts() {
  if (!stmts) getDb();
  return stmts!;
}

export const linkDb = {
  getAll(options: {
    search?: string;
    category?: string;
    tag?: string;
    status?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const database = getDb();
    const { search, category, tag, status, sort = 'newest', page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('links.id IN (SELECT rowid FROM links_fts WHERE links_fts MATCH ?)');
      params.push(search.split(' ').map(w => `${w}*`).join(' '));
    }

    if (category && category !== 'all') {
      whereClauses.push('links.category = ?');
      params.push(category);
    }

    if (tag) {
      whereClauses.push('links.tags LIKE ?');
      params.push(`%"${tag}"%`);
    }

    if (status && status !== 'all') {
      whereClauses.push('links.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderBy = 'links.created_at DESC';
    switch (sort) {
      case 'oldest':
        orderBy = 'links.created_at ASC';
        break;
      case 'most_clicked':
        orderBy = 'links.click_count DESC';
        break;
      case 'alphabetical':
        orderBy = 'links.title ASC';
        break;
      case 'domain':
        orderBy = 'links.domain ASC';
        break;
    }

    const countSql = `SELECT COUNT(*) as total FROM links ${whereSql}`;
    const countResult = database.prepare(countSql).get(...params) as { total: number };

    const lightCols = `id, url, title, description, category, tags, thumbnail_url, thumbnail_type, favicon_url, domain, click_count, last_clicked, status, reading_time, is_broken, last_checked, created_at, updated_at`;
    const dataSql = `SELECT ${lightCols} FROM links ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    const links = database.prepare(dataSql).all(...params, limit, offset);

    return {
      links: links.map(parseLink),
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit),
    };
  },

  getById(id: number) {
    const s = ensureStmts();
    const link = s.getById.get(id);
    return link ? parseLink(link) : null;
  },

  getByUrl(url: string) {
    const s = ensureStmts();
    const link = s.getByUrl.get(url);
    return link ? parseLink(link) : null;
  },

  create(data: {
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    thumbnail_url?: string;
    thumbnail_type?: string;
    favicon_url?: string;
    domain: string;
    content?: string;
    reading_time?: number;
  }) {
    const s = ensureStmts();
    const result = s.insert.run(
      data.url,
      data.title,
      data.description,
      data.category,
      JSON.stringify(data.tags),
      data.thumbnail_url ?? null,
      data.thumbnail_type || 'og',
      data.favicon_url ?? null,
      data.domain,
      data.content ?? '',
      data.reading_time ?? 0
    );

    return this.getById(result.lastInsertRowid as number);
  },

  update(id: number, data: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    thumbnail_url?: string;
    thumbnail_type?: string;
    favicon_url?: string;
    status?: string;
    content?: string;
    reading_time?: number;
    is_broken?: number;
    last_checked?: string;
  }) {
    const database = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(data.tags));
    }
    if (data.thumbnail_url !== undefined) {
      fields.push('thumbnail_url = ?');
      values.push(data.thumbnail_url);
    }
    if (data.thumbnail_type !== undefined) {
      fields.push('thumbnail_type = ?');
      values.push(data.thumbnail_type);
    }
    if (data.favicon_url !== undefined) {
      fields.push('favicon_url = ?');
      values.push(data.favicon_url);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      values.push(data.content);
    }
    if (data.reading_time !== undefined) {
      fields.push('reading_time = ?');
      values.push(data.reading_time);
    }
    if (data.is_broken !== undefined) {
      fields.push('is_broken = ?');
      values.push(data.is_broken);
    }
    if (data.last_checked !== undefined) {
      fields.push('last_checked = ?');
      values.push(data.last_checked);
    }

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    const sql = `UPDATE links SET ${fields.join(', ')} WHERE id = ?`;
    database.prepare(sql).run(...values);

    return this.getById(id);
  },

  updateStatus(ids: number[], status: string) {
    const database = getDb();
    const placeholders = ids.map(() => '?').join(',');
    database.prepare(`
      UPDATE links SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})
    `).run(status, ...ids);
    return { updated: ids.length };
  },

  getStatusCounts() {
    const s = ensureStmts();
    const results = s.getStatusCounts.all() as { status: string; count: number }[];

    const counts: Record<string, number> = { unread: 0, reading: 0, archived: 0 };
    results.forEach(r => { counts[r.status] = r.count; });
    return counts;
  },

  delete(id: number) {
    const s = ensureStmts();
    return s.deleteById.run(id);
  },

  deleteMany(ids: number[]) {
    const database = getDb();
    const placeholders = ids.map(() => '?').join(',');
    database.prepare(`DELETE FROM links WHERE id IN (${placeholders})`).run(...ids);
    return { deleted: ids.length };
  },

  incrementClick(id: number) {
    const s = ensureStmts();
    s.incrementClick.run(id);
    return this.getById(id);
  },

  getCategories() {
    const s = ensureStmts();
    return s.getCategories.all() as { category: string; count: number }[];
  },

  getStats() {
    const s = ensureStmts();

    const total = s.getTotal.get() as { count: number };
    const totalClicks = s.getTotalClicks.get() as { count: number | null };
    const brokenCount = s.getBrokenCount.get() as { count: number };
    const categories = s.getCategories.all() as { category: string; count: number }[];
    const topDomains = s.getTopDomains.all() as { domain: string; count: number }[];
    const recent = s.getRecent.all().map(parseLink);

    const categoryMap: Record<string, number> = {};
    categories.forEach(c => { categoryMap[c.category] = c.count; });

    return {
      total: total.count,
      categories: categoryMap,
      top_domains: topDomains,
      recent,
      total_clicks: totalClicks.count || 0,
      broken_count: brokenCount.count,
    };
  },

  getBrokenLinks() {
    const s = ensureStmts();
    return s.getBrokenLinks.all().map(parseLink);
  },

  updateBrokenStatus(id: number, isBroken: boolean) {
    const s = ensureStmts();
    s.updateBrokenStatus.run(isBroken ? 1 : 0, id);
    return this.getById(id);
  },

};

function parseLink(row: any) {
  return {
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
    content: row.content || '',
    reading_time: row.reading_time || 0,
    is_broken: row.is_broken || 0,
    last_checked: row.last_checked || null,
  };
}
