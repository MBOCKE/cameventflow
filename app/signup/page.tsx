"use client";

// app/signup/page.tsx  –  Sign Up  (/signup)
// Creates a Supabase auth account then immediately POSTs to /api/users
// to create the internal PostgreSQL User row.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CalendarDays, Building2, User } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();

    // 1. Create Supabase auth account
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Pass role and name as metadata so the callback can use them
        data: { name, role },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. If a session was returned immediately (email confirm disabled),
    //    create the DB user row right now. Otherwise the callback route handles it.
    if (data.user) {
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
        // Non-fatal – the callback or onAuthStateChange will retry
        console.warn("[signup] /api/users call failed; will retry via onAuthStateChange.");
      }
    }

    // 3. Redirect based on role
    if (role === "VENDOR") {
      router.push("/onboarding/vendor");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
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
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Choose your role, then fill in your details.
            </CardDescription>
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
                    {showPw
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
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
