import { hasRolePermission } from "@/lib/permissions";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/session";
import { parsePlanningFile } from "@/server/calendar/import-parser";
import { listCalendarOccurrences } from "@/server/calendar/service";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function canManage(
  session: Parameters<typeof hasRolePermission>[0],
) {
  return hasRolePermission(session, "calendar");
}

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase("fr");
}

function localDateTime(startAt: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(startAt));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  if (!canManage(session)) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Sélectionnez un fichier." },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Le fichier doit faire moins de 10 Mo." },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["xlsx", "csv", "docx"].includes(extension)) {
      return NextResponse.json(
        { message: "Formats acceptés : XLSX, CSV et DOCX." },
        { status: 400 },
      );
    }

    const events = await parsePlanningFile(file);

    if (events.length === 0) {
      return NextResponse.json(
        {
          message:
            "Aucune date exploitable n'a été détectée dans ce fichier.",
        },
        { status: 422 },
      );
    }

    const dates = events
      .map((event) => event.date)
      .filter(Boolean)
      .sort();

    const existingByKey = new Map<
      string,
      Awaited<ReturnType<typeof listCalendarOccurrences>>[number]
    >();

    if (dates.length > 0) {
      const start = new Date(`${dates[0]}T00:00:00.000Z`);
      start.setUTCDate(start.getUTCDate() - 1);

      const end = new Date(
        `${dates[dates.length - 1]}T00:00:00.000Z`,
      );
      end.setUTCDate(end.getUTCDate() + 2);

      const existing = await listCalendarOccurrences(
        start.toISOString(),
        end.toISOString(),
      );

      for (const event of existing) {
        const local = localDateTime(event.startAt);

        const key = [
          normalizeTitle(event.title),
          local.date,
          local.time,
        ].join("|");

        if (!existingByKey.has(key)) {
          existingByKey.set(key, event);
        }
      }
    }

    const seenInFile = new Set<string>();

    const checkedEvents = events.map((event) => {
      if (!event.startTime) {
        return {
          ...event,
          duplicate: false,
          duplicateSource: null,
          existingEvent: null,
        };
      }

      const key = [
        normalizeTitle(event.title),
        event.date,
        event.startTime,
      ].join("|");

      const existingEvent = existingByKey.get(key);
      const duplicateInFile = seenInFile.has(key);

      seenInFile.add(key);

      return {
        ...event,
        duplicate: Boolean(existingEvent) || duplicateInFile,
        duplicateSource: existingEvent
          ? "calendar"
          : duplicateInFile
            ? "file"
            : null,
        existingEvent: existingEvent
          ? {
              id: existingEvent.id,
              title: existingEvent.title,
              startAt: existingEvent.startAt,
              endAt: existingEvent.endAt,
              location: existingEvent.location,
              notes: existingEvent.notes,
            }
          : null,
      };
    });

    return NextResponse.json({
      fileName: file.name,
      events: checkedEvents,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'analyser le fichier.",
      },
      { status: 400 },
    );
  }
}
