import { describe, expect, it } from 'vitest';
import { formatAmountInput, formatCurrency, formatDate, formatMonth, formatTime, formatWeekday, parseAmount } from './format';

describe('format helpers', () => {
  it('formats colones without decimals and parses separators', () => {
    expect(formatCurrency(12500)).toBe('₡12,500');
    expect(formatAmountInput('₡12,500')).toBe('12,500');
    expect(parseAmount('12,500')).toBe(12500);
  });

  it('formats time in am/pm', () => {
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('14:30')).toBe('2:30 PM');
  });

  it('formats Spanish dates and month groups', () => {
    expect(formatDate('2026-11-15')).toContain('2026');
    expect(formatDate('2026-11-15').toLowerCase()).toContain('noviembre');
    expect(formatMonth('2026-11-01').toLowerCase()).toContain('noviembre');
    expect(formatWeekday('2026-11-14')).toBe('Sábado');
  });
});
