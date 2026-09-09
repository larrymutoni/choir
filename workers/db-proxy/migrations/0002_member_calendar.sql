PRAGMA foreign_keys = ON;

CREATE TABLE calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT,
    all_day INTEGER NOT NULL DEFAULT 0 CHECK (all_day IN (0, 1)),
    location TEXT,
    notes TEXT,
    series_id TEXT,
    created_by_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_calendar_events_start_at
ON calendar_events(start_at);

CREATE INDEX idx_calendar_events_series_id
ON calendar_events(series_id);
