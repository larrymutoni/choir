import {
  Env,
  json,
  normalizeEmail,
  readJson,
} from "./http";

type MemberInput = {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string | null;
};

type MemberRow = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

type UserForMemberRow = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  status: "pending" | "active" | "rejected";
  role: "member" | "admin" | "super_admin";
};

function validEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function cleanPhone(
  value?: string | null,
) {
  return (
    value?.trim() ||
    null
  );
}

function validateMemberInput(
  body: MemberInput,
) {
  const firstname =
    body.firstname?.trim() ??
    "";

  const lastname =
    body.lastname?.trim() ??
    "";

  const email =
    normalizeEmail(
      body.email ?? "",
    );

  if (
    !firstname ||
    !lastname ||
    !email ||
    !validEmail(email)
  ) {
    return null;
  }

  return {
    firstname,
    lastname,
    email,
    phone:
      cleanPhone(body.phone),
  };
}

export async function listMembers(
  _request: Request,
  env: Env,
) {
  const result =
    await env.DB.prepare(
      `
      SELECT
        membership_id,
        user_id,
        firstname,
        lastname,
        email,
        phone,
        role,
        custom_role_id,
        custom_role_name,
        account_status,
        is_official
      FROM (
        SELECT
          members.id AS membership_id,

          users.id AS user_id,

          COALESCE(
            NULLIF(users.firstname, ''),
            NULLIF(members.firstname, ''),
            ''
          ) AS firstname,

          COALESCE(
            NULLIF(users.lastname, ''),
            NULLIF(members.lastname, ''),
            ''
          ) AS lastname,

          members.email AS email,

          COALESCE(
            users.phone,
            members.phone
          ) AS phone,

          COALESCE(
            roles.name,
            'member'
          ) AS role,

          users.custom_role_id
            AS custom_role_id,

          custom_roles.name
            AS custom_role_name,

          users.status AS account_status,

          1 AS is_official

        FROM members

        LEFT JOIN users
          ON LOWER(users.email) =
             LOWER(members.email)

        LEFT JOIN roles
          ON roles.id =
             users.role_id

        LEFT JOIN custom_roles
          ON custom_roles.id =
             users.custom_role_id

        UNION ALL

        SELECT
          NULL AS membership_id,

          users.id AS user_id,

          users.firstname AS firstname,
          users.lastname AS lastname,
          users.email AS email,
          users.phone AS phone,

          roles.name AS role,

          users.custom_role_id
            AS custom_role_id,

          custom_roles.name
            AS custom_role_name,

          users.status AS account_status,

          0 AS is_official

        FROM users

        JOIN roles
          ON roles.id =
             users.role_id

        LEFT JOIN custom_roles
          ON custom_roles.id =
             users.custom_role_id

        WHERE NOT EXISTS (
          SELECT 1
          FROM members
          WHERE LOWER(members.email) =
                LOWER(users.email)
        )
      )

      ORDER BY
        LOWER(lastname),
        LOWER(firstname),
        LOWER(email)
      `,
    ).all();

  return json({
    members:
      result.results,
  });
}

export async function createMember(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<MemberInput>(
      request,
    );

  const input =
    validateMemberInput(body);

  if (!input) {
    return json(
      {
        error:
          "Invalid member data",
      },
      400,
    );
  }

  const now =
    new Date().toISOString();

  const id =
    crypto.randomUUID();

  try {
    await env.DB.prepare(
      `
      INSERT INTO members (
        id,
        firstname,
        lastname,
        email,
        phone,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
      .bind(
        id,
        input.firstname,
        input.lastname,
        input.email,
        input.phone,
        now,
        now,
      )
      .run();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message.includes(
        "UNIQUE",
      )
    ) {
      return json(
        {
          error:
            "Member already exists",
        },
        409,
      );
    }

    throw error;
  }

  /*
   * Compatibility:
   * keep the legacy emails table synchronized
   * while its old admin page still exists.
   */
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
    ).bind(
      crypto.randomUUID(),
      input.email,
      now,
    ),

    /*
     * If this person had already registered
     * and was waiting for approval,
     * adding them to the official member list
     * activates the account automatically.
     */
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
    ).bind(
      now,
      input.email,
    ),
  ]);

  return json(
    {
      ok: true,
      id,
    },
    201,
  );
}

export async function updateMember(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<
      MemberInput & {
        id?: string;
      }
    >(request);

  if (!body.id) {
    return json(
      {
        error:
          "Member ID is required",
      },
      400,
    );
  }

  const input =
    validateMemberInput(body);

  if (!input) {
    return json(
      {
        error:
          "Invalid member data",
      },
      400,
    );
  }

  const existing =
    await env.DB.prepare(
      `
      SELECT
        id,
        firstname,
        lastname,
        email,
        phone,
        created_at,
        updated_at
      FROM members
      WHERE id = ?
      LIMIT 1
      `,
    )
      .bind(body.id)
      .first<MemberRow>();

  if (!existing) {
    return json(
      {
        error:
          "Member not found",
      },
      404,
    );
  }

  const account =
    await env.DB.prepare(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) =
            LOWER(?)
      LIMIT 1
      `,
    )
      .bind(
        existing.email,
      )
      .first<{
        id: string;
      }>();

  if (
    account &&
    normalizeEmail(
      existing.email,
    ) !== input.email
  ) {
    return json(
      {
        error:
          "Registered member email cannot be changed",
      },
      409,
    );
  }

  const now =
    new Date().toISOString();

  try {
    await env.DB.prepare(
      `
      UPDATE members
      SET
        firstname = ?,
        lastname = ?,
        email = ?,
        phone = ?,
        updated_at = ?
      WHERE id = ?
      `,
    )
      .bind(
        input.firstname,
        input.lastname,
        input.email,
        input.phone,
        now,
        body.id,
      )
      .run();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message.includes(
        "UNIQUE",
      )
    ) {
      return json(
        {
          error:
            "Email already belongs to another member",
        },
        409,
      );
    }

    throw error;
  }

  await env.DB.batch([
    env.DB.prepare(
      `
      DELETE FROM emails
      WHERE LOWER(email) =
            LOWER(?)
      `,
    ).bind(
      existing.email,
    ),

    env.DB.prepare(
      `
      INSERT OR IGNORE INTO emails (
        id,
        email,
        created_at
      )
      VALUES (?, ?, ?)
      `,
    ).bind(
      crypto.randomUUID(),
      input.email,
      now,
    ),

    /*
     * When a registered member is edited by
     * an administrator, keep their profile
     * synchronized.
     */
    env.DB.prepare(
      `
      UPDATE users
      SET
        firstname = ?,
        lastname = ?,
        phone = ?,
        updated_at = ?
      WHERE LOWER(email) =
            LOWER(?)
      `,
    ).bind(
      input.firstname,
      input.lastname,
      input.phone,
      now,
      input.email,
    ),
  ]);

  return json({
    ok: true,
  });
}

export async function deleteMember(
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
          "Member ID is required",
      },
      400,
    );
  }

  const member =
    await env.DB.prepare(
      `
      SELECT
        id,
        email
      FROM members
      WHERE id = ?
      LIMIT 1
      `,
    )
      .bind(body.id)
      .first<{
        id: string;
        email: string;
      }>();

  if (!member) {
    return json(
      {
        error:
          "Member not found",
      },
      404,
    );
  }

  const now =
    new Date().toISOString();

  await env.DB.batch([
    /*
     * Kill active sessions first.
     */
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
    ).bind(
      member.email,
    ),

    /*
     * Keep the account but revoke access.
     */
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
    ).bind(
      now,
      member.email,
    ),

    env.DB.prepare(
      `
      DELETE FROM emails
      WHERE LOWER(email) =
            LOWER(?)
      `,
    ).bind(
      member.email,
    ),

    env.DB.prepare(
      `
      DELETE FROM members
      WHERE id = ?
      `,
    ).bind(
      body.id,
    ),
  ]);

  return json({
    ok: true,
  });
}

export async function approveMemberUser(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      userId?: string;
    }>(request);

  if (!body.userId) {
    return json(
      {
        error:
          "User ID is required",
      },
      400,
    );
  }

  const user =
    await env.DB.prepare(
      `
      SELECT
        users.id,
        users.firstname,
        users.lastname,
        users.email,
        users.phone,
        users.status,
        roles.name AS role
      FROM users
      JOIN roles
        ON roles.id =
           users.role_id
      WHERE users.id = ?
      LIMIT 1
      `,
    )
      .bind(body.userId)
      .first<UserForMemberRow>();

  if (!user) {
    return json(
      {
        error:
          "User not found",
      },
      404,
    );
  }

  if (
    user.role !== "member"
  ) {
    return json(
      {
        error:
          "Only member accounts can be approved here",
      },
      400,
    );
  }

  const now =
    new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `
      INSERT INTO members (
        id,
        firstname,
        lastname,
        email,
        phone,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(email)
      DO UPDATE SET
        firstname =
          excluded.firstname,
        lastname =
          excluded.lastname,
        phone =
          excluded.phone,
        updated_at =
          excluded.updated_at
      `,
    ).bind(
      crypto.randomUUID(),
      user.firstname,
      user.lastname,
      normalizeEmail(
        user.email,
      ),
      user.phone,
      now,
      now,
    ),

    env.DB.prepare(
      `
      INSERT OR IGNORE INTO emails (
        id,
        email,
        created_at
      )
      VALUES (?, ?, ?)
      `,
    ).bind(
      crypto.randomUUID(),
      normalizeEmail(
        user.email,
      ),
      now,
    ),

    env.DB.prepare(
      `
      UPDATE users
      SET
        status = 'active',
        updated_at = ?
      WHERE id = ?
      `,
    ).bind(
      now,
      user.id,
    ),
  ]);

  return json({
    ok: true,
  });
}

export async function rejectMemberUser(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      userId?: string;
    }>(request);

  if (!body.userId) {
    return json(
      {
        error:
          "User ID is required",
      },
      400,
    );
  }

  const user =
    await env.DB.prepare(
      `
      SELECT
        users.id,
        users.email,
        roles.name AS role
      FROM users
      JOIN roles
        ON roles.id =
           users.role_id
      WHERE users.id = ?
      LIMIT 1
      `,
    )
      .bind(body.userId)
      .first<{
        id: string;
        email: string;
        role: string;
      }>();

  if (!user) {
    return json(
      {
        error:
          "User not found",
      },
      404,
    );
  }

  if (
    user.role !== "member"
  ) {
    return json(
      {
        error:
          "Only member accounts can be rejected here",
      },
      400,
    );
  }

  const now =
    new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `
      DELETE FROM sessions
      WHERE user_id = ?
      `,
    ).bind(
      user.id,
    ),

    env.DB.prepare(
      `
      UPDATE users
      SET
        status = 'rejected',
        updated_at = ?
      WHERE id = ?
      `,
    ).bind(
      now,
      user.id,
    ),

    env.DB.prepare(
      `
      DELETE FROM members
      WHERE LOWER(email) =
            LOWER(?)
      `,
    ).bind(
      user.email,
    ),

    env.DB.prepare(
      `
      DELETE FROM emails
      WHERE LOWER(email) =
            LOWER(?)
      `,
    ).bind(
      user.email,
    ),
  ]);

  return json({
    ok: true,
  });
}

export async function importMembers(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      members?: MemberInput[];
    }>(request);

  if (
    !Array.isArray(
      body.members,
    ) ||
    body.members.length === 0 ||
    body.members.length > 200
  ) {
    return json(
      {
        error:
          "Invalid member list",
      },
      400,
    );
  }

  const members =
    body.members.map(
      validateMemberInput,
    );

  if (
    members.some(
      (member) =>
        member === null,
    )
  ) {
    return json(
      {
        error:
          "Invalid member in list",
      },
      400,
    );
  }

  const validMembers =
    members.filter(
      (
        member,
      ): member is NonNullable<
        typeof member
      > => member !== null,
    );

  const now =
    new Date().toISOString();

  /*
   * Small batches keep this safe for normal
   * choir-sized imports without creating one
   * enormous D1 batch.
   */
  const CHUNK_SIZE = 40;

  for (
    let offset = 0;
    offset <
    validMembers.length;
    offset += CHUNK_SIZE
  ) {
    const chunk =
      validMembers.slice(
        offset,
        offset +
          CHUNK_SIZE,
      );

    const statements:
      D1PreparedStatement[] =
      [];

    for (
      const member of chunk
    ) {
      statements.push(
        env.DB.prepare(
          `
          INSERT INTO members (
            id,
            firstname,
            lastname,
            email,
            phone,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)

          ON CONFLICT(email)
          DO UPDATE SET
            firstname =
              excluded.firstname,
            lastname =
              excluded.lastname,
            phone =
              excluded.phone,
            updated_at =
              excluded.updated_at
          `,
        ).bind(
          crypto.randomUUID(),
          member.firstname,
          member.lastname,
          member.email,
          member.phone,
          now,
          now,
        ),

        env.DB.prepare(
          `
          INSERT OR IGNORE INTO emails (
            id,
            email,
            created_at
          )
          VALUES (?, ?, ?)
          `,
        ).bind(
          crypto.randomUUID(),
          member.email,
          now,
        ),

        /*
         * If someone registered before the
         * list was imported, approve them.
         */
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
        ).bind(
          now,
          member.email,
        ),
      );
    }

    await env.DB.batch(
      statements,
    );
  }

  return json({
    ok: true,
    count:
      validMembers.length,
  });
}