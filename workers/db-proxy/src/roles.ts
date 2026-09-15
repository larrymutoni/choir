import {
  Env,
  json,
  readJson,
} from "./http";

type Permissions = {
  members: boolean;
  calendar: boolean;
  resources: boolean;
  content: boolean;
  images: boolean;
  gallery: boolean;
  settings: boolean;
};

type PermissionRow = {
  members: number;
  calendar: number;
  resources: number;
  content: number;
  images: number;
  gallery: number;
  settings: number;
};

type SystemRoleRow =
  PermissionRow & {
    name: string;
  };

type CustomRoleRow =
  PermissionRow & {
    id: string;
    name: string;
    usage_count: number;
  };

const fullPermissions: Permissions = {
  members: true,
  calendar: true,
  resources: true,
  content: true,
  images: true,
  gallery: true,
  settings: true,
};

function mapPermissions(
  row: PermissionRow,
): Permissions {
  return {
    members:
      Boolean(row.members),
    calendar:
      Boolean(row.calendar),
    resources:
      Boolean(row.resources),
    content:
      Boolean(row.content),
    images:
      Boolean(row.images),
    gallery:
      Boolean(row.gallery),
    settings:
      Boolean(row.settings),
  };
}

function normalizePermissions(
  value: unknown,
): Permissions | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const raw =
    value as Partial<
      Record<
        keyof Permissions,
        unknown
      >
    >;

  return {
    members:
      raw.members === true,
    calendar:
      raw.calendar === true,
    resources:
      raw.resources === true,
    content:
      raw.content === true,
    images:
      raw.images === true,
    gallery:
      raw.gallery === true,
    settings:
      raw.settings === true,
  };
}

function systemLabel(
  role: string,
) {
  if (
    role === "super_admin"
  ) {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}

function validName(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const name =
    value.trim();

  if (
    name.length < 2 ||
    name.length > 60
  ) {
    return null;
  }

  const reserved = [
    "membre",
    "administrateur",
    "super administrateur",
    "member",
    "admin",
    "super_admin",
  ];

  if (
    reserved.includes(
      name.toLocaleLowerCase(
        "fr",
      ),
    )
  ) {
    return null;
  }

  return name;
}

export async function listCustomRoles(
  _request: Request,
  env: Env,
) {
  const system =
    await env.DB.prepare(
      `
      SELECT
        name,
        members,
        calendar,
        resources,
        content,
        images,
        gallery,
        settings
      FROM roles
      WHERE name IN (
        'member',
        'admin',
        'super_admin'
      )
      `,
    ).all<SystemRoleRow>();

  const custom =
    await env.DB.prepare(
      `
      SELECT
        custom_roles.id,
        custom_roles.name,
        custom_roles.members,
        custom_roles.calendar,
        custom_roles.resources,
        custom_roles.content,
        custom_roles.images,
        custom_roles.gallery,
        custom_roles.settings,
        COUNT(
          users.id
        ) AS usage_count

      FROM custom_roles

      LEFT JOIN users
        ON users.custom_role_id =
           custom_roles.id

      GROUP BY
        custom_roles.id

      ORDER BY
        LOWER(
          custom_roles.name
        )
      `,
    ).all<CustomRoleRow>();

  const order = [
    "member",
    "admin",
    "super_admin",
  ];

  const systemRoles =
    [...system.results]
      .sort(
        (left, right) =>
          order.indexOf(
            left.name,
          ) -
          order.indexOf(
            right.name,
          ),
      )
      .map((role) => ({
        id: role.name,

        name:
          systemLabel(
            role.name,
          ),

        permissions:
          role.name ===
          "super_admin"
            ? fullPermissions
            : mapPermissions(
                role,
              ),
      }));

  return json({
    systemRoles,

    roles:
      custom.results.map(
        (role) => ({
          id: role.id,
          name: role.name,

          permissions:
            mapPermissions(
              role,
            ),

          usageCount:
            Number(
              role.usage_count,
            ),
        }),
      ),
  });
}

export async function createCustomRole(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      name?: unknown;
      permissions?: unknown;
    }>(request);

  const name =
    validName(body.name);

  const permissions =
    normalizePermissions(
      body.permissions,
    );

  if (
    !name ||
    !permissions
  ) {
    return json(
      {
        error:
          "Invalid role data",
      },
      400,
    );
  }

  const duplicate =
    await env.DB.prepare(
      `
      SELECT id
      FROM custom_roles
      WHERE LOWER(name) =
            LOWER(?)
      LIMIT 1
      `,
    )
      .bind(name)
      .first();

  if (duplicate) {
    return json(
      {
        error:
          "Role already exists",
      },
      409,
    );
  }

  const id =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO custom_roles (
      id,
      name,
      members,
      calendar,
      resources,
      content,
      images,
      gallery,
      settings,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      id,
      name,
      Number(
        permissions.members,
      ),
      Number(
        permissions.calendar,
      ),
      Number(
        permissions.resources,
      ),
      Number(
        permissions.content,
      ),
      Number(
        permissions.images,
      ),
      Number(
        permissions.gallery,
      ),
      Number(
        permissions.settings,
      ),
      now,
      now,
    )
    .run();

  return json(
    {
      ok: true,
      id,
    },
    201,
  );
}

export async function updateCustomRole(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      kind?:
        | "system"
        | "custom";

      id?: string;
      name?: unknown;
      permissions?: unknown;
    }>(request);

  const permissions =
    normalizePermissions(
      body.permissions,
    );

  if (
    !body.kind ||
    !body.id ||
    !permissions
  ) {
    return json(
      {
        error:
          "Invalid role data",
      },
      400,
    );
  }

  if (
    body.kind ===
    "system"
  ) {
    if (
      body.id ===
      "super_admin"
    ) {
      return json(
        {
          error:
            "Super administrator role is protected",
        },
        403,
      );
    }

    if (
      ![
        "member",
        "admin",
      ].includes(body.id)
    ) {
      return json(
        {
          error:
            "Invalid system role",
        },
        400,
      );
    }

    await env.DB.prepare(
      `
      UPDATE roles
      SET
        members = ?,
        calendar = ?,
        resources = ?,
        content = ?,
        images = ?,
        gallery = ?,
        settings = ?
      WHERE name = ?
      `,
    )
      .bind(
        Number(
          permissions.members,
        ),
        Number(
          permissions.calendar,
        ),
        Number(
          permissions.resources,
        ),
        Number(
          permissions.content,
        ),
        Number(
          permissions.images,
        ),
        Number(
          permissions.gallery,
        ),
        Number(
          permissions.settings,
        ),
        body.id,
      )
      .run();

    return json({
      ok: true,
    });
  }

  const name =
    validName(body.name);

  if (!name) {
    return json(
      {
        error:
          "Invalid role name",
      },
      400,
    );
  }

  const duplicate =
    await env.DB.prepare(
      `
      SELECT id
      FROM custom_roles
      WHERE LOWER(name) =
            LOWER(?)
        AND id <> ?
      LIMIT 1
      `,
    )
      .bind(
        name,
        body.id,
      )
      .first();

  if (duplicate) {
    return json(
      {
        error:
          "Role already exists",
      },
      409,
    );
  }

  const result =
    await env.DB.prepare(
      `
      UPDATE custom_roles
      SET
        name = ?,
        members = ?,
        calendar = ?,
        resources = ?,
        content = ?,
        images = ?,
        gallery = ?,
        settings = ?,
        updated_at = ?
      WHERE id = ?
      `,
    )
      .bind(
        name,
        Number(
          permissions.members,
        ),
        Number(
          permissions.calendar,
        ),
        Number(
          permissions.resources,
        ),
        Number(
          permissions.content,
        ),
        Number(
          permissions.images,
        ),
        Number(
          permissions.gallery,
        ),
        Number(
          permissions.settings,
        ),
        new Date().toISOString(),
        body.id,
      )
      .run();

  if (
    result.meta.changes === 0
  ) {
    return json(
      {
        error:
          "Role not found",
      },
      404,
    );
  }

  return json({
    ok: true,
  });
}

export async function deleteCustomRole(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
    }>(request);

  if (!body.id) {
    return json(
      {
        error:
          "Role ID required",
      },
      400,
    );
  }

  const usage =
    await env.DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM users
      WHERE custom_role_id = ?
      `,
    )
      .bind(body.id)
      .first<{
        count: number;
      }>();

  if (
    Number(
      usage?.count ?? 0,
    ) > 0
  ) {
    return json(
      {
        error:
          "Role is assigned",
      },
      409,
    );
  }

  await env.DB.prepare(
    `
    DELETE FROM custom_roles
    WHERE id = ?
    `,
  )
    .bind(body.id)
    .run();

  return json({
    ok: true,
  });
}
