CREATE TABLE public.resident_caregivers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (resident_id, user_id)
);

CREATE INDEX idx_resident_caregivers_user ON public.resident_caregivers(user_id);
CREATE INDEX idx_resident_caregivers_resident ON public.resident_caregivers(resident_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resident_caregivers TO authenticated;
GRANT ALL ON public.resident_caregivers TO service_role;

ALTER TABLE public.resident_caregivers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION app_private.is_assigned_caregiver(_user_id uuid, _resident_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.resident_caregivers
    WHERE user_id = _user_id AND resident_id = _resident_id
  )
$$;

REVOKE ALL ON FUNCTION app_private.is_assigned_caregiver(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_assigned_caregiver(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Staff manage caregiver assignments"
ON public.resident_caregivers FOR ALL TO authenticated
USING (app_private.is_staff(auth.uid()))
WITH CHECK (app_private.is_staff(auth.uid()));

CREATE POLICY "Caregivers view their own assignments"
ON public.resident_caregivers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Caregivers access assigned residents"
ON public.residents FOR SELECT TO authenticated
USING (app_private.is_assigned_caregiver(auth.uid(), id));

CREATE POLICY "Caregivers update assigned residents"
ON public.residents FOR UPDATE TO authenticated
USING (app_private.is_assigned_caregiver(auth.uid(), id))
WITH CHECK (app_private.is_assigned_caregiver(auth.uid(), id));

CREATE POLICY "Caregivers manage assigned call schedules"
ON public.call_schedules FOR ALL TO authenticated
USING (app_private.is_assigned_caregiver(auth.uid(), resident_id))
WITH CHECK (app_private.is_assigned_caregiver(auth.uid(), resident_id));

CREATE POLICY "Caregivers manage assigned call logs"
ON public.call_logs FOR ALL TO authenticated
USING (app_private.is_assigned_caregiver(auth.uid(), resident_id))
WITH CHECK (app_private.is_assigned_caregiver(auth.uid(), resident_id));

CREATE POLICY "Caregivers manage assigned activity schedules"
ON public.weekly_activity_schedules FOR ALL TO authenticated
USING (app_private.is_assigned_caregiver(auth.uid(), resident_id))
WITH CHECK (app_private.is_assigned_caregiver(auth.uid(), resident_id));