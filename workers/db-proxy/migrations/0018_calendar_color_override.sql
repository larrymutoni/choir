-- Couleur manuelle facultative. Les anciens événements restent en mode automatique.
ALTER TABLE calendar_events ADD COLUMN color_override TEXT;
