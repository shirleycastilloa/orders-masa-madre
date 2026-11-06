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

test('despliega el menú de mantenimientos en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [], error: null } }));
  await page.goto('/');
  const menuToggle = page.getByRole('button', { name: 'Abrir menú de mantenimientos' });
  const clientsOption = page.getByRole('button', { name: /Clientes/ });
  await expect(menuToggle).toBeVisible();
  await expect(clientsOption).not.toBeVisible();
  await menuToggle.click();
  await expect(page.getByRole('button', { name: 'Cerrar menú de mantenimientos' })).toBeVisible();
  await expect(clientsOption).toBeVisible();
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
  await expect(page.getByText('Entregar temprano antes de las 10')).toHaveClass(/has-notes/);
});

test('muestra el resumen de pagos de las órdenes activas', async ({ page }) => {
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [
    {
      id: 21,
      cliente_id: 10,
      fecha_registro: '2026-11-01',
      fecha_entrega: '2026-11-14',
      hora_entrega: '09:00',
      tipo_pan_id: 1,
      ingrediente_adicional_id: 1,
      monto_colones: 12500,
      pagada: true,
      activa: true,
      notas: null,
      cliente: { id: 10, alias: 'Ana QA', nombre_completo: 'Ana QA', email: null, mobile: null, direccion: null },
      tipo_pan: 'Bolla',
      ingrediente_adicional: 'Sin ingredientes adicionales',
    },
    {
      id: 22,
      cliente_id: 11,
      fecha_registro: '2026-11-01',
      fecha_entrega: '2026-11-15',
      hora_entrega: '10:00',
      tipo_pan_id: 1,
      ingrediente_adicional_id: 1,
      monto_colones: 8000,
      pagada: false,
      activa: true,
      notas: null,
      cliente: { id: 11, alias: 'Luis QA', nombre_completo: 'Luis QA', email: null, mobile: null, direccion: null },
      tipo_pan: 'Bolla',
      ingrediente_adicional: 'Sin ingredientes adicionales',
    },
  ], error: null } }));

  await page.goto('/');
  const summary = page.getByRole('region', { name: 'Resumen de pagos' });
  await expect(summary).toBeVisible();
  await expect(summary.getByText('₡12,500')).toBeVisible();
  await expect(summary.getByText('₡8,000')).toBeVisible();
  await expect(summary.locator('.summary-card.is-paid')).toContainText('Cantidad de órdenes');
  await expect(summary.locator('.summary-card.is-paid .summary-card-count')).toHaveText('1');
  await expect(summary.locator('.summary-card.is-pending')).toContainText('Cantidad de órdenes');
  await expect(summary.locator('.summary-card.is-pending .summary-card-count')).toHaveText('1');
  await expect(summary.locator('.summary-card.is-paid')).toHaveCSS('background-color', 'rgb(224, 240, 231)');
  await expect(summary.locator('.summary-card.is-pending')).toHaveCSS('background-color', 'rgb(253, 227, 225)');
});

test('permite alternar el estado de pago desde el detalle', async ({ page }) => {
  const order = {
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
    notas: null,
    cliente: { id: 10, alias: 'Ana QA', nombre_completo: 'Ana QA', email: null, mobile: null, direccion: null },
    tipo_pan: 'Bolla',
    ingrediente_adicional: 'Sin ingredientes adicionales',
  };
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [order], error: null } }));
  await page.route('**/api/ordenes/20', async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as { pagada: boolean };
      order.pagada = body.pagada;
    }
    await route.fulfill({ json: { data: order, error: null } });
  });

  await page.goto('/#/ordenes/20');
  await expect(page.getByRole('button', { name: 'Regresar' })).toHaveClass(/button-return/);
  await expect(page.getByRole('button', { name: 'Marcar completada' })).toHaveClass(/button-complete/);
  const paymentButton = page.getByRole('button', { name: 'Marcar Pagada' });
  await expect(paymentButton).toHaveClass(/is-pending/);
  await expect(paymentButton).toHaveCSS('background-color', 'rgb(180, 35, 24)');
  await expect(page.getByText('Pendiente', { exact: true }).last()).toHaveClass(/is-pending/);
  await expect(page.getByText('Pendiente', { exact: true }).last()).toHaveCSS('background-color', 'rgb(253, 227, 225)');
  await paymentButton.click();
  const paidButton = page.getByRole('button', { name: 'Marcar Pendiente' });
  await expect(paidButton).toHaveClass(/is-paid/);
  await expect(paidButton).toHaveCSS('background-color', 'rgb(34, 107, 78)');
  await expect(page.getByText('Pagada', { exact: true }).last()).toHaveClass(/is-paid/);
  await expect(page.getByText('Pagada', { exact: true }).last()).toHaveCSS('background-color', 'rgb(224, 240, 231)');
  await page.getByRole('button', { name: 'Regresar' }).click();
  await expect(page).toHaveURL(/\/#\/$/);
  await expect(page.getByRole('heading', { name: 'Órdenes activas', exact: true })).toBeVisible();
});

test('muestra el resumen de pagos del histórico y permite regresar', async ({ page }) => {
  await page.route('**/api/ordenes/historico', (route) => route.fulfill({ json: { data: [
    {
      id: 31,
      cliente_id: 10,
      fecha_registro: '2026-10-10',
      fecha_entrega: '2026-10-11',
      hora_entrega: '09:00',
      tipo_pan_id: 1,
      ingrediente_adicional_id: 1,
      monto_colones: 12500,
      pagada: true,
      activa: false,
      notas: null,
      cliente: { id: 10, alias: 'Ana QA', nombre_completo: 'Ana QA', email: null, mobile: null, direccion: null },
      tipo_pan: 'Bolla',
      ingrediente_adicional: 'Sin ingredientes adicionales',
    },
    {
      id: 32,
      cliente_id: 11,
      fecha_registro: '2026-10-12',
      fecha_entrega: '2026-10-13',
      hora_entrega: '10:00',
      tipo_pan_id: 1,
      ingrediente_adicional_id: 1,
      monto_colones: 8000,
      pagada: false,
      activa: false,
      notas: null,
      cliente: { id: 11, alias: 'Luis QA', nombre_completo: 'Luis QA', email: null, mobile: null, direccion: null },
      tipo_pan: 'Bolla',
      ingrediente_adicional: 'Sin ingredientes adicionales',
    },
  ], error: null } }));
  await page.route('**/api/ordenes/activas', (route) => route.fulfill({ json: { data: [], error: null } }));

  await page.goto('/#/historial');
  await expect(page.getByRole('heading', { name: 'Resumen de pagos' })).toBeVisible();
  const summary = page.getByRole('region', { name: 'Resumen de pagos' });
  await expect(summary.getByText('₡12,500')).toBeVisible();
  await expect(summary.getByText('₡8,000')).toBeVisible();
  await expect(summary.locator('.summary-card.is-paid .summary-card-count')).toHaveText('1');
  await expect(summary.locator('.summary-card.is-pending .summary-card-count')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Regresar' })).toHaveClass(/button-return/);
  await page.getByRole('button', { name: 'Regresar' }).click();
  await expect(page).toHaveURL(/\/#\/$/);
  await expect(page.getByRole('heading', { name: 'Órdenes activas', exact: true })).toBeVisible();
});

test('muestra y registra gastos ordenados por fecha', async ({ page }) => {
  let expenses = [
    { id: 2, fecha_registro: '2026-11-05', monto: 3000, detalle: 'Harina' },
    { id: 1, fecha_registro: '2026-11-01', monto: 1500, detalle: 'Empaques' },
  ];
  await page.route('**/api/gastos', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { monto: number; detalle: string };
      expenses = [{ id: 3, fecha_registro: '2026-11-06', ...body }, ...expenses];
      return route.fulfill({ status: 201, json: { data: expenses[0], error: null } });
    }
    return route.fulfill({ json: { data: {
      gastos: expenses,
      resumen: { total_gastos: expenses.reduce((sum, expense) => sum + expense.monto, 0), total_pagadas: 12000, total_pendientes: 8000, ganancias_netas: 7500, ganancias_brutas: 15500 },
    }, error: null } });
  });
  await page.route('**/api/gastos/*', async (route) => {
    const id = Number(route.request().url().split('/').pop());
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as { monto: number; detalle: string };
      expenses = expenses.map((expense) => expense.id === id ? { ...expense, ...body } : expense);
      return route.fulfill({ json: { data: expenses.find((expense) => expense.id === id), error: null } });
    }
    expenses = expenses.filter((expense) => expense.id !== id);
    return route.fulfill({ status: 204 });
  });

  await page.goto('/#/gastos');
  await expect(page.getByRole('heading', { name: 'Gastos', exact: true })).toBeVisible();
  await expect(page.getByText('Total de gastos')).toBeVisible();
  await expect(page.getByText('₡4,500')).toBeVisible();
  await expect(page.locator('.expense-row').first()).toContainText('Harina');
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  await page.getByLabel('Monto').fill('2500');
  await page.getByLabel('Detalle').fill('Leña');
  await page.getByRole('button', { name: 'Guardar gasto' }).click();
  await expect(page.locator('.expense-row').first()).toContainText('Leña');
  await expect(page.getByText('₡7,000')).toBeVisible();
  await page.locator('.expense-row').first().click();
  await page.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Monto').fill('3000');
  await page.getByLabel('Detalle').fill('Leña editada');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('.expense-row').first()).toContainText('Leña editada');
  await page.locator('.expense-row').first().click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.locator('.expense-row').first()).toContainText('Harina');
  await expect(page.getByText('Leña editada')).not.toBeVisible();
});
