import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

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
    assetId: text('asset_id'),
  },
  (table) => ({
    organizationIdx: index('idx_assets_org').on(table.organizationId),
    locationIdx: index('idx_assets_location').on(table.locationTagId),
    assetOrgUniqueIdx: uniqueIndex('idx_assets_org_asset_id_unique')
      .on(table.organizationId, table.assetId)
      .where(sql`asset_id IS NOT NULL`),
  }),
);
