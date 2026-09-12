import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff sign in — Vera" },
      {
        name: "description",
        content: "Sign in to Vera to view user profiles, wellness call schedules and call history.",
      },
      { property: "og:title", content: "Staff sign in — Vera" },
      { property: "og:description", content: "Private staff access to the Vera care registry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/residents", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/residents", replace: true });
  }

  async function handleReset() {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent.");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pattern-houndstooth h-1.5 w-full text-foreground/10" />
      <main className="mx-auto flex max-w-md flex-col px-6 py-20">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-sm bg-foreground font-display text-lg font-bold text-background">
            V
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Vera</span>
        </Link>

        <h1 className="mt-12 font-display text-4xl font-bold tracking-tighter">Staff sign in</h1>
        <p className="mt-3 text-[15px] text-muted">
          Vera is invite only. Accounts are created by an administrator.
        </p>

        <form onSubmit={handleSignIn} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
          <div>
            <Label htmlFor="email" className="font-mono text-[9px] uppercase tracking-widest text-muted">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password" className="font-mono text-[9px] uppercase tracking-widest text-muted">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="w-full text-center font-mono text-[10px] uppercase tracking-widest text-muted hover:text-foreground"
          >
            {resetting ? "Sending…" : "Forgot password"}
          </button>
        </form>
      </main>
    </div>
  );
}
