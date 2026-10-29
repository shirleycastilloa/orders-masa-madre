import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import supertest from 'supertest';

const hasDatabaseCredentials = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

describe.skipIf(!hasDatabaseCredentials)('API integration against Turso', () => {
  let request: ReturnType<typeof supertest>;
  let db: typeof import('./db/client.js').db;
  let testClientId = 0;
  let testOrderId = 0;
  let testBreadTypeId = 0;
  let testIngredientId = 0;
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
    if (testBreadTypeId) await db.execute({ sql: 'DELETE FROM tipos_pan WHERE id = ?', args: [testBreadTypeId] });
    if (testIngredientId) await db.execute({ sql: 'DELETE FROM ingredientes_adicionales WHERE id = ?', args: [testIngredientId] });
  });

  it('runs the complete order lifecycle', async () => {
    const catalogs = await request.get('/api/catalogos').expect(200);
    const breadType = await request.post('/api/catalogos/tipos-pan').send({ tipo: `Pan QA ${Date.now()}` }).expect(201);
    testBreadTypeId = breadType.body.data.id;
    const breadTypeUpdate = await request.patch(`/api/catalogos/tipos-pan/${testBreadTypeId}`).send({ tipo: `${breadType.body.data.tipo} editado` }).expect(200);
    expect(breadTypeUpdate.body.data.tipo).toContain('editado');
    const ingredient = await request.post('/api/catalogos/ingredientes').send({ ingrediente: `Ingrediente QA ${Date.now()}` }).expect(201);
    testIngredientId = ingredient.body.data.id;
    const ingredientUpdate = await request.patch(`/api/catalogos/ingredientes/${testIngredientId}`).send({ ingrediente: `${ingredient.body.data.ingrediente} editado` }).expect(200);
    expect(ingredientUpdate.body.data.ingrediente).toContain('editado');

    const clientResponse = await request.post('/api/clientes').send({ alias }).expect(201);
    testClientId = clientResponse.body.data.id;

    const orderResponse = await request.post('/api/ordenes').send({
      cliente_id: testClientId,
      fecha_entrega: '2099-12-31',
      hora_entrega: '14:30',
      tipo_pan_id: testBreadTypeId,
      ingrediente_adicional_id: testIngredientId,
      notas: 'Nota de integración para esta orden',
      monto_colones: 12500,
      pagada: false,
    }).expect(201);
    testOrderId = orderResponse.body.data.id;
    expect(orderResponse.body.data.activa).toBe(true);
    expect(orderResponse.body.data.notas).toBe('Nota de integración para esta orden');

    await request.patch(`/api/ordenes/${testOrderId}`).send({ notas: 'Nota actualizada', monto_colones: 13000, pagada: true }).expect(200);
    expect((await request.get(`/api/ordenes/${testOrderId}`)).body.data.notas).toBe('Nota actualizada');
    const completed = await request.patch(`/api/ordenes/${testOrderId}/completar`).expect(200);
    expect(completed.body.data.activa).toBe(false);
    expect((await request.get('/api/ordenes/historico')).body.data.some((order: { id: number }) => order.id === testOrderId)).toBe(true);

    await request.delete(`/api/ordenes/${testOrderId}`).expect(204);
    await request.get(`/api/ordenes/${testOrderId}`).expect(404);
    testOrderId = 0;
    await request.delete(`/api/clientes/${testClientId}`).expect(204);
    testClientId = 0;
    await request.delete(`/api/catalogos/tipos-pan/${testBreadTypeId}`).expect(204);
    testBreadTypeId = 0;
    await request.delete(`/api/catalogos/ingredientes/${testIngredientId}`).expect(204);
    testIngredientId = 0;
  });
});
