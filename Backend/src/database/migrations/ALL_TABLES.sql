-- ============================================================================
-- WorCoor Database Schema - Complete Setup Script
-- ============================================================================
-- This script creates all tables, columns, constraints, and indexes required
-- for the WorCoor warehouse management system.
-- 
-- Run this single script to set up the entire database schema on any device.
-- 
-- Tables (in dependency order):
--   1. organizations
--   2. users
--   3. user_invitations
--   4. units
--   5. layouts
--   6. location_tags
--   7. components
--   8. skus
--   9. sku_movements
--  10. assets
--
-- Generated: February 12, 2026
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================
-- Core tenant table for multi-tenant SaaS architecture.
-- All other tables reference this for organization scoping.
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================
-- User accounts with authentication and role-based access control.
-- Supports password reset functionality with token-based flow.
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reset_token_hash TEXT,
    reset_token_expires_at TIMESTAMP WITH TIME ZONE
);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token_hash);

-- ============================================================================
-- 3. USER_INVITATIONS TABLE
-- ============================================================================
-- Tracks user invitations for onboarding new team members.
-- Supports invitation workflow with token-based acceptance.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'viewer')),
    invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- User invitations indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_org ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_org_email ON user_invitations(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);

-- ============================================================================
-- 4. UNITS TABLE
-- ============================================================================
-- Organizational units (warehouses, facilities, zones).
-- Each unit can have multiple layouts and location tags.
-- ============================================================================

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    unit_id VARCHAR(100),
    unit_name TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('LIVE', 'OFFLINE', 'MAINTENANCE', 'PLANNING')),
    description TEXT,
    area VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_org ON units(organization_id);

-- ============================================================================
-- 5. LAYOUTS TABLE
-- ============================================================================
-- Warehouse layout configurations with canvas data stored as JSONB.
-- Supports draft/published/archived workflow states.
-- ============================================================================

CREATE TABLE IF NOT EXISTS layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    layout_name TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('operational', 'draft', 'archived')),
    layout_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Layouts indexes
CREATE INDEX IF NOT EXISTS idx_layouts_unit ON layouts(unit_id);
CREATE INDEX IF NOT EXISTS idx_layouts_org ON layouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_layouts_layout_data ON layouts USING GIN (layout_data);

-- ============================================================================
-- 6. LOCATION_TAGS TABLE
-- ============================================================================
-- Named locations within units for inventory placement.
-- Supports dimensional measurements (length, breadth, height).
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    location_tag_name TEXT NOT NULL,
    capacity NUMERIC(15, 3) NOT NULL DEFAULT 0,
    length NUMERIC(10, 3),
    breadth NUMERIC(10, 3),
    height NUMERIC(10, 3),
    unit_of_measurement TEXT CHECK (unit_of_measurement IN ('meters', 'feet', 'inches', 'centimeters') OR unit_of_measurement IS NULL),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_location_per_unit UNIQUE (organization_id, unit_id, location_tag_name)
);

-- Location tags indexes
CREATE INDEX IF NOT EXISTS idx_location_tags_org ON location_tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_location_tags_unit ON location_tags(unit_id);

-- ============================================================================
-- 7. COMPONENTS TABLE
-- ============================================================================
-- Layout components (racks, shelves, zones) with position and dimensions.
-- Links to location tags for inventory association.
-- ============================================================================

CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    display_name TEXT NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    location_tag_id UUID REFERENCES location_tags(id),
    location_tag_name TEXT,
    color TEXT,
    label TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Components indexes
CREATE INDEX IF NOT EXISTS idx_components_layout ON components(layout_id);
CREATE INDEX IF NOT EXISTS idx_components_org ON components(organization_id);
CREATE INDEX IF NOT EXISTS idx_components_location_tag ON components(location_tag_id);

-- ============================================================================
-- 8. SKUS TABLE
-- ============================================================================
-- Stock Keeping Units (inventory items) with quantity tracking.
-- Supports expiry dates and location assignment.
-- ============================================================================

CREATE TABLE IF NOT EXISTS skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku_name TEXT NOT NULL,
    sku_category TEXT NOT NULL,
    sku_unit TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    sku_id TEXT,
    location_tag_id UUID REFERENCES location_tags(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- SKUs indexes
CREATE INDEX IF NOT EXISTS idx_skus_org ON skus(organization_id);
CREATE INDEX IF NOT EXISTS idx_skus_location ON skus(location_tag_id);
CREATE INDEX IF NOT EXISTS idx_skus_expiry ON skus(expiry_date);

-- ============================================================================
-- 9. SKU_MOVEMENTS TABLE
-- ============================================================================
-- Tracks inventory movement history between locations.
-- Provides audit trail for all SKU relocations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sku_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    from_location_tag_id UUID REFERENCES location_tags(id),
    to_location_tag_id UUID NOT NULL REFERENCES location_tags(id),
    moved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    moved_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- SKU movements indexes
CREATE INDEX IF NOT EXISTS idx_sku_movements_sku ON sku_movements(sku_id);
CREATE INDEX IF NOT EXISTS idx_sku_movements_org ON sku_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_sku_movements_date ON sku_movements(moved_at);

-- ============================================================================
-- 10. ASSETS TABLE
-- ============================================================================
-- Physical assets (forklifts, equipment) with location tracking.
-- Supports user-defined asset IDs with uniqueness per organization.
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    location_tag_id UUID REFERENCES location_tags(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    asset_id TEXT
);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location_tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_org_asset_id_unique ON assets(organization_id, asset_id) WHERE asset_id IS NOT NULL;

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================
-- 
-- TABLES CREATED: 10
--   - organizations: Core tenant table
--   - users: User accounts with auth
--   - user_invitations: Team invitation workflow
--   - units: Warehouse/facility units
--   - layouts: Canvas layout configurations
--   - location_tags: Named inventory locations
--   - components: Layout visual components
--   - skus: Inventory items
--   - sku_movements: Movement audit trail
--   - assets: Physical equipment tracking
--
-- INDEXES CREATED: 25
--   - Primary key indexes: 10 (auto-created)
--   - Foreign key indexes: 8
--   - Unique constraints: 5
--   - GIN index: 1 (for JSONB layout_data)
--   - Additional query indexes: 11
--
-- CONSTRAINTS:
--   - Primary keys: UUID with auto-generation
--   - Foreign keys: CASCADE delete for org-scoped data
--   - CHECK constraints: role, status enums
--   - UNIQUE constraints: email, location_tag per unit, asset_id per org
--   - NOT NULL constraints: All required fields
--
-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
