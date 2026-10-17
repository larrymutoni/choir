-- New optional song metadata; existing songs and media remain unchanged.
ALTER TABLE songs ADD COLUMN youtube_url TEXT;
