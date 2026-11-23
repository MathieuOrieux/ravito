-- Schéma initial : les traces GPX et leurs likes.

CREATE TABLE traces (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description       TEXT        NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  activity          TEXT        NOT NULL,
  -- Statistiques calculées depuis le GPX à l'import
  distance_m        INTEGER     NOT NULL CHECK (distance_m >= 0),
  elevation_gain_m  INTEGER     NOT NULL DEFAULT 0,
  elevation_loss_m  INTEGER     NOT NULL DEFAULT 0,
  min_elevation_m   INTEGER,
  max_elevation_m   INTEGER,
  -- Géométrie simplifiée pour l'affichage : [[lat, lon, ele|null], ...]
  geometry          JSONB       NOT NULL,
  -- Version très allégée (~150 points) pour les aperçus et la carte d'ensemble
  preview           JSONB       NOT NULL,
  bbox              JSONB       NOT NULL, -- [[minLat, minLon], [maxLat, maxLon]]
  -- Fichier d'origine, renvoyé tel quel au téléchargement
  gpx_filename      TEXT        NOT NULL,
  gpx_data          TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX traces_created_at_idx ON traces (created_at DESC);
CREATE INDEX traces_activity_idx   ON traces (activity);

-- Un like par trace et par visiteur (identifiant anonyme stocké dans le navigateur).
-- Quand les comptes utilisateurs arriveront, voter_id pourra devenir user_id.
CREATE TABLE trace_likes (
  trace_id   UUID        NOT NULL REFERENCES traces (id) ON DELETE CASCADE,
  voter_id   UUID        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (trace_id, voter_id)
);

CREATE INDEX trace_likes_voter_idx ON trace_likes (voter_id);

-- Tient updated_at à jour automatiquement.
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER traces_set_updated_at
  BEFORE UPDATE ON traces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
