---
inclusion: always
---

# CamEventFlow – Project Steering

## What this project is
A **mobile-first Progressive Web App** for discovering and booking event vendors in Cameroon (Douala, Yaoundé, Buea). Built in a 5-day sprint using a low-code, service-integrated architecture.

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Database | PostgreSQL via Prisma ORM 5 |
| Auth & Storage | Supabase (`@supabase/ssr`) |
| Styling | Tailwind CSS + Shadcn/UI (Radix primitives) |
| State | Zustand 5 (`useBookingStore`) |
| PWA | `public/manifest.json`, Next.js `Metadata` + `Viewport` API |

## Directory conventions
```
app/                  # Next.js App Router pages and API routes
  api/                # Route Handlers only – no UI
  (page folders)/     # Each route = folder with page.tsx + co-located Client Components
components/
  ui/                 # Shadcn/UI primitives (never modify generated files directly)
  *.tsx               # Shared composite components (Navbar, VendorCard, BookingModal)
lib/
  prisma.ts           # Prisma singleton
  supabase.ts         # Browser + server Supabase clients
  utils.ts            # cn() helper
  stores/             # Zustand stores
prisma/
  schema.prisma       # Single source of truth for DB shape
public/
  manifest.json       # PWA manifest
  icons/              # 192×192 and 512×512 PNG icons (must be added manually)
```

## Coding rules
- **Server Components by default.** Only add `"use client"` when strictly needed (event handlers, browser APIs, Zustand reads).
- **Mobile-first layout.** All page wrappers use `max-w-md mx-auto px-4`.
- **Currency formatting.** Always use `Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF" })`.
- **Date formatting.** Always use `toLocaleDateString("fr-CM", { day: "numeric", month: "long", year: "numeric" })`.
- **Auth pattern.** Every protected API Route calls `getSupabaseUser()` from `lib/supabase.ts` first, then resolves the internal `User` via `prisma.user.findUnique({ where: { supabaseId } })`.
- **No open dependency ranges.** All `package.json` versions are pinned.
- **Prisma enums are used for all constrained string fields** (`Role`, `VendorCategory`, `City`, `BookingStatus`).
- **Integration holes** must be left as commented-out code blocks, never removed, until the integration is implemented (see `integrations.md`).

## Environment variables
| Variable | Used in | Notes |
|---|---|---|
| `DATABASE_URL` | `lib/prisma.ts` | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts` | Public – safe to expose to browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts` | Public – safe to expose to browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only routes | Never expose to client |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Day 3 – map components | Set when implementing Mapbox |
| `NEXT_PUBLIC_TALKJS_APP_ID` | Day 4 – chat | Set when implementing TalkJS |
| `MAKE_WEBHOOK_URL` | Day 4 – notifications | Set when implementing Make.com |

## Data models (summary)
- **User** – `id`, `supabaseId` (unique), `email`, `phone?`, `name`, `role` (PLANNER | VENDOR)
- **Vendor** – `id`, `userId` (1-to-1 User), `category`, `city`, `basePrice`, `availability`, `description`, `profileImageUrl?`
- **Booking** – `id`, `plannerId` (→ User), `vendorId` (→ Vendor), `eventDate`, `guestCount`, `status` (PENDING | CONFIRMED | CANCELED), `message`
