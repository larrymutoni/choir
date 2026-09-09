import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";

import {
  createCalendarItem,
  deleteCalendarItem,
  listCalendarOccurrences,
  updateCalendarItem,
} from "@/server/calendar/service";

const eventSchema = z.object({
  title: z.string().trim().min(1).max(120),

  startAt: z.string().min(1),

  endAt: z.string().min(1).nullable(),

  allDay: z.boolean(),

  location: z.string().trim().max(200).nullable(),

  notes: z.string().trim().max(5000).nullable(),
});

const scopeSchema = z.enum(["single", "following", "series"]);

function canManage(role: string) {
  return role === "admin" || role === "super_admin";
}

function errorResponse(error: unknown) {
  return NextResponse.json(
    {
      message:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    },
    {
      status: 400,
    },
  );
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);

  const start = url.searchParams.get("start");

  const end = url.searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      {
        message: "Missing date range.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const events = await listCalendarOccurrences(start, end);

    return NextResponse.json({
      events,
    });
  } catch (error) {
    return errorResponse(error);
  }
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

  const body = await request.json().catch(() => null);

  const schema = eventSchema.extend({
    recurrence: z
      .object({
        type: z.enum(["weekly", "biweekly"]),

        until: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
  });

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Données invalides.",
      },
      {
        status: 400,
      },
    );
  }

  const { recurrence, ...event } = parsed.data;

  try {
    const result = await createCalendarItem(
      event,
      session.user_id,
      recurrence ?? null,
    );

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
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

  const body = await request.json().catch(() => null);

  const schema = eventSchema.extend({
    id: z.string().min(1).optional(),

    seriesId: z.string().min(1).nullable().optional(),

    originalStartAt: z.string().min(1).nullable().optional(),

    scope: scopeSchema.optional(),
  });

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Données invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await updateCalendarItem(parsed.data, session.user_id);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
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

  const body = await request.json().catch(() => null);

  const parsed = z
    .object({
      id: z.string().min(1).optional(),

      seriesId: z.string().min(1).nullable().optional(),

      originalStartAt: z.string().min(1).nullable().optional(),

      scope: scopeSchema.optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Données invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await deleteCalendarItem(parsed.data);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
