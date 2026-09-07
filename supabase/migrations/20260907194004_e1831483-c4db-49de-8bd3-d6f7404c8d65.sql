CREATE TABLE public.residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  living_situation text NOT NULL DEFAULT 'Nursing home',
  family_contact_name text,
  family_contact_info text,
  caregiver_contact_name text,
  caregiver_contact_info text,
  caregiver_relationship text,
  interests_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.call_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  call_type text NOT NULL,
  frequency text NOT NULL,
  activity_description text,
  preferred_time text,
  next_call_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resident_id, call_type)
);

CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  call_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL DEFAULT 'Completed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX call_schedules_resident_idx ON public.call_schedules(resident_id);
CREATE INDEX call_logs_resident_idx ON public.call_logs(resident_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.residents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_schedules TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO anon, authenticated;
GRANT ALL ON public.residents TO service_role;
GRANT ALL ON public.call_schedules TO service_role;
GRANT ALL ON public.call_logs TO service_role;

ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open access to residents" ON public.residents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Open access to call schedules" ON public.call_schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Open access to call logs" ON public.call_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER residents_updated_at BEFORE UPDATE ON public.residents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER call_schedules_updated_at BEFORE UPDATE ON public.call_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();