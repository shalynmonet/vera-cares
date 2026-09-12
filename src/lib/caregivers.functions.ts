import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CaregiverAssignment {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("Unable to verify your access level.");
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("staff") && !roles.includes("admin")) {
    throw new Error("Only staff can manage caregiver access.");
  }
}

export const listCaregiverAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ residentId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<CaregiverAssignment[]> => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("resident_caregivers")
      .select("id,user_id,created_at")
      .eq("resident_id", data.residentId)
      .order("created_at");
    if (error) throw new Error("Unable to load caregiver access.");

    const results: CaregiverAssignment[] = [];
    for (const row of rows ?? []) {
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      results.push({
        id: row.id,
        user_id: row.user_id,
        created_at: row.created_at,
        email: user?.user?.email ?? "Unknown account",
      });
    }
    return results;
  });

export const addCaregiverAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ residentId: z.string().uuid(), email: z.string().email() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    let userId: string | undefined;
    for (let page = 1; page <= 10 && !userId; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error("Unable to look up that account.");
      userId = list.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (list.users.length < 200) break;
    }
    if (!userId) {
      throw new Error("No account uses that email yet. Create the caregiver account first.");
    }

    const { error: insertError } = await supabaseAdmin
      .from("resident_caregivers")
      .upsert({ resident_id: data.residentId, user_id: userId }, { onConflict: "resident_id,user_id" });
    if (insertError) throw new Error("Unable to give that caregiver access.");
    return { ok: true };
  });

export const removeCaregiverAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("resident_caregivers").delete().eq("id", data.id);
    if (error) throw new Error("Unable to remove that caregiver's access.");
    return { ok: true };
  });
