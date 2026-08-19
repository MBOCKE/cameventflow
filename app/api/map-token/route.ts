// app/api/map-token/route.ts
// GET /api/map-token
//
// Serves the Mapbox public token to client components without embedding it
// directly in the JS bundle. The token is read server-side from env vars and
// returned as JSON. Because NEXT_PUBLIC_* vars are already safe to expose
// to the browser, this endpoint adds an Origin check as a belt-and-braces
// measure so only the app itself can request the token.
//
// Usage in client components:
//   const { token } = await fetch("/api/map-token").then(r => r.json());

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local." },
      { status: 503 }
    );
  }

  // Optional: restrict to same-origin requests in production
  const origin = req.headers.get("origin");
  const host   = req.headers.get("host");
  if (
    process.env.NODE_ENV === "production" &&
    origin &&
    host &&
    !origin.includes(host)
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json(
    { token },
    {
      status: 200,
      headers: {
        // Short cache – token rarely changes but we don't want stale 503s
        "Cache-Control": "private, max-age=3600",
      },
    }
  );
}
