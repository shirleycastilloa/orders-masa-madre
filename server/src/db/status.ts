import { db } from './client.js';

const tables = await db.execute(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
    AND name IN ('schema_migrations', 'clientes', 'tipos_pan', 'ingredientes_adicionales', 'ordenes')
  ORDER BY name
`);

const counts = await Promise.all(
  ['clientes', 'tipos_pan', 'ingredientes_adicionales', 'ordenes'].map(async (table) => {
    const result = await db.execute(`SELECT COUNT(*) AS count FROM ${table}`);
    return `${table}=${result.rows[0]?.count ?? 0}`;
  }),
);

console.log(`Tables: ${tables.rows.map((row) => row.name).join(', ')}`);
console.log(`Counts: ${counts.join(', ')}`);
