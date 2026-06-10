-- ===========================================
-- THE UNSAID - Draft Version History
-- ===========================================
-- Stores encrypted snapshots of drafts taken before autosave overwrites
-- them. Rows are ciphertext copies made client-side (zero-knowledge: the
-- server never sees plaintext). Snapshots are throttled (max one per draft
-- per 10 minutes) and pruned to the most recent 20 per draft by the client
-- (see versionService).

CREATE TABLE IF NOT EXISTS draft_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_content TEXT NOT NULL,
    encrypted_metadata TEXT NOT NULL,
    iv TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE draft_versions ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own versions. UPDATE is allowed
-- (scoped to the owner) because the KDF migration re-encrypts rows in
-- place; the app itself never edits a snapshot's content.
CREATE POLICY "Users can read own draft versions"
    ON draft_versions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own draft versions"
    ON draft_versions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft versions"
    ON draft_versions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft versions"
    ON draft_versions FOR DELETE
    USING (auth.uid() = user_id);

-- Version lists are always fetched per draft, newest first
CREATE INDEX IF NOT EXISTS idx_draft_versions_draft
    ON draft_versions(draft_id, created_at DESC);

-- KDF migration scans by user
CREATE INDEX IF NOT EXISTS idx_draft_versions_user
    ON draft_versions(user_id);
