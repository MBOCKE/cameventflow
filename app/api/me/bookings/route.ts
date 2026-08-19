// app/api/me/bookings/route.ts
// GET /api/me/bookings
// Returns all bookings relevant to the logged-in user.
//   - PLANNER → bookings they created (plannerId = user.id)
//   - VENDOR  → bookings on their vendor profile (vendor.userId = user.id)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser } from "@/lib/supabase";

export async function GET() {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { vendor: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // ── PLANNER: return bookings they made ────────────────────────────────────
    if (user.role === "PLANNER") {
      const bookings = await prisma.booking.findMany({
        where: { plannerId: user.id },
        include: {
          vendor: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
        orderBy: { eventDate: "asc" },
      });
      return NextResponse.json({ role: "PLANNER", bookings }, { status: 200 });
    }

    // ── VENDOR: return incoming bookings on their profile ─────────────────────
    if (user.role === "VENDOR") {
      if (!user.vendor) {
        // Vendor account exists but profile not yet created
        return NextResponse.json(
          { role: "VENDOR", bookings: [] },
          { status: 200 }
        );
      }

      const bookings = await prisma.booking.findMany({
        where: { vendorId: user.vendor.id },
        include: {
          planner: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { eventDate: "asc" },
      });
      return NextResponse.json({ role: "VENDOR", bookings }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown role." }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/me/bookings]", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings." },
      { status: 500 }
    );
  }
}
