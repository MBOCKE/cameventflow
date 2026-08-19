// lib/make.ts
// Make.com webhook helper.
//
// Fires a POST request to the Make.com scenario webhook after a booking is
// created. Errors are caught and logged but NEVER re-thrown — a webhook
// failure must not crash the booking flow or return a 500 to the client.
//
// Usage:
//   import { triggerMakeWebhook } from "@/lib/make";
//   await triggerMakeWebhook({ ... });

export interface MakeWebhookPayload {
  eventType:    string;          // e.g. "NEW_BOOKING"
  plannerEmail: string;
  plannerPhone: string | null;
  plannerName:  string;
  vendorName:   string;
  vendorCity:   string;
  vendorCategory: string;
  eventDate:    string;          // ISO string
  guestCount:   number;
  message:      string;
  bookingId:    string;
  /** ISO timestamp of when the webhook was fired */
  firedAt:      string;
}

/**
 * Sends a POST request to the Make.com webhook URL.
 * Silently swallows any network or HTTP error so the caller is never blocked.
 *
 * @returns true if the webhook was delivered (2xx response), false otherwise.
 */
export async function triggerMakeWebhook(
  payload: MakeWebhookPayload
): Promise<boolean> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    // Not configured — skip silently in development, warn in production
    if (process.env.NODE_ENV === "production") {
      console.warn("[Make.com] MAKE_WEBHOOK_URL is not set. Skipping notification.");
    }
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      // 8 s timeout — Make.com webhooks should respond well within this
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(
        `[Make.com] Webhook returned non-2xx status: ${res.status} ${res.statusText}`
      );
      return false;
    }

    return true;
  } catch (err) {
    // Network error, timeout, or abort — log but do not propagate
    console.error("[Make.com] Webhook delivery failed:", err);
    return false;
  }
}
