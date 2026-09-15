import { hasRolePermission } from "@/lib/permissions";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";
import { createImportedCalendarEvents } from "@/server/calendar/repository";

const eventSchema = z.object({
  title: z.string().trim().min(1).max(120),

  startAt: z.string().min(1),

  endAt: z.string().min(1).nullable(),

  allDay: z.boolean(),

  location: z.string().trim().max(200).nullable(),

  notes: z.string().trim().max(5000).nullable(),
});

const importSchema = z.object({
  events: z.array(eventSchema).min(1).max(200),
});

function canManage(
  session: Parameters<
    typeof hasRolePermission
  >[0],
) {
  return hasRolePermission(
    session,
    "calendar",
  );
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

  if (!canManage(session)) {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const body = await request.json().catch(() => null);

  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Certaines lignes du planning sont invalides.",
      },
      {
        status: 400,
      },
    );
  }

  for (const event of parsed.data.events) {
    const start = Date.parse(event.startAt);

    if (Number.isNaN(start)) {
      return NextResponse.json(
        {
          message: "Une date du planning est invalide.",
        },
        {
          status: 400,
        },
      );
    }

    if (event.endAt) {
      const end = Date.parse(event.endAt);

      if (Number.isNaN(end) || end <= start) {
        return NextResponse.json(
          {
            message: "Une heure de fin du planning est invalide.",
          },
          {
            status: 400,
          },
        );
      }
    }
  }

  try {
    const result = await createImportedCalendarEvents(
      parsed.data.events.map((event) => ({
        ...event,

        createdByUserId: session.user_id,
      })),
    );

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Impossible d'ajouter le planning au calendrier.",
      },
      {
        status: 500,
      },
    );
  }
}
