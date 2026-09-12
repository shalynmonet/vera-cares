import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { ResidentExercise } from "@/lib/vera";

export function DailyExercises({
  residentId,
  exercises,
}: {
  residentId: string;
  exercises: ResidentExercise[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [minutes, setMinutes] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["exercises", residentId] });

  const add = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Give the exercise a name.");
      const parsed = minutes ? Number(minutes) : null;
      if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1 || parsed > 1440)) {
        throw new Error("Length must be between 1 and 1,440 minutes.");
      }
      const { error } = await supabase.from("resident_exercises").insert({
        resident_id: residentId,
        name: trimmed,
        instructions: instructions.trim() || null,
        duration_minutes: parsed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setInstructions("");
      setMinutes("");
      invalidate();
      toast.success("Exercise added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resident_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Exercise removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="rise mt-12 [animation-delay:360ms]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Custom daily exercises</h2>
          <p className="mt-2 text-[13px] text-muted">
            Saved exercises for this person. They appear as suggestions in the weekly schedule.
          </p>
        </div>
        <div className="pattern-houndstooth size-5 text-accent/20" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {exercises.length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-muted">No exercises saved yet.</div>
        )}
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className={`flex items-start justify-between gap-4 px-4 py-3 ${
              index < exercises.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="text-[14px] font-semibold">{exercise.name}</div>
              {exercise.instructions && (
                <div className="text-[13px] text-muted">{exercise.instructions}</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {exercise.duration_minutes ? (
                <span className="rounded-sm border border-accent/20 bg-accent-soft px-2 py-0.5 font-mono text-[9px] uppercase text-accent">
                  {exercise.duration_minutes} min
                </span>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${exercise.name}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(exercise.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}

        <div className="grid gap-3 border-t border-border bg-background/50 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_110px_44px] md:items-end">
          <div>
            <Label className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-muted">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chair stretches" className="h-9" />
          </div>
          <div>
            <Label className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-muted">
              How to do it
            </Label>
            <Textarea
              rows={1}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Seated, slow arm raises, breathe steadily"
              className="min-h-9"
            />
          </div>
          <div>
            <Label className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-muted">Minutes</Label>
            <Input
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="15"
              className="h-9"
            />
          </div>
          <Button
            type="button"
            size="icon"
            aria-label="Add exercise"
            disabled={add.isPending}
            onClick={() => add.mutate()}
            className="justify-self-end"
          >
            <Plus />
          </Button>
        </div>
      </div>
    </section>
  );
}
