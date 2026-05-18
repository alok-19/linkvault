import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'src', 'migrations');

interface Migration {
  id: number;
  name: string;
  sql: string;
}

function parseMigrations(): Migration[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const match = file.match(/^(\d+)_(.+?)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${file}. Expected format: 001_name.sql`);
    }

    const id = parseInt(match[1], 10);
    const name = match[2];
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

    return { id, name, sql };
  });
}

function bootstrapExistingDatabase(db: Database.Database, migrations: Migration[]) {
  // Check if this is an existing database that predates the migration system
  const linksTableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='links'"
  ).get();

  const migrationsTableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
  ).get();

  if (linksTableExists && !migrationsTableExists) {
    console.log('Bootstrapping existing database: marking all current migrations as applied');
    db.exec(`
      CREATE TABLE schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      )
    `);

    for (const migration of migrations) {
      db.prepare('INSERT INTO schema_migrations (id, name) VALUES (?, ?)')
        .run(migration.id, migration.name);
    }

    console.log(`  ✓ Bootstrapped ${migrations.length} migration(s)`);
  }
}

export function runMigrations(db: Database.Database) {
  const migrations = parseMigrations();
  if (migrations.length === 0) {
    console.log('No migrations found in', MIGRATIONS_DIR);
    return;
  }

  bootstrapExistingDatabase(db, migrations);

  // Create migrations tracking table (idempotent, safe to re-run)
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Get already applied migrations
  const appliedRows = db.prepare('SELECT id FROM schema_migrations').all() as { id: number }[];
  const appliedIds = new Set(appliedRows.map(r => r.id));

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    console.log(`Running migration ${migration.id}: ${migration.name}`);

    try {
      db.exec('BEGIN TRANSACTION');
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (id, name) VALUES (?, ?)').run(migration.id, migration.name);
      db.exec('COMMIT');
      console.log(`  ✓ Migration ${migration.id} applied successfully`);
    } catch (error) {
      db.exec('ROLLBACK');
      console.error(`  ✗ Migration ${migration.id} failed:`, error);
      throw error;
    }
  }

  console.log('Migrations complete.');
}
