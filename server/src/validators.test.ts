import { describe, expect, it } from 'vitest';
import { clientCreateSchema, isValidDateOnly, orderCreateSchema } from './validators.js';

describe('business validators', () => {
  it('requires a client alias', () => {
    expect(() => clientCreateSchema.parse({ alias: '' })).toThrow();
    expect(clientCreateSchema.parse({ alias: '  Ana  ' }).alias).toBe('Ana');
  });

  it('validates order fields and converts ids and amount to numbers', () => {
    const order = orderCreateSchema.parse({
      cliente_id: '1',
      fecha_entrega: '2026-11-15',
      hora_entrega: '14:30',
      tipo_pan_id: '2',
      ingrediente_adicional_id: '1',
      monto_colones: '12500',
      pagada: false,
    });
    expect(order.cliente_id).toBe(1);
    expect(order.monto_colones).toBe(12500);
  });

  it('rejects impossible calendar dates', () => {
    expect(isValidDateOnly('2026-02-29')).toBe(false);
    expect(isValidDateOnly('2028-02-29')).toBe(true);
  });
});
