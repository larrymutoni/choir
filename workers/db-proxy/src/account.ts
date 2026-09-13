import { type Env, json, readJson } from "./http";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function updateUserPassword(request: Request, env: Env) {
  const body = await readJson<{
    userId?: string;
    passwordHash?: string;
    currentSessionId?: string;
  }>(request);

  if (!body.userId || !body.passwordHash || !body.currentSessionId) {
    return json(
      {
        error: "Invalid password update data",
      },
      400,
    );
  }

  const results = await env.DB.batch([
    env.DB.prepare(
      `
        UPDATE users
        SET
          password_hash = ?,
          updated_at = ?
        WHERE id = ?
        `,
    ).bind(body.passwordHash, new Date().toISOString(), body.userId),

    env.DB.prepare(
      `
        DELETE FROM sessions
        WHERE
          user_id = ?
          AND id <> ?
        `,
    ).bind(body.userId, body.currentSessionId),
  ]);

  if (results[0].meta.changes === 0) {
    return json(
      {
        error: "User not found",
      },
      404,
    );
  }

  return json({
    ok: true,
  });
}

export async function uploadUserAvatar(request: Request, env: Env) {
  const form = await request.formData();

  const userId = form.get("userId");

  const file = form.get("file");

  if (typeof userId !== "string" || !userId) {
    return json(
      {
        error: "User ID is required",
      },
      400,
    );
  }

  if (!(file instanceof File)) {
    return json(
      {
        error: "Avatar file is required",
      },
      400,
    );
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return json(
      {
        error: "Unsupported avatar format",
      },
      400,
    );
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return json(
      {
        error: "Avatar is too large",
      },
      400,
    );
  }

  const user = await env.DB.prepare(
    `
      SELECT avatar_key
      FROM users
      WHERE id = ?
      `,
  )
    .bind(userId)
    .first<{
      avatar_key: string | null;
    }>();

  if (!user) {
    return json(
      {
        error: "User not found",
      },
      404,
    );
  }

  const extension = EXTENSIONS[file.type];

  const key = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;

  await env.PRIVATE_STORAGE.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  const result = await env.DB.prepare(
    `
      UPDATE users
      SET
        avatar_key = ?,
        updated_at = ?
      WHERE id = ?
      `,
  )
    .bind(key, new Date().toISOString(), userId)
    .run();

  if (result.meta.changes === 0) {
    await env.PRIVATE_STORAGE.delete(key);

    return json(
      {
        error: "User not found",
      },
      404,
    );
  }

  if (user.avatar_key && user.avatar_key !== key) {
    try {
      await env.PRIVATE_STORAGE.delete(user.avatar_key);
    } catch {
      // Best effort cleanup.
    }
  }

  return json({
    ok: true,
    avatarKey: key,
  });
}

export async function serveUserAvatar(request: Request, env: Env) {
  const url = new URL(request.url);

  const userId = url.searchParams.get("userId");

  if (!userId) {
    return json(
      {
        error: "User ID is required",
      },
      400,
    );
  }

  const user = await env.DB.prepare(
    `
      SELECT avatar_key
      FROM users
      WHERE id = ?
      `,
  )
    .bind(userId)
    .first<{
      avatar_key: string | null;
    }>();

  if (!user?.avatar_key) {
    return json(
      {
        error: "Avatar not found",
      },
      404,
    );
  }

  const object = await env.PRIVATE_STORAGE.get(user.avatar_key);

  if (!object) {
    return json(
      {
        error: "Avatar not found",
      },
      404,
    );
  }

  const headers = new Headers();

  headers.set(
    "Content-Type",
    object.httpMetadata?.contentType ?? "application/octet-stream",
  );

  headers.set("Cache-Control", "private, max-age=300");

  headers.set("ETag", object.httpEtag);

  return new Response(object.body, {
    headers,
  });
}

export async function deleteUserAvatar(request: Request, env: Env) {
  const body = await readJson<{
    userId?: string;
  }>(request);

  if (!body.userId) {
    return json(
      {
        error: "User ID is required",
      },
      400,
    );
  }

  const user = await env.DB.prepare(
    `
      SELECT avatar_key
      FROM users
      WHERE id = ?
      `,
  )
    .bind(body.userId)
    .first<{
      avatar_key: string | null;
    }>();

  if (!user) {
    return json(
      {
        error: "User not found",
      },
      404,
    );
  }

  await env.DB.prepare(
    `
    UPDATE users
    SET
      avatar_key = NULL,
      updated_at = ?
    WHERE id = ?
    `,
  )
    .bind(new Date().toISOString(), body.userId)
    .run();

  if (user.avatar_key) {
    try {
      await env.PRIVATE_STORAGE.delete(user.avatar_key);
    } catch {
      // Best effort cleanup.
    }
  }

  return json({
    ok: true,
  });
}
