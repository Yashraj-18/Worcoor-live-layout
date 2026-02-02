import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';
import { users } from './user.js';

export const userInvitations = pgTable(
  'user_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').$type<'admin' | 'worker' | 'viewer'>().notNull(),
    invitedByUserId: uuid('invited_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: text('status').$type<'pending' | 'accepted' | 'expired'>().notNull().default('pending'),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  },
  (table) => ({
    orgIdx: index('idx_user_invitations_org').on(table.organizationId),
    tokenIdx: index('idx_user_invitations_token').on(table.token),
    emailIdx: index('idx_user_invitations_org_email').on(table.organizationId, table.email),
    statusIdx: index('idx_user_invitations_status').on(table.status),
    expiresAtIdx: index('idx_user_invitations_expires_at').on(table.expiresAt),
  }),
);
