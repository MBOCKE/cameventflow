// app/api/vendors/route.ts
// GET /api/vendors
//
// Query params:
//   ?city=Douala          filter by city
//   ?category=Venue       filter by category
//   ?maxPrice=500000      filter by max base price
//   ?type=events          return ONLY isEvent=true with LIVE or UPCOMING status
//
// When ?type=events is passed all other filters are still composable.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const city      = searchParams.get("city")      as string | null;
    const category  = searchParams.get("category")  as string | null;
    const maxPrice  = searchParams.get("maxPrice");
    const type      = searchParams.get("type"); // "events" | null

    // ── Base where clause ────────────────────────────────────────────
    const where: Record<string, unknown> = {
      ...(city     && { city }),
      ...(category && { category }),
      ...(maxPrice && { basePrice: { lte: parseFloat(maxPrice) } }),
    };

    // ── Events filter ─────────────────────────────────────────────────
    if (type === "events") {
      where.isEvent = true;
      where.activeStatus = { in: ["LIVE", "UPCOMING"] };
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: [
        // Live events first, then upcoming, then the rest
        { activeStatus: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(vendors, { status: 200 });
  } catch (error) {
    console.error("[GET /api/vendors]", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors." },
      { status: 500 }
    );
  }
}
