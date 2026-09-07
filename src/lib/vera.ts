import { supabase } from "@/integrations/supabase/client";

export type LivingSituation = "Nursing home" | "Independent at home";
export const LIVING_SITUATIONS: LivingSituation[] = ["Nursing home", "Independent at home"];

export type CallType = "Social Check-In" | "Activity";
export const CALL_TYPES: CallType[] = ["Social Check-In", "Activity"];

export type Outcome = "Completed" | "No answer" | "Cut short";
export const OUTCOMES: Outcome[] = ["Completed", "No answer", "Cut short"];

export const FREQUENCIES = ["Daily", "Every other day", "Weekly", "Twice weekly", "Monthly"];

export interface Resident {
  id: string;
  name: string;
  living_situation: string;
  family_contact_name: string | null;
  family_contact_info: string | null;
  caregiver_contact_name: string | null;
  caregiver_contact_info: string | null;
  caregiver_relationship: string | null;
  interests_notes: string | null;
  created_at: string;
}

export interface CallSchedule {
  id: string;
  resident_id: string;
  call_type: string;
  frequency: string;
  activity_description: string | null;
  preferred_time: string | null;
  next_call_at: string | null;
}

export interface CallLog {
  id: string;
  resident_id: string;
  call_type: string;
  occurred_at: string;
  outcome: string;
  notes: string | null;
}

export const residentsQuery = {
  queryKey: ["residents"],
  queryFn: async (): Promise<Resident[]> => {
    const { data, error } = await supabase.from("residents").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Resident[];
  },
};

export const residentQuery = (id: string) => ({
  queryKey: ["resident", id],
  queryFn: async (): Promise<Resident | null> => {
    const { data, error } = await supabase.from("residents").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? null) as Resident | null;
  },
});

export const schedulesQuery = (id: string) => ({
  queryKey: ["schedules", id],
  queryFn: async (): Promise<CallSchedule[]> => {
    const { data, error } = await supabase
      .from("call_schedules")
      .select("*")
      .eq("resident_id", id)
      .order("call_type");
    if (error) throw error;
    return (data ?? []) as CallSchedule[];
  },
});

export const logsQuery = (id: string) => ({
  queryKey: ["logs", id],
  queryFn: async (): Promise<CallLog[]> => {
    const { data, error } = await supabase
      .from("call_logs")
      .select("*")
      .eq("resident_id", id)
      .order("occurred_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CallLog[];
  },
});

export const allSchedulesQuery = {
  queryKey: ["schedules-all"],
  queryFn: async (): Promise<CallSchedule[]> => {
    const { data, error } = await supabase.from("call_schedules").select("*");
    if (error) throw error;
    return (data ?? []) as CallSchedule[];
  },
};

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function outcomeClasses(outcome: string) {
  if (outcome === "Completed") return "bg-good-soft text-good border-good/25";
  if (outcome === "Cut short") return "bg-warn-soft text-warn border-warn/25";
  return "bg-bad-soft text-bad border-bad/25";
}

export function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
