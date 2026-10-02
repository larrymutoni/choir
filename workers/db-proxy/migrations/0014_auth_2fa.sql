ALTER TABLE users
ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0
CHECK (two_factor_enabled IN (0, 1));

CREATE TABLE two_factor_challenges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('login', 'enable', 'disable')),
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_two_factor_challenges_user_id
ON two_factor_challenges(user_id);

CREATE INDEX idx_two_factor_challenges_expires_at
ON two_factor_challenges(expires_at);

CREATE TABLE trusted_devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    device_label TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_used_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_trusted_devices_user_id
ON trusted_devices(user_id);

CREATE INDEX idx_trusted_devices_expires_at
ON trusted_devices(expires_at);
