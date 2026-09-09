PRAGMA foreign_keys = ON;
ALTER TABLE calendar_events
ADD COLUMN event_kind TEXT NOT NULL DEFAULT 'single' CHECK (event_kind IN ('single', 'series'));
ALTER TABLE calendar_events
ADD COLUMN recurrence_type TEXT CHECK (
        recurrence_type IS NULL
        OR recurrence_type IN ('weekly', 'biweekly')
    );
ALTER TABLE calendar_events
ADD COLUMN recurrence_until TEXT;
CREATE INDEX idx_calendar_events_kind ON calendar_events(event_kind);
CREATE TABLE calendar_event_exceptions (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL,
    original_start_at TEXT NOT NULL,
    cancelled INTEGER NOT NULL DEFAULT 0 CHECK (cancelled IN (0, 1)),
    overrides_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (series_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    UNIQUE (series_id, original_start_at)
);
CREATE INDEX idx_calendar_event_exceptions_series ON calendar_event_exceptions(series_id);
CREATE INDEX idx_calendar_event_exceptions_original_start ON calendar_event_exceptions(original_start_at);