// app/api/auth/callback/route.ts
// Handles the Supabase Auth redirect after:
//   - Email confirmation (user clicks the link in their inbox)
//   - OAuth sign-in (Google, GitHub, etc. – for future use)
//
// Flow:
//   1. Exchange the `code` query param for a Supabase session (PKCE flow)
//   2. Upsert the internal PostgreSQL User row via POST /api/users
//   3. Redirect to /onboarding/vendor (VENDOR) or /dashboard (PLANNER / fallback)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // `next` can be passed as a custom redirect param from the middleware
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    // No code – just redirect to login with an error hint
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange the code for a session (sets the auth cookies)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] Code exchange failed:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { user } = data;

  // Pull name and role from the user_metadata set during signUp()
  const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? "User";
  const role = (user.user_metadata?.role as string | undefined) === "VENDOR"
    ? "VENDOR"
    : "PLANNER";

  // Upsert the DB User row – fire-and-forget with error isolation
  try {
    await fetch(`${origin}/api/users`, {
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
    console.error("[auth/callback] /api/users upsert failed:", err);
    // Non-fatal – the user is authenticated; DB row creation will be retried
  }

  // Redirect VENDOR users to onboarding, everyone else to intended destination
  const destination = role === "VENDOR" ? "/onboarding/vendor" : next;
  return NextResponse.redirect(`${origin}${destination}`);
}
