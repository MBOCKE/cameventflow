"use client";

// app/signup/page.tsx  –  Sign Up  (/signup)

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Loader2, CalendarDays,
  Building2, User, MailCheck,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Role = "PLANNER" | "VENDOR";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<Role>("PLANNER");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  // When Supabase requires email confirmation, we show this screen instead
  // of redirecting so the user knows what to do next.
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Supabase returns a user but NO session when email confirmation is on.
    // data.session === null means "check your inbox".
    if (data.user && !data.session) {
      setAwaitingConfirmation(true);
      setLoading(false);
      return;
    }

    // Session exists → email confirmation is disabled, user is signed in now.
    if (data.user && data.session) {
      try {
        await fetch("/api/users", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseId: data.user.id,
            email:      data.user.email ?? email,
            name,
            role,
          }),
        });
      } catch {
        console.warn("[signup] /api/users call failed; will retry via onAuthStateChange.");
      }

      router.push(role === "VENDOR" ? "/onboarding/vendor" : "/dashboard");
      router.refresh();
    }
  }

  // ── Email confirmation waiting screen ─────────────────────────────────────
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground text-sm max-w-xs">
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click it to activate your account, then come back and sign in.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder, or{" "}
                <button
                  className="text-primary underline underline-offset-2"
                  onClick={async () => {
                    const supabase = createBrowserClient();
                    await supabase.auth.resend({ type: "signup", email });
                    alert("Confirmation email resent.");
                  }}
                >
                  resend it
                </button>
                .
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Go to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Sign up form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6">

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <CalendarDays className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">CamEventFlow</h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Choose your role, then fill in your details.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">

              {/* Role toggle */}
              <div className="space-y-1.5">
                <Label>I am a…</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["PLANNER", "VENDOR"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        role === r
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-input bg-background text-muted-foreground hover:bg-accent"
                      )}
                      aria-pressed={role === r}
                    >
                      {r === "PLANNER"
                        ? <User className="h-5 w-5" aria-hidden="true" />
                        : <Building2 className="h-5 w-5" aria-hidden="true" />}
                      {r === "PLANNER" ? "Event Planner" : "Vendor"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {role === "PLANNER"
                    ? "You want to find and book vendors for your events."
                    : "You offer a service and want to receive booking requests."}
                </p>
              </div>

              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Jean-Pierre Mbarga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating account…</>
                  : role === "VENDOR" ? "Create Account & Set Up Profile" : "Create Account"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
