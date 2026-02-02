import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { requireRole } from '../../common/rbac.js';
import {
  acceptInvitationSchema,
  invitationTokenParamsSchema,
  inviteUserSchema,
  updateUserRoleSchema,
  type AcceptInvitationInput,
  type InviteUserInput,
  type UpdateUserRoleInput,
} from './schemas.js';
import { UsersService } from './service.js';

export async function usersRoutes(app: FastifyInstance) {
  const service = new UsersService();

  // Admin invite new user
  app.post<{ Body: InviteUserInput }>('/invite', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: { body: inviteUserSchema },
    handler: async (request, reply) => {
      return service.invite(request, reply);
    },
  });

  // Public: view invitation details
  app.get<{ Params: { token: string } }>('/invitation/:token', {
    schema: { params: invitationTokenParamsSchema },
    handler: async (request, reply) => {
      return service.getInvitation(request, reply);
    },
  });

  // Public: accept invitation and create account
  app.post<{ Body: AcceptInvitationInput }>('/accept-invitation', {
    schema: { body: acceptInvitationSchema },
    handler: async (request, reply) => {
      return service.acceptInvitation(request, reply);
    },
  });

  // Admin: update user role
  app.put<{ Params: { id: string }; Body: UpdateUserRoleInput }>('/:id/role', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: { body: updateUserRoleSchema },
    handler: async (request, reply) => {
      return service.updateUserRole(request, reply);
    },
  });
}
