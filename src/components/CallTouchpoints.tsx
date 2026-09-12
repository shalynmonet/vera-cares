import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CALL_TYPES, type CallTouchpoint } from "@/lib/vera";

export function CallTouchpoints({
  residentId,
  touchpoints,
}: {
  residentId: string;
  touchpoints: CallTouchpoint[];
}) {
  return (
    <section className="rise mt-12 [animation-delay:380ms]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Call touchpoints</h2>
          <p className="mt-2 text-[13px] text-muted">
            Things to cover on each call type, in order.
          </p>
        </div>
        <div className="pattern-houndstooth size-5 text-accent/20" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CALL_TYPES.map((type) => (
          <TouchpointColumn
            key={type}
            residentId={residentId}
            callType={type}
            items={touchpoints.filter((t) => t.call_type === type)}
          />
        ))}
      </div>
    </section>
  );
}

function TouchpointColumn({
  residentId,
  callType,
  items,
}: {
  residentId: string;
  callType: string;
  items: CallTouchpoint[];
}) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["touchpoints", residentId] });

  const add = useMutation({
    mutationFn: async () => {
      const trimmed = prompt.trim();
      if (!trimmed) throw new Error("Write a touchpoint first.");
      const nextOrder = items.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
      const { error } = await supabase.from("call_touchpoints").insert({
        resident_id: residentId,
        call_type: callType,
        prompt: trimmed,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPrompt("");
      invalidate();
      toast.success("Touchpoint added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("call_touchpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Touchpoint removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-background/60 px-4 py-2.5 font-mono text-[9px] uppercase tracking-widest text-muted">
        {callType}
      </div>
      {items.length === 0 && (
        <div className="px-4 py-5 text-center text-[13px] text-muted">No touchpoints yet.</div>
      )}
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center justify-between gap-3 px-4 py-2.5 ${
            index < items.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</span>
            <span className="truncate text-[13px]">{item.prompt}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove touchpoint"
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.id)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-border bg-background/50 px-4 py-3">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add.mutate();
          }}
          placeholder={callType === "Activity" ? "Confirm today's exercise" : "Ask about the grandkids"}
          className="h-9"
        />
        <Button type="button" size="icon" aria-label={`Add ${callType} touchpoint`} disabled={add.isPending} onClick={() => add.mutate()}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}
