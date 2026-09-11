CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION app_private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'staff')
  )
$$;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.is_staff(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff manage residents" ON public.residents;
CREATE POLICY "Staff manage residents" ON public.residents FOR ALL TO authenticated
  USING (app_private.is_staff(auth.uid())) WITH CHECK (app_private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage call schedules" ON public.call_schedules;
CREATE POLICY "Staff manage call schedules" ON public.call_schedules FOR ALL TO authenticated
  USING (app_private.is_staff(auth.uid())) WITH CHECK (app_private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage call logs" ON public.call_logs;
CREATE POLICY "Staff manage call logs" ON public.call_logs FOR ALL TO authenticated
  USING (app_private.is_staff(auth.uid())) WITH CHECK (app_private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage weekly activity schedules" ON public.weekly_activity_schedules;
CREATE POLICY "Staff manage weekly activity schedules" ON public.weekly_activity_schedules FOR ALL TO authenticated
  USING (app_private.is_staff(auth.uid())) WITH CHECK (app_private.is_staff(auth.uid()));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_staff(uuid);