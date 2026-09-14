import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";
import {
  listUnreadMemberNotifications,
  markMemberNotificationSeen,
} from "@/server/notifications/repository";

const seenSchema = z.object({
  notificationId: z.string().min(1),
});

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message: "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const notifications =
      await listUnreadMemberNotifications(
        session.user_id,
      );

    return NextResponse.json(
      {
        notifications,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Notifications:", error);

    return NextResponse.json(
      {
        message: "Impossible de charger les notifications.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message: "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  const body: unknown =
    await request.json().catch(() => null);

  const parsed = seenSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Notification invalide.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await markMemberNotificationSeen(
      parsed.data.notificationId,
      session.user_id,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Notification seen:", error);

    return NextResponse.json(
      {
        message: "Impossible de mettre à jour la notification.",
      },
      {
        status: 500,
      },
    );
  }
}
