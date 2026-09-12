import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vera — Wellness Call Care Registry" },
      {
        name: "description",
        content:
          "Vera helps care teams track people receiving scheduled wellness phone calls, with user profiles, schedules and call history.",
      },
      { property: "og:title", content: "Vera — Wellness Call Care Registry" },
      {
        property: "og:description",
        content: "A private care registry for scheduled wellness calls. Staff sign-in required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pattern-houndstooth h-1.5 w-full text-foreground/10" />
      <main className="mx-auto flex max-w-3xl flex-col items-start px-6 py-24 sm:py-32">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="grid size-11 place-items-center rounded-sm bg-foreground font-display text-2xl font-bold text-background">
              V
            </div>
            <div className="pattern-houndstooth absolute -right-1 -bottom-1 size-3 text-accent" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold leading-none tracking-tight">Vera</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted">
              Care Intelligence
            </div>
          </div>
        </div>

        <h1 className="mt-12 font-display text-5xl font-bold leading-tight tracking-tighter text-balance sm:text-6xl">
          Scheduled wellness calls, kept in one calm place.
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
          Resident profiles, family and caregiver contacts, weekly activity plans and full call
          history. Resident information is private and only visible to signed-in staff.
        </p>

        <Link
          to="/auth"
          className="group relative mt-10 overflow-hidden rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background transition-all hover:pr-9"
        >
          <span className="relative z-10">Staff sign in</span>
          <div className="absolute inset-y-0 right-0 w-0 bg-accent transition-all group-hover:w-full" />
        </Link>
      </main>
    </div>
  );
}
