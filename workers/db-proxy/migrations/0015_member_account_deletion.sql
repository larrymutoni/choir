PRAGMA foreign_keys = ON;

-- Calendar
CREATE TABLE _m0015_calendar_event_exceptions AS
SELECT
  id,
  series_id,
  original_start_at,
  cancelled,
  overrides_json,
  created_at,
  updated_at
FROM calendar_event_exceptions;

DROP TABLE calendar_event_exceptions;

CREATE TABLE calendar_events_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT,
    all_day INTEGER NOT NULL DEFAULT 0 CHECK (all_day IN (0, 1)),
    location TEXT,
    notes TEXT,
    series_id TEXT,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    event_kind TEXT NOT NULL DEFAULT 'single'
      CHECK (event_kind IN ('single', 'series')),
    recurrence_type TEXT
      CHECK (
        recurrence_type IS NULL
        OR recurrence_type IN ('weekly', 'biweekly')
      ),
    recurrence_until TEXT,
    FOREIGN KEY (created_by_user_id)
      REFERENCES users(id)
      ON DELETE SET NULL
);

INSERT INTO calendar_events_new (
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
SELECT
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
FROM calendar_events;

DROP TABLE calendar_events;
ALTER TABLE calendar_events_new RENAME TO calendar_events;

CREATE INDEX idx_calendar_events_start_at
ON calendar_events(start_at);

CREATE INDEX idx_calendar_events_series_id
ON calendar_events(series_id);

CREATE INDEX idx_calendar_events_kind
ON calendar_events(event_kind);

CREATE TABLE calendar_event_exceptions (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL,
    original_start_at TEXT NOT NULL,
    cancelled INTEGER NOT NULL DEFAULT 0 CHECK (cancelled IN (0, 1)),
    overrides_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (series_id)
      REFERENCES calendar_events(id)
      ON DELETE CASCADE,
    UNIQUE (series_id, original_start_at)
);

INSERT INTO calendar_event_exceptions (
  id,
  series_id,
  original_start_at,
  cancelled,
  overrides_json,
  created_at,
  updated_at
)
SELECT
  id,
  series_id,
  original_start_at,
  cancelled,
  overrides_json,
  created_at,
  updated_at
FROM _m0015_calendar_event_exceptions;

DROP TABLE _m0015_calendar_event_exceptions;

CREATE INDEX idx_calendar_event_exceptions_series
ON calendar_event_exceptions(series_id);

CREATE INDEX idx_calendar_event_exceptions_original_start
ON calendar_event_exceptions(original_start_at);

-- Resources
CREATE TABLE _m0015_resource_files AS
SELECT
  id,
  song_id,
  kind,
  title,
  category,
  description,
  storage_key,
  original_filename,
  mime_type,
  size_bytes,
  downloadable,
  published,
  sort_order,
  created_by_user_id,
  created_at,
  updated_at
FROM resource_files;

DROP TABLE resource_files;

CREATE TABLE songs_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    composer TEXT,
    program TEXT,
    lyrics TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'published'
      CHECK (status IN ('draft', 'published')),
    created_by_user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (created_by_user_id)
      REFERENCES users(id)
      ON DELETE SET NULL
);

INSERT INTO songs_new (
  id,
  title,
  composer,
  program,
  lyrics,
  notes,
  status,
  created_by_user_id,
  created_at,
  updated_at
)
SELECT
  id,
  title,
  composer,
  program,
  lyrics,
  notes,
  status,
  created_by_user_id,
  created_at,
  updated_at
FROM songs;

DROP TABLE songs;
ALTER TABLE songs_new RENAME TO songs;

CREATE INDEX idx_songs_title
ON songs(title);

CREATE INDEX idx_songs_status
ON songs(status);

CREATE TABLE resource_files (
    id TEXT PRIMARY KEY,
    song_id TEXT,
    kind TEXT NOT NULL
      CHECK (
        kind IN (
          'score',
          'audio',
          'document'
        )
      ),
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    storage_key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    downloadable INTEGER NOT NULL DEFAULT 1
      CHECK (downloadable IN (0, 1)),
    published INTEGER NOT NULL DEFAULT 1
      CHECK (published IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (song_id)
      REFERENCES songs(id)
      ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id)
      REFERENCES users(id)
      ON DELETE SET NULL,
    CHECK (
      (
        kind = 'document'
        AND song_id IS NULL
      )
      OR (
        kind IN ('score', 'audio')
        AND song_id IS NOT NULL
      )
    )
);

INSERT INTO resource_files (
  id,
  song_id,
  kind,
  title,
  category,
  description,
  storage_key,
  original_filename,
  mime_type,
  size_bytes,
  downloadable,
  published,
  sort_order,
  created_by_user_id,
  created_at,
  updated_at
)
SELECT
  id,
  song_id,
  kind,
  title,
  category,
  description,
  storage_key,
  original_filename,
  mime_type,
  size_bytes,
  downloadable,
  published,
  sort_order,
  created_by_user_id,
  created_at,
  updated_at
FROM _m0015_resource_files;

DROP TABLE _m0015_resource_files;

CREATE INDEX idx_resource_files_song
ON resource_files(song_id);

CREATE INDEX idx_resource_files_kind
ON resource_files(kind);

CREATE INDEX idx_resource_files_category
ON resource_files(category);

-- Notifications
CREATE TABLE _m0015_notification_recipients AS
SELECT
  notification_id,
  user_id,
  seen_at
FROM notification_recipients;

DROP TABLE notification_recipients;

CREATE TABLE notifications_new (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    href TEXT NOT NULL,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (created_by_user_id)
      REFERENCES users(id)
      ON DELETE SET NULL
);

INSERT INTO notifications_new (
  id,
  message,
  href,
  created_by_user_id,
  created_at
)
SELECT
  id,
  message,
  href,
  created_by_user_id,
  created_at
FROM notifications;

DROP TABLE notifications;
ALTER TABLE notifications_new RENAME TO notifications;

CREATE TABLE notification_recipients (
    notification_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    seen_at TEXT,
    PRIMARY KEY (notification_id, user_id),
    FOREIGN KEY (notification_id)
      REFERENCES notifications(id)
      ON DELETE CASCADE,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
);

INSERT INTO notification_recipients (
  notification_id,
  user_id,
  seen_at
)
SELECT
  notification_id,
  user_id,
  seen_at
FROM _m0015_notification_recipients;

DROP TABLE _m0015_notification_recipients;

CREATE INDEX idx_notification_recipients_user
ON notification_recipients(user_id);

CREATE INDEX idx_notification_recipients_unseen
ON notification_recipients(user_id, seen_at);

CREATE INDEX idx_notifications_created_at
ON notifications(created_at);
