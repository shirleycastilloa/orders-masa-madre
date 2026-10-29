import { expect, test } from '@playwright/test';

test('navega desde inicio a registrar una orden', async ({ page }) => {
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [], error: null } }));
  await page.route('**/api/catalogos', (route) => route.fulfill({ json: {
    data: {
      tipos_pan: [{ id: 1, tipo: 'Bolla' }],
      ingredientes_adicionales: [{ id: 1, ingrediente: 'Sin ingredientes adicionales' }],
    },
    error: null,
  } }));
  await page.route('**/api/clientes', (route) => route.fulfill({ json: { data: [], error: null } }));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Órdenes activas', exact: true })).toBeVisible();
  await expect(page.getByText('No hay órdenes activas')).toBeVisible();
  await page.getByRole('button', { name: /Registrar orden/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Registrar orden' })).toBeVisible();
  await expect(page.getByLabel('Fecha de entrega')).toBeVisible();
  await expect(page.getByLabel('Hora de entrega')).toBeVisible();
});

test('permite agregar un cliente desde registrar orden', async ({ page }) => {
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [], error: null } }));
  await page.route('**/api/catalogos', (route) => route.fulfill({ json: { data: { tipos_pan: [{ id: 1, tipo: 'Bolla' }], ingredientes_adicionales: [{ id: 1, ingrediente: 'Sin ingredientes adicionales' }] }, error: null } }));
  await page.route('**/api/clientes', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, json: { data: { id: 10, alias: 'Ana QA', nombre_completo: 'Ana QA', email: null, mobile: null, direccion: null }, error: null } });
    }
    return route.fulfill({ json: { data: [], error: null } });
  });

  await page.goto('/#/ordenes/nueva');
  await expect(page.getByRole('heading', { name: 'Registrar orden', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ Nuevo' }).click();
  await page.getByLabel('Alias').fill('Ana QA');
  await page.getByRole('button', { name: 'Crear cliente' }).click();
  await expect(page.locator('select').first()).toHaveValue('10');
});

test('muestra los mantenimientos en la parte superior', async ({ page }) => {
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [], error: null } }));
  await page.route('**/api/clientes', (route) => route.fulfill({ json: { data: [], error: null } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mantenimientos' })).toBeVisible();
  await page.getByRole('button', { name: /Clientes/ }).click();
  await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
});

test('muestra el día de entrega y las notas en la tarjeta activa', async ({ page }) => {
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [{
    id: 20,
    cliente_id: 10,
    fecha_registro: '2026-11-01',
    fecha_entrega: '2026-11-14',
    hora_entrega: '09:00',
    tipo_pan_id: 1,
    ingrediente_adicional_id: 1,
    monto_colones: 12500,
    pagada: false,
    activa: true,
    notas: 'Entregar temprano antes de las 10',
    cliente: { id: 10, alias: 'Ana QA', nombre_completo: 'Ana QA', email: null, mobile: null, direccion: null },
    tipo_pan: 'Bolla',
    ingrediente_adicional: 'Sin ingredientes adicionales',
  }], error: null } }));
  await page.goto('/');
  await expect(page.getByText('Sábado')).toBeVisible();
  await expect(page.getByText('Notas: Entregar temprano antes de las 10')).toBeVisible();
});
