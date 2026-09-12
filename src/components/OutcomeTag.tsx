import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { OUTCOMES, outcomeClasses, type CallLog } from "@/lib/vera";

export function OutcomeTag({ log }: { log: CallLog }) {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: async (outcome: string) => {
      const { error } = await supabase.from("call_logs").update({ outcome }).eq("id", log.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs", log.resident_id] });
      toast.success("Outcome updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <span
      className={`relative ml-3 shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${outcomeClasses(
        log.outcome,
      )}`}
    >
      {log.outcome}
      <select
        aria-label="Change call outcome"
        value={log.outcome}
        disabled={update.isPending}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          update.mutate(e.target.value);
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {OUTCOMES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </span>
  );
}
