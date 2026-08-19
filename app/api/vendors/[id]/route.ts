// app/api/vendors/[id]/route.ts
// GET /api/vendors/:id
// Returns a single vendor profile with user details and their bookings count.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        // Return aggregate booking stats without exposing planner PII
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    return NextResponse.json(vendor, { status: 200 });
  } catch (error) {
    console.error("[GET /api/vendors/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor." },
      { status: 500 }
    );
  }
}
