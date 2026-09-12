import { createFileRoute } from "@tanstack/react-router";

// Uses Web Crypto (available natively in the edge runtime) instead of node:crypto,
// whose timingSafeEqual polyfill cannot be trusted here.
async function sha256(value: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)]);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export const Route = createFileRoute("/api/public/vera-export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const apiKey = process.env["VERA_EXPORT_API_KEY"];
        const authHeader = request.headers.get("authorization") ?? "";
        const match = /^Bearer ([^\s,]+)$/.exec(authHeader);

        if (!apiKey) return Response.json({ error: "Export API is not configured" }, { status: 503 });

        const provided = match?.[1];
        if (!provided || !(await secretsMatch(provided, apiKey))) return unauthorized();


        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [residents, callSchedules, weeklyActivities, exercises, touchpoints] = await Promise.all([
          supabaseAdmin
            .from("residents")
            .select("id,name,living_situation,family_contact_name,family_contact_info,caregiver_contact_name,caregiver_contact_info,caregiver_relationship,interests_notes,updated_at")
            .order("name"),
          supabaseAdmin
            .from("call_schedules")
            .select("id,resident_id,call_type,frequency,activity_description,preferred_time,next_call_at,updated_at")
            .order("resident_id"),
          supabaseAdmin
            .from("weekly_activity_schedules")
            .select("id,resident_id,day_of_week,activity_description,duration_minutes,is_rest_day,updated_at")
            .order("resident_id")
            .order("day_of_week"),
          supabaseAdmin
            .from("resident_exercises")
            .select("id,resident_id,name,instructions,duration_minutes,updated_at")
            .order("resident_id")
            .order("created_at"),
          supabaseAdmin
            .from("call_touchpoints")
            .select("id,resident_id,call_type,prompt,sort_order,updated_at")
            .order("resident_id")
            .order("sort_order"),
        ]);

        const error =
          residents.error ??
          callSchedules.error ??
          weeklyActivities.error ??
          exercises.error ??
          touchpoints.error;
        if (error) return Response.json({ error: "Unable to export resident data" }, { status: 500 });

        const schedulesByResident = new Map<string, typeof callSchedules.data>();
        const activitiesByResident = new Map<string, typeof weeklyActivities.data>();
        const exercisesByResident = new Map<string, typeof exercises.data>();
        const touchpointsByResident = new Map<string, typeof touchpoints.data>();
        for (const exercise of exercises.data ?? []) {
          exercisesByResident.set(exercise.resident_id, [
            ...(exercisesByResident.get(exercise.resident_id) ?? []),
            exercise,
          ]);
        }
        for (const touchpoint of touchpoints.data ?? []) {
          touchpointsByResident.set(touchpoint.resident_id, [
            ...(touchpointsByResident.get(touchpoint.resident_id) ?? []),
            touchpoint,
          ]);
        }
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
            custom_exercises: exercisesByResident.get(resident.id) ?? [],
            call_touchpoints: touchpointsByResident.get(resident.id) ?? [],
          })),
        });
      },
    },
  },
});