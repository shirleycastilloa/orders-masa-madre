export function formatCurrency(value: number) {
  return `₡${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function formatMonth(value: string) {
  const label = new Intl.DateTimeFormat('es-GT', { month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? new Intl.NumberFormat('en-US').format(Number(digits)) : '';
}

export function parseAmount(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}
