import { Router } from 'express';
import type { InValue } from '@libsql/client';
import { db } from '../db/client.js';
import { ApiError, sendData } from '../http.js';
import {
  clientCreateSchema,
  clientUpdateSchema,
  getNumericId,
  isValidDateOnly,
  normalizeOptionalText,
  orderCreateSchema,
  orderUpdateSchema,
} from '../validators.js';

export const apiRouter = Router();

const orderProjection = `
  SELECT
    o.id,
    o.cliente_id,
    o.fecha_registro,
    o.fecha_entrega,
    o.hora_entrega,
    o.tipo_pan_id,
    o.ingrediente_adicional_id,
    o.monto_colones,
    o.pagada,
    o.activa,
    c.alias AS cliente_alias,
    c.nombre_completo AS cliente_nombre_completo,
    c.email AS cliente_email,
    c.mobile AS cliente_mobile,
    c.direccion AS cliente_direccion,
    c.notas AS cliente_notas,
    tp.tipo AS tipo_pan,
    ia.ingrediente AS ingrediente_adicional
  FROM ordenes o
  INNER JOIN clientes c ON c.id = o.cliente_id
  INNER JOIN tipos_pan tp ON tp.id = o.tipo_pan_id
  INNER JOIN ingredientes_adicionales ia ON ia.id = o.ingrediente_adicional_id
`;

function mapClient(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    alias: row.alias,
    nombre_completo: row.nombre_completo,
    email: row.email,
    mobile: row.mobile,
    direccion: row.direccion,
    notas: row.notas,
  };
}

function mapOrder(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    cliente_id: Number(row.cliente_id),
    fecha_registro: row.fecha_registro,
    fecha_entrega: row.fecha_entrega,
    hora_entrega: row.hora_entrega,
    tipo_pan_id: Number(row.tipo_pan_id),
    ingrediente_adicional_id: Number(row.ingrediente_adicional_id),
    monto_colones: Number(row.monto_colones),
    pagada: Number(row.pagada) === 1,
    activa: Number(row.activa) === 1,
    cliente: {
      alias: row.cliente_alias,
      nombre_completo: row.cliente_nombre_completo,
      email: row.cliente_email,
      mobile: row.cliente_mobile,
      direccion: row.cliente_direccion,
      notas: row.cliente_notas,
    },
    tipo_pan: row.tipo_pan,
    ingrediente_adicional: row.ingrediente_adicional,
  };
}

function getBusinessDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: process.env.APP_TIMEZONE ?? 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function getOrder(id: number) {
  const result = await db.execute({
    sql: `${orderProjection} WHERE o.id = ?`,
    args: [id],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapOrder(row) : null;
}

async function assertReferences(clienteId: number, tipoPanId: number, ingredienteId: number) {
  const checks = await Promise.all([
    db.execute({ sql: 'SELECT 1 FROM clientes WHERE id = ?', args: [clienteId] }),
    db.execute({ sql: 'SELECT 1 FROM tipos_pan WHERE id = ?', args: [tipoPanId] }),
    db.execute({ sql: 'SELECT 1 FROM ingredientes_adicionales WHERE id = ?', args: [ingredienteId] }),
  ]);
  const names = ['cliente_id', 'tipo_pan_id', 'ingrediente_adicional_id'];
  const fields: Record<string, string> = {};
  checks.forEach((check, index) => {
    if (check.rows.length === 0) fields[names[index]] = 'El registro relacionado no existe.';
  });
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'REFERENCE_ERROR', 'Uno o más registros relacionados no existen.', fields);
  }
}

apiRouter.get('/catalogos', async (_request, response) => {
  const [types, ingredients] = await Promise.all([
    db.execute('SELECT id, tipo FROM tipos_pan ORDER BY tipo COLLATE NOCASE ASC'),
    db.execute('SELECT id, ingrediente FROM ingredientes_adicionales ORDER BY ingrediente COLLATE NOCASE ASC'),
  ]);

  return sendData(response, {
    tipos_pan: types.rows.map((row) => ({ id: Number(row.id), tipo: row.tipo })),
    ingredientes_adicionales: ingredients.rows.map((row) => ({ id: Number(row.id), ingrediente: row.ingrediente })),
  });
});

apiRouter.get('/clientes', async (request, response) => {
  const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
  const result = search
    ? await db.execute({
        sql: `SELECT id, alias, nombre_completo, email, mobile, direccion, notas
              FROM clientes
              WHERE alias LIKE ? COLLATE NOCASE OR nombre_completo LIKE ? COLLATE NOCASE
              ORDER BY alias COLLATE NOCASE ASC`,
        args: [`%${search}%`, `%${search}%`],
      })
    : await db.execute(
        'SELECT id, alias, nombre_completo, email, mobile, direccion, notas FROM clientes ORDER BY alias COLLATE NOCASE ASC',
      );
  return sendData(response, result.rows.map((row) => mapClient(row as Record<string, unknown>)));
});

apiRouter.get('/clientes/:id', async (request, response) => {
  const id = getNumericId(request.params.id);
  const result = await db.execute({
    sql: 'SELECT id, alias, nombre_completo, email, mobile, direccion, notas FROM clientes WHERE id = ?',
    args: [id],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) throw new ApiError(404, 'CLIENT_NOT_FOUND', 'Cliente no encontrado.');
  return sendData(response, mapClient(row));
});

apiRouter.post('/clientes', async (request, response) => {
  const data = clientCreateSchema.parse(request.body);
  try {
    const result = await db.execute({
      sql: `INSERT INTO clientes (alias, nombre_completo, email, mobile, direccion, notas)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        data.alias,
        normalizeOptionalText(data.nombre_completo),
        normalizeOptionalText(data.email),
        normalizeOptionalText(data.mobile),
        normalizeOptionalText(data.direccion),
        normalizeOptionalText(data.notas),
      ],
    });
    const id = Number(result.lastInsertRowid);
    const created = await db.execute({
      sql: 'SELECT id, alias, nombre_completo, email, mobile, direccion, notas FROM clientes WHERE id = ?',
      args: [id],
    });
    return sendData(response, mapClient(created.rows[0] as Record<string, unknown>), 201);
  } catch (error) {
    if (String(error).toLowerCase().includes('unique')) {
      throw new ApiError(409, 'DUPLICATE_ALIAS', 'Ya existe un cliente con ese alias.');
    }
    throw error;
  }
});

apiRouter.patch('/clientes/:id', async (request, response) => {
  const id = getNumericId(request.params.id);
  const data = clientUpdateSchema.parse(request.body);
  const current = await db.execute({ sql: 'SELECT id FROM clientes WHERE id = ?', args: [id] });
  if (current.rows.length === 0) throw new ApiError(404, 'CLIENT_NOT_FOUND', 'Cliente no encontrado.');

  const fields: string[] = [];
  const args: InValue[] = [];
  if (data.alias !== undefined) {
    fields.push('alias = ?');
    args.push(data.alias);
  }
  for (const field of ['nombre_completo', 'email', 'mobile', 'direccion', 'notas'] as const) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      args.push(normalizeOptionalText(data[field]));
    }
  }
  args.push(id);
  try {
    await db.execute({ sql: `UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, args });
  } catch (error) {
    if (String(error).toLowerCase().includes('unique')) {
      throw new ApiError(409, 'DUPLICATE_ALIAS', 'Ya existe un cliente con ese alias.');
    }
    throw error;
  }
  const updated = await db.execute({
    sql: 'SELECT id, alias, nombre_completo, email, mobile, direccion, notas FROM clientes WHERE id = ?',
    args: [id],
  });
  return sendData(response, mapClient(updated.rows[0] as Record<string, unknown>));
});

async function listOrders(active: boolean) {
  const result = await db.execute({
    sql: `${orderProjection}
      WHERE o.activa = ?
      ORDER BY ${active ? 'o.fecha_entrega ASC, o.hora_entrega ASC, o.id ASC' : 'o.fecha_registro DESC, o.id DESC'}`,
    args: [active ? 1 : 0],
  });
  return result.rows.map((row) => mapOrder(row as Record<string, unknown>));
}

apiRouter.get('/ordenes/activas', async (_request, response) => sendData(response, await listOrders(true)));
apiRouter.get('/ordenes/historico', async (_request, response) => sendData(response, await listOrders(false)));

apiRouter.get('/ordenes/:id', async (request, response) => {
  const order = await getOrder(getNumericId(request.params.id));
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Orden no encontrada.');
  return sendData(response, order);
});

apiRouter.post('/ordenes', async (request, response) => {
  const data = orderCreateSchema.parse(request.body);
  if (!isValidDateOnly(data.fecha_entrega)) {
    throw new ApiError(400, 'INVALID_DATE', 'La fecha de entrega no es válida.', { fecha_entrega: 'Selecciona una fecha válida.' });
  }
  await assertReferences(data.cliente_id, data.tipo_pan_id, data.ingrediente_adicional_id);
  const result = await db.execute({
    sql: `INSERT INTO ordenes
      (cliente_id, fecha_registro, fecha_entrega, hora_entrega, tipo_pan_id,
       ingrediente_adicional_id, monto_colones, pagada, activa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    args: [
      data.cliente_id,
      getBusinessDate(),
      data.fecha_entrega,
      data.hora_entrega,
      data.tipo_pan_id,
      data.ingrediente_adicional_id,
      data.monto_colones,
      data.pagada ? 1 : 0,
    ],
  });
  const order = await getOrder(Number(result.lastInsertRowid));
  return sendData(response, order, 201);
});

apiRouter.patch('/ordenes/:id', async (request, response) => {
  const id = getNumericId(request.params.id);
  const data = orderUpdateSchema.parse(request.body);
  const existing = await getOrder(id);
  if (!existing) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Orden no encontrada.');
  if (data.fecha_entrega !== undefined && !isValidDateOnly(data.fecha_entrega)) {
    throw new ApiError(400, 'INVALID_DATE', 'La fecha de entrega no es válida.', { fecha_entrega: 'Selecciona una fecha válida.' });
  }

  const references = {
    cliente_id: data.cliente_id ?? existing.cliente_id,
    tipo_pan_id: data.tipo_pan_id ?? existing.tipo_pan_id,
    ingrediente_adicional_id: data.ingrediente_adicional_id ?? existing.ingrediente_adicional_id,
  };
  await assertReferences(references.cliente_id, references.tipo_pan_id, references.ingrediente_adicional_id);

  const assignments: string[] = [];
  const args: InValue[] = [];
  const values: Record<string, InValue | undefined> = {
    cliente_id: data.cliente_id,
    fecha_entrega: data.fecha_entrega,
    hora_entrega: data.hora_entrega,
    tipo_pan_id: data.tipo_pan_id,
    ingrediente_adicional_id: data.ingrediente_adicional_id,
    monto_colones: data.monto_colones,
    pagada: data.pagada === undefined ? undefined : data.pagada ? 1 : 0,
  };
  for (const field of Object.keys(values)) {
    if (values[field] !== undefined) {
      assignments.push(`${field} = ?`);
      args.push(values[field]);
    }
  }
  args.push(id);
  await db.execute({ sql: `UPDATE ordenes SET ${assignments.join(', ')} WHERE id = ?`, args });
  return sendData(response, await getOrder(id));
});

apiRouter.patch('/ordenes/:id/completar', async (request, response) => {
  const id = getNumericId(request.params.id);
  const existing = await getOrder(id);
  if (!existing) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Orden no encontrada.');
  await db.execute({ sql: 'UPDATE ordenes SET activa = 0 WHERE id = ?', args: [id] });
  return sendData(response, await getOrder(id));
});

apiRouter.delete('/ordenes/:id', async (request, response) => {
  const id = getNumericId(request.params.id);
  const existing = await getOrder(id);
  if (!existing) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Orden no encontrada.');
  await db.execute({ sql: 'DELETE FROM ordenes WHERE id = ?', args: [id] });
  return response.status(204).send();
});
