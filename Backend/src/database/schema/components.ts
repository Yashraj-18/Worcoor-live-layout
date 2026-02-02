import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organization.js';
import { layouts } from './layouts.js';
import { locationTags } from './location-tags.js';

export const components = pgTable(
  'components',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    layoutId: uuid('layout_id')
      .notNull()
      .references(() => layouts.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    componentType: text('component_type').notNull(),
    displayName: text('display_name').notNull(),
    positionX: integer('position_x').notNull(),
    positionY: integer('position_y').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    locationTagId: uuid('location_tag_id').references(() => locationTags.id),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    layoutIdx: index('idx_components_layout').on(table.layoutId),
    organizationIdx: index('idx_components_org').on(table.organizationId),
    locationTagIdx: index('idx_components_location_tag').on(table.locationTagId),
  }),
);
