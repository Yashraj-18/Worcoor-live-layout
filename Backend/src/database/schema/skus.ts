import { date, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';
import { locationTags } from './location-tags.js';

export const skus = pgTable(
  'skus',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    skuName: text('sku_name').notNull(),
    skuCategory: text('sku_category').notNull(),
    skuUnit: text('sku_unit').notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    expiryDate: date('expiry_date'),
    locationTagId: uuid('location_tag_id').references(() => locationTags.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationIdx: index('idx_skus_org').on(table.organizationId),
    locationIdx: index('idx_skus_location').on(table.locationTagId),
    expiryIdx: index('idx_skus_expiry').on(table.expiryDate),
  }),
);
