PRAGMA foreign_keys = ON;

CREATE TABLE custom_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,

  members INTEGER NOT NULL DEFAULT 0 CHECK (members IN (0, 1)),
  calendar INTEGER NOT NULL DEFAULT 0 CHECK (calendar IN (0, 1)),
  resources INTEGER NOT NULL DEFAULT 0 CHECK (resources IN (0, 1)),
  content INTEGER NOT NULL DEFAULT 0 CHECK (content IN (0, 1)),
  images INTEGER NOT NULL DEFAULT 0 CHECK (images IN (0, 1)),
  gallery INTEGER NOT NULL DEFAULT 0 CHECK (gallery IN (0, 1)),
  settings INTEGER NOT NULL DEFAULT 0 CHECK (settings IN (0, 1)),

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE users
ADD COLUMN custom_role_id TEXT;

CREATE INDEX idx_users_custom_role_id
ON users(custom_role_id);

CREATE INDEX idx_custom_roles_name
ON custom_roles(name);
