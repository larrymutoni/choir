import { Env, json, normalizeEmail, readJson } from "./http";

type UserRow = {
  id: string;
  role_id: number;
  role_name: string;
  firstname: string;
  lastname: string;
  email: string;
  password_hash: string;
  phone: string | null;
  avatar_key: string | null;
  status: "pending" | "active" | "rejected";
  created_at: string;
  updated_at: string;
};

export async function checkAuthorizedEmail(request: Request, env: Env) {
  const body = await readJson<{ email?: string }>(request);

  if (!body.email) {
    return json({ error: "Email is required" }, 400);
  }

  const email = normalizeEmail(body.email);

  const row = await env.DB.prepare(
    "SELECT id FROM emails WHERE email = ? LIMIT 1",
  )
    .bind(email)
    .first();

  return json({
    authorized: Boolean(row),
  });
}

export async function findUserByEmail(request: Request, env: Env) {
  const body = await readJson<{ email?: string }>(request);

  if (!body.email) {
    return json({ error: "Email is required" }, 400);
  }

  const email = normalizeEmail(body.email);

  const user = await env.DB.prepare(
    `
    SELECT
      users.id,
      users.role_id,
      roles.name AS role_name,
      users.firstname,
      users.lastname,
      users.email,
      users.password_hash,
      users.phone,
      users.avatar_key,
      users.status,
      users.created_at,
      users.updated_at
    FROM users
    JOIN roles ON roles.id = users.role_id
    WHERE users.email = ?
    LIMIT 1
    `,
  )
    .bind(email)
    .first<UserRow>();

  return json({ user: user ?? null });
}

export async function createUser(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    passwordHash?: string;
    phone?: string | null;
    role?: string;
    status?: string;
  }>(request);

  if (
    !body.id ||
    !body.firstname ||
    !body.lastname ||
    !body.email ||
    !body.passwordHash
  ) {
    return json({ error: "Missing required user data" }, 400);
  }

  const roleName = body.role ?? "member";
  const status = body.status ?? "pending";

  if (!["pending", "active", "rejected"].includes(status)) {
    return json({ error: "Invalid user status" }, 400);
  }

  const role = await env.DB.prepare(
    "SELECT id FROM roles WHERE name = ? LIMIT 1",
  )
    .bind(roleName)
    .first<{ id: number }>();

  if (!role) {
    return json({ error: "Invalid role" }, 400);
  }

  const email = normalizeEmail(body.email);
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `
      INSERT INTO users (
        id,
        role_id,
        firstname,
        lastname,
        email,
        password_hash,
        phone,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
      .bind(
        body.id,
        role.id,
        body.firstname.trim(),
        body.lastname.trim(),
        email,
        body.passwordHash,
        body.phone?.trim() || null,
        status,
        now,
        now,
      )
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("UNIQUE")) {
      return json({ error: "User already exists" }, 409);
    }

    throw error;
  }

  return json({ ok: true }, 201);
}

export async function listUsers(_request: Request, env: Env) {
  const result = await env.DB.prepare(
    `
    SELECT
      users.id,
      roles.name AS role,
      users.firstname,
      users.lastname,
      users.email,
      users.phone,
      users.status,
      users.created_at,
      users.updated_at
    FROM users
    JOIN roles ON roles.id = users.role_id
    ORDER BY users.created_at DESC
    `,
  ).all();

  return json({
    users: result.results,
  });
}

export async function updateUserStatus(request: Request, env: Env) {
  const body = await readJson<{
    userId?: string;
    status?: "pending" | "active" | "rejected";
  }>(request);

  if (!body.userId || !body.status) {
    return json({ error: "User ID and status are required" }, 400);
  }

  if (!["pending", "active", "rejected"].includes(body.status)) {
    return json({ error: "Invalid user status" }, 400);
  }

  const result = await env.DB.prepare(
    `
    UPDATE users
    SET status = ?, updated_at = ?
    WHERE id = ?
    `,
  )
    .bind(body.status, new Date().toISOString(), body.userId)
    .run();

  if (result.meta.changes === 0) {
    return json({ error: "User not found" }, 404);
  }

  return json({ ok: true });
}
export async function updateUserRole(request: Request, env: Env) {
  const body = await readJson<{
    userId?: string;
    role?: "member" | "admin" | "super_admin";
  }>(request);

  if (!body.userId || !body.role) {
    return json({ error: "User ID and role are required" }, 400);
  }

  const role = await env.DB.prepare(
    "SELECT id FROM roles WHERE name = ? LIMIT 1",
  )
    .bind(body.role)
    .first<{ id: number }>();

  if (!role) {
    return json({ error: "Invalid role" }, 400);
  }

  const result = await env.DB.prepare(
    `
    UPDATE users
    SET role_id = ?, updated_at = ?
    WHERE id = ?
    `,
  )
    .bind(role.id, new Date().toISOString(), body.userId)
    .run();

  if (result.meta.changes === 0) {
    return json({ error: "User not found" }, 404);
  }

  return json({ ok: true });
}
export async function updateUserProfile(request: Request, env: Env) {
  const body = await readJson<{
    userId?: string;
    firstname?: string;
    lastname?: string;
    phone?: string | null;
  }>(request);

  if (!body.userId || !body.firstname?.trim() || !body.lastname?.trim()) {
    return json({ error: "Missing profile data" }, 400);
  }

  const result = await env.DB.prepare(
    `
    UPDATE users
    SET
      firstname = ?,
      lastname = ?,
      phone = ?,
      updated_at = ?
    WHERE id = ?
    `,
  )
    .bind(
      body.firstname.trim(),
      body.lastname.trim(),
      body.phone?.trim() || null,
      new Date().toISOString(),
      body.userId,
    )
    .run();

  if (result.meta.changes === 0) {
    return json({ error: "User not found" }, 404);
  }

  return json({ ok: true });
}
