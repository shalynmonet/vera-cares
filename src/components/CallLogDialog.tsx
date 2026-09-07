import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { CALL_TYPES, OUTCOMES, toLocalInputValue } from "@/lib/vera";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CallLogDialog({
  open,
  onOpenChange,
  residentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
}) {
  const [callType, setCallType] = useState<string>("Social Check-In");
  const [outcome, setOutcome] = useState<string>("Completed");
  const [occurredAt, setOccurredAt] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setCallType("Social Check-In");
    setOutcome("Completed");
    setOccurredAt(toLocalInputValue(new Date()));
  }, [open]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("call_logs").insert({
        resident_id: residentId,
        call_type: callType,
        outcome,
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Call logged");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">Log a call</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">Call type</Label>
            <div className="flex flex-wrap gap-2">
              {CALL_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCallType(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    callType === option
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">Date & time</Label>
            <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">Outcome</Label>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOutcome(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    outcome === option
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
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
            Add entry
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
