PRAGMA foreign_keys = ON;

ALTER TABLE sessions
ADD COLUMN last_seen_at TEXT;

UPDATE sessions
SET last_seen_at = created_at
WHERE last_seen_at IS NULL;

CREATE INDEX idx_sessions_last_seen_at
ON sessions(last_seen_at);

ALTER TABLE members
ADD COLUMN voice_type TEXT
CHECK (
  voice_type IS NULL OR
  voice_type IN (
    'soprano',
    'alto',
    'tenor'
  )
);
