-- Création table appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer la Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de gérer leurs rendez-vous
CREATE POLICY "Users can manage their own appointments"
ON appointments FOR ALL USING (auth.uid() = user_id);

-- Trigger de mise à jour du champ updated_at
CREATE TRIGGER appointments_updated_at_trigger
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
