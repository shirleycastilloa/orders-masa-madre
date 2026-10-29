import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function sendData(response: Response, data: unknown, status = 200) {
  return response.status(status).json({ data, error: null });
}

export function sendError(response: Response, error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.join('.') || 'body';
      fields[field] ??= issue.message;
    }
    return response.status(400).json({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los campos enviados.',
        fields,
      },
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.status).json({
      data: null,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
  }

  console.error(error);
  return response.status(500).json({
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado.',
    },
  });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  return sendError(response, error);
}

export const notFoundHandler = (_request: Request, response: Response) =>
  sendError(response, new ApiError(404, 'NOT_FOUND', 'Recurso no encontrado.'));
