import { dbRequest } from "@/server/db/client";

export type EventKind = "single" | "series";

export type RecurrenceType = "weekly" | "biweekly";

export type CalendarStoredEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  seriesId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  eventKind: EventKind;
  recurrenceType: RecurrenceType | null;
  recurrenceUntil: string | null;
};

type CalendarStoredEventRow = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  all_day: number;
  location: string | null;
  notes: string | null;
  series_id: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  event_kind: EventKind;
  recurrence_type: RecurrenceType | null;
  recurrence_until: string | null;
};

export type CalendarException = {
  id: string;
  seriesId: string;
  originalStartAt: string;
  cancelled: boolean;
  overridesJson: string | null;
};

type CalendarExceptionRow = {
  id: string;
  series_id: string;
  original_start_at: string;
  cancelled: number;
  overrides_json: string | null;
};

export type CalendarEventInput = {
  title: string;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  location?: string | null;
  notes?: string | null;
  eventKind?: EventKind;
  recurrenceType?: RecurrenceType | null;
  recurrenceUntil?: string | null;
};

export type ImportedCalendarEventInput = {
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  createdByUserId: string;
};

function mapEvent(row: CalendarStoredEventRow): CalendarStoredEvent {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: Boolean(row.all_day),
    location: row.location,
    notes: row.notes,
    seriesId: row.series_id,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    eventKind: row.event_kind,
    recurrenceType: row.recurrence_type,
    recurrenceUntil: row.recurrence_until,
  };
}

function mapException(row: CalendarExceptionRow): CalendarException {
  return {
    id: row.id,
    seriesId: row.series_id,
    originalStartAt: row.original_start_at,
    cancelled: Boolean(row.cancelled),
    overridesJson: row.overrides_json,
  };
}

export async function fetchCalendarData(start: string, end: string) {
  const params = new URLSearchParams({
    start,
    end,
  });

  const result = await dbRequest<{
    events: CalendarStoredEventRow[];
    series: CalendarStoredEventRow[];
    exceptions: CalendarExceptionRow[];
  }>(`/v1/calendar-events?${params.toString()}`);

  return {
    events: result.events.map(mapEvent),

    series: result.series.map(mapEvent),

    exceptions: result.exceptions.map(mapException),
  };
}

export async function getCalendarEventById(id: string) {
  const result = await dbRequest<{
    event: CalendarStoredEventRow;
  }>("/v1/calendar-events/by-id", {
    method: "POST",
    body: JSON.stringify({ id }),
  });

  return mapEvent(result.event);
}

export async function createCalendarEvent(
  input: CalendarEventInput & {
    createdByUserId: string;
  },
) {
  return dbRequest<{
    ok: true;
    id: string;
  }>("/v1/calendar-events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createImportedCalendarEvents(
  events: ImportedCalendarEventInput[],
) {
  return dbRequest<{
    ok: true;
    count: number;
    ids: string[];
  }>("/v1/calendar-events/import", {
    method: "POST",

    body: JSON.stringify({
      events,
    }),
  });
}

export async function updateCalendarEvent(
  id: string,
  input: CalendarEventInput,
  clearExceptions = false,
) {
  return dbRequest<{ ok: true }>("/v1/calendar-events", {
    method: "PATCH",

    body: JSON.stringify({
      id,
      ...input,
      clearExceptions,
    }),
  });
}

export async function upsertCalendarException(input: {
  seriesId: string;
  originalStartAt: string;
  cancelled: boolean;

  overrides?: Record<string, unknown> | null;
}) {
  return dbRequest<{ ok: true }>("/v1/calendar-exceptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function truncateCalendarSeries(input: {
  id: string;
  recurrenceUntil: string;
  cutoffOriginalStartAt: string;
}) {
  return dbRequest<{ ok: true }>("/v1/calendar-events/truncate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function splitCalendarSeries(input: {
  oldSeriesId: string;
  cutoffOriginalStartAt: string;
  previousUntil: string;

  newEvent: CalendarEventInput & {
    createdByUserId: string;
    recurrenceType: RecurrenceType;
  };
}) {
  return dbRequest<{
    ok: true;
    id: string;
  }>("/v1/calendar-events/split", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteCalendarEvent(id: string) {
  return dbRequest<{ ok: true }>("/v1/calendar-events", {
    method: "DELETE",

    body: JSON.stringify({
      id,
    }),
  });
}
