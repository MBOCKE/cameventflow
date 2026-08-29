"use client";

// app/login/page.tsx  –  Sign In  (/login)

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CalendarDays, MailCheck } from "lucide-react";
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

// Map Supabase error messages to human-friendly copy
function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("email not confirmed"))
    return "Your email hasn't been confirmed yet. Check your inbox for the confirmation link.";
  if (m.includes("invalid login credentials") || m.includes("invalid email or password"))
    return "Incorrect email or password. Please try again.";
  if (m.includes("too many requests"))
    return "Too many attempts. Please wait a moment and try again.";
  return msg;
}

// Wrap in Suspense because useSearchParams() requires it in Next.js 15
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  // Show a gentle notice when the user lands here after email confirmation
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  // Surface errors passed via query string (e.g. from auth callback)
  const callbackError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Detect the "email not confirmed" case so we can offer a resend link
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmedEmail(email);
      }
      setError(friendlyError(authError.message));
      setLoading(false);
      return;
    }

    // Sync the DB user row in case it wasn't created at signup time
    if (data.user) {
      const name = (data.user.user_metadata?.name as string | undefined) ?? data.user.email ?? "User";
      const role = (data.user.user_metadata?.role as string | undefined) === "VENDOR"
        ? "VENDOR"
        : "PLANNER";
      try {
        await fetch("/api/users", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseId: data.user.id,
            email:      data.user.email,
            name,
            role,
          }),
        });
      } catch {
        // Non-fatal
      }
    }

    // Respect ?next= redirect param set by middleware, fall back to /dashboard
    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
    router.refresh();
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return;
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resend({
      type:  "signup",
      email: unconfirmedEmail,
    });
    if (error) {
      setError("Could not resend confirmation email: " + error.message);
    } else {
      setError(null);
      alert(`Confirmation email resent to ${unconfirmedEmail}. Check your inbox.`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <CalendarDays className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">CamEventFlow</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Callback error banner (e.g. auth_failed from /api/auth/callback) */}
        {callbackError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {callbackError === "auth_failed"
              ? "The confirmation link has expired or is invalid. Please sign up again."
              : callbackError === "missing_code"
              ? "Something went wrong with the confirmation link. Try signing in directly."
              : "An error occurred. Please try again."}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your email and password to continue.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">

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
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
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

              {/* Error + optional resend link */}
              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive" role="alert">{error}</p>
                  {unconfirmedEmail && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
                    >
                      <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Resend confirmation email
                    </button>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</>
                  : "Sign In"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
