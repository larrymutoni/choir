import { Env, json, readJson } from "./http";

export async function createNotification(
  request: Request,
  env: Env,
) {
  const body = await readJson<{
    id?: string;
    message?: string;
    href?: string;
    createdByUserId?: string;
    recipientUserIds?: string[];
    createdAt?: string;
  }>(request);

  const message = body.message?.trim();
  const href = body.href?.trim();

  const recipientUserIds = [
    ...new Set(body.recipientUserIds ?? []),
  ].filter(
    (id) =>
      typeof id === "string" &&
      id.trim().length > 0,
  );

  if (
    !body.id ||
    !message ||
    !href ||
    !href.startsWith("/") ||
    !body.createdByUserId ||
    recipientUserIds.length === 0
  ) {
    return json(
      {
        error: "Invalid notification data",
      },
      400,
    );
  }

  const createdAt =
    body.createdAt ?? new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `
        INSERT INTO notifications (
          id,
          message,
          href,
          created_by_user_id,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `,
    ).bind(
      body.id,
      message,
      href,
      body.createdByUserId,
      createdAt,
    ),

    ...recipientUserIds.map((userId) =>
      env.DB.prepare(
        `
          INSERT INTO notification_recipients (
            notification_id,
            user_id,
            seen_at
          )
          VALUES (?, ?, NULL)
        `,
      ).bind(body.id, userId),
    ),
  ]);

  return json(
    {
      ok: true,
    },
    201,
  );
}

export async function listUnreadNotifications(
  request: Request,
  env: Env,
) {
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

  const result = await env.DB.prepare(
    `
      SELECT
        notifications.id,
        notifications.message,
        notifications.href,
        notifications.created_at
      FROM notification_recipients
      JOIN notifications
        ON notifications.id =
           notification_recipients.notification_id
      WHERE notification_recipients.user_id = ?
        AND notification_recipients.seen_at IS NULL
      ORDER BY notifications.created_at DESC
      LIMIT 20
    `,
  )
    .bind(userId)
    .all();

  return json({
    notifications: result.results,
  });
}

export async function markNotificationSeen(
  request: Request,
  env: Env,
) {
  const body = await readJson<{
    notificationId?: string;
    userId?: string;
  }>(request);

  if (!body.notificationId || !body.userId) {
    return json(
      {
        error: "Notification ID and user ID are required",
      },
      400,
    );
  }

  const result = await env.DB.prepare(
    `
      UPDATE notification_recipients
      SET seen_at = ?
      WHERE notification_id = ?
        AND user_id = ?
        AND seen_at IS NULL
    `,
  )
    .bind(
      new Date().toISOString(),
      body.notificationId,
      body.userId,
    )
    .run();

  if (result.meta.changes === 0) {
    return json({
      ok: true,
    });
  }

  return json({
    ok: true,
  });
}
