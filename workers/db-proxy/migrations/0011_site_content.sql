CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO site_content (key, value)
VALUES ('about_choir_director_text', 'Le chef de chœur accompagne le groupe dans le travail vocal, le rythme et l’interprétation des chants.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_choir_director_title', 'Chef de chœur')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_intro', 'La Chorale Rayon de Soleil rassemble des voix et des parcours différents autour d’une même envie : chanter ensemble.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_members_text', 'Découvrez les membres qui font vivre la Chorale Rayon de Soleil au fil des répétitions, concerts et moments partagés.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_members_title', 'Les visages de la chorale')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_page_title', 'Une histoire de passion et de partage.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_quote', 'La musique nous rassemble, une voix après l’autre.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_story_text', 'La Chorale Rayon de Soleil est un espace musical et humain. On y vient pour chanter, progresser, écouter les autres et partager des moments simples autour d’un répertoire varié.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_story_title', 'Chanter ensemble, créer du lien.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('about_values_title', 'Ce qui nous rassemble')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('activities_intro', 'Répétitions, concerts et moments de partage autour de la musique.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('contact_accessibility', 'Salle au sous-sol avec ascenseur pour les personnes à mobilité réduite.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('contact_admin_address', 'Ensemble Vocal Rayon de Soleil Lyon 6, 33 rue Bossuet, 69006 Lyon')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('contact_francois_phone', '')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('contact_intro', 'Pour une inscription, une question ou une demande d’information, contactez la chorale.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('contact_monique_phone', '06 78 92 70 05')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('contact_rehearsal_address', '37 rue Bossuet, 69006 Lyon')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_about_text', 'La Chorale Rayon de Soleil réunit des personnes qui aiment chanter, progresser ensemble et partager un répertoire varié dans une ambiance chaleureuse.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_about_title', 'Une chorale au cœur de Lyon 6')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_address_text', '33 rue Bossuet, 69006 Lyon.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_hero_description', 'Découvrez nos concerts, nos répétitions et les moments musicaux qui font vivre la Chorale Rayon de Soleil.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_hero_title', 'Une chorale lumineuse pour chanter, partager et rassembler. ')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_join_text', 'Venez découvrir la chorale, assister à une répétition et rencontrer le groupe.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_join_title', 'Envie de chanter avec nous ?')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_quote', 'Développer le lien social par le chant choral.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_rehearsal_text', 'Cours collectifs hebdomadaires le mardi, 17h30–19h ou 19h30–21h.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_content (key, value)
VALUES ('home_repertoire_text', 'Répertoire de variété française et étrangère.')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;
