import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Nexus PMO" },
      { name: "description", content: "Sign in or create an account to access your PMO workspace." },
      { property: "og:title", content: "Sign in — Nexus PMO" },
      { property: "og:description", content: "Access your Nexus PMO workspace securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        router.invalidate();
        navigate({ to: "/" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const next: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "email" || key === "password") && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setBusy(true);
    try {
      // Try sign-in first; if the account doesn't exist, auto-create it.
      const { error: signInErr } = await supabase.auth.signInWithPassword(parsed.data);
      if (!signInErr) {
        // signed in
      } else if (signInErr.message.toLowerCase().includes("invalid login credentials") || mode === "signup") {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (signUpErr) throw signUpErr;
        // Auto-confirm is on, so sign in immediately
        const { error: retry } = await supabase.auth.signInWithPassword(parsed.data);
        if (retry) throw retry;
        toast.success("Account created — welcome!");
      } else {
        throw signInErr;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md glass-card p-6">
        <header className="mb-5 text-center">
          <h1 className="text-xl font-semibold text-foreground">Nexus PMO</h1>
          <p className="mt-1 text-xs text-muted-foreground">Sign in to manage your portfolio</p>
        </header>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
          <TabsList className="w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value={mode} className="mt-4">
            <form onSubmit={submit} className="grid gap-3">
              <Field label="Email" htmlFor="email" required error={errors.email}>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }} />
              </Field>
              <Field label="Password" htmlFor="password" required error={errors.password}>
                <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }} />
              </Field>
              <Button type="submit" disabled={busy} className="mt-1 bg-accent text-accent-foreground hover:bg-accent/90">
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
