import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CallLogDialog } from "@/components/CallLogDialog";
import { CallSummaryDialog } from "@/components/CallSummaryDialog";
import { CallTouchpoints } from "@/components/CallTouchpoints";
import { DailyExercises } from "@/components/DailyExercises";
import { ResidentDialog } from "@/components/ResidentDialog";
import { CaregiverAccess } from "@/components/CaregiverAccess";
import { OutcomeTag } from "@/components/OutcomeTag";
import { ScheduleDialog } from "@/components/ScheduleDialog";
import { WeeklyActivitySchedule } from "@/components/WeeklyActivitySchedule";
import {
  exercisesQuery,
  formatDateTime,
  initials,
  logsQuery,
  residentQuery,
  residentsQuery,
  schedulesQuery,
  touchpointsQuery,
  weeklyActivitiesQuery,
  type CallLog,
  type CallSchedule,
} from "@/lib/vera";

export const Route = createFileRoute("/_authenticated/residents/$residentId")({
  head: () => ({
    meta: [
      { title: "User profile — Vera" },
      {
        name: "description",
        content:
          "User profile with contacts, personalization notes, upcoming wellness calls, and full call history.",
      },
      { property: "og:title", content: "User profile — Vera" },
      {
        property: "og:description",
        content: "Contacts, notes, upcoming wellness calls, and call history for one person.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResidentProfile,
});

function ResidentProfile() {
  const { residentId } = Route.useParams();
  const [editing, setEditing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [editSchedule, setEditSchedule] = useState<CallSchedule | null>(null);
  const [openLog, setOpenLog] = useState<CallLog | null>(null);

  const resident = useQuery(residentQuery(residentId));
  const schedules = useQuery(schedulesQuery(residentId));
  const logs = useQuery(logsQuery(residentId));
  const allResidents = useQuery(residentsQuery);
  const weeklyActivities = useQuery(weeklyActivitiesQuery(residentId));
  const exercises = useQuery(exercisesQuery(residentId));
  const touchpoints = useQuery(touchpointsQuery(residentId));

  if (resident.isLoading) {
    return (
      <AppShell>
        <div className="py-20 font-mono text-xs uppercase tracking-widest text-muted">Loading profile…</div>
      </AppShell>
    );
  }

  if (!resident.data) {
    return (
      <AppShell>
        <div className="space-y-4 py-20">
          <h1 className="font-display text-3xl font-bold">User profile not found</h1>
          <Link to="/residents" className="font-mono text-xs uppercase tracking-widest text-accent">
            Back to registry
          </Link>
        </div>
      </AppShell>
    );
  }

  const r = resident.data;
  const social = schedules.data?.find((s) => s.call_type === "Social Check-In") ?? null;
  const activity = schedules.data?.find((s) => s.call_type === "Activity") ?? null;

  return (
    <AppShell>
      <main className="grid gap-10 pb-20 lg:grid-cols-[1fr_300px]">
        <section className="pt-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                <Link to="/residents" className="hover:text-foreground">
                  User profiles
                </Link>
                <span className="opacity-30">/</span>
                <span className="text-foreground">{r.name}</span>
              </div>
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tighter text-balance sm:text-6xl">
                {r.name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium">
                  <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                  {r.living_situation}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
                >
                  Edit profile
                </button>
              </div>
            </div>
            <button
              onClick={() => setLogging(true)}
              className="group relative overflow-hidden rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:pr-8"
            >
              <span className="relative z-10">Log a call</span>
              <div className="absolute inset-y-0 right-0 w-0 bg-accent transition-all group-hover:w-full" />
            </button>
          </div>

          <div className="mt-10 grid gap-1">
            <div className="rise grid overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-2 [animation-delay:100ms]">
              <div className="border-b border-border p-6 sm:border-r sm:border-b-0">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {r.caregiver_relationship || "Family contact"}
                  </span>
                  <div className="pattern-houndstooth size-4 text-border" />
                </div>
                <div className="font-display text-lg font-semibold">{r.family_contact_name || "—"}</div>
                <div className="mt-2 font-mono text-xs text-muted">{r.family_contact_info || "No contact details"}</div>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {r.caregiver_relationship || "Caregiver contact"}
                  </span>
                  <div className="pattern-houndstooth size-4 text-border" />
                </div>
                <div className="font-display text-lg font-semibold">{r.caregiver_contact_name || "—"}</div>
                <div className="mt-2 font-mono text-xs text-muted">
                  {r.caregiver_contact_info || "No contact details"}
                </div>
              </div>
            </div>

            <div className="rise relative overflow-hidden rounded-2xl border border-border bg-surface p-6 [animation-delay:200ms]">
              <div className="pattern-houndstooth absolute top-0 right-0 h-full w-12 text-foreground/[0.03]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Interests &amp; notes</span>
              <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-pretty">
                {r.interests_notes || "No personalization notes yet."}
              </p>
            </div>

            <div className="rise rounded-2xl border border-bad/30 bg-bad-soft p-6 [animation-delay:250ms]">
              <span className="font-mono text-[10px] uppercase tracking-widest text-bad">Emergency criteria</span>
              <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-pretty">
                {r.emergency_criteria || "No emergency criteria recorded yet."}
              </p>
            </div>
          </div>

          <WeeklyActivitySchedule
            schedule={weeklyActivities.data ?? []}
            exercises={exercises.data ?? []}
          />

          <DailyExercises residentId={r.id} exercises={exercises.data ?? []} />

          <CallTouchpoints residentId={r.id} touchpoints={touchpoints.data ?? []} />

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rise [animation-delay:300ms]">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Upcoming calls</h2>
              <div className="space-y-3">
                <ScheduleCard
                  title="Social Check-In"
                  schedule={social}
                  detail="Conversation and companionship"
                  onEdit={() => social && setEditSchedule(social)}
                />
                <ScheduleCard
                  title="Activity Call"
                  schedule={activity}
                  detail={activity?.activity_description || "No activity described"}
                  onEdit={() => activity && setEditSchedule(activity)}
                />
              </div>
            </div>

            <div className="rise [animation-delay:400ms]">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Call history</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {logs.data?.length === 0 && (
                  <div className="px-4 py-6 text-center text-[13px] text-muted">No calls logged yet.</div>
                )}
                {logs.data?.map((log, index) => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setOpenLog(log)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent-soft/30 ${
                      index < (logs.data?.length ?? 0) - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[13px] font-medium">{log.call_type}</div>
                      <div className="font-mono text-[10px] text-muted">{formatDateTime(log.occurred_at)}</div>
                      {log.notes && <div className="truncate text-[12px] text-muted">{log.notes}</div>}
                    </div>
                    <OutcomeTag log={log} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="pt-10">
          <div className="sticky top-10 space-y-5">
            <CaregiverAccess residentId={r.id} />
            <div className="rise rounded-2xl border border-border bg-surface p-5 [animation-delay:500ms]">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Care Registry</span>
                <div className="pattern-houndstooth size-4 text-accent/20" />
              </div>
              <div className="grid gap-2">
                {allResidents.data?.map((other) =>
                  other.id === r.id ? (
                    <div
                      key={other.id}
                      className="flex w-full items-center gap-3 rounded-xl bg-foreground p-3 text-left text-background ring-2 ring-foreground"
                    >
                      <div className="grid size-9 place-items-center rounded-lg bg-background font-display text-sm font-bold text-foreground">
                        {initials(other.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold">{other.name}</div>
                        <div className="font-mono text-[9px] opacity-60">Active profile</div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={other.id}
                      to="/residents/$residentId"
                      params={{ residentId: other.id }}
                      className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-background"
                    >
                      <div className="grid size-9 place-items-center rounded-lg bg-muted/15 font-display text-sm font-bold text-muted group-hover:bg-accent group-hover:text-background">
                        {initials(other.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium">{other.name}</div>
                        <div className="font-mono text-[9px] text-muted">{other.living_situation}</div>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <ResidentDialog open={editing} onOpenChange={setEditing} resident={r} />
      <CallLogDialog open={logging} onOpenChange={setLogging} residentId={r.id} />
      <ScheduleDialog
        open={editSchedule !== null}
        onOpenChange={(open) => !open && setEditSchedule(null)}
        schedule={editSchedule}
      />
      <CallSummaryDialog
        open={openLog !== null}
        onOpenChange={(open) => !open && setOpenLog(null)}
        log={openLog}
        touchpoints={touchpoints.data ?? []}
      />
    </AppShell>
  );
}

function ScheduleCard({
  title,
  schedule,
  detail,
  onEdit,
}: {
  title: string;
  schedule: CallSchedule | null;
  detail: string;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className="w-full rounded-xl border border-border bg-surface p-4 text-left transition-transform hover:-translate-y-1"
    >
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold">{title}</span>
        <span className="rounded-sm border border-accent/20 bg-accent-soft px-2 py-0.5 font-mono text-[9px] uppercase text-accent">
          {schedule?.frequency ?? "Not set"}
        </span>
      </div>
      <div className="mt-3 text-[13px] text-muted">{detail}</div>
      <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
        <span className="font-mono text-[11px] text-muted">
          Next: {schedule ? formatDateTime(schedule.next_call_at) : "—"}
        </span>
        <span className="text-[11px] font-medium">{schedule?.preferred_time ?? "—"}</span>
      </div>
    </button>
  );
}
