import { Env, json, readJson } from "./http";

export async function createPasswordResetToken(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
    userId?: string;
    tokenHash?: string;
    expiresAt?: string;
  }>(request);

  if (!body.id || !body.userId || !body.tokenHash || !body.expiresAt) {
    return json({ error: "Missing reset token data" }, 400);
  }

  await env.DB.prepare(
    `
    DELETE FROM password_reset_tokens
    WHERE user_id = ?
      AND used_at IS NULL
    `,
  )
    .bind(body.userId)
    .run();

  await env.DB.prepare(
    `
    INSERT INTO password_reset_tokens (
      id,
      user_id,
      token_hash,
      expires_at,
      used_at,
      created_at
    )
    VALUES (?, ?, ?, ?, NULL, ?)
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

export async function findPasswordResetToken(request: Request, env: Env) {
  const body = await readJson<{ tokenHash?: string }>(request);

  if (!body.tokenHash) {
    return json({ error: "Token hash is required" }, 400);
  }

  const reset = await env.DB.prepare(
    `
    SELECT
      password_reset_tokens.id,
      password_reset_tokens.user_id,
      password_reset_tokens.expires_at
    FROM password_reset_tokens
    JOIN users
      ON users.id = password_reset_tokens.user_id
    WHERE password_reset_tokens.token_hash = ?
      AND password_reset_tokens.used_at IS NULL
      AND password_reset_tokens.expires_at > ?
      AND users.status = 'active'
    LIMIT 1
    `,
  )
    .bind(body.tokenHash, new Date().toISOString())
    .first();

  return json({
    reset: reset ?? null,
  });
}

export async function consumePasswordResetToken(request: Request, env: Env) {
  const body = await readJson<{
    tokenId?: string;
    userId?: string;
    passwordHash?: string;
  }>(request);

  if (!body.tokenId || !body.userId || !body.passwordHash) {
    return json({ error: "Missing password reset data" }, 400);
  }

  const now = new Date().toISOString();

  const reset = await env.DB.prepare(
    `
    SELECT id
    FROM password_reset_tokens
    WHERE id = ?
      AND user_id = ?
      AND used_at IS NULL
      AND expires_at > ?
    LIMIT 1
    `,
  )
    .bind(body.tokenId, body.userId, now)
    .first();

  if (!reset) {
    return json({ error: "Invalid reset token" }, 400);
  }

  await env.DB.batch([
    env.DB.prepare(
      `
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
      `,
    ).bind(body.passwordHash, now, body.userId),

    env.DB.prepare(
      `
      UPDATE password_reset_tokens
      SET used_at = ?
      WHERE id = ?
      `,
    ).bind(now, body.tokenId),

    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(body.userId),
  ]);

  return json({ ok: true });
}
