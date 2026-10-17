-- Keep pre-existing chronological order until an admin manually reorders albums.
ALTER TABLE gallery_albums ADD COLUMN sort_order INTEGER;
CREATE INDEX IF NOT EXISTS idx_gallery_albums_sort ON gallery_albums(sort_order);
