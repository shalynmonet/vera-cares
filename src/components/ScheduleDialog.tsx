import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { FREQUENCIES, toLocalInputValue, type CallSchedule } from "@/lib/vera";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: CallSchedule | null;
}) {
  const [frequency, setFrequency] = useState("Weekly");
  const [preferredTime, setPreferredTime] = useState("10:00");
  const [activity, setActivity] = useState("");
  const [nextCall, setNextCall] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open || !schedule) return;
    setFrequency(schedule.frequency);
    setPreferredTime(schedule.preferred_time ?? "10:00");
    setActivity(schedule.activity_description ?? "");
    setNextCall(schedule.next_call_at ? toLocalInputValue(new Date(schedule.next_call_at)) : "");
  }, [open, schedule]);

  const save = useMutation({
    mutationFn: async () => {
      if (!schedule) return;
      const { error } = await supabase
        .from("call_schedules")
        .update({
          frequency,
          preferred_time: preferredTime,
          activity_description: schedule.call_type === "Activity" ? activity : null,
          next_call_at: nextCall ? new Date(nextCall).toISOString() : null,
        })
        .eq("id", schedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Schedule updated");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            {schedule?.call_type === "Activity" ? "Activity call" : "Social check-in"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">Frequency</Label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFrequency(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    frequency === option
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {schedule?.call_type === "Activity" && (
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Activity description
              </Label>
              <Input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="10 minutes on stationary bike"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Preferred time of day
            </Label>
            <Input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">Next call</Label>
            <Input type="datetime-local" value={nextCall} onChange={(e) => setNextCall(e.target.value)} />
          </div>
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
            Save schedule
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
