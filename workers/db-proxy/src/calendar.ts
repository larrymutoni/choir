import { Env, json, readJson } from "./http";

type EventKind = "single" | "series";
type RecurrenceType = "weekly" | "biweekly";

type CalendarEventInput = {
  id?: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  location?: string | null;
  notes?: string | null;
  eventKind?: EventKind;
  recurrenceType?: RecurrenceType | null;
  recurrenceUntil?: string | null;
  createdByUserId?: string;
  clearExceptions?: boolean;
};

type CalendarExceptionInput = {
  seriesId: string;
  originalStartAt: string;
  cancelled?: boolean;
  overrides?: Record<string, unknown> | null;
};

const EVENT_COLUMNS = `
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
`;

function validEvent(body: CalendarEventInput) {
  if (!body.title?.trim() || !body.startAt || !body.createdByUserId) {
    return false;
  }

  if (body.eventKind === "series" && !body.recurrenceType) {
    return false;
  }

  return true;
}

export async function listCalendarEvents(request: Request, env: Env) {
  const url = new URL(request.url);

  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end) {
    return json({ error: "Missing date range" }, 400);
  }

  const singles = await env.DB.prepare(
    `
      SELECT ${EVENT_COLUMNS}
      FROM calendar_events
      WHERE event_kind = 'single'
        AND start_at < ?
        AND COALESCE(end_at, start_at) >= ?
      ORDER BY start_at ASC
    `,
  )
    .bind(end, start)
    .all();

  const series = await env.DB.prepare(
    `
      SELECT ${EVENT_COLUMNS}
      FROM calendar_events
      WHERE event_kind = 'series'
        AND start_at < ?
      ORDER BY start_at ASC
    `,
  )
    .bind(end)
    .all();

  const exceptions = await env.DB.prepare(
    `
      SELECT
        e.id,
        e.series_id,
        e.original_start_at,
        e.cancelled,
        e.overrides_json,
        e.created_at,
        e.updated_at
      FROM calendar_event_exceptions e
      INNER JOIN calendar_events s
        ON s.id = e.series_id
      WHERE s.event_kind = 'series'
        AND s.start_at < ?
      ORDER BY e.original_start_at ASC
    `,
  )
    .bind(end)
    .all();

  return json({
    events: singles.results ?? [],
    series: series.results ?? [],
    exceptions: exceptions.results ?? [],
  });
}

export async function getCalendarEvent(request: Request, env: Env) {
  const body = await readJson<{
    id: string;
  }>(request);

  if (!body.id) {
    return json({ error: "Missing event id" }, 400);
  }

  const event = await env.DB.prepare(
    `
      SELECT ${EVENT_COLUMNS}
      FROM calendar_events
      WHERE id = ?
      LIMIT 1
    `,
  )
    .bind(body.id)
    .first();

  if (!event) {
    return json({ error: "Event not found" }, 404);
  }

  return json({ event });
}

export async function createCalendarEvent(request: Request, env: Env) {
  const body = await readJson<CalendarEventInput>(request);

  if (!validEvent(body)) {
    return json({ error: "Invalid event" }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const eventKind = body.eventKind ?? "single";

  const seriesId = eventKind === "series" ? id : null;

  await env.DB.prepare(
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      id,
      body.title.trim(),
      body.startAt,
      body.endAt ?? null,
      body.allDay ? 1 : 0,
      body.location?.trim() || null,
      body.notes?.trim() || null,
      seriesId,
      body.createdByUserId,
      now,
      now,
      eventKind,
      eventKind === "series" ? body.recurrenceType : null,
      eventKind === "series" ? (body.recurrenceUntil ?? null) : null,
    )
    .run();

  return json(
    {
      ok: true,
      id,
    },
    201,
  );
}

export async function updateCalendarEvent(request: Request, env: Env) {
  const body = await readJson<CalendarEventInput>(request);

  if (!body.id || !body.title?.trim() || !body.startAt) {
    return json({ error: "Invalid event" }, 400);
  }

  const update = env.DB.prepare(
    `
      UPDATE calendar_events
      SET
        title = ?,
        start_at = ?,
        end_at = ?,
        all_day = ?,
        location = ?,
        notes = ?,
        recurrence_type = ?,
        recurrence_until = ?,
        updated_at = ?
      WHERE id = ?
    `,
  ).bind(
    body.title.trim(),
    body.startAt,
    body.endAt ?? null,
    body.allDay ? 1 : 0,
    body.location?.trim() || null,
    body.notes?.trim() || null,
    body.recurrenceType ?? null,
    body.recurrenceUntil ?? null,
    new Date().toISOString(),
    body.id,
  );

  if (body.clearExceptions) {
    const results = await env.DB.batch([
      update,
      env.DB.prepare(
        `
          DELETE FROM calendar_event_exceptions
          WHERE series_id = ?
        `,
      ).bind(body.id),
    ]);

    if (!results[0]?.meta.changes) {
      return json({ error: "Event not found" }, 404);
    }

    return json({ ok: true });
  }

  const result = await update.run();

  if (!result.meta.changes) {
    return json({ error: "Event not found" }, 404);
  }

  return json({ ok: true });
}

export async function upsertCalendarException(request: Request, env: Env) {
  const body = await readJson<CalendarExceptionInput>(request);

  if (!body.seriesId || !body.originalStartAt) {
    return json({ error: "Invalid exception" }, 400);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `
      INSERT INTO calendar_event_exceptions (
        id,
        series_id,
        original_start_at,
        cancelled,
        overrides_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(series_id, original_start_at)
      DO UPDATE SET
        cancelled = excluded.cancelled,
        overrides_json = excluded.overrides_json,
        updated_at = excluded.updated_at
    `,
  )
    .bind(
      id,
      body.seriesId,
      body.originalStartAt,
      body.cancelled ? 1 : 0,
      JSON.stringify(body.overrides ?? {}),
      now,
      now,
    )
    .run();

  return json({ ok: true });
}

export async function truncateCalendarSeries(request: Request, env: Env) {
  const body = await readJson<{
    id: string;
    recurrenceUntil: string;
    cutoffOriginalStartAt: string;
  }>(request);

  if (!body.id || !body.recurrenceUntil || !body.cutoffOriginalStartAt) {
    return json({ error: "Invalid request" }, 400);
  }

  const now = new Date().toISOString();

  const results = await env.DB.batch([
    env.DB.prepare(
      `
        UPDATE calendar_events
        SET
          recurrence_until = ?,
          updated_at = ?
        WHERE id = ?
          AND event_kind = 'series'
      `,
    ).bind(body.recurrenceUntil, now, body.id),

    env.DB.prepare(
      `
        DELETE FROM calendar_event_exceptions
        WHERE series_id = ?
          AND original_start_at >= ?
      `,
    ).bind(body.id, body.cutoffOriginalStartAt),
  ]);

  if (!results[0]?.meta.changes) {
    return json({ error: "Series not found" }, 404);
  }

  return json({ ok: true });
}

export async function splitCalendarSeries(request: Request, env: Env) {
  const body = await readJson<{
    oldSeriesId: string;
    cutoffOriginalStartAt: string;
    previousUntil: string;
    newEvent: CalendarEventInput;
  }>(request);

  const newEvent = body.newEvent;

  if (
    !body.oldSeriesId ||
    !body.cutoffOriginalStartAt ||
    !body.previousUntil ||
    !newEvent ||
    !validEvent({
      ...newEvent,
      eventKind: "series",
    }) ||
    !newEvent.recurrenceType
  ) {
    return json({ error: "Invalid split" }, 400);
  }

  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const results = await env.DB.batch([
    env.DB.prepare(
      `
        UPDATE calendar_events
        SET
          recurrence_until = ?,
          updated_at = ?
        WHERE id = ?
          AND event_kind = 'series'
      `,
    ).bind(body.previousUntil, now, body.oldSeriesId),

    env.DB.prepare(
      `
        DELETE FROM calendar_event_exceptions
        WHERE series_id = ?
          AND original_start_at >= ?
      `,
    ).bind(body.oldSeriesId, body.cutoffOriginalStartAt),

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'series', ?, ?)
      `,
    ).bind(
      newId,
      newEvent.title.trim(),
      newEvent.startAt,
      newEvent.endAt ?? null,
      newEvent.allDay ? 1 : 0,
      newEvent.location?.trim() || null,
      newEvent.notes?.trim() || null,
      newId,
      newEvent.createdByUserId,
      now,
      now,
      newEvent.recurrenceType,
      newEvent.recurrenceUntil ?? null,
    ),
  ]);

  if (!results[0]?.meta.changes) {
    return json({ error: "Series not found" }, 404);
  }

  return json({
    ok: true,
    id: newId,
  });
}

export async function deleteCalendarEvent(request: Request, env: Env) {
  const body = await readJson<{
    id: string;
  }>(request);

  if (!body.id) {
    return json({ error: "Missing event id" }, 400);
  }

  const results = await env.DB.batch([
    env.DB.prepare(
      `
        DELETE FROM calendar_event_exceptions
        WHERE series_id = ?
      `,
    ).bind(body.id),

    env.DB.prepare(
      `
        DELETE FROM calendar_events
        WHERE id = ?
      `,
    ).bind(body.id),
  ]);

  if (!results[1]?.meta.changes) {
    return json({ error: "Event not found" }, 404);
  }

  return json({ ok: true });
}
