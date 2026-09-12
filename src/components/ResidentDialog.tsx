import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { LIVING_SITUATIONS, type Resident } from "@/lib/vera";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty = {
  name: "",
  living_situation: "Nursing home",
  family_contact_name: "",
  family_contact_info: "",
  caregiver_contact_name: "",
  caregiver_contact_info: "",
  caregiver_relationship: "",
  interests_notes: "",
  emergency_criteria: "",
};

type Form = typeof empty;

export function ResidentDialog({
  open,
  onOpenChange,
  resident,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident?: Resident | null;
  onCreated?: (id: string) => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    if (resident) {
      setForm({
        name: resident.name,
        living_situation: resident.living_situation,
        family_contact_name: resident.family_contact_name ?? "",
        family_contact_info: resident.family_contact_info ?? "",
        caregiver_contact_name: resident.caregiver_contact_name ?? "",
        caregiver_contact_info: resident.caregiver_contact_info ?? "",
        caregiver_relationship: resident.caregiver_relationship ?? "",
        interests_notes: resident.interests_notes ?? "",
        emergency_criteria: resident.emergency_criteria ?? "",
      });
    } else {
      setForm(empty);
    }
  }, [open, resident]);

  const set = (key: keyof Form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Please enter a name.");
      const payload = { ...form, name: form.name.trim() };
      if (resident) {
        const { error } = await supabase.from("residents").update(payload).eq("id", resident.id);
        if (error) throw error;
        return resident.id;
      }
      const { data, error } = await supabase
        .from("residents")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      const newId = data.id as string;
      const { error: schedError } = await supabase.from("call_schedules").insert([
        { resident_id: newId, call_type: "Social Check-In", frequency: "Weekly", preferred_time: "10:00" },
        { resident_id: newId, call_type: "Activity", frequency: "Daily", preferred_time: "09:30" },
      ]);
      if (schedError) throw schedError;
      return newId;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries();
      toast.success(resident ? "Profile updated" : "User profile added");
      onOpenChange(false);
      if (!resident) onCreated?.(id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-surface sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            {resident ? "Edit profile" : "New enrollment"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Eleanor Whitfield" />
          </Field>

          <Field label="Living situation" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {LIVING_SITUATIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => set("living_situation")(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    form.living_situation === option
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Family contact name">
            <Input value={form.family_contact_name} onChange={(e) => set("family_contact_name")(e.target.value)} />
          </Field>
          <Field label="Family email or phone">
            <Input value={form.family_contact_info} onChange={(e) => set("family_contact_info")(e.target.value)} />
          </Field>

          <Field label="Caregiver / facility contact">
            <Input value={form.caregiver_contact_name} onChange={(e) => set("caregiver_contact_name")(e.target.value)} />
          </Field>
          <Field label="Caregiver email or phone">
            <Input value={form.caregiver_contact_info} onChange={(e) => set("caregiver_contact_info")(e.target.value)} />
          </Field>

          <Field label="Relationship" className="sm:col-span-2">
            <Input
              value={form.caregiver_relationship}
              onChange={(e) => set("caregiver_relationship")(e.target.value)}
              placeholder="Facility nurse, Daughter, Home health aide…"
            />
          </Field>

          <Field label="Interests & notes" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={form.interests_notes}
              onChange={(e) => set("interests_notes")(e.target.value)}
              placeholder="Hobbies, family names, things they like to talk about…"
            />
          </Field>

          <Field label="Emergency criteria" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.emergency_criteria}
              onChange={(e) => set("emergency_criteria")(e.target.value)}
              placeholder="What counts as an emergency for this person, and who to call…"
            />
          </Field>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : resident ? "Save changes" : "Add user profile"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</Label>
      {children}
    </div>
  );
}
