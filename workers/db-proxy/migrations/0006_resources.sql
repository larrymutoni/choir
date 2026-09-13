CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    composer TEXT,
    program TEXT,
    lyrics TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_by_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS resource_files (
    id TEXT PRIMARY KEY,
    song_id TEXT,
    kind TEXT NOT NULL CHECK (
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
    downloadable INTEGER NOT NULL DEFAULT 1 CHECK (downloadable IN (0, 1)),
    published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
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
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(status);
CREATE INDEX IF NOT EXISTS idx_resource_files_song ON resource_files(song_id);
CREATE INDEX IF NOT EXISTS idx_resource_files_kind ON resource_files(kind);
CREATE INDEX IF NOT EXISTS idx_resource_files_category ON resource_files(category);