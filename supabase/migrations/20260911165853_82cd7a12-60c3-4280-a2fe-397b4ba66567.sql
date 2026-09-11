-- residents
DROP POLICY IF EXISTS "Open access to residents" ON public.residents;
REVOKE ALL ON public.residents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.residents TO authenticated;
GRANT ALL ON public.residents TO service_role;
CREATE POLICY "Authenticated staff manage residents"
  ON public.residents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- call_schedules
DROP POLICY IF EXISTS "Open access to call schedules" ON public.call_schedules;
REVOKE ALL ON public.call_schedules FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_schedules TO authenticated;
GRANT ALL ON public.call_schedules TO service_role;
CREATE POLICY "Authenticated staff manage call schedules"
  ON public.call_schedules FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- call_logs
DROP POLICY IF EXISTS "Open access to call logs" ON public.call_logs;
REVOKE ALL ON public.call_logs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
CREATE POLICY "Authenticated staff manage call logs"
  ON public.call_logs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- weekly_activity_schedules
DROP POLICY IF EXISTS "Open access to weekly activity schedules" ON public.weekly_activity_schedules;
REVOKE ALL ON public.weekly_activity_schedules FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_activity_schedules TO authenticated;
GRANT ALL ON public.weekly_activity_schedules TO service_role;
CREATE POLICY "Authenticated staff manage weekly activity schedules"
  ON public.weekly_activity_schedules FOR ALL TO authenticated
  USING (true) WITH CHECK (true);