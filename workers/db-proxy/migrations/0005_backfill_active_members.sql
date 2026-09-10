PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO members (
  id,
  firstname,
  lastname,
  email,
  phone,
  created_at,
  updated_at
)
SELECT
  'legacy-user-' || users.id,
  users.firstname,
  users.lastname,
  users.email,
  users.phone,
  users.created_at,
  users.updated_at
FROM users
WHERE users.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM members
    WHERE LOWER(members.email) = LOWER(users.email)
  );

INSERT OR IGNORE INTO emails (
  id,
  email,
  created_at
)
SELECT
  'legacy-user-email-' || users.id,
  users.email,
  users.created_at
FROM users
WHERE users.status = 'active';