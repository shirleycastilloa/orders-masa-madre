import { db } from './client.js';

const result = await db.execute('SELECT 1 AS connected');
const connected = result.rows[0]?.connected === 1;

if (!connected) {
  throw new Error('Turso no devolvió la respuesta esperada.');
}

console.log('Turso connection: ok');
