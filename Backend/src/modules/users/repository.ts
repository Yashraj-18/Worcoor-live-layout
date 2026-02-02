import crypto from 'crypto';

import { db } from '../../config/database.js';
import { userInvitations, users } from '../../database/schema/index.js';
import { eq } from 'drizzle-orm';

export type InvitationStatus = 'pending' | 'accepted' | 'expired';
export type InvitationRole = 'admin' | 'worker' | 'viewer';

export class UsersRepository {
  async findUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ?? null;
  }

  async createInvitation(params: {
    organizationId: string;
    invitedByUserId: string;
    email: string;
    role: InvitationRole;
    token: string;
    expiresAt: Date;
  }) {
    await db.insert(userInvitations).values({
      organizationId: params.organizationId,
      invitedByUserId: params.invitedByUserId,
      email: params.email,
      role: params.role,
      token: params.token,
      expiresAt: params.expiresAt,
      status: 'pending',
    });
  }

  async getInvitationByToken(token: string) {
    const result = await db.select().from(userInvitations).where(eq(userInvitations.token, token)).limit(1);
    return result[0] ?? null;
  }

  async markInvitationAccepted(id: string) {
    await db
      .update(userInvitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(userInvitations.id, id));
  }

  async createUser(params: {
    organizationId: string;
    email: string;
    passwordHash: string;
    role: InvitationRole;
  }) {
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      organizationId: params.organizationId,
      email: params.email,
      passwordHash: params.passwordHash,
      role: params.role,
    });
    return id;
  }

  async updateUserRole(userId: string, role: InvitationRole) {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }
}
