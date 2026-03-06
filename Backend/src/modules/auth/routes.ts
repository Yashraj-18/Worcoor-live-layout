import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
  loginSchema,
  confirmPasswordResetSchema,
  registerSchema,
  requestPasswordResetSchema,
  type LoginInput,
  type RegisterInput,
  type RequestPasswordResetInput,
  type ConfirmPasswordResetInput,
} from './schemas.js';
import { AuthService } from './service.js';

export async function authRoutes(app: FastifyInstance) {
  const service = new AuthService();

  app.post<{ Body: LoginInput }>('/login', {
    schema: { body: loginSchema },
    handler: async (request, reply) => {
      return service.login(request, reply);
    },
  });

  // Organization signup (first user auto-admin)
  app.post<{ Body: RegisterInput }>('/signup', {
    schema: { body: registerSchema },
    handler: async (request, reply) => {
      return service.register(request, reply);
    },
  });

  // Alias for backward compatibility (but same behavior: auto-admin)
  app.post<{ Body: RegisterInput }>('/register', {
    schema: { body: registerSchema },
    handler: async (request, reply) => {
      return service.register(request, reply);
    },
  });

  app.post<{ Body: RequestPasswordResetInput }>('/password/reset/request', {
    schema: { body: requestPasswordResetSchema },
    handler: async (request, reply) => {
      return service.requestPasswordReset(request, reply);
    },
  });

  app.post<{ Body: ConfirmPasswordResetInput }>('/password/reset/confirm', {
    schema: { body: confirmPasswordResetSchema },
    handler: async (request, reply) => {
      return service.confirmPasswordReset(request, reply);
    },
  });

  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return service.me(request, reply);
    },
  );

  app.post(
    '/logout',
    async (request: FastifyRequest, reply: FastifyReply) => {
      return service.logout(request, reply);
    },
  );
}
