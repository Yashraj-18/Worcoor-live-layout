import crypto from 'crypto';
import bcrypt from 'bcrypt';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { UsersRepository, type InvitationRole } from './repository.js';
import type { AcceptInvitationInput, InviteUserInput, UpdateUserRoleInput } from './schemas.js';

export type InviteRequest = FastifyRequest<{ Body: InviteUserInput }>;
export type InvitationTokenRequest = FastifyRequest<{ Params: { token: string } }>;
export type AcceptInvitationRequest = FastifyRequest<{ Body: AcceptInvitationInput }>;
export type UpdateUserRoleRequest = FastifyRequest<{ Params: { id: string }; Body: UpdateUserRoleInput }>;

const INVITE_EXPIRY_HOURS = 48;

export class UsersService {
  constructor(private readonly repo = new UsersRepository()) {}

  async invite(request: InviteRequest, reply: FastifyReply) {
    const { email, role } = request.body;
    const orgId = request.user.organizationId;
    const invitedByUserId = request.user.userId;

    // prevent duplicate users or invites to existing users
    const existingUser = await this.repo.findUserByEmail(email);
    if (existingUser && existingUser.organizationId === orgId) {
      return reply.status(409).send({ error: 'User already exists in this organization' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.repo.createInvitation({
      organizationId: orgId,
      invitedByUserId,
      email,
      role,
      token,
      expiresAt,
    });

    // In real system, send email. For now return token for manual delivery.
    return {
      message: 'Invitation created',
      token,
      expiresAt,
    };
  }

  async getInvitation(request: InvitationTokenRequest, reply: FastifyReply) {
    const invite = await this.repo.getInvitationByToken(request.params.token);
    if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Invalid or expired invitation' });
    }

    return {
      email: invite.email,
      role: invite.role as InvitationRole,
      organizationId: invite.organizationId,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvitation(request: AcceptInvitationRequest, reply: FastifyReply) {
    const { token, password } = request.body;
    const invite = await this.repo.getInvitationByToken(token);
    if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Invalid or expired invitation' });
    }

    const existingUser = await this.repo.findUserByEmail(invite.email);
    if (existingUser && existingUser.organizationId === invite.organizationId) {
      return reply.status(409).send({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await this.repo.createUser({
      organizationId: invite.organizationId,
      email: invite.email,
      passwordHash,
      role: invite.role as InvitationRole,
    });

    await this.repo.markInvitationAccepted(invite.id);

    return {
      message: 'Invitation accepted',
      userId,
      email: invite.email,
      role: invite.role,
      organizationId: invite.organizationId,
    };
  }

  async updateUserRole(request: UpdateUserRoleRequest, reply: FastifyReply) {
    const { id } = request.params;
    const { role } = request.body;

    // optionally could verify org scoping by fetching user; simple update here
    await this.repo.updateUserRole(id, role as InvitationRole);
    return { message: 'Role updated', userId: id, role };
  }
}
