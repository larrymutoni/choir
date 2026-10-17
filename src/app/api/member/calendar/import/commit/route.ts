import {
  hasRolePermission,
} from "@/lib/permissions";
import {
  NextResponse,
} from "next/server";
import { z } from "zod";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  createImportedCalendarEvents,
} from "@/server/calendar/repository";

import {
  updateCalendarItem,
} from "@/server/calendar/service";

const replaceSchema =
  z.object({
    id:
      z.string().min(1),

    seriesId:
      z.string()
        .min(1)
        .nullable(),

    originalStartAt:
      z.string()
        .min(1)
        .nullable(),

    isRecurring:
      z.boolean(),
  });

const eventSchema =
  z.object({
    title:
      z.string()
        .trim()
        .min(1)
        .max(120),

    startAt:
      z.string().min(1),

    endAt:
      z.string()
        .min(1)
        .nullable(),

    allDay:
      z.boolean(),

    location:
      z.string()
        .trim()
        .max(200)
        .nullable(),

    notes:
      z.string()
        .trim()
        .max(5000)
        .nullable(),

    replaceExisting:
      replaceSchema
        .nullable()
        .optional(),
  });

const importSchema =
  z.object({
    events:
      z.array(
        eventSchema,
      )
        .min(1)
        .max(200),

    clearBeforeImport:
      z.boolean()
        .default(false),
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

export async function POST(
  request: Request,
) {
  const session =
    await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message:
          "Authentication required.",
      },
      { status: 401 },
    );
  }

  if (!canManage(session)) {
    return NextResponse.json(
      {
        message:
          "Forbidden.",
      },
      { status: 403 },
    );
  }

  const body =
    await request
      .json()
      .catch(() => null);

  const parsed =
    importSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Certaines lignes du planning sont invalides.",
      },
      { status: 400 },
    );
  }

  if (
    parsed.data.clearBeforeImport &&
    session.role !== "admin" &&
    session.role !== "super_admin"
  ) {
    return NextResponse.json(
      {
        message:
          "Le nettoyage complet est réservé aux administrateurs.",
      },
      {
        status: 403,
      },
    );
  }

  for (
    const event of
      parsed.data.events
  ) {
    const start =
      Date.parse(
        event.startAt,
      );

    if (
      Number.isNaN(start)
    ) {
      return NextResponse.json(
        {
          message:
            "Une date de début est invalide.",
        },
        { status: 400 },
      );
    }

    if (event.endAt) {
      const end =
        Date.parse(
          event.endAt,
        );

      if (
        Number.isNaN(end) ||
        end <= start
      ) {
        return NextResponse.json(
          {
            message:
              "Une heure de fin est invalide.",
          },
          { status: 400 },
        );
      }
    }
  }

  try {
    /*
     * Mode demandé par le client :
     * vider complètement puis importer.
     */
    if (
      parsed.data
        .clearBeforeImport
    ) {
      const result =
        await createImportedCalendarEvents(
          parsed.data.events.map(
            (event) => ({
              title:
                event.title,
              startAt:
                event.startAt,
              endAt:
                event.endAt,
              allDay:
                event.allDay,
              location:
                event.location,
              notes:
                event.notes,
              createdByUserId:
                session.user_id,
            }),
          ),
          true,
        );

      return NextResponse.json(
        result,
        { status: 201 },
      );
    }

    const replacements =
      parsed.data.events.filter(
        (event) =>
          Boolean(
            event.replaceExisting,
          ),
      );

    const additions =
      parsed.data.events.filter(
        (event) =>
          !event.replaceExisting,
      );

    let addedCount = 0;
    let skipped = 0;

    if (
      additions.length > 0
    ) {
      const result =
        await createImportedCalendarEvents(
          additions.map(
            (event) => ({
              title:
                event.title,
              startAt:
                event.startAt,
              endAt:
                event.endAt,
              allDay:
                event.allDay,
              location:
                event.location,
              notes:
                event.notes,
              createdByUserId:
                session.user_id,
            }),
          ),
        );

      addedCount =
        result.count ?? 0;

      skipped =
        result.skipped ?? 0;
    }

    for (
      const event of
        replacements
    ) {
      const existing =
        event.replaceExisting!;

      const input = {
        title:
          event.title,
        startAt:
          event.startAt,
        endAt:
          event.endAt,
        allDay:
          event.allDay,
        location:
          event.location,
        notes:
          event.notes,
      };

      if (
        existing.isRecurring &&
        existing.seriesId &&
        existing.originalStartAt
      ) {
        await updateCalendarItem(
          {
            ...input,
            seriesId:
              existing.seriesId,
            originalStartAt:
              existing.originalStartAt,
            scope: "single",
          },
          session.user_id,
        );
      } else {
        await updateCalendarItem(
          {
            ...input,
            id:
              existing.id,
          },
          session.user_id,
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        count:
          addedCount +
          replacements.length,
        skipped,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Impossible d'importer le planning.",
      },
      { status: 500 },
    );
  }
}
