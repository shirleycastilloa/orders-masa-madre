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
