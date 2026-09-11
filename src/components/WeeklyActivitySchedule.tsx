import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { DAYS_OF_WEEK, type WeeklyActivitySchedule as ActivityDay } from "@/lib/vera";

export function WeeklyActivitySchedule({ schedule }: { schedule: ActivityDay[] }) {
  return (
    <section className="rise mt-12 [animation-delay:350ms]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Weekly activity schedule</h2>
          <p className="mt-2 text-[13px] text-muted">Update and save one day at a time.</p>
        </div>
        <div className="pattern-houndstooth size-5 text-accent/20" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[100px_minmax(0,1fr)_120px_92px_44px] gap-3 border-b border-border bg-background/60 px-4 py-2.5 font-mono text-[9px] uppercase tracking-widest text-muted md:grid">
          <span>Day</span>
          <span>Activity</span>
          <span>Minutes</span>
          <span>Rest day</span>
          <span className="sr-only">Save</span>
        </div>
        {schedule.map((day, index) => (
          <ActivityDayRow key={day.id} day={day} isLast={index === schedule.length - 1} />
        ))}
        {schedule.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px] text-muted">Loading weekly schedule…</div>
        )}
      </div>
    </section>
  );
}

function ActivityDayRow({ day, isLast }: { day: ActivityDay; isLast: boolean }) {
  const [description, setDescription] = useState(day.activity_description ?? "");
  const [duration, setDuration] = useState(day.duration_minutes?.toString() ?? "");
  const [isRestDay, setIsRestDay] = useState(day.is_rest_day);
  const queryClient = useQueryClient();

  useEffect(() => {
    setDescription(day.activity_description ?? "");
    setDuration(day.duration_minutes?.toString() ?? "");
    setIsRestDay(day.is_rest_day);
  }, [day]);

  const isDirty =
    description !== (day.activity_description ?? "") ||
    duration !== (day.duration_minutes?.toString() ?? "") ||
    isRestDay !== day.is_rest_day;

  const save = useMutation({
    mutationFn: async () => {
      const trimmedDescription = description.trim();
      const parsedDuration = Number(duration);
      if (!isRestDay && !trimmedDescription) throw new Error("Add an activity description.");
      if (!isRestDay && (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 1440)) {
        throw new Error("Duration must be between 1 and 1,440 minutes.");
      }

      const { error } = await supabase
        .from("weekly_activity_schedules")
        .update({
          activity_description: isRestDay ? null : trimmedDescription,
          duration_minutes: isRestDay ? null : parsedDuration,
          is_rest_day: isRestDay,
        })
        .eq("id", day.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-activities", day.resident_id] });
      toast.success(`${DAYS_OF_WEEK[day.day_of_week - 1]} updated`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const dayName = DAYS_OF_WEEK[day.day_of_week - 1] ?? `Day ${day.day_of_week}`;

  return (
    <div
      className={`grid gap-3 px-4 py-4 md:grid-cols-[100px_minmax(0,1fr)_120px_92px_44px] md:items-center ${
        isLast ? "" : "border-b border-border"
      }`}
    >
      <div className="font-display text-base font-semibold">{dayName}</div>
      <div>
        <Label htmlFor={`activity-${day.id}`} className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-muted md:sr-only">
          Activity
        </Label>
        <Input
          id={`activity-${day.id}`}
          value={description}
          disabled={isRestDay}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={isRestDay ? "No activity scheduled" : "15 min stretching routine"}
          className="h-9"
        />
      </div>
      <div>
        <Label htmlFor={`duration-${day.id}`} className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-muted md:sr-only">
          Duration (minutes)
        </Label>
        <Input
          id={`duration-${day.id}`}
          type="number"
          min={1}
          max={1440}
          step={1}
          value={duration}
          disabled={isRestDay}
          onChange={(event) => setDuration(event.target.value)}
          placeholder="Minutes"
          className="h-9"
        />
      </div>
      <div className="flex items-center justify-between gap-3 md:justify-start">
        <Label htmlFor={`rest-${day.id}`} className="font-mono text-[9px] uppercase tracking-widest text-muted md:sr-only">
          Rest day
        </Label>
        <Switch
          id={`rest-${day.id}`}
          checked={isRestDay}
          onCheckedChange={(checked) => {
            setIsRestDay(checked);
            if (checked) {
              setDescription("");
              setDuration("");
            }
          }}
          aria-label={`${dayName} rest day`}
        />
        <span className="text-xs text-muted md:hidden">Rest day</span>
      </div>
      <Button
        type="button"
        variant={isDirty ? "default" : "ghost"}
        size="icon"
        disabled={!isDirty || save.isPending}
        onClick={() => save.mutate()}
        aria-label={`Save ${dayName}`}
        title={`Save ${dayName}`}
        className="justify-self-end"
      >
        <Save />
      </Button>
    </div>
  );
}