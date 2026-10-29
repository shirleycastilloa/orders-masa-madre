import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, '../../client/dist');

app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({
    data: { status: 'ok' },
    error: null,
  });
});

app.use(express.static(clientDist));

app.get('*splat', (_request, response) => {
  response.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Orders Masa Madre server listening on port ${port}`);
});
