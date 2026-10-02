PRAGMA foreign_keys = ON;

ALTER TABLE gallery_media ADD COLUMN taken_at TEXT;
ALTER TABLE gallery_media ADD COLUMN year_override INTEGER;
ALTER TABLE gallery_media ADD COLUMN width INTEGER;
ALTER TABLE gallery_media ADD COLUMN height INTEGER;
ALTER TABLE gallery_media ADD COLUMN content_hash TEXT;
ALTER TABLE gallery_media ADD COLUMN thumbnail_storage_key TEXT;
ALTER TABLE gallery_media ADD COLUMN thumbnail_mime_type TEXT;
ALTER TABLE gallery_media ADD COLUMN thumbnail_size_bytes INTEGER;
ALTER TABLE gallery_media ADD COLUMN preview_storage_key TEXT;
ALTER TABLE gallery_media ADD COLUMN preview_mime_type TEXT;
ALTER TABLE gallery_media ADD COLUMN preview_size_bytes INTEGER;

CREATE UNIQUE INDEX idx_gallery_media_content_hash
ON gallery_media(content_hash);

CREATE INDEX idx_gallery_media_taken_at
ON gallery_media(taken_at DESC);

CREATE INDEX idx_gallery_media_year_override
ON gallery_media(year_override DESC);
