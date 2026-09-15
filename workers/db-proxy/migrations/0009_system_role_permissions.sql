ALTER TABLE roles ADD COLUMN members INTEGER NOT NULL DEFAULT 0;
ALTER TABLE roles ADD COLUMN calendar INTEGER NOT NULL DEFAULT 0;
ALTER TABLE roles ADD COLUMN resources INTEGER NOT NULL DEFAULT 0;
ALTER TABLE roles ADD COLUMN content INTEGER NOT NULL DEFAULT 0;
ALTER TABLE roles ADD COLUMN images INTEGER NOT NULL DEFAULT 0;
ALTER TABLE roles ADD COLUMN gallery INTEGER NOT NULL DEFAULT 0;
ALTER TABLE roles ADD COLUMN settings INTEGER NOT NULL DEFAULT 0;

UPDATE roles
SET
  members = 0,
  calendar = 0,
  resources = 0,
  content = 0,
  images = 0,
  gallery = 0,
  settings = 0
WHERE name = 'member';

UPDATE roles
SET
  members = 1,
  calendar = 1,
  resources = 1,
  content = 1,
  images = 1,
  gallery = 1,
  settings = 1
WHERE name = 'admin';

UPDATE roles
SET
  members = 1,
  calendar = 1,
  resources = 1,
  content = 1,
  images = 1,
  gallery = 1,
  settings = 1
WHERE name = 'super_admin';
