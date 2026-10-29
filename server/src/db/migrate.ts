import { readFile } from 'node:fs/promises';
import { db } from './client.js';

const version = '001_initial';
const migrationUrl = new URL('./migrations/001_initial.sql', import.meta.url);
const migrationSql = await readFile(migrationUrl, 'utf8');
const statements = migrationSql
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

await db.execute(
  'CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
);

const applied = await db.execute({
  sql: 'SELECT version FROM schema_migrations WHERE version = ?',
  args: [version],
});

if (applied.rows.length > 0) {
  console.log(`Migration ${version}: already applied`);
  process.exit(0);
}

const statementsWithRecord = [
  ...statements,
  {
    sql: 'INSERT INTO schema_migrations (version) VALUES (?)',
    args: [version],
  },
];

await db.batch(statementsWithRecord, 'write');
console.log(`Migration ${version}: applied`);
