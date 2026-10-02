import {
  type Env,
  json,
  readJson,
} from "./http";

type ChallengePurpose =
  | "login"
  | "enable"
  | "disable";

type ChallengeRow = {
  id: string;
  user_id: string;
  purpose: ChallengePurpose;
  code_hash: string;
  expires_at: string;
  used_at: string | null;
  attempts: number;
  created_at: string;
  email: string;
  firstname: string;
  status: string;
  two_factor_enabled: number;
};

function validPurpose(
  value: unknown,
): value is ChallengePurpose {
  return (
    value === "login" ||
    value === "enable" ||
    value === "disable"
  );
}

export async function getSecurityState(
  request: Request,
  env: Env,
) {
  const url = new URL(request.url);
  const userId =
    url.searchParams.get("userId");

  if (!userId) {
    return json(
      {
        error: "User ID is required",
      },
      400,
    );
  }

  const user =
    await env.DB.prepare(
      `
      SELECT
        id,
        two_factor_enabled
      FROM users
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
      `,
    )
      .bind(userId)
      .first<{
        id: string;
        two_factor_enabled: number;
      }>();

  if (!user) {
    return json(
      {
        error: "User not found",
      },
      404,
    );
  }

  const now =
    new Date().toISOString();

  await env.DB.prepare(
    `
    DELETE FROM trusted_devices
    WHERE user_id = ?
      AND expires_at <= ?
    `,
  )
    .bind(userId, now)
    .run();

  const devices =
    await env.DB.prepare(
      `
      SELECT
        id,
        device_label,
        expires_at,
        last_used_at,
        created_at
      FROM trusted_devices
      WHERE user_id = ?
        AND expires_at > ?
      ORDER BY last_used_at DESC
      `,
    )
      .bind(userId, now)
      .all<{
        id: string;
        device_label: string;
        expires_at: string;
        last_used_at: string;
        created_at: string;
      }>();

  return json({
    twoFactorEnabled:
      Boolean(
        user.two_factor_enabled,
      ),
    trustedDevices:
      devices.results,
  });
}

export async function createTwoFactorChallenge(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
      userId?: string;
      purpose?: string;
      codeHash?: string;
      expiresAt?: string;
    }>(request);

  if (
    !body.id ||
    !body.userId ||
    !validPurpose(body.purpose) ||
    !body.codeHash ||
    !body.expiresAt
  ) {
    return json(
      {
        error:
          "Invalid two-factor challenge data",
      },
      400,
    );
  }

  const user =
    await env.DB.prepare(
      `
      SELECT
        id,
        two_factor_enabled
      FROM users
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
      `,
    )
      .bind(body.userId)
      .first<{
        id: string;
        two_factor_enabled: number;
      }>();

  if (!user) {
    return json(
      {
        error: "User not found",
      },
      404,
    );
  }

  if (
    body.purpose === "login" &&
    !user.two_factor_enabled
  ) {
    return json(
      {
        error:
          "Two-factor authentication is not enabled",
      },
      409,
    );
  }

  if (
    body.purpose === "enable" &&
    user.two_factor_enabled
  ) {
    return json(
      {
        error:
          "Two-factor authentication is already enabled",
      },
      409,
    );
  }

  if (
    body.purpose === "disable" &&
    !user.two_factor_enabled
  ) {
    return json(
      {
        error:
          "Two-factor authentication is already disabled",
      },
      409,
    );
  }

  const now =
    new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `
      UPDATE two_factor_challenges
      SET used_at = ?
      WHERE user_id = ?
        AND purpose = ?
        AND used_at IS NULL
      `,
    ).bind(
      now,
      body.userId,
      body.purpose,
    ),

    env.DB.prepare(
      `
      INSERT INTO two_factor_challenges (
        id,
        user_id,
        purpose,
        code_hash,
        expires_at,
        used_at,
        attempts,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, NULL, 0, ?)
      `,
    ).bind(
      body.id,
      body.userId,
      body.purpose,
      body.codeHash,
      body.expiresAt,
      now,
    ),
  ]);

  return json(
    {
      ok: true,
    },
    201,
  );
}

export async function getTwoFactorChallenge(
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
          "Challenge ID is required",
      },
      400,
    );
  }

  const challenge =
    await env.DB.prepare(
      `
      SELECT
        two_factor_challenges.id,
        two_factor_challenges.user_id,
        two_factor_challenges.purpose,
        two_factor_challenges.code_hash,
        two_factor_challenges.expires_at,
        two_factor_challenges.used_at,
        two_factor_challenges.attempts,
        two_factor_challenges.created_at,
        users.email,
        users.firstname,
        users.status,
        users.two_factor_enabled
      FROM two_factor_challenges
      JOIN users
        ON users.id =
           two_factor_challenges.user_id
      WHERE two_factor_challenges.id = ?
      LIMIT 1
      `,
    )
      .bind(body.id)
      .first<ChallengeRow>();

  return json({
    challenge:
      challenge ?? null,
  });
}

export async function failTwoFactorChallenge(
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
          "Challenge ID is required",
      },
      400,
    );
  }

  await env.DB.prepare(
    `
    UPDATE two_factor_challenges
    SET attempts = attempts + 1
    WHERE id = ?
      AND used_at IS NULL
      AND expires_at > ?
      AND attempts < 5
    `,
  )
    .bind(
      body.id,
      new Date().toISOString(),
    )
    .run();

  return json({
    ok: true,
  });
}

export async function consumeTwoFactorChallenge(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
      userId?: string;
      purpose?: string;
    }>(request);

  if (
    !body.id ||
    !body.userId ||
    !validPurpose(body.purpose)
  ) {
    return json(
      {
        error:
          "Invalid challenge consumption data",
      },
      400,
    );
  }

  const result =
    await env.DB.prepare(
      `
      UPDATE two_factor_challenges
      SET used_at = ?
      WHERE id = ?
        AND user_id = ?
        AND purpose = ?
        AND used_at IS NULL
        AND expires_at > ?
        AND attempts < 5
      `,
    )
      .bind(
        new Date().toISOString(),
        body.id,
        body.userId,
        body.purpose,
        new Date().toISOString(),
      )
      .run();

  return json({
    ok:
      result.meta.changes === 1,
  });
}

export async function updateTwoFactorState(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      userId?: string;
      enabled?: boolean;
    }>(request);

  if (
    !body.userId ||
    typeof body.enabled !==
      "boolean"
  ) {
    return json(
      {
        error:
          "Invalid two-factor state data",
      },
      400,
    );
  }

  const now =
    new Date().toISOString();

  const result =
    await env.DB.prepare(
      `
      UPDATE users
      SET
        two_factor_enabled = ?,
        updated_at = ?
      WHERE id = ?
        AND status = 'active'
      `,
    )
      .bind(
        body.enabled ? 1 : 0,
        now,
        body.userId,
      )
      .run();

  if (
    result.meta.changes === 0
  ) {
    return json(
      {
        error: "User not found",
      },
      404,
    );
  }

  await env.DB.prepare(
    `
    UPDATE two_factor_challenges
    SET used_at = COALESCE(used_at, ?)
    WHERE user_id = ?
    `,
  )
    .bind(
      now,
      body.userId,
    )
    .run();

  if (!body.enabled) {
    await env.DB.prepare(
      `
      DELETE FROM trusted_devices
      WHERE user_id = ?
      `,
    )
      .bind(body.userId)
      .run();
  }

  return json({
    ok: true,
  });
}

export async function createTrustedDevice(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
      userId?: string;
      tokenHash?: string;
      deviceLabel?: string;
      expiresAt?: string;
    }>(request);

  if (
    !body.id ||
    !body.userId ||
    !body.tokenHash ||
    !body.deviceLabel ||
    !body.expiresAt
  ) {
    return json(
      {
        error:
          "Invalid trusted device data",
      },
      400,
    );
  }

  const user =
    await env.DB.prepare(
      `
      SELECT id
      FROM users
      WHERE id = ?
        AND status = 'active'
        AND two_factor_enabled = 1
      LIMIT 1
      `,
    )
      .bind(body.userId)
      .first();

  if (!user) {
    return json(
      {
        error:
          "Two-factor authentication is not enabled",
      },
      409,
    );
  }

  const now =
    new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO trusted_devices (
      id,
      user_id,
      token_hash,
      device_label,
      expires_at,
      last_used_at,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      body.id,
      body.userId,
      body.tokenHash,
      body.deviceLabel,
      body.expiresAt,
      now,
      now,
    )
    .run();

  return json(
    {
      ok: true,
    },
    201,
  );
}

export async function findTrustedDevice(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      userId?: string;
      tokenHash?: string;
    }>(request);

  if (
    !body.userId ||
    !body.tokenHash
  ) {
    return json(
      {
        error:
          "Trusted device data is required",
      },
      400,
    );
  }

  const now =
    new Date().toISOString();

  const device =
    await env.DB.prepare(
      `
      SELECT
        trusted_devices.id,
        trusted_devices.device_label,
        trusted_devices.expires_at,
        trusted_devices.last_used_at,
        trusted_devices.created_at
      FROM trusted_devices
      JOIN users
        ON users.id =
           trusted_devices.user_id
      WHERE trusted_devices.user_id = ?
        AND trusted_devices.token_hash = ?
        AND trusted_devices.expires_at > ?
        AND users.status = 'active'
        AND users.two_factor_enabled = 1
      LIMIT 1
      `,
    )
      .bind(
        body.userId,
        body.tokenHash,
        now,
      )
      .first<{
        id: string;
        device_label: string;
        expires_at: string;
        last_used_at: string;
        created_at: string;
      }>();

  if (device) {
    await env.DB.prepare(
      `
      UPDATE trusted_devices
      SET last_used_at = ?
      WHERE id = ?
      `,
    )
      .bind(
        now,
        device.id,
      )
      .run();
  }

  return json({
    device:
      device ?? null,
  });
}

export async function revokeTrustedDevice(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      userId?: string;
      id?: string;
      all?: boolean;
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

  if (body.all) {
    await env.DB.prepare(
      `
      DELETE FROM trusted_devices
      WHERE user_id = ?
      `,
    )
      .bind(body.userId)
      .run();

    return json({
      ok: true,
    });
  }

  if (!body.id) {
    return json(
      {
        error:
          "Trusted device ID is required",
      },
      400,
    );
  }

  await env.DB.prepare(
    `
    DELETE FROM trusted_devices
    WHERE id = ?
      AND user_id = ?
    `,
  )
    .bind(
      body.id,
      body.userId,
    )
    .run();

  return json({
    ok: true,
  });
}
