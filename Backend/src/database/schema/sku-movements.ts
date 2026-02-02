import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';
import { users } from './user.js';
import { skus } from './skus.js';
import { locationTags } from './location-tags.js';

export const skuMovements = pgTable(
  'sku_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    skuId: uuid('sku_id')
      .notNull()
      .references(() => skus.id, { onDelete: 'cascade' }),
    fromLocationTagId: uuid('from_location_tag_id').references(() => locationTags.id),
    toLocationTagId: uuid('to_location_tag_id')
      .notNull()
      .references(() => locationTags.id),
    movedAt: timestamp('moved_at', { withTimezone: true }).notNull().defaultNow(),
    movedByUserId: uuid('moved_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    skuIdx: index('idx_sku_movements_sku').on(table.skuId),
    organizationIdx: index('idx_sku_movements_org').on(table.organizationId),
    dateIdx: index('idx_sku_movements_date').on(table.movedAt),
  }),
);
