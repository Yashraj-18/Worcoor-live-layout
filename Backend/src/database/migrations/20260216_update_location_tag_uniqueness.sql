-- Migration: Update location tag uniqueness to be per organization + unit
-- Created: 2026-02-16

BEGIN;

-- Drop previous unique constraint (organization_id + location_tag_name)
DROP INDEX IF EXISTS unique_location_per_org;

-- Create new unique constraint (organization_id + unit_id + location_tag_name)
CREATE UNIQUE INDEX IF NOT EXISTS unique_location_per_unit
  ON location_tags (organization_id, unit_id, location_tag_name);

COMMIT;
