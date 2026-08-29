// app/api/search/route.ts
// GET /api/search?q=query
//
// Searches across ALL vendors AND events in a single query.
// Uses Prisma `contains` (case-insensitive) on:
//   - user.name      (vendor / event name)
//   - description
//   - category       (stringified – matched via enum label)
//
// Returns a unified list with a `_type` discriminator field added
// so the client can render badges ("Vendor" vs "Event").

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const results = await prisma.vendor.findMany({
      where: {
        OR: [
          // MySQL utf8mb4_unicode_ci collation is case-insensitive by default —
          // no mode:"insensitive" needed (that is PostgreSQL-only)
          { user: { name: { contains: q } } },
          { description: { contains: q } },
          { city: { contains: q } },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: [
        { isEvent: "desc" },   // events surface first
        { createdAt: "desc" },
      ],
      take: 20, // cap results for dropdown performance
    });

    // Attach a client-friendly type discriminator
    const enriched = results.map((v) => ({
      ...v,
      _type: v.isEvent ? "event" : "vendor",
    }));

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json(
      { error: "Search failed." },
      { status: 500 }
    );
  }
}
