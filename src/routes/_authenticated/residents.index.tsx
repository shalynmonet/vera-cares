import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ResidentDialog } from "@/components/ResidentDialog";
import {
  allSchedulesQuery,
  formatDateTime,
  initials,
  residentsQuery,
  type CallSchedule,
} from "@/lib/vera";

export const Route = createFileRoute("/_authenticated/residents/")({
  head: () => ({
    meta: [
      { title: "User profiles — Vera Care Intelligence" },
      {
        name: "description",
        content:
          "Vera tracks people receiving scheduled wellness phone calls: profiles, call schedules, and call history in one place.",
      },
      { property: "og:title", content: "User profiles — Vera Care Intelligence" },
      {
        property: "og:description",
        content: "Profiles, call schedules, and call history for every user profile in your care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function nextCall(schedules: CallSchedule[], residentId: string) {
  const upcoming = schedules
    .filter((s) => s.resident_id === residentId && s.next_call_at)
    .sort((a, b) => (a.next_call_at! < b.next_call_at! ? -1 : 1));
  return upcoming[0] ?? null;
}

function Dashboard() {
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const residents = useQuery(residentsQuery);
  const schedules = useQuery(allSchedulesQuery);

  return (
    <AppShell>
      <main className="pt-10 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Care Registry</div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tighter text-balance sm:text-6xl">
              User profiles
            </h1>
            <p className="max-w-md pt-2 text-[15px] text-muted">
              Everyone receiving scheduled wellness calls, with their next call and most recent outcome.
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="group relative overflow-hidden rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:pr-8"
          >
            <span className="relative z-10">New enrollment</span>
            <div className="absolute inset-y-0 right-0 w-0 bg-accent transition-all group-hover:w-full" />
          </button>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {residents.isLoading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}

          {residents.data?.map((resident, index) => {
            const upcoming = nextCall(schedules.data ?? [], resident.id);
            return (
              <Link
                key={resident.id}
                to="/residents/$residentId"
                params={{ residentId: resident.id }}
                className="rise group rounded-2xl border border-border bg-surface p-5 transition-transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-11 place-items-center rounded-lg bg-muted/15 font-display text-sm font-bold text-muted transition-colors group-hover:bg-accent group-hover:text-background">
                    {initials(resident.name)}
                  </div>
                  <div className="pattern-houndstooth size-4 text-border" />
                </div>
                <div className="mt-4 font-display text-xl font-semibold leading-tight">{resident.name}</div>
                <div className="mt-1 text-[13px] text-muted">{resident.living_situation}</div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Next</span>
                  <span className="font-mono text-[11px]">
                    {upcoming ? formatDateTime(upcoming.next_call_at) : "Not scheduled"}
                  </span>
                </div>
              </Link>
            );
          })}

          {residents.data?.length === 0 && (
            <button
              onClick={() => setAdding(true)}
              className="flex h-40 w-full items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
            >
              + Add your first user profile
            </button>
          )}
        </div>
      </main>

      <ResidentDialog
        open={adding}
        onOpenChange={setAdding}
        onCreated={(id) => navigate({ to: "/residents/$residentId", params: { residentId: id } })}
      />
    </AppShell>
  );
}
