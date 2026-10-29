import { readdir, readFile } from 'node:fs/promises';
import { db } from './client.js';

await db.execute(
  'CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
);

const migrationDirectory = new URL('./migrations/', import.meta.url);
const migrationFiles = (await readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort();

for (const migrationFile of migrationFiles) {
  const version = migrationFile.replace(/\.sql$/, '');
  const applied = await db.execute({
    sql: 'SELECT version FROM schema_migrations WHERE version = ?',
    args: [version],
  });

  if (applied.rows.length > 0) {
    console.log(`Migration ${version}: already applied`);
    continue;
  }

  const migrationSql = await readFile(new URL(migrationFile, migrationDirectory), 'utf8');
  const statements = migrationSql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  await db.batch([
    ...statements,
    {
      sql: 'INSERT INTO schema_migrations (version) VALUES (?)',
      args: [version],
    },
  ], 'write');
  console.log(`Migration ${version}: applied`);
}
