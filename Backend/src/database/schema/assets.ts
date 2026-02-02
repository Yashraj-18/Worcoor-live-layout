import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';
import { locationTags } from './location-tags.js';

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    assetName: text('asset_name').notNull(),
    assetType: text('asset_type').notNull(),
    locationTagId: uuid('location_tag_id').references(() => locationTags.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationIdx: index('idx_assets_org').on(table.organizationId),
    locationIdx: index('idx_assets_location').on(table.locationTagId),
  }),
);
