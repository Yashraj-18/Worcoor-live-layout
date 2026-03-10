-- Add composite indexes for performance optimization
-- This migration addresses the N+1 query performance issues

-- Composite index for SKUs table (most critical - used in location-tags API)
CREATE INDEX IF NOT EXISTS "idx_skus_location_org" ON "skus" ("location_tag_id", "organization_id");

-- Composite index for Assets table (used in popup queries)
CREATE INDEX IF NOT EXISTS "idx_assets_location_org" ON "assets" ("location_tag_id", "organization_id");

-- Composite index for Location Tags table (used in unit queries)
CREATE INDEX IF NOT EXISTS "idx_location_tags_unit_org" ON "location_tags" ("unit_id", "organization_id");

-- Composite index for Components table (used in live-map queries)
CREATE INDEX IF NOT EXISTS "idx_components_layout_org" ON "components" ("layout_id", "organization_id");
