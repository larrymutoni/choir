PRAGMA foreign_keys = ON;

ALTER TABLE members
ADD COLUMN assigned_role TEXT NOT NULL DEFAULT 'member'
CHECK (
  assigned_role IN (
    'member',
    'admin',
    'super_admin'
  )
);

ALTER TABLE members
ADD COLUMN assigned_custom_role_id TEXT;

CREATE INDEX idx_members_assigned_custom_role_id
ON members(assigned_custom_role_id);

/*
 * Preserve the current role of members who
 * already have an account.
 */
UPDATE members
SET
  assigned_role =
    COALESCE(
      (
        SELECT roles.name
        FROM users
        JOIN roles
          ON roles.id = users.role_id
        WHERE LOWER(users.email) =
              LOWER(members.email)
        LIMIT 1
      ),
      'member'
    ),

  assigned_custom_role_id =
    (
      SELECT users.custom_role_id
      FROM users
      WHERE LOWER(users.email) =
            LOWER(members.email)
      LIMIT 1
    );
