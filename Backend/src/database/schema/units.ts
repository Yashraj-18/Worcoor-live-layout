import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';

export const units = pgTable(
  'units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    unitId: varchar('unit_id', { length: 100 }),
    unitName: text('unit_name').notNull(),
    unitType: text('unit_type').notNull(),
    status: text('status').$type<'LIVE' | 'OFFLINE' | 'MAINTENANCE' | 'PLANNING'>().notNull(),
    description: text('description'),
    area: varchar('area', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationIdx: index('idx_units_org').on(table.organizationId),
  }),
);
