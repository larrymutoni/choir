import {
  Env,
  json,
  readJson,
} from "./http";

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

function eventKey(
  event: ImportedEventInput,
) {
  return `${
    event.title
      .trim()
      .toLowerCase()
  }|${event.startAt}`;
}

export async function createImportedCalendarEvents(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      events:
        ImportedEventInput[];

      clearBeforeImport?:
        boolean;
    }>(request);

  if (
    !Array.isArray(
      body.events,
    ) ||
    body.events.length === 0 ||
    body.events.length > 200 ||
    !body.events.every(
      isValidEvent,
    )
  ) {
    return json(
      {
        error:
          "Invalid events",
      },
      400,
    );
  }

  /*
   * Évite uniquement les lignes
   * strictement identiques présentes
   * plusieurs fois dans le fichier.
   */
  const seen =
    new Set<string>();

  const uniqueEvents =
    body.events.filter(
      (event) => {
        const key =
          eventKey(event);

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      },
    );

  const now =
    new Date().toISOString();

  function makeInsert(
    event: ImportedEventInput,
    id: string,
  ) {
    return env.DB.prepare(
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
          ?, ?, ?, ?, ?, ?, ?,
          NULL, ?, ?, ?,
          'single',
          NULL,
          NULL
        )
      `,
    ).bind(
      id,
      event.title.trim(),
      event.startAt,
      event.endAt ?? null,
      event.allDay
        ? 1
        : 0,
      event.location
        ?.trim() ||
        null,
      event.notes
        ?.trim() ||
        null,
      event.createdByUserId,
      now,
      now,
    );
  }

  /*
   * Tout nettoyer avant import.
   */
  if (
    body.clearBeforeImport
  ) {
    const ids =
      uniqueEvents.map(
        () =>
          crypto.randomUUID(),
      );

    const inserts =
      uniqueEvents.map(
        (event, index) =>
          makeInsert(
            event,
            ids[index],
          ),
      );

    await env.DB.batch([
      env.DB.prepare(
        `
          DELETE FROM
            calendar_event_exceptions
        `,
      ),

      env.DB.prepare(
        `
          DELETE FROM
            calendar_events
        `,
      ),

      ...inserts,
    ]);

    return json(
      {
        ok: true,
        count:
          ids.length,

        skipped:
          body.events.length -
          uniqueEvents.length,

        ids,
      },
      201,
    );
  }

  /*
   * Import normal :
   * doublon exact existant
   * = on conserve l'ancien.
   */
  const checks =
    await env.DB.batch(
      uniqueEvents.map(
        (event) =>
          env.DB.prepare(
            `
              SELECT id
              FROM calendar_events
              WHERE
                LOWER(TRIM(title)) =
                LOWER(TRIM(?))
                AND start_at = ?
              LIMIT 1
            `,
          ).bind(
            event.title,
            event.startAt,
          ),
      ),
    );

  const eventsToInsert =
    uniqueEvents.filter(
      (_, index) =>
        (
          checks[index]
            ?.results
            ?.length ?? 0
        ) === 0,
    );

  const skipped =
    body.events.length -
    eventsToInsert.length;

  if (
    eventsToInsert.length ===
    0
  ) {
    return json({
      ok: true,
      count: 0,
      skipped,
      ids: [],
    });
  }

  const ids =
    eventsToInsert.map(
      () =>
        crypto.randomUUID(),
    );

  await env.DB.batch(
    eventsToInsert.map(
      (event, index) =>
        makeInsert(
          event,
          ids[index],
        ),
    ),
  );

  return json(
    {
      ok: true,
      count:
        ids.length,
      skipped,
      ids,
    },
    201,
  );
}
