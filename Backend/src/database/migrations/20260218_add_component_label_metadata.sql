-- Migration: Add label and metadata columns to components table
-- Created: 2026-02-18

BEGIN;

-- Add label column for user-editable component labels
ALTER TABLE components
  ADD COLUMN IF NOT EXISTS label TEXT;

-- Add metadata JSONB column for rich data (compartmentContents, stack, locationData, etc.)
ALTER TABLE components
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMIT;
