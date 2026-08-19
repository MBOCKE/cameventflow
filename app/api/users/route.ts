// app/api/users/route.ts
// POST /api/users
// Body: { supabaseId, email, name, role }
//
// Creates a new User row in PostgreSQL linked to a Supabase auth account.
// Uses upsert (create-or-ignore) so it is safe to call multiple times —
// from signup, from the auth callback, and from onAuthStateChange.
// Returns 200 for existing users and 201 for newly created ones.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supabaseId, email, name, role } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!supabaseId || !email || !name) {
      return NextResponse.json(
        { error: "Missing required fields: supabaseId, email, name." },
        { status: 400 }
      );
    }

    const resolvedRole = role === "VENDOR" ? "VENDOR" : "PLANNER";

    // ── Check if user already exists ──────────────────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true, role: true },
    });

    if (existing) {
      // Already exists – return the existing record without modifications
      return NextResponse.json(
        { message: "User already exists.", userId: existing.id, created: false },
        { status: 200 }
      );
    }

    // ── Create the user ───────────────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        supabaseId,
        email,
        name,
        role: resolvedRole,
      },
      select: { id: true, role: true, name: true },
    });

    return NextResponse.json(
      { message: "User created.", userId: user.id, role: user.role, created: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/users]", error);
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}
