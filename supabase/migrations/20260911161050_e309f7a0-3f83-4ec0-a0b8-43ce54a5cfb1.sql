CREATE TABLE public.weekly_activity_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,
  activity_description text,
  duration_minutes smallint,
  is_rest_day boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT weekly_activity_day_range CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT weekly_activity_unique_day UNIQUE (resident_id, day_of_week),
  CONSTRAINT weekly_activity_rest_day_fields CHECK (
    (is_rest_day AND activity_description IS NULL AND duration_minutes IS NULL)
    OR
    (NOT is_rest_day AND length(btrim(activity_description)) > 0 AND duration_minutes > 0 AND duration_minutes <= 1440)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_activity_schedules TO anon, authenticated;
GRANT ALL ON public.weekly_activity_schedules TO service_role;

ALTER TABLE public.weekly_activity_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open access to weekly activity schedules"
ON public.weekly_activity_schedules
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX weekly_activity_schedules_resident_idx
ON public.weekly_activity_schedules(resident_id, day_of_week);

CREATE TRIGGER weekly_activity_schedules_updated_at
BEFORE UPDATE ON public.weekly_activity_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_resident_weekly_activity_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.weekly_activity_schedules (resident_id, day_of_week, is_rest_day)
  SELECT NEW.id, day_number, true
  FROM generate_series(1, 7) AS day_number;
  RETURN NEW;
END;
$$;

CREATE TRIGGER residents_create_weekly_activity_schedule
AFTER INSERT ON public.residents
FOR EACH ROW EXECUTE FUNCTION public.create_resident_weekly_activity_schedule();

INSERT INTO public.weekly_activity_schedules (resident_id, day_of_week, is_rest_day)
SELECT residents.id, day_number, true
FROM public.residents
CROSS JOIN generate_series(1, 7) AS day_number
ON CONFLICT (resident_id, day_of_week) DO NOTHING;