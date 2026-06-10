-- Adds a per-user PBKDF2 iteration count for versioned key derivation.
-- Existing rows default to 100000 (the legacy count); new users are
-- inserted with the current count (600000) by the client. Users on the
-- legacy count are migrated lazily on login (see kdfMigrationService).
--
-- IMPORTANT: apply this migration BEFORE deploying the client that
-- selects/writes kdf_iterations.

ALTER TABLE user_salts
ADD COLUMN IF NOT EXISTS kdf_iterations INTEGER NOT NULL DEFAULT 100000;
