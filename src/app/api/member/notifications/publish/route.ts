import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";
import { notifyMembersOfUpdate } from "@/server/notifications/service";

export const runtime = "nodejs";

const schema = z.object({
  area: z.enum(["calendar", "resources"]),
  sendEmail: z.boolean().optional().default(false),
});

const updates = {
  calendar: {
    message: "Le calendrier a été mis à jour. Veuillez le consulter.",
    href: "/membre/calendrier",
  },

  resources: {
    message: "Le répertoire a été mis à jour. Veuillez le consulter.",
    href: "/membre/ressources",
  },
} as const;

function canManage(role: string) {
  return role === "admin" || role === "super_admin";
}

export async function POST(request: Request) {
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

  if (!canManage(session.role)) {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const body: unknown = await request.json().catch(() => null);

  const parsed = schema.safeParse(body);

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

  const update = updates[parsed.data.area];

  try {
    const result = await notifyMembersOfUpdate({
      message: update.message,
      href: update.href,
      createdByUserId: session.user_id,
      appUrl: new URL(request.url).origin,
      sendEmail: parsed.data.sendEmail,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Publish member update:", error);

    return NextResponse.json(
      {
        message:
          "La mise à jour a été enregistrée, mais la notification n'a pas pu être créée.",
      },
      {
        status: 500,
      },
    );
  }
}
