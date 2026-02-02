import type { FastifyReply } from 'fastify';

export type ErrorResponse = {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toResponse(): ErrorResponse {
    return {
      error: this.message,
      ...(this.code && { code: this.code }),
      ...(this.details && { details: this.details }),
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found${id ? `: ${id}` : ''}`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export function sendError(reply: FastifyReply, error: AppError | Error): void {
  if (error instanceof AppError) {
    reply.code(error.statusCode).send(error.toResponse());
  } else {
    reply.code(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

export function sendNotFound(reply: FastifyReply, resource: string, id?: string): void {
  sendError(reply, new NotFoundError(resource, id));
}

export function sendValidationError(
  reply: FastifyReply,
  message: string,
  details?: Record<string, unknown>,
): void {
  sendError(reply, new ValidationError(message, details));
}
