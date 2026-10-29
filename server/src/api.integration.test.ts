import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import supertest from 'supertest';

const hasDatabaseCredentials = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

describe.skipIf(!hasDatabaseCredentials)('API integration against Turso', () => {
  let request: ReturnType<typeof supertest>;
  let db: typeof import('./db/client.js').db;
  let testClientId = 0;
  let testOrderId = 0;
  const alias = `INTEGRATION-${Date.now()}`;

  beforeAll(async () => {
    const appModule = await import('./app.js');
    const dbModule = await import('./db/client.js');
    request = supertest(appModule.default);
    db = dbModule.db;
  });

  afterAll(async () => {
    if (testOrderId) await db.execute({ sql: 'DELETE FROM ordenes WHERE id = ?', args: [testOrderId] });
    if (testClientId) await db.execute({ sql: 'DELETE FROM clientes WHERE id = ?', args: [testClientId] });
  });

  it('runs the complete order lifecycle', async () => {
    const catalogs = await request.get('/api/catalogos').expect(200);
    const typeId = catalogs.body.data.tipos_pan[0].id;
    const ingredientId = catalogs.body.data.ingredientes_adicionales[0].id;

    const clientResponse = await request.post('/api/clientes').send({ alias }).expect(201);
    testClientId = clientResponse.body.data.id;

    const orderResponse = await request.post('/api/ordenes').send({
      cliente_id: testClientId,
      fecha_entrega: '2099-12-31',
      hora_entrega: '14:30',
      tipo_pan_id: typeId,
      ingrediente_adicional_id: ingredientId,
      monto_colones: 12500,
      pagada: false,
    }).expect(201);
    testOrderId = orderResponse.body.data.id;
    expect(orderResponse.body.data.activa).toBe(true);

    await request.patch(`/api/ordenes/${testOrderId}`).send({ monto_colones: 13000, pagada: true }).expect(200);
    const completed = await request.patch(`/api/ordenes/${testOrderId}/completar`).expect(200);
    expect(completed.body.data.activa).toBe(false);
    expect((await request.get('/api/ordenes/historico')).body.data.some((order: { id: number }) => order.id === testOrderId)).toBe(true);

    await request.delete(`/api/ordenes/${testOrderId}`).expect(204);
    await request.get(`/api/ordenes/${testOrderId}`).expect(404);
    testOrderId = 0;
  });
});
