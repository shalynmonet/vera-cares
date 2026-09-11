import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export const Route = createFileRoute("/api/public/vera-export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const apiKey = process.env["VERA_EXPORT_API_KEY"];
        if (!apiKey) return Response.json({ error: "Export API is not configured" }, { status: 503 });

        const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
        const provided = match?.[1];
        if (!provided || !timingSafeEqual(digest(provided), digest(apiKey))) return unauthorized();

        const url = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !publishableKey) {
          return Response.json({ error: "Data service is not configured" }, { status: 503 });
        }

        const supabase = createClient<Database>(url, publishableKey, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const [residents, callSchedules, weeklyActivities] = await Promise.all([
          supabase
            .from("residents")
            .select("id,name,living_situation,family_contact_name,family_contact_info,caregiver_contact_name,caregiver_contact_info,caregiver_relationship,interests_notes,updated_at")
            .order("name"),
          supabase
            .from("call_schedules")
            .select("id,resident_id,call_type,frequency,activity_description,preferred_time,next_call_at,updated_at")
            .order("resident_id"),
          supabase
            .from("weekly_activity_schedules")
            .select("id,resident_id,day_of_week,activity_description,duration_minutes,is_rest_day,updated_at")
            .order("resident_id")
            .order("day_of_week"),
        ]);

        const error = residents.error ?? callSchedules.error ?? weeklyActivities.error;
        if (error) return Response.json({ error: "Unable to export resident data" }, { status: 500 });

        const schedulesByResident = new Map<string, typeof callSchedules.data>();
        const activitiesByResident = new Map<string, typeof weeklyActivities.data>();
        for (const schedule of callSchedules.data ?? []) {
          schedulesByResident.set(schedule.resident_id, [
            ...(schedulesByResident.get(schedule.resident_id) ?? []),
            schedule,
          ]);
        }
        for (const activity of weeklyActivities.data ?? []) {
          activitiesByResident.set(activity.resident_id, [
            ...(activitiesByResident.get(activity.resident_id) ?? []),
            activity,
          ]);
        }

        return Response.json({
          exported_at: new Date().toISOString(),
          residents: (residents.data ?? []).map((resident) => ({
            ...resident,
            call_schedules: schedulesByResident.get(resident.id) ?? [],
            weekly_activity_schedule: activitiesByResident.get(resident.id) ?? [],
          })),
        });
      },
    },
  },
});