import { z } from 'zod';
import { ApiError } from './http.js';

const idSchema = z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).pipe(z.number().int().positive());
const amountSchema = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform(Number)
  .pipe(z.number().int().min(0));
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato YYYY-MM-DD.');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:mm.');
const optionalText = z.string().trim().optional();
const optionalEmail = z.union([z.string().trim().email('El correo no es válido.'), z.literal('')]).optional();

export const clientCreateSchema = z
  .object({
    alias: z.string().trim().min(1, 'El alias es obligatorio.'),
    nombre_completo: optionalText,
    email: optionalEmail,
    mobile: optionalText,
    direccion: optionalText,
  })
  .strict();

export const clientUpdateSchema = clientCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar.',
});

export const breadTypeCreateSchema = z.object({ tipo: z.string().trim().min(1, 'El tipo es obligatorio.') }).strict();
export const breadTypeUpdateSchema = breadTypeCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar.',
});
export const ingredientCreateSchema = z.object({ ingrediente: z.string().trim().min(1, 'El ingrediente es obligatorio.') }).strict();
export const ingredientUpdateSchema = ingredientCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar.',
});

export const orderCreateSchema = z
  .object({
    cliente_id: idSchema,
    fecha_entrega: dateSchema,
    hora_entrega: timeSchema,
    tipo_pan_id: idSchema,
    ingrediente_adicional_id: idSchema,
    notas: optionalText,
    monto_colones: amountSchema,
    pagada: z.boolean().default(false),
  })
  .strict();

export const orderUpdateSchema = orderCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getNumericId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, 'INVALID_ID', 'El identificador no es válido.');
  }
  return parsed;
}

export function isValidDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
