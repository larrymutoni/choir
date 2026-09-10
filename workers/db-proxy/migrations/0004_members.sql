PRAGMA foreign_keys = ON;

CREATE TABLE members (
    id TEXT PRIMARY KEY,

    firstname TEXT,
    lastname TEXT,

    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    phone TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_members_email
ON members(email);

CREATE INDEX idx_members_name
ON members(lastname, firstname);

/*
 * Migration des anciennes adresses autorisées.
 *
 * Si un compte existe déjà, on récupère ses informations.
 * Sinon le membre existe quand même avec simplement son email.
 */
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
    emails.id,
    users.firstname,
    users.lastname,
    emails.email,
    users.phone,
    emails.created_at,
    COALESCE(users.updated_at, emails.created_at)
FROM emails
LEFT JOIN users
    ON LOWER(users.email) = LOWER(emails.email);