// lib/supabase.client.ts
// BROWSER-ONLY exports — safe to import from "use client" components.
// Does NOT import next/headers, so it never breaks client-side rendering.

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser client ────────────────────────────────────────────────────────────
export function createBrowserClient() {
  return _createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Auth state listener ───────────────────────────────────────────────────────
// Call initAuthListener() inside a single "use client" root component
// (AuthProvider). On every SIGNED_IN event it fires POST /api/users so the
// DB User row is created regardless of auth method used.
// Returns the unsubscribe function for cleanup on unmount.
export function initAuthListener(): () => void {
  const supabase = createBrowserClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      const { user } = session;
      const name =
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        "User";
      const role =
        (user.user_metadata?.role as string | undefined) === "VENDOR"
          ? "VENDOR"
          : "PLANNER";

      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseId: user.id,
            email: user.email,
            name,
            role,
          }),
        });
      } catch (err) {
        console.warn("[onAuthStateChange] /api/users call failed:", err);
      }
    }
  });

  return () => subscription.unsubscribe();
}
