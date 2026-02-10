import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';
import { units } from './units.js';

export const layouts = pgTable(
  'layouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    layoutName: text('layout_name').notNull(),
    status: text('status').$type<'operational' | 'draft' | 'archived'>().default('draft'),
    layoutData: jsonb('layout_data'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    unitIdx: index('idx_layouts_unit').on(table.unitId),
    organizationIdx: index('idx_layouts_org').on(table.organizationId),
  }),
);
