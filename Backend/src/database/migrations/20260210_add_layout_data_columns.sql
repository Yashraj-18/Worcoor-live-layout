-- Add layout_data, status, metadata, and updated_at columns to layouts
ALTER TABLE layouts
ADD COLUMN layout_data JSONB,
ADD COLUMN status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('operational', 'draft', 'archived')),
ADD COLUMN metadata JSONB,
ADD COLUMN updated_at TIMESTAMPTZ;

-- Create GIN index for layout_data queries
CREATE INDEX IF NOT EXISTS idx_layouts_data ON layouts USING GIN (layout_data);
