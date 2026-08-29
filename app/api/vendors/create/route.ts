// app/api/vendors/create/route.ts
// POST /api/vendors/create
// Body: { category, city, basePrice, description, profileImageUrl?, latitude?, longitude? }
//
// Creates a Vendor row in the DB linked to the authenticated user.
// Returns 409 if the user already has a vendor profile.
//
// Note: VendorCategory and City are plain strings in the MySQL schema
// (SQLite/MySQL don't support Prisma enums). Validation is done against
// hard-coded arrays instead.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser } from "@/lib/supabase";

const VALID_CATEGORIES = ["Venue", "Caterer", "Decorator", "Sound", "Photographer"] as const;
const VALID_CITIES     = ["Douala", "Yaounde", "Buea"] as const;

type VendorCategory = typeof VALID_CATEGORIES[number];
type City           = typeof VALID_CITIES[number];

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where:   { supabaseId: supabaseUser.id },
      include: { vendor: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Idempotency guard – vendor profile already exists
    if (user.vendor) {
      return NextResponse.json(
        { message: "Vendor profile already exists.", vendorId: user.vendor.id },
        { status: 409 }
      );
    }

    // ── Validate body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { category, city, basePrice, description, profileImageUrl, latitude, longitude } = body;

    if (!category || !city || !basePrice || !description) {
      return NextResponse.json(
        { error: "Missing required fields: category, city, basePrice, description." },
        { status: 400 }
      );
    }

    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 });
    }
    if (!(VALID_CITIES as readonly string[]).includes(city)) {
      return NextResponse.json({ error: `Invalid city: ${city}` }, { status: 400 });
    }

    const parsedPrice = parseFloat(basePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "basePrice must be a positive number." }, { status: 400 });
    }

    // ── Create vendor ─────────────────────────────────────────────────────────
    const vendor = await prisma.vendor.create({
      data: {
        userId:          user.id,
        category:        category as VendorCategory,
        city:            city     as City,
        basePrice:       parsedPrice,
        description,
        profileImageUrl: profileImageUrl ?? null,
        latitude:        latitude  != null ? parseFloat(latitude)  : null,
        longitude:       longitude != null ? parseFloat(longitude) : null,
        availability:    true,
        isEvent:         false,
        activeStatus:    "UPCOMING",
      },
      select: { id: true, category: true, city: true },
    });

    // Ensure user.role is set to VENDOR
    if (user.role !== "VENDOR") {
      await prisma.user.update({
        where: { id: user.id },
        data:  { role: "VENDOR" },
      });
    }

    return NextResponse.json(
      { message: "Vendor profile created.", vendor },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/vendors/create]", error);
    return NextResponse.json({ error: "Failed to create vendor profile." }, { status: 500 });
  }
}
