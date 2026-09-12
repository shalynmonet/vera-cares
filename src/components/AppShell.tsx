import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-accent/20">
      <div className="pattern-houndstooth h-1.5 w-full text-foreground/10" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-border/60 py-5">
          <Link to="/residents" className="flex items-center gap-4">
            <div className="relative">
              <div className="grid size-10 place-items-center rounded-sm bg-foreground font-display text-xl font-bold text-background">
                V
              </div>
              <div className="pattern-houndstooth absolute -right-1 -bottom-1 size-3 text-accent" />
            </div>
            <div>
              <div className="font-display text-xl font-bold leading-none tracking-tight">Vera</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted">
                Care Intelligence
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-[13px] font-medium">
            <Link
              to="/residents"
              className="relative text-foreground after:absolute after:-bottom-5 after:left-0 after:h-0.5 after:w-full after:bg-accent"
            >
              User profiles
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
