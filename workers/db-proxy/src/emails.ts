import { Env, json, normalizeEmail, readJson } from "./http";

type AuthorizedEmailRow = {
  id: string;
  email: string;
  created_at: string;
};

export async function listAuthorizedEmails(
  _request: Request,
  env: Env,
) {
  const result = await env.DB.prepare(
    `
    SELECT id, email, created_at
    FROM emails
    ORDER BY created_at DESC
    `,
  ).all<AuthorizedEmailRow>();

  return json({
    emails: result.results,
  });
}

export async function addAuthorizedEmail(
  request: Request,
  env: Env,
) {
  const body = await readJson<{ email?: string }>(request);

  if (!body.email) {
    return json({ error: "Email is required" }, 400);
  }

  const email = normalizeEmail(body.email);

  await env.DB.prepare(
    `
    INSERT OR IGNORE INTO emails (
      id,
      email,
      created_at
    )
    VALUES (?, ?, ?)
    `,
  )
    .bind(
      crypto.randomUUID(),
      email,
      new Date().toISOString(),
    )
    .run();

  return json({ ok: true }, 201);
}

export async function deleteAuthorizedEmail(
  request: Request,
  env: Env,
) {
  const body = await readJson<{ id?: string }>(request);

  if (!body.id) {
    return json({ error: "Email ID is required" }, 400);
  }

  const result = await env.DB.prepare(
    "DELETE FROM emails WHERE id = ?",
  )
    .bind(body.id)
    .run();

  if (result.meta.changes === 0) {
    return json({ error: "Email not found" }, 404);
  }

  return json({ ok: true });
}