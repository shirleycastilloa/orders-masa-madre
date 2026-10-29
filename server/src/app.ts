import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorHandler, notFoundHandler, sendData } from './http.js';
import { apiRouter } from './routes/api.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, '../../client/dist');

app.use(express.json());

app.get('/api/health', (_request, response) => {
  sendData(response, { status: 'ok' });
});

app.use('/api', apiRouter);
app.use('/api', notFoundHandler);
app.use(express.static(clientDist));

app.get('*splat', (_request, response) => {
  response.sendFile(path.join(clientDist, 'index.html'));
});

app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`Orders Masa Madre server listening on port ${port}`);
});
