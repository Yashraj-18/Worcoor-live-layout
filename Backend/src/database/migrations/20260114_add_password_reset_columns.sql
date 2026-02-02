ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token_hash text,
ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token_hash);
