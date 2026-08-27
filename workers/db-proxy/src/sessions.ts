import { Env, json, readJson } from "./http";

export async function createSession(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
    userId?: string;
    tokenHash?: string;
    expiresAt?: string;
  }>(request);

  if (!body.id || !body.userId || !body.tokenHash || !body.expiresAt) {
    return json({ error: "Missing session data" }, 400);
  }

  await env.DB.prepare(
    `
    INSERT INTO sessions (
      id,
      user_id,
      token_hash,
      expires_at,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
    `,
  )
    .bind(
      body.id,
      body.userId,
      body.tokenHash,
      body.expiresAt,
      new Date().toISOString(),
    )
    .run();

  return json({ ok: true }, 201);
}

export async function findSession(request: Request, env: Env) {
  const body = await readJson<{ tokenHash?: string }>(request);

  if (!body.tokenHash) {
    return json({ error: "Token hash is required" }, 400);
  }

  const row = await env.DB.prepare(
    `
    SELECT
      sessions.id AS session_id,
      sessions.expires_at,
      users.id AS user_id,
      users.firstname,
      users.lastname,
      users.email,
      users.status,
      roles.name AS role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    JOIN roles ON roles.id = users.role_id
    WHERE sessions.token_hash = ?
      AND sessions.expires_at > ?
    LIMIT 1
    `,
  )
    .bind(body.tokenHash, new Date().toISOString())
    .first();

  return json({
    session: row ?? null,
  });
}

export async function deleteSession(request: Request, env: Env) {
  const body = await readJson<{ tokenHash?: string }>(request);

  if (!body.tokenHash) {
    return json({ error: "Token hash is required" }, 400);
  }

  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(body.tokenHash)
    .run();

  return json({ ok: true });
}
