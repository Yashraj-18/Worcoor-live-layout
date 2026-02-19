-- ============================================================================
-- Migration: Add location_tag_name to components table
-- ============================================================================
-- Adds a denormalized location_tag_name column to the components table.
-- This stores the location tag name alongside the location_tag_id FK,
-- making it easy to see which tag is assigned without joining tables.
-- ============================================================================

ALTER TABLE components
ADD COLUMN IF NOT EXISTS location_tag_name TEXT;
