// app/api/automate/route.ts
// POST /api/automate
//
// Inbound webhook endpoint — Make.com can call this URL to trigger
// server-side actions from automation scenarios (e.g. after a booking status
// changes in an external system, or to push notifications back into the app).
//
// Security: requests must include the correct secret header
//   X-Automate-Secret: <AUTOMATE_WEBHOOK_SECRET>
// Set this value in both .env.local and the Make.com scenario's HTTP headers.
//
// Supported eventTypes (extend as needed on Days 4–5):
//   BOOKING_CONFIRMED   – vendor confirmed via external tool
//   BOOKING_CANCELED    – vendor canceled via external tool
//   SEND_REMINDER       – Make.com timer scenario fires a day before event
//   CUSTOM              – catch-all for ad-hoc payloads

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AutomatePayload {
  eventType:  string;
  bookingId?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  // ── Secret verification ───────────────────────────────────────────────────
  const expectedSecret = process.env.AUTOMATE_WEBHOOK_SECRET;
  const receivedSecret = req.headers.get("x-automate-secret");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    console.warn("[/api/automate] Rejected request: invalid secret header.");
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload: AutomatePayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { eventType, bookingId } = payload;

  if (!eventType) {
    return NextResponse.json(
      { error: "Missing required field: eventType." },
      { status: 400 }
    );
  }

  console.log(`[/api/automate] Received event: ${eventType}`, { bookingId });

  // ── Route by eventType ────────────────────────────────────────────────────
  try {
    switch (eventType) {

      case "BOOKING_CONFIRMED": {
        if (!bookingId) {
          return NextResponse.json({ error: "bookingId required for BOOKING_CONFIRMED." }, { status: 400 });
        }
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data:  { status: "CONFIRMED" },
          select: { id: true, status: true },
        });
        return NextResponse.json({ success: true, booking }, { status: 200 });
      }

      case "BOOKING_CANCELED": {
        if (!bookingId) {
          return NextResponse.json({ error: "bookingId required for BOOKING_CANCELED." }, { status: 400 });
        }
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data:  { status: "CANCELED" },
          select: { id: true, status: true },
        });
        return NextResponse.json({ success: true, booking }, { status: 200 });
      }

      case "SEND_REMINDER": {
        // Placeholder: integrate with a push notification service on Day 5
        // e.g. Expo Push Notifications, OneSignal, or Firebase FCM
        console.log("[/api/automate] SEND_REMINDER – push notification not yet implemented.");
        return NextResponse.json(
          { success: true, message: "Reminder received. Push notifications coming on Day 5." },
          { status: 200 }
        );
      }

      default: {
        // Log unrecognised events rather than erroring — future-proofing
        console.log(`[/api/automate] Unhandled eventType: ${eventType}. Payload:`, payload);
        return NextResponse.json(
          { success: true, message: `Event '${eventType}' logged but not handled.` },
          { status: 200 }
        );
      }
    }
  } catch (err) {
    console.error("[/api/automate] Error processing event:", err);
    return NextResponse.json(
      { error: "Internal server error while processing event." },
      { status: 500 }
    );
  }
}

// ── GET – health check (Make.com connection test) ─────────────────────────────
export async function GET() {
  return NextResponse.json(
    { status: "ok", endpoint: "/api/automate", timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
