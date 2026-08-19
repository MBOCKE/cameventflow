# CamEventFlow – Feature Spec

## Overview
Mobile-first PWA for booking event vendors in Cameroon, built in 5 days.

**Target users:**
- **Planners** – people organising events who need to find and hire vendors.
- **Vendors** – caterers, photographers, venues, decorators, and sound engineers who want to receive bookings.

---

## Requirements

### R1 – Vendor Discovery
- Users can browse all vendors without authentication.
- Vendors can be filtered by `city` (Douala, Yaoundé, Buea), `category` (Venue, Caterer, Decorator, Sound, Photographer), and `maxPrice`.
- Filters are applied via URL search params and update the list without a full page reload.
- Each vendor card shows: name, category, city, base price (XAF), availability badge.

### R2 – Vendor Profile
- A dedicated page `/vendors/[id]` shows full vendor details: image, description, price, booking count, availability.
- An unavailable vendor's "Book Now" button is disabled.

### R3 – Booking Flow
- Only authenticated **Planners** can create bookings.
- Booking requires: `vendorId`, `eventDate` (must be in the future), `guestCount` (≥ 1), `message`.
- New bookings default to `PENDING` status.
- On success, the planner is redirected to `/dashboard`.

### R4 – Dashboard
- Authenticated users see `/dashboard`.
- **Planners** see "My Bookings" tab: their outgoing bookings with vendor name, date, guest count, city, status.
- **Vendors** see "Incoming Leads" tab: bookings on their profile with planner contact info.
- Unauthenticated users are redirected to `/login`.

### R5 – Authentication
- Auth is handled entirely by Supabase.
- On first sign-in, a `User` row is created in PostgreSQL linking `supabaseId`.
- Session is managed via Supabase SSR cookies (server-readable).

### R6 – PWA
- App is installable on Android/iOS via `manifest.json`.
- Theme colour `#2563EB`, standalone display, portrait orientation.
- Scores ≥ 90 on Lighthouse PWA audit after icons are added.

### R7 – Mapbox Integration *(Day 3)*
- Vendor map on landing page.
- Location embed on vendor profile page.
- Venue geocoding picker inside the BookingModal.

### R8 – TalkJS Messaging *(Day 4)*
- A conversation is auto-created between planner and vendor when a booking is submitted.
- Vendor can reply via chat from the dashboard.

### R9 – Make.com Notifications *(Day 4)*
- A Make.com webhook fires after every new booking.
- Scenario sends a WhatsApp/email notification to the vendor.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| Server Components by default | Minimise JS bundle; only hydrate interactive islands |
| Zustand for booking modal state | Avoids prop-drilling across Server/Client boundary |
| URL search params for filters | Shareable URLs, works without JS, SSR-friendly |
| Prisma enums for constrained fields | Type-safe, validated at DB level |
| `fr-CM` locale for formatting | XAF currency and French-language date format matches target market |
| Bottom nav instead of header nav | Mobile-first; thumb-reachable navigation |

---

## 5-Day Sprint Plan

### Day 1 ✅ – Foundation
- [x] Project config (Next.js 15, Tailwind, Prisma, Supabase, Zustand)
- [x] Prisma schema (User, Vendor, Booking)
- [x] Utility libraries (prisma.ts, supabase.ts, useBookingStore)
- [x] Shadcn/UI component primitives
- [x] Shared components (Navbar, VendorCard, BookingModal)
- [x] API routes (vendors list, vendor detail, create booking, my bookings)
- [x] Pages (Landing, Search Results, Vendor Profile, Dashboard)
- [x] PWA layout + manifest
- [x] .kiro workspace config

### Day 2 – Auth & Real Data
- [ ] Supabase Auth login/signup pages (`/login`, `/signup`)
- [ ] Next.js middleware for session refresh
- [ ] User auto-creation on first Supabase sign-in (webhook or callback route)
- [ ] Vendor profile creation flow (for VENDOR role users)
- [ ] Connect dashboard to real authenticated data
- [ ] Seed database with sample vendors for testing

### Day 3 – Mapbox
- [ ] Install and configure `mapbox-gl`
- [ ] `MapboxVendorMap` component on landing page
- [ ] `MapboxEmbed` on vendor profile
- [ ] `MapboxVenuePicker` in BookingModal
- [ ] Add `lat`/`lng` to Vendor model, run migration

### Day 4 – Messaging & Notifications
- [ ] TalkJS account setup + `lib/talkjs.ts`
- [ ] Auto-create conversation on booking (`app/api/bookings/route.ts` hole)
- [ ] `TalkJSChat` component in dashboard
- [ ] Make.com webhook scenario (vendor WhatsApp/email notification)
- [ ] `lib/make.ts` + uncomment webhook call in bookings route

### Day 5 – Polish & Deploy
- [ ] Lighthouse audit (PWA, performance, accessibility)
- [ ] Add PWA icons (`public/icons/icon-192.png`, `icon-512.png`)
- [ ] Error boundaries and loading skeletons
- [ ] Deploy to Vercel (connect Supabase + Neon/Supabase Postgres)
- [ ] Final end-to-end test (planner books vendor → vendor sees lead → chat opens)
