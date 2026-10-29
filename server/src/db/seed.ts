import { db } from './client.js';

const tiposPan = ['Bolla', 'Cuadrado'];
const ingredientes = [
  'Sin ingredientes adicionales',
  'Pasas',
  'Frutos rojos',
  'Cherrys',
  'Pistachos',
  'Semillas',
];

const statements = [
  ...tiposPan.map((tipo) => ({
    sql: 'INSERT INTO tipos_pan (tipo) VALUES (?) ON CONFLICT(tipo) DO NOTHING',
    args: [tipo],
  })),
  ...ingredientes.map((ingrediente) => ({
    sql: 'INSERT INTO ingredientes_adicionales (ingrediente) VALUES (?) ON CONFLICT(ingrediente) DO NOTHING',
    args: [ingrediente],
  })),
];

await db.batch(statements, 'write');
console.log(`Seed: ${tiposPan.length} tipos de pan y ${ingredientes.length} ingredientes verificados`);
