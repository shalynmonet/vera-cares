import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Vera" },
      { name: "description", content: "Choose a new password for your Vera staff account." },
      { property: "og:title", content: "Set a new password — Vera" },
      { property: "og:description", content: "Choose a new password for your Vera staff account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/residents", replace: true });
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pattern-houndstooth h-1.5 w-full text-foreground/10" />
      <main className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-4xl font-bold tracking-tighter">Set a new password</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
          <div>
            <Label htmlFor="new-password" className="font-mono text-[9px] uppercase tracking-widest text-muted">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
      </main>
    </div>
  );
}
