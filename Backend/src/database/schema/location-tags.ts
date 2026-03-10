import { sql } from 'drizzle-orm';
import { index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';
import { units } from './units.js';

export const locationTags = pgTable(
  'location_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    locationTagName: text('location_tag_name').notNull(),
    capacity: numeric('capacity', { precision: 15, scale: 3 })
      .$type<number>()
      .notNull()
      .default(sql`0`),
    length: numeric('length', { precision: 10, scale: 3 }).$type<number | null>(),
    breadth: numeric('breadth', { precision: 10, scale: 3 }).$type<number | null>(),
    height: numeric('height', { precision: 10, scale: 3 }).$type<number | null>(),
    unitOfMeasurement: text('unit_of_measurement').$type<'meters' | 'feet' | 'inches' | 'centimeters' | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationIdx: index('idx_location_tags_org').on(table.organizationId),
    unitIdx: index('idx_location_tags_unit').on(table.unitId),
    uniqueLocationPerUnit: uniqueIndex('unique_location_per_unit').on(
      table.organizationId,
      table.unitId,
      table.locationTagName,
    ),
    unitOrgIdx: index('idx_location_tags_unit_org').on(table.unitId, table.organizationId),
  }),
);
