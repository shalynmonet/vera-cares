import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, outcomeClasses, type CallLog, type CallTouchpoint } from "@/lib/vera";

export function CallSummaryDialog({
  open,
  onOpenChange,
  log,
  touchpoints,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: CallLog | null;
  touchpoints: CallTouchpoint[];
}) {
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setNotes(log?.notes ?? "");
  }, [open, log]);

  const save = useMutation({
    mutationFn: async () => {
      if (!log) return;
      const { error } = await supabase
        .from("call_logs")
        .update({ notes: notes.trim() || null })
        .eq("id", log.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (log) queryClient.invalidateQueries({ queryKey: ["logs", log.resident_id] });
      toast.success("Summary saved");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const planned = touchpoints.filter((t) => t.call_type === log?.call_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">Call summary</DialogTitle>
        </DialogHeader>

        {log && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-lg font-semibold">{log.call_type}</span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${outcomeClasses(log.outcome)}`}
              >
                {log.outcome}
              </span>
              <span className="font-mono text-[11px] text-muted">{formatDateTime(log.occurred_at)}</span>
            </div>

            {planned.length > 0 && (
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted">Planned touchpoints</div>
                <ul className="mt-2 space-y-1.5">
                  {planned.map((item, index) => (
                    <li key={item.id} className="flex gap-3 text-[13px]">
                      <span className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</span>
                      <span>{item.prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted">Summary &amp; notes</Label>
              <Textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How the call went, mood, anything to follow up on…"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Close
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent disabled:opacity-60"
          >
            Save summary
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
