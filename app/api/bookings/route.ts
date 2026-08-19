// app/api/bookings/route.ts
// POST /api/bookings
// Body: { vendorId, eventDate, guestCount, message, venueLocation? }
// Creates a booking for the currently authenticated planner.
// After creation: fires Make.com webhook (non-blocking) and creates a
// TalkJS conversation via the REST API (non-blocking).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser } from "@/lib/supabase";
import { triggerMakeWebhook } from "@/lib/make";

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (user.role !== "PLANNER") {
      return NextResponse.json(
        { error: "Only planners can create bookings." },
        { status: 403 }
      );
    }

    // ── Validate body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { vendorId, eventDate, guestCount, message } = body;

    if (!vendorId || !eventDate || !guestCount || !message) {
      return NextResponse.json(
        { error: "Missing required fields: vendorId, eventDate, guestCount, message." },
        { status: 400 }
      );
    }

    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      return NextResponse.json(
        { error: "eventDate must be a valid future date." },
        { status: 400 }
      );
    }

    const parsedGuestCount = parseInt(guestCount, 10);
    if (isNaN(parsedGuestCount) || parsedGuestCount < 1) {
      return NextResponse.json(
        { error: "guestCount must be a positive integer." },
        { status: 400 }
      );
    }

    // ── Verify vendor exists ──────────────────────────────────────────────────
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    // ── Create booking ────────────────────────────────────────────────────────
    const booking = await prisma.booking.create({
      data: {
        plannerId:  user.id,
        vendorId,
        eventDate:  parsedDate,
        guestCount: parsedGuestCount,
        message,
        status:     "PENDING",
      },
      include: {
        vendor: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    // ── Make.com webhook ─────────────────────────────────────────────────────
    // Fire-and-forget: errors are swallowed inside triggerMakeWebhook so the
    // booking response is never delayed or blocked by webhook failures.
    void triggerMakeWebhook({
      eventType:      "NEW_BOOKING",
      plannerEmail:   user.email,
      plannerPhone:   user.phone ?? null,
      plannerName:    user.name,
      vendorName:     vendor.user.name,
      vendorCity:     vendor.city,
      vendorCategory: vendor.category,
      eventDate:      parsedDate.toISOString(),
      guestCount:     parsedGuestCount,
      message,
      bookingId:      booking.id,
      firedAt:        new Date().toISOString(),
    });

    // ── TalkJS conversation creation ─────────────────────────────────────────
    // Creates a TalkJS conversation via REST API so both parties can chat
    // immediately without either of them having to open the vendor profile.
    void createTalkJSConversation({
      conversationId: `booking-${booking.id}`,
      plannerId:      user.id,
      plannerName:    user.name,
      plannerEmail:   user.email,
      vendorUserId:   vendor.userId,
      vendorName:     vendor.user.name,
      vendorEmail:    vendor.user.email,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[POST /api/bookings]", error);
    return NextResponse.json(
      { error: "Failed to create booking." },
      { status: 500 }
    );
  }
}

// ── TalkJS REST API helper (server-side) ──────────────────────────────────────
// Creates/syncs both users and the conversation in TalkJS so the thread
// is ready before either party opens the chat UI.
// Errors are caught and logged without affecting the booking response.

interface TalkJSConversationArgs {
  conversationId: string;
  plannerId:      string;
  plannerName:    string;
  plannerEmail:   string;
  vendorUserId:   string;
  vendorName:     string;
  vendorEmail:    string;
}

async function createTalkJSConversation(args: TalkJSConversationArgs): Promise<void> {
  const appId     = process.env.NEXT_PUBLIC_TALKJS_APP_ID;
  const secretKey = process.env.TALKJS_SECRET_KEY;

  if (!appId || !secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[TalkJS] App ID or secret key not configured. Skipping conversation creation.");
    }
    return;
  }

  const BASE = `https://api.talkjs.com/v1/${appId}`;
  const headers = {
    "Authorization": `Bearer ${secretKey}`,
    "Content-Type":  "application/json",
  };
  const timeout = AbortSignal.timeout(8000);

  try {
    // 1. Upsert planner user in TalkJS
    await fetch(`${BASE}/users/${args.plannerId}`, {
      method:  "PUT",
      headers,
      signal:  timeout,
      body: JSON.stringify({
        name:  args.plannerName,
        email: [args.plannerEmail],
        role:  "planner",
      }),
    });

    // 2. Upsert vendor user in TalkJS
    await fetch(`${BASE}/users/${args.vendorUserId}`, {
      method:  "PUT",
      headers,
      signal:  AbortSignal.timeout(8000),
      body: JSON.stringify({
        name:  args.vendorName,
        email: [args.vendorEmail],
        role:  "vendor",
      }),
    });

    // 3. Create / update the conversation
    await fetch(`${BASE}/conversations/${args.conversationId}`, {
      method:  "PUT",
      headers,
      signal:  AbortSignal.timeout(8000),
      body: JSON.stringify({
        participants:  [args.plannerId, args.vendorUserId],
        subject:       `Booking enquiry`,
      }),
    });
  } catch (err) {
    console.error("[TalkJS] Failed to create conversation:", err);
  }
}
