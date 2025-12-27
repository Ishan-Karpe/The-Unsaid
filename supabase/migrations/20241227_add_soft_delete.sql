-- ===========================================
-- THE UNSAID - Soft Delete Migration
-- ===========================================
-- Adds deleted_at column to enable soft delete functionality
-- Existing drafts will have deleted_at = NULL (not deleted)

-- Add soft delete support to drafts table
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create partial index for efficient querying of non-deleted drafts
-- This index only includes rows where deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_drafts_not_deleted
    ON drafts(user_id, updated_at DESC)
    WHERE deleted_at IS NULL;

-- Create index for deleted drafts (for trash view)
CREATE INDEX IF NOT EXISTS idx_drafts_deleted
    ON drafts(user_id, deleted_at DESC)
    WHERE deleted_at IS NOT NULL;

-- Note: RLS policies should already filter by user_id
-- The deleted_at filtering is handled in the application layer
-- to allow users to explicitly query their deleted drafts (trash view)
