
CREATE TABLE public.resident_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  name text NOT NULL,
  instructions text,
  duration_minutes smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resident_exercises TO authenticated;
GRANT ALL ON public.resident_exercises TO service_role;
ALTER TABLE public.resident_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage resident exercises" ON public.resident_exercises
  FOR ALL TO authenticated
  USING (app_private.is_staff(auth.uid()))
  WITH CHECK (app_private.is_staff(auth.uid()));

CREATE POLICY "Caregivers manage assigned exercises" ON public.resident_exercises
  FOR ALL TO authenticated
  USING (app_private.is_assigned_caregiver(auth.uid(), resident_id))
  WITH CHECK (app_private.is_assigned_caregiver(auth.uid(), resident_id));

CREATE INDEX resident_exercises_resident_id_idx ON public.resident_exercises(resident_id);

CREATE TRIGGER resident_exercises_updated_at
  BEFORE UPDATE ON public.resident_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.call_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('Social Check-In', 'Activity')),
  prompt text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_touchpoints TO authenticated;
GRANT ALL ON public.call_touchpoints TO service_role;
ALTER TABLE public.call_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage call touchpoints" ON public.call_touchpoints
  FOR ALL TO authenticated
  USING (app_private.is_staff(auth.uid()))
  WITH CHECK (app_private.is_staff(auth.uid()));

CREATE POLICY "Caregivers manage assigned touchpoints" ON public.call_touchpoints
  FOR ALL TO authenticated
  USING (app_private.is_assigned_caregiver(auth.uid(), resident_id))
  WITH CHECK (app_private.is_assigned_caregiver(auth.uid(), resident_id));

CREATE INDEX call_touchpoints_resident_id_idx ON public.call_touchpoints(resident_id, call_type, sort_order);

CREATE TRIGGER call_touchpoints_updated_at
  BEFORE UPDATE ON public.call_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
