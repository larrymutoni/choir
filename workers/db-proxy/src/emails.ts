import { Env, json, normalizeEmail, readJson } from "./http";

type AuthorizedEmailRow = {
  id: string;
  email: string;
  created_at: string;
};

export async function listAuthorizedEmails(_request: Request, env: Env) {
  const result = await env.DB.prepare(
    `
      SELECT
        id,
        email,
        created_at
      FROM emails
      ORDER BY created_at DESC
      `,
  ).all<AuthorizedEmailRow>();

  return json({
    emails: result.results,
  });
}

export async function addAuthorizedEmail(request: Request, env: Env) {
  const body = await readJson<{
    email?: string;
  }>(request);

  if (!body.email) {
    return json(
      {
        error: "Email is required",
      },
      400,
    );
  }

  const email = normalizeEmail(body.email);

  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `
      INSERT OR IGNORE INTO emails (
        id,
        email,
        created_at
      )
      VALUES (?, ?, ?)
      `,
    ).bind(crypto.randomUUID(), email, now),

    /*
     * Compatibility with the old
     * "Emails autorisés" screen.
     *
     * An authorized email now also becomes
     * an official member record.
     */
    env.DB.prepare(
      `
      INSERT OR IGNORE INTO members (
        id,
        firstname,
        lastname,
        email,
        phone,
        created_at,
        updated_at
      )
      VALUES (?, NULL, NULL, ?, NULL, ?, ?)
      `,
    ).bind(crypto.randomUUID(), email, now, now),

    env.DB.prepare(
      `
      UPDATE users
      SET
        status = 'active',
        updated_at = ?
      WHERE LOWER(email) =
            LOWER(?)
        AND role_id = (
          SELECT id
          FROM roles
          WHERE name = 'member'
          LIMIT 1
        )
      `,
    ).bind(now, email),
  ]);

  return json(
    {
      ok: true,
    },
    201,
  );
}

export async function deleteAuthorizedEmail(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
  }>(request);

  if (!body.id) {
    return json(
      {
        error: "Email ID is required",
      },
      400,
    );
  }

  const existing = await env.DB.prepare(
    `
      SELECT
        id,
        email
      FROM emails
      WHERE id = ?
      LIMIT 1
      `,
  )
    .bind(body.id)
    .first<AuthorizedEmailRow>();

  if (!existing) {
    return json(
      {
        error: "Email not found",
      },
      404,
    );
  }

  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `
      DELETE FROM sessions
      WHERE user_id IN (
        SELECT users.id
        FROM users
        JOIN roles
          ON roles.id =
             users.role_id
        WHERE LOWER(users.email) =
              LOWER(?)
          AND roles.name =
              'member'
      )
      `,
    ).bind(existing.email),

    env.DB.prepare(
      `
      UPDATE users
      SET
        status = 'rejected',
        updated_at = ?
      WHERE LOWER(email) =
            LOWER(?)
        AND role_id = (
          SELECT id
          FROM roles
          WHERE name = 'member'
          LIMIT 1
        )
      `,
    ).bind(now, existing.email),

    env.DB.prepare(
      `
      DELETE FROM members
      WHERE LOWER(email) =
            LOWER(?)
      `,
    ).bind(existing.email),

    env.DB.prepare(
      `
      DELETE FROM emails
      WHERE id = ?
      `,
    ).bind(body.id),
  ]);

  return json({
    ok: true,
  });
}
