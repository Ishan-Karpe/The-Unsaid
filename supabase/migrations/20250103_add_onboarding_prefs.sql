-- ===========================================
-- THE UNSAID - Onboarding Preferences Migration
-- ===========================================
-- Adds onboarding tracking columns to preferences table
--
-- FIELDS ADDED:
-- - onboarding_completed: Has user finished the onboarding flow
-- - onboarding_completed_at: Timestamp when onboarding was completed
-- - onboarding_skipped_at: Timestamp when user chose to skip (null if not skipped)
-- - onboarding_version: Version of onboarding flow completed (for future updates)
--
-- ENTRY CONDITIONS:
-- - New users: onboarding_completed = false, both timestamps null
-- - Completed users: onboarding_completed = true, completed_at set
-- - Skipped users: onboarding_completed = false, skipped_at set
--
-- NOTE: The preferences table already exists with user settings

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS onboarding_version TEXT DEFAULT 'v1' NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN preferences.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN preferences.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN preferences.onboarding_skipped_at IS 'Timestamp when user chose to skip onboarding';
COMMENT ON COLUMN preferences.onboarding_version IS 'Version of the onboarding flow completed';
