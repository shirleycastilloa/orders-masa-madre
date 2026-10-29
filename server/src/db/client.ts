import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('Falta la variable TURSO_DATABASE_URL.');
}

if (!authToken) {
  throw new Error('Falta la variable TURSO_AUTH_TOKEN.');
}

export const db = createClient({
  url,
  authToken,
});
