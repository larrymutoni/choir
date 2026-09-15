import {
  Env,
  json,
  readJson,
} from "./http";

type SessionRow = {
  session_id: string;
  expires_at: string;

  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  status:
    | "pending"
    | "active"
    | "rejected";

  role: string;

  custom_role_id:
    | string
    | null;

  custom_role_name:
    | string
    | null;

  system_members: number;
  system_calendar: number;
  system_resources: number;
  system_content: number;
  system_images: number;
  system_gallery: number;
  system_settings: number;

  custom_members:
    | number
    | null;

  custom_calendar:
    | number
    | null;

  custom_resources:
    | number
    | null;

  custom_content:
    | number
    | null;

  custom_images:
    | number
    | null;

  custom_gallery:
    | number
    | null;

  custom_settings:
    | number
    | null;
};

export async function createSession(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
      userId?: string;
      tokenHash?: string;
      expiresAt?: string;
    }>(request);

  if (
    !body.id ||
    !body.userId ||
    !body.tokenHash ||
    !body.expiresAt
  ) {
    return json(
      {
        error:
          "Missing session data",
      },
      400,
    );
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

  return json(
    {
      ok: true,
    },
    201,
  );
}

export async function findSession(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      tokenHash?: string;
    }>(request);

  if (!body.tokenHash) {
    return json(
      {
        error:
          "Token hash is required",
      },
      400,
    );
  }

  const row =
    await env.DB.prepare(
      `
      SELECT
        sessions.id AS session_id,
        sessions.expires_at,

        users.id AS user_id,
        users.firstname,
        users.lastname,
        users.email,
        users.status,

        roles.name AS role,

        users.custom_role_id,
        custom_roles.name
          AS custom_role_name,

        roles.members
          AS system_members,
        roles.calendar
          AS system_calendar,
        roles.resources
          AS system_resources,
        roles.content
          AS system_content,
        roles.images
          AS system_images,
        roles.gallery
          AS system_gallery,
        roles.settings
          AS system_settings,

        custom_roles.members
          AS custom_members,
        custom_roles.calendar
          AS custom_calendar,
        custom_roles.resources
          AS custom_resources,
        custom_roles.content
          AS custom_content,
        custom_roles.images
          AS custom_images,
        custom_roles.gallery
          AS custom_gallery,
        custom_roles.settings
          AS custom_settings

      FROM sessions

      JOIN users
        ON users.id =
           sessions.user_id

      JOIN roles
        ON roles.id =
           users.role_id

      LEFT JOIN custom_roles
        ON custom_roles.id =
           users.custom_role_id

      WHERE
        sessions.token_hash = ?
        AND sessions.expires_at > ?

      LIMIT 1
      `,
    )
      .bind(
        body.tokenHash,
        new Date().toISOString(),
      )
      .first<SessionRow>();

  if (!row) {
    return json({
      session: null,
    });
  }

  const isSuperAdmin =
    row.role ===
    "super_admin";

  const usesCustomRole =
    Boolean(
      row.custom_role_id &&
        row.custom_role_name,
    );

  function permission(
    systemValue: number,
    customValue:
      | number
      | null,
  ) {
    if (isSuperAdmin) {
      return true;
    }

    return Boolean(
      usesCustomRole
        ? customValue
        : systemValue,
    );
  }

  const permissions = {
    members: permission(
      row.system_members,
      row.custom_members,
    ),

    calendar: permission(
      row.system_calendar,
      row.custom_calendar,
    ),

    resources: permission(
      row.system_resources,
      row.custom_resources,
    ),

    content: permission(
      row.system_content,
      row.custom_content,
    ),

    images: permission(
      row.system_images,
      row.custom_images,
    ),

    gallery: permission(
      row.system_gallery,
      row.custom_gallery,
    ),

    settings: permission(
      row.system_settings,
      row.custom_settings,
    ),
  };

  return json({
    session: {
      session_id:
        row.session_id,

      expires_at:
        row.expires_at,

      user_id:
        row.user_id,

      firstname:
        row.firstname,

      lastname:
        row.lastname,

      email:
        row.email,

      status:
        row.status,

      role:
        row.role,

      custom_role_id:
        row.custom_role_id,

      custom_role_name:
        row.custom_role_name,

      role_name:
        row.custom_role_name ??
        (
          row.role ===
          "super_admin"
            ? "Super administrateur"
            : row.role === "admin"
              ? "Administrateur"
              : "Membre"
        ),

      permissions,
    },
  });
}

export async function deleteSession(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      tokenHash?: string;
    }>(request);

  if (!body.tokenHash) {
    return json(
      {
        error:
          "Token hash is required",
      },
      400,
    );
  }

  await env.DB.prepare(
    `
    DELETE FROM sessions
    WHERE token_hash = ?
    `,
  )
    .bind(body.tokenHash)
    .run();

  return json({
    ok: true,
  });
}
