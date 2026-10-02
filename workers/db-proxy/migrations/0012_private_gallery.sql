PRAGMA foreign_keys = ON;

CREATE TABLE gallery_albums (
  id TEXT PRIMARY KEY,

  title TEXT NOT NULL,
  description TEXT,
  activity TEXT,

  album_date TEXT NOT NULL,

  cover_media_id TEXT,

  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_gallery_albums_date
ON gallery_albums(album_date DESC);

CREATE INDEX idx_gallery_albums_activity
ON gallery_albums(activity);


CREATE TABLE gallery_media (
  id TEXT PRIMARY KEY,

  album_id TEXT,

  media_type TEXT NOT NULL
    CHECK (media_type IN ('photo', 'video')),

  storage_key TEXT NOT NULL UNIQUE,

  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,

  captured_at TEXT NOT NULL,

  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (album_id)
    REFERENCES gallery_albums(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_gallery_media_album
ON gallery_media(album_id);

CREATE INDEX idx_gallery_media_type
ON gallery_media(media_type);

CREATE INDEX idx_gallery_media_captured_at
ON gallery_media(captured_at DESC);
