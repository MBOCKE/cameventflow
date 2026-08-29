// lib/supabase.ts
// SERVER-ONLY exports — safe to import in Server Components and Route Handlers.
// Do NOT import this file from any "use client" component.
//
// For client components, import from "@/lib/supabase.client" instead.

import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Server client (Server Components / Route Handlers) ───────────────────────
// Always call inside an async Server Component or Route Handler so that
// cookies() has access to the current request context.
export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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
