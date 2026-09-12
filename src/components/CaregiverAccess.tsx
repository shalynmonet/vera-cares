import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  addCaregiverAssignment,
  listCaregiverAssignments,
  removeCaregiverAssignment,
} from "@/lib/caregivers.functions";

export function CaregiverAccess({ residentId }: { residentId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const list = useServerFn(listCaregiverAssignments);
  const add = useServerFn(addCaregiverAssignment);
  const remove = useServerFn(removeCaregiverAssignment);

  const myRoles = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [] as string[];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
      return (data ?? []).map((r) => r.role as string);
    },
  });

  const isStaff = (myRoles.data ?? []).some((role) => role === "staff" || role === "admin");

  const assignments = useQuery({
    queryKey: ["caregiver-access", residentId],
    queryFn: () => list({ data: { residentId } }),
    enabled: isStaff,
    retry: false,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["caregiver-access", residentId] });

  const grant = useMutation({
    mutationFn: () => add({ data: { residentId, email } }),
    onSuccess: () => {
      setEmail("");
      toast.success("Caregiver access granted");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Access removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isStaff) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
        Caregiver access
      </div>
      <p className="text-[13px] text-muted">
        Caregivers sign in with their own account and see only the profiles listed here.
      </p>

      <div className="mt-4 divide-y divide-border">
        {assignments.data?.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="truncate text-[13px]">{a.email}</span>
            <button
              type="button"
              onClick={() => revoke.mutate(a.id)}
              className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-foreground"
            >
              Remove
            </button>
          </div>
        ))}
        {assignments.data?.length === 0 && (
          <div className="py-2.5 text-[13px] text-muted">No caregivers have access yet.</div>
        )}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) grant.mutate();
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="caregiver@email.com"
          aria-label="Caregiver email"
        />
        <Button type="submit" disabled={grant.isPending}>
          {grant.isPending ? "Adding…" : "Add"}
        </Button>
      </form>
    </div>
  );
}
