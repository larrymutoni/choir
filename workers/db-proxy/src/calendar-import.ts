import { Env, json, readJson } from "./http";

type ImportedEventInput = {
  title: string;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  location?: string | null;
  notes?: string | null;
  createdByUserId: string;
};

function isValidEvent(
  event: ImportedEventInput,
) {
  return Boolean(
    event.title?.trim() &&
      event.startAt &&
      event.createdByUserId,
  );
}

export async function createImportedCalendarEvents(
  request: Request,
  env: Env,
) {
  const body = await readJson<{
    events: ImportedEventInput[];
  }>(request);

  if (
    !Array.isArray(body.events) ||
    body.events.length === 0 ||
    body.events.length > 200 ||
    !body.events.every(isValidEvent)
  ) {
    return json(
      {
        error: "Invalid events",
      },
      400,
    );
  }

  const now = new Date().toISOString();

  const ids = body.events.map(() =>
    crypto.randomUUID(),
  );

  const statements =
    body.events.map(
      (event, index) =>
        env.DB.prepare(
          `
            INSERT INTO calendar_events (
              id,
              title,
              start_at,
              end_at,
              all_day,
              location,
              notes,
              series_id,
              created_by_user_id,
              created_at,
              updated_at,
              event_kind,
              recurrence_type,
              recurrence_until
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?,
              'single', NULL, NULL
            )
          `,
        ).bind(
          ids[index],
          event.title.trim(),
          event.startAt,
          event.endAt ?? null,
          event.allDay ? 1 : 0,
          event.location?.trim() || null,
          event.notes?.trim() || null,
          event.createdByUserId,
          now,
          now,
        ),
    );

  await env.DB.batch(statements);

  return json(
    {
      ok: true,
      count: ids.length,
      ids,
    },
    201,
  );
}