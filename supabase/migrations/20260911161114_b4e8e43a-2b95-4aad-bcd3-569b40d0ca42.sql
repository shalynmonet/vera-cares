REVOKE ALL ON FUNCTION public.create_resident_weekly_activity_schedule() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_resident_weekly_activity_schedule() FROM anon;
REVOKE ALL ON FUNCTION public.create_resident_weekly_activity_schedule() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_resident_weekly_activity_schedule() TO service_role;