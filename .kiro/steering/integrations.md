---
inclusion: always
---

# CamEventFlow – Pending Integrations

These three external services have **not yet been implemented**. Their connection points (holes) are left as commented-out code in the codebase. Do not remove the hole comments until the integration is live.

---

## Day 3 – Mapbox

**Purpose:** Show vendors on an interactive map on the landing page, a location embed on vendor profiles, and a venue picker inside the booking modal.

**Env var:** `NEXT_PUBLIC_MAPBOX_TOKEN`

| Hole location | File | Description |
|---|---|---|
| Featured vendors map | `app/page.tsx` | Section below category grid, renders `<MapboxVendorMap vendors={...} />` |
| Location embed | `app/vendors/[id]/page.tsx` | Shows vendor's city on a small Mapbox static map |
| Venue picker | `components/BookingModal.tsx` | Geocoding input so planner can pin their event location |

**Integration steps (when ready):**
1. Install `mapbox-gl` and `@types/mapbox-gl`.
2. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`.
3. Create `components/MapboxVendorMap.tsx` (Client Component, `"use client"`).
4. Create `components/MapboxEmbed.tsx` (static map image via Mapbox Static API).
5. Create `components/MapboxVenuePicker.tsx` (geocoding search + pin).
6. Uncomment the hole blocks in the three files above.
7. Add vendor `lat`/`lng` fields to the `Vendor` model in `prisma/schema.prisma` and run `prisma migrate dev`.

---

## Day 4 – TalkJS (In-app Messaging)

**Purpose:** Allow planners and vendors to message each other directly within the app after a booking is created.

**Env var:** `NEXT_PUBLIC_TALKJS_APP_ID`

| Hole location | File | Description |
|---|---|---|
| Auto-create conversation on booking | `app/api/bookings/route.ts` | Calls TalkJS REST API after `prisma.booking.create` |
| "Reply via Chat" button | `app/dashboard/VendorLeads.tsx` | Opens TalkJS inbox/popup for the vendor |
| Chat button on vendor profile | `app/vendors/[id]/page.tsx` | Lets planner message before booking |

**Integration steps (when ready):**
1. Sign up at [talkjs.com](https://talkjs.com) and get your App ID + Secret Key.
2. Add `NEXT_PUBLIC_TALKJS_APP_ID` and `TALKJS_SECRET_KEY` to `.env.local`.
3. Create `lib/talkjs.ts` — server-side helper using TalkJS REST API to create users and conversations.
4. Call `createTalkJSConversation({ booking, planner, vendor })` in `app/api/bookings/route.ts` (hole already present).
5. Create `components/TalkJSChat.tsx` (Client Component) using the TalkJS JavaScript SDK.
6. Uncomment the hole blocks in the dashboard and vendor profile.

---

## Day 4 – Make.com (Automated Notifications)

**Purpose:** Trigger automated workflows when a booking is created — e.g. send WhatsApp/email notifications to the vendor and confirmation SMS to the planner.

**Env var:** `MAKE_WEBHOOK_URL`

| Hole location | File | Description |
|---|---|---|
| Post-booking webhook trigger | `app/api/bookings/route.ts` | Fires after successful `prisma.booking.create` |

**Integration steps (when ready):**
1. Create a Make.com scenario with a **Webhooks > Custom Webhook** trigger.
2. Copy the webhook URL into `MAKE_WEBHOOK_URL` in `.env.local`.
3. Create `lib/make.ts`:
   ```ts
   export async function triggerMakeWebhook(payload: object) {
     await fetch(process.env.MAKE_WEBHOOK_URL!, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(payload),
     });
   }
   ```
4. Uncomment `triggerMakeWebhook({ booking, planner: user })` in `app/api/bookings/route.ts`.
5. In Make.com, chain modules: parse JSON → send WhatsApp (Vonage/Twilio) → send email (Gmail/SendGrid).
