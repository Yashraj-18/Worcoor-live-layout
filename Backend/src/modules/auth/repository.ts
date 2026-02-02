import { and, eq } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { organizations, users } from '../../database/schema/index.js';

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'worker' | 'viewer';
  organizationId: string;
  organizationName: string;
};

export class AuthRepository {
  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        organizationId: organizations.id,
        organizationName: organizations.name,
      })
      .from(users)
      .innerJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async createOrganization(payload: { id: string; name: string }) {
    await db.insert(organizations).values(payload);
  }

  async createUser(payload: {
    id: string;
    organizationId: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'worker' | 'viewer';
  }) {
    await db.insert(users).values(payload);
  }

  async setResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    await db
      .update(users)
      .set({
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      })
      .where(eq(users.id, userId));
  }

  async findByResetToken(tokenHash: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        organizationId: users.organizationId,
        role: users.role,
        resetTokenExpiresAt: users.resetTokenExpiresAt,
      })
      .from(users)
      .where(eq(users.resetTokenHash, tokenHash))
      .limit(1);

    return result[0] ?? null;
  }

  async clearResetTokenAndUpdatePassword(userId: string, newPasswordHash: string) {
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      })
      .where(eq(users.id, userId));
  }
}
