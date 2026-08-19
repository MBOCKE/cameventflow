// lib/supabase.ts
// Exports:
//   createBrowserClient()   – Client Components (browser)
//   createServerClient()    – Server Components / Route Handlers (cookies)
//   getSupabaseUser()       – Server-side auth check helper
//   initAuthListener()      – Call once in a root Client Component to sync
//                             Supabase auth state → PostgreSQL User row

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser client (Client Components) ───────────────────────────────────────
export function createBrowserClient() {
  return _createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Server client (Server Components / Route Handlers) ───────────────────────
export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Middleware handles the session refresh in that case.
        }
      },
    },
  });
}

// ─── Helper: get the currently authenticated Supabase user (server-side) ──────
export async function getSupabaseUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

// ─── Auth state listener (browser only) ───────────────────────────────────────
// Call initAuthListener() inside a single "use client" component that is
// mounted at the root (e.g. a <AuthProvider> inside app/layout.tsx).
//
// On every SIGNED_IN event it fires POST /api/users so the PostgreSQL row
// exists regardless of how the user authenticated (email+password, OAuth,
// magic link, or email confirmation callback).
//
// Returns the unsubscribe function so the caller can clean up on unmount.

export function initAuthListener(): () => void {
  const supabase = createBrowserClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { user } = session;
        const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? "User";
        const role = (user.user_metadata?.role as string | undefined) === "VENDOR"
          ? "VENDOR"
          : "PLANNER";

        try {
          await fetch("/api/users", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supabaseId: user.id,
              email:      user.email,
              name,
              role,
            }),
          });
        } catch (err) {
          // Non-fatal – the row may already exist (POST /api/users is idempotent)
          console.warn("[onAuthStateChange] /api/users call failed:", err);
        }
      }
    }
  );

  return () => subscription.unsubscribe();
}
