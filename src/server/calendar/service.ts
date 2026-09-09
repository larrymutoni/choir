import { Temporal } from "temporal-polyfill";

import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarData,
  getCalendarEventById,
  splitCalendarSeries,
  truncateCalendarSeries,
  updateCalendarEvent,
  upsertCalendarException,
  type CalendarException,
  type CalendarStoredEvent,
  type RecurrenceType,
} from "@/server/calendar/repository";

const TIME_ZONE = "Europe/Paris";

export type CalendarScope = "single" | "following" | "series";

export type CalendarMutationInput = {
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  notes: string | null;
};

export type CalendarOccurrence = CalendarMutationInput & {
  id: string;
  seriesId: string | null;
  originalStartAt: string | null;
  isRecurring: boolean;
  isException: boolean;
};

type EventOverrides = Partial<CalendarMutationInput>;

function canonicalInstant(value: string) {
  const milliseconds = Date.parse(value);

  if (Number.isNaN(milliseconds)) {
    throw new Error("Date invalide.");
  }

  return new Date(milliseconds).toISOString();
}

function canonicalNullableInstant(value: string | null) {
  return value ? canonicalInstant(value) : null;
}

function normaliseInput(input: CalendarMutationInput): CalendarMutationInput {
  return {
    title: input.title.trim(),
    startAt: canonicalInstant(input.startAt),
    endAt: canonicalNullableInstant(input.endAt),
    allDay: input.allDay,
    location: input.location?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

function sameInstant(a: string, b: string) {
  return Date.parse(a) === Date.parse(b);
}

function sameNullableInstant(a: string | null, b: string | null) {
  if (!a && !b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return sameInstant(a, b);
}

function intervalWeeks(type: RecurrenceType) {
  return type === "biweekly" ? 2 : 1;
}

function durationMilliseconds(startAt: string, endAt: string | null) {
  if (!endAt) {
    return null;
  }

  return Date.parse(endAt) - Date.parse(startAt);
}

function occurrenceId(seriesId: string, originalStartAt: string) {
  return `series:${seriesId}:${originalStartAt}`;
}

function buildBaseOccurrence(
  series: CalendarStoredEvent,
  originalStartAt: string,
): CalendarMutationInput {
  const duration = durationMilliseconds(series.startAt, series.endAt);

  const startAt = canonicalInstant(originalStartAt);

  const endAt =
    duration === null
      ? null
      : new Date(Date.parse(startAt) + duration).toISOString();

  return {
    title: series.title,
    startAt,
    endAt,
    allDay: series.allDay,
    location: series.location,
    notes: series.notes,
  };
}

function parseOverrides(exception: CalendarException): EventOverrides {
  if (!exception.overridesJson) {
    return {};
  }

  try {
    return JSON.parse(exception.overridesJson) as EventOverrides;
  } catch {
    return {};
  }
}

function applyException(
  base: CalendarMutationInput,
  exception: CalendarException,
) {
  const overrides = parseOverrides(exception);

  return {
    ...base,
    ...overrides,
  };
}

function eventOverlapsRange(
  event: CalendarMutationInput,
  rangeStart: string,
  rangeEnd: string,
) {
  const start = Date.parse(event.startAt);

  const end = event.endAt ? Date.parse(event.endAt) : start;

  return start < Date.parse(rangeEnd) && end >= Date.parse(rangeStart);
}

function differenceOverrides(
  base: CalendarMutationInput,
  changed: CalendarMutationInput,
): EventOverrides {
  const overrides: EventOverrides = {};

  if (base.title !== changed.title) {
    overrides.title = changed.title;
  }

  if (!sameInstant(base.startAt, changed.startAt)) {
    overrides.startAt = changed.startAt;
  }

  if (!sameNullableInstant(base.endAt, changed.endAt)) {
    overrides.endAt = changed.endAt;
  }

  if (base.allDay !== changed.allDay) {
    overrides.allDay = changed.allDay;
  }

  if (base.location !== changed.location) {
    overrides.location = changed.location;
  }

  if (base.notes !== changed.notes) {
    overrides.notes = changed.notes;
  }

  return overrides;
}

function plainDateNumber(date: Temporal.PlainDate) {
  return Date.UTC(date.year, date.month - 1, date.day) / 86_400_000;
}

function previousCalendarDate(originalStartAt: string) {
  return Temporal.Instant.from(originalStartAt)
    .toZonedDateTimeISO(TIME_ZONE)
    .toPlainDate()
    .subtract({
      days: 1,
    })
    .toString();
}

function rebaseWholeSeries(
  series: CalendarStoredEvent,
  originalStartAt: string,
  changed: CalendarMutationInput,
) {
  if (!series.recurrenceType) {
    throw new Error("Série invalide.");
  }

  const masterStart = Temporal.Instant.from(series.startAt).toZonedDateTimeISO(
    TIME_ZONE,
  );

  const targetOriginal =
    Temporal.Instant.from(originalStartAt).toZonedDateTimeISO(TIME_ZONE);

  const days =
    plainDateNumber(targetOriginal.toPlainDate()) -
    plainDateNumber(masterStart.toPlainDate());

  const weeks = intervalWeeks(series.recurrenceType);

  const occurrenceIndex = Math.round(days / (7 * weeks));

  const changedStart = Temporal.Instant.from(
    changed.startAt,
  ).toZonedDateTimeISO(TIME_ZONE);

  const newMasterStart = changedStart.subtract({
    weeks: occurrenceIndex * weeks,
  });

  const startAt = canonicalInstant(newMasterStart.toInstant().toString());

  const changedDuration = durationMilliseconds(changed.startAt, changed.endAt);

  const endAt =
    changedDuration === null
      ? null
      : new Date(Date.parse(startAt) + changedDuration).toISOString();

  return {
    title: changed.title,
    startAt,
    endAt,
    allDay: changed.allDay,
    location: changed.location,
    notes: changed.notes,
  };
}

export async function listCalendarOccurrences(
  rangeStart: string,
  rangeEnd: string,
) {
  const canonicalStart = canonicalInstant(rangeStart);

  const canonicalEnd = canonicalInstant(rangeEnd);

  const data = await fetchCalendarData(canonicalStart, canonicalEnd);

  const occurrences: CalendarOccurrence[] = data.events.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
    location: event.location,
    notes: event.notes,
    seriesId: null,
    originalStartAt: null,
    isRecurring: false,
    isException: false,
  }));

  const exceptionsBySeries = new Map<string, CalendarException[]>();

  for (const exception of data.exceptions) {
    const existing = exceptionsBySeries.get(exception.seriesId) ?? [];

    existing.push(exception);

    exceptionsBySeries.set(exception.seriesId, existing);
  }

  for (const series of data.series) {
    if (!series.recurrenceType) {
      continue;
    }

    const seriesExceptions = exceptionsBySeries.get(series.id) ?? [];

    const exceptionByOriginal = new Map(
      seriesExceptions.map((exception) => [
        canonicalInstant(exception.originalStartAt),
        exception,
      ]),
    );

    const usedExceptions = new Set<string>();

    let current = Temporal.Instant.from(series.startAt).toZonedDateTimeISO(
      TIME_ZONE,
    );

    const until = series.recurrenceUntil
      ? Temporal.PlainDate.from(series.recurrenceUntil)
      : null;

    const weeks = intervalWeeks(series.recurrenceType);

    let guard = 0;

    while (
      Date.parse(canonicalInstant(current.toInstant().toString())) <
        Date.parse(canonicalEnd) &&
      guard < 10_000
    ) {
      guard += 1;

      const currentDate = current.toPlainDate();

      if (until && Temporal.PlainDate.compare(currentDate, until) > 0) {
        break;
      }

      const originalStartAt = canonicalInstant(current.toInstant().toString());

      const base = buildBaseOccurrence(series, originalStartAt);

      const exception = exceptionByOriginal.get(originalStartAt);

      if (exception) {
        usedExceptions.add(exception.id);

        if (!exception.cancelled) {
          const changed = applyException(base, exception);

          if (eventOverlapsRange(changed, canonicalStart, canonicalEnd)) {
            occurrences.push({
              id: occurrenceId(series.id, originalStartAt),
              ...changed,
              seriesId: series.id,
              originalStartAt,
              isRecurring: true,
              isException: true,
            });
          }
        }
      } else if (eventOverlapsRange(base, canonicalStart, canonicalEnd)) {
        occurrences.push({
          id: occurrenceId(series.id, originalStartAt),
          ...base,
          seriesId: series.id,
          originalStartAt,
          isRecurring: true,
          isException: false,
        });
      }

      current = current.add({
        weeks,
      });
    }

    for (const exception of seriesExceptions) {
      if (usedExceptions.has(exception.id) || exception.cancelled) {
        continue;
      }

      const originalStartAt = canonicalInstant(exception.originalStartAt);

      const base = buildBaseOccurrence(series, originalStartAt);

      const changed = applyException(base, exception);

      if (eventOverlapsRange(changed, canonicalStart, canonicalEnd)) {
        occurrences.push({
          id: occurrenceId(series.id, originalStartAt),
          ...changed,
          seriesId: series.id,
          originalStartAt,
          isRecurring: true,
          isException: true,
        });
      }
    }
  }

  occurrences.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

  return occurrences;
}

export async function createCalendarItem(
  input: CalendarMutationInput,
  createdByUserId: string,
  recurrence?: {
    type: RecurrenceType;
    until?: string | null;
  } | null,
) {
  const event = normaliseInput(input);

  if (!recurrence) {
    return createCalendarEvent({
      ...event,
      eventKind: "single",
      recurrenceType: null,
      recurrenceUntil: null,
      createdByUserId,
    });
  }

  if (recurrence.until) {
    const startDate = Temporal.Instant.from(event.startAt)
      .toZonedDateTimeISO(TIME_ZONE)
      .toPlainDate();

    const until = Temporal.PlainDate.from(recurrence.until);

    if (Temporal.PlainDate.compare(until, startDate) < 0) {
      throw new Error(
        "La date de fin de répétition doit être après la première date.",
      );
    }
  }

  return createCalendarEvent({
    ...event,
    eventKind: "series",
    recurrenceType: recurrence.type,
    recurrenceUntil: recurrence.until ?? null,
    createdByUserId,
  });
}

export async function updateCalendarItem(
  input: CalendarMutationInput & {
    id?: string;
    seriesId?: string | null;
    originalStartAt?: string | null;
    scope?: CalendarScope;
  },
  updatedByUserId: string,
) {
  const changed = normaliseInput(input);

  if (!input.seriesId) {
    if (!input.id) {
      throw new Error("Événement invalide.");
    }

    await updateCalendarEvent(input.id, {
      ...changed,
      eventKind: "single",
      recurrenceType: null,
      recurrenceUntil: null,
    });

    return;
  }

  if (!input.originalStartAt || !input.scope) {
    throw new Error("Portée de modification manquante.");
  }

  const series = await getCalendarEventById(input.seriesId);

  if (series.eventKind !== "series" || !series.recurrenceType) {
    throw new Error("Série invalide.");
  }

  const originalStartAt = canonicalInstant(input.originalStartAt);

  if (input.scope === "single") {
    const base = buildBaseOccurrence(series, originalStartAt);

    const overrides = differenceOverrides(base, changed);

    await upsertCalendarException({
      seriesId: series.id,
      originalStartAt,
      cancelled: false,
      overrides,
    });

    return;
  }

  if (input.scope === "following") {
    if (sameInstant(originalStartAt, series.startAt)) {
      await updateCalendarEvent(
        series.id,
        {
          ...changed,
          eventKind: "series",
          recurrenceType: series.recurrenceType,
          recurrenceUntil: series.recurrenceUntil,
        },
        true,
      );

      return;
    }

    await splitCalendarSeries({
      oldSeriesId: series.id,
      cutoffOriginalStartAt: originalStartAt,
      previousUntil: previousCalendarDate(originalStartAt),
      newEvent: {
        ...changed,
        eventKind: "series",
        recurrenceType: series.recurrenceType,
        recurrenceUntil: series.recurrenceUntil,
        createdByUserId: updatedByUserId,
      },
    });

    return;
  }

  const rebased = rebaseWholeSeries(series, originalStartAt, changed);

  const scheduleChanged =
    !sameInstant(rebased.startAt, series.startAt) ||
    !sameNullableInstant(rebased.endAt, series.endAt) ||
    rebased.allDay !== series.allDay;

  await updateCalendarEvent(
    series.id,
    {
      ...rebased,
      eventKind: "series",
      recurrenceType: series.recurrenceType,
      recurrenceUntil: series.recurrenceUntil,
    },
    scheduleChanged,
  );
}

export async function deleteCalendarItem(input: {
  id?: string;
  seriesId?: string | null;
  originalStartAt?: string | null;
  scope?: CalendarScope;
}) {
  if (!input.seriesId) {
    if (!input.id) {
      throw new Error("Événement invalide.");
    }

    await deleteCalendarEvent(input.id);

    return;
  }

  if (!input.originalStartAt || !input.scope) {
    throw new Error("Portée de suppression manquante.");
  }

  const series = await getCalendarEventById(input.seriesId);

  const originalStartAt = canonicalInstant(input.originalStartAt);

  if (input.scope === "single") {
    await upsertCalendarException({
      seriesId: series.id,
      originalStartAt,
      cancelled: true,
      overrides: null,
    });

    return;
  }

  if (input.scope === "series") {
    await deleteCalendarEvent(series.id);

    return;
  }

  if (sameInstant(originalStartAt, series.startAt)) {
    await deleteCalendarEvent(series.id);

    return;
  }

  await truncateCalendarSeries({
    id: series.id,
    recurrenceUntil: previousCalendarDate(originalStartAt),
    cutoffOriginalStartAt: originalStartAt,
  });
}
