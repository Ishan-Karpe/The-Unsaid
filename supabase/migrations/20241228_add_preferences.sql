-- ===========================================
-- THE UNSAID - User Preferences AI Fields Migration
-- ===========================================
-- Adds AI preference columns to existing preferences table
--
-- FIELDS ADDED:
-- - emotional_analysis: Allow AI to analyze tone & sentiment
-- - autosuggestions: Enable phrase suggestions while typing
-- - therapeutic_mode: Focus on processing over polishing
-- - ai_personality: Preferred AI tone (empathetic, direct, supportive, neutral)
--
-- NOTE: The preferences table already exists with:
-- - user_id, theme, ai_enabled, ai_consent_date, created_at, updated_at

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS emotional_analysis BOOLEAN DEFAULT true NOT NULL;

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS autosuggestions BOOLEAN DEFAULT true NOT NULL;

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS therapeutic_mode BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS ai_personality TEXT DEFAULT 'empathetic' NOT NULL
    CHECK (ai_personality IN ('empathetic', 'direct', 'supportive', 'neutral'));
