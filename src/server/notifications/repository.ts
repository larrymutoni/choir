import "server-only";

import { dbRequest } from "@/server/db/client";

export type MemberNotification = {
  id: string;
  message: string;
  href: string;
  created_at: string;
};

export async function createMemberNotification(input: {
  id: string;
  message: string;
  href: string;
  createdByUserId: string;
  recipientUserIds: string[];
  createdAt: string;
}) {
  return dbRequest<{
    ok: true;
  }>("/v1/notifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listUnreadMemberNotifications(
  userId: string,
) {
  const result = await dbRequest<{
    notifications: MemberNotification[];
  }>(
    `/v1/notifications?userId=${encodeURIComponent(userId)}`,
    {
      method: "GET",
    },
  );

  return result.notifications;
}

export async function markMemberNotificationSeen(
  notificationId: string,
  userId: string,
) {
  return dbRequest<{
    ok: true;
  }>("/v1/notifications/seen", {
    method: "PATCH",
    body: JSON.stringify({
      notificationId,
      userId,
    }),
  });
}
