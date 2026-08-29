# CamEventFlow – Build Report

> Generated iteratively as each task was completed.  
> Last updated: PWA conversion + all post-Day-5 fixes (29 August 2026)

---

## Project Overview

**CamEventFlow** is a mobile-first Progressive Web App for discovering and booking event vendors across Cameroon (Douala, Yaoundé, Buea). Built on a 5-day sprint using Next.js 15 App Router, Supabase Auth/Storage, PostgreSQL via Prisma, Tailwind CSS + Shadcn/UI, and Zustand.

---

## ✅ Task 1 – Project Configuration

**Files created:**
| File | Purpose |
|---|---|
| `package.json` | All dependencies pinned (Next 15, React 19, Prisma 5, Zustand 5, Supabase SSR, Shadcn Radix primitives) |
| `tsconfig.json` | Strict TypeScript, `@/*` path alias, bundler module resolution |
| `next.config.ts` | Supabase Storage remote image pattern, security headers |
| `tailwind.config.ts` | Shadcn CSS variable theme, `tailwindcss-animate` plugin, content paths |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `.env.example` | Template for `DATABASE_URL`, Supabase keys, and future integration placeholders (Mapbox, TalkJS, Make.com) |

**Key decisions:**

- All dependency versions are pinned (no open ranges) to prevent surprise breakage during a 5-day sprint.
- `.env.example` already has labelled blank slots for Day 3–4 integrations so no future file edits are needed for secrets setup.

---

## ✅ Task 2 – Prisma Schema (`prisma/schema.prisma`)

**Models:**

### `User`

- `id` (cuid), `supabaseId` (unique – links to Supabase Auth), `email` (unique), `phone?`, `name`, `role` (enum: `PLANNER | VENDOR`), timestamps.
- **Relations:** one optional `Vendor` profile, many `Booking` records (as planner).

### `Vendor`

- `id`, `userId` (1-to-1 → User), `category` (enum: `Venue | Caterer | Decorator | Sound | Photographer`), `city` (enum: `Douala | Yaounde | Buea`), `basePrice` (Float), `availability` (Boolean, default `true`), `description`, `profileImageUrl?`, timestamps.
- **Relations:** belongs to one `User`, has many `Booking` records.

### `Booking`

- `id`, `plannerId` (→ User), `vendorId` (→ Vendor), `eventDate` (DateTime), `guestCount` (Int), `status` (enum: `PENDING | CONFIRMED | CANCELED`, default `PENDING`), `message` (String), timestamps.
- **Relations:** belongs to one `User` (planner) and one `Vendor`.

**Cascade deletes** are set on both User→Vendor and User/Vendor→Booking so orphan rows are automatically cleaned up.

---

## ✅ Task 3 – Utility Files

### `lib/prisma.ts`

- Prisma Client singleton using the `globalThis` pattern to survive Next.js hot-reload in development.
- Enables `query/error/warn` logging in dev, `error` only in production.

### `lib/supabase.ts`

- `createBrowserClient()` – for use in `"use client"` components (no cookie access needed).
- `createServerClient()` – async factory for Server Components and Route Handlers; reads and writes cookies via Next.js `cookies()` API from `next/headers`.
- `getSupabaseUser()` – convenience helper that returns the authenticated Supabase user or `null`. Used directly in all API Route Handlers for auth checks.

### `lib/stores/useBookingStore.ts`

- Zustand store managing the full booking-modal lifecycle:
  - `draft: BookingDraft | null` – holds `vendorId`, `vendorName`, `eventDate`, `guestCount`, `message` while the user fills the form.
  - `isModalOpen`, `isSubmitting`, `submitError`, `submitSuccess` – UI state flags.
  - Actions: `openModal`, `closeModal`, `updateDraft`, `resetDraft`, `setSubmitting`, `setSubmitError`, `setSubmitSuccess`.
- Modal auto-redirects to `/dashboard` on success and resets all state.

---

## ✅ Task 4 – Shared UI Components

### Shadcn/UI Primitives (`components/ui/`)

All built from Radix UI headless primitives with Tailwind CVA variants:

| Component       | Radix Primitive             | Notes                                                                             |
| --------------- | --------------------------- | --------------------------------------------------------------------------------- |
| `button.tsx`    | `@radix-ui/react-slot`      | 6 variants × 4 sizes                                                              |
| `badge.tsx`     | none                        | Added `success` + `warning` custom variants for booking status                    |
| `card.tsx`      | none                        | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `input.tsx`     | none                        | Standard controlled input                                                         |
| `label.tsx`     | `@radix-ui/react-label`     | Accessible label with `peer-disabled` styles                                      |
| `dialog.tsx`    | `@radix-ui/react-dialog`    | Full Shadcn dialog with overlay, close button, portal                             |
| `select.tsx`    | `@radix-ui/react-select`    | Scrollable, accessible dropdown                                                   |
| `tabs.tsx`      | `@radix-ui/react-tabs`      | Used in Dashboard                                                                 |
| `avatar.tsx`    | `@radix-ui/react-avatar`    | Image + fallback                                                                  |
| `separator.tsx` | `@radix-ui/react-separator` | Horizontal/vertical divider                                                       |

### `components/Navbar.tsx`

- Fixed bottom navigation bar (mobile-first pattern).
- 4 items: Home `/`, Explore `/vendors`, Dashboard `/dashboard`, Profile `/profile`.
- Active route highlighted via `usePathname()`. Fully accessible (`aria-current="page"`).

### `components/VendorCard.tsx`

- Displays vendor image (Next.js `<Image>` with Supabase URL pattern), name, category (with icon), city, base price (XAF formatted via `Intl.NumberFormat`), and availability badge.
- "View Profile" CTA links to `/vendors/[id]`.

### `components/BookingModal.tsx`

- Reads/writes Zustand store.
- Controlled form: event date (min = today), guest count, message textarea.
- Calls `POST /api/bookings` on submit, shows success state, then redirects to `/dashboard`.
- **Integration hole:** `<MapboxVenuePicker>` component slot commented in for Day 3.

---

## ✅ Task 5 – Backend API Routes

### `GET /api/vendors`

- Accepts optional query params: `?city`, `?category`, `?maxPrice`.
- Builds a dynamic Prisma `where` clause — all filters are optional and composable.
- Includes `user.name/email/phone` in the response.
- Returns `200` with array, `500` on DB error.

### `GET /api/vendors/[id]`

- Finds a single vendor by `id`.
- Includes `user` details and `_count.bookings` (total booking requests) without exposing planner PII.
- Returns `404` if not found.

### `POST /api/bookings`

- **Auth-guarded:** resolves Supabase session → looks up internal `User` → checks `role === "PLANNER"`.
- Validates all required fields; rejects past `eventDate` and non-positive `guestCount`.
- Creates the booking with `status: "PENDING"`.
- **Integration holes (Day 4):**
  - `triggerMakeWebhook()` – Make.com notification flow.
  - `createTalkJSConversation()` – opens a messaging thread between planner and vendor.

### `GET /api/me/bookings`

- **Auth-guarded:** same Supabase → User resolution.
- **PLANNER:** returns their outgoing bookings with nested vendor+user data.
- **VENDOR:** returns incoming bookings on their profile with planner contact info.
- Role is included in the response envelope so the client knows which view to render.

---

## ✅ Task 6 – Frontend Pages

### `app/page.tsx` – Landing `/`

- Hero section with tagline and "Made for Cameroon" pill.
- Search bar (`<form action="/vendors">`) that passes `?q` to the vendors page.
- City shortcut buttons: Douala, Yaoundé, Buea.
- 4 category grid cards: Venues, Caterers, Photography, Sound — each links to `/vendors?category=X`.
- **Integration hole:** Mapbox "Vendors near you" map section commented in.
- Two CTA buttons: "Find a Vendor" and "My Dashboard".

### `app/vendors/page.tsx` + `VendorFilters.tsx` – Search Results `/vendors`

- Server Component fetches vendors directly via Prisma (no fetch overhead).
- Sorts available vendors first, then by newest.
- `VendorFilters` is a Client Component that reads and updates URL search params via `useSearchParams` + `useRouter` — no form submit required, filters react instantly.
- 3 dropdowns: City, Category, Max Price (XAF presets). Clear filters button appears when any filter is active.
- Empty state with helpful copy when no results.

### `app/vendors/[id]/page.tsx` + `BookNowButton.tsx` – Vendor Profile `/vendors/:id`

- Server Component fetches vendor + user + booking count.
- Generates per-vendor `<title>` and `<meta description>` via `generateMetadata`.
- Shows full-width profile image, availability badge, category, city, booking count.
- Price formatted in XAF (`fr-CM` locale).
- About section with vendor description.
- **Integration holes:** Rating/reviews section placeholder, Mapbox location embed, TalkJS chat button.
- `BookNowButton` is the only Client Component — keeps the page server-rendered while enabling the Zustand modal interaction.
- "Book Now" button is disabled when vendor is unavailable.

### `app/dashboard/page.tsx` + sub-components – Dashboard `/dashboard`

- Server Component with auth guard — redirects to `/login` if not authenticated.
- Fetches both outgoing bookings (as planner) and incoming leads (as vendor) in parallel.
- Two tabs: "My Bookings" and "Incoming Leads".
- `PlannerBookings`: shows booking cards with event date, guest count, city, truncated message, and status badge. Empty state links to `/vendors`.
- `VendorLeads`: shows lead cards with planner contact details (name, email, phone). Empty state for non-vendor users. **Integration hole:** TalkJS "Reply via Chat" button commented in.

---

## ✅ Task 7 – App Layout & PWA

### `app/layout.tsx`

- Root layout with Inter font, `globals.css` import.
- `metadata` export: title template, description, `manifest.json` link, `apple-web-app` meta, OG tags.
- `viewport` export: `themeColor: #2563EB`, scale locked to 1 (mobile PWA behaviour).
- Persistent `<Navbar />` rendered for all routes.

### `app/globals.css`

- Full Shadcn CSS variable theme (light + dark mode) via HSL custom properties.
- `body` padding-bottom accounts for fixed bottom nav height.

### `public/manifest.json`

- PWA manifest: `display: standalone`, portrait orientation, `#2563EB` theme colour.
- Icon slots at 192×512 px with `maskable any` purpose — drop PNG files into `public/icons/` to complete.

---

## Project File Tree (complete)

```
cameventflow/
├── app/
│   ├── api/
│   │   ├── bookings/route.ts          # POST /api/bookings
│   │   ├── me/bookings/route.ts       # GET  /api/me/bookings
│   │   └── vendors/
│   │       ├── route.ts               # GET  /api/vendors
│   │       └── [id]/route.ts          # GET  /api/vendors/:id
│   ├── dashboard/
│   │   ├── page.tsx                   # Dashboard (tabs)
│   │   ├── PlannerBookings.tsx
│   │   └── VendorLeads.tsx
│   ├── vendors/
│   │   ├── page.tsx                   # Search results
│   │   ├── VendorFilters.tsx          # Client filter dropdowns
│   │   └── [id]/
│   │       ├── page.tsx               # Vendor profile
│   │       └── BookNowButton.tsx      # Client modal trigger
│   ├── globals.css
│   ├── layout.tsx                     # Root layout + PWA meta
│   └── page.tsx                       # Landing page
├── components/
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   └── tabs.tsx
│   ├── BookingModal.tsx
│   ├── Navbar.tsx
│   └── VendorCard.tsx
├── lib/
│   ├── stores/
│   │   └── useBookingStore.ts
│   ├── prisma.ts
│   ├── supabase.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
│   ├── icons/                         # → add icon-192.png + icon-512.png
│   └── manifest.json
├── .env.example
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── report.md
```

---

## Integration Holes Summary (Days 3–4)

| Hole                                       | File                            | Day   | Service              |
| ------------------------------------------ | ------------------------------- | ----- | -------------------- |
| Vendor map on landing page                 | `app/page.tsx`                  | Day 3 | Mapbox GL JS         |
| Location embed on vendor profile           | `app/vendors/[id]/page.tsx`     | Day 3 | Mapbox GL JS         |
| Venue picker in booking modal              | `components/BookingModal.tsx`   | Day 3 | Mapbox Geocoding API |
| Post-booking notification webhook          | `app/api/bookings/route.ts`     | Day 4 | Make.com Webhook     |
| Auto-create messaging thread               | `app/api/bookings/route.ts`     | Day 4 | TalkJS REST API      |
| "Reply via Chat" button (vendor dashboard) | `app/dashboard/VendorLeads.tsx` | Day 4 | TalkJS UI Kit        |

---

## Next Steps (Day 2)

1. **Run `npm install`** to install all dependencies.
2. **Copy `.env.example` → `.env.local`** and fill in your Supabase project URL, anon key, and `DATABASE_URL`.
3. **Run `npm run db:push`** to sync the Prisma schema to your PostgreSQL instance.
4. **Run `npm run db:generate`** to generate the Prisma Client types.
5. **Add PWA icons** (`192×192` and `512×512` PNG) to `public/icons/`.
6. **Implement Supabase Auth** — login/signup pages, middleware for session refresh, and the `/login` redirect target referenced by the dashboard guard.
7. **Implement `POST /api/users`** (or a Supabase Auth webhook) to auto-create a `User` row in PostgreSQL on first sign-up, linking `supabaseId`.

---

## ✅ Day 2 – Event Discovery (Snap Map Style) & Global Search

### Overview

Added a full event-discovery layer on top of the existing vendor architecture. The `Vendor` model now doubles as an event entity via a boolean flag, keeping the data model lean while enabling a Snap Map–style discovery experience.

---

### Task 1 – Schema: Vendor Model Extended (`prisma/schema.prisma`)

**New enum:**

```prisma
enum ActiveStatus { LIVE  UPCOMING  ENDED }
```

**New fields on `Vendor`:**
| Field | Type | Default | Notes |
|---|---|---|---|
| `isEvent` | `Boolean` | `false` | Distinguishes events from regular vendor profiles |
| `latitude` | `Float?` | `null` | GPS latitude – required when `isEvent = true` |
| `longitude` | `Float?` | `null` | GPS longitude – required when `isEvent = true` |
| `eventStartTime` | `DateTime?` | `null` | Nullable – events only |
| `eventEndTime` | `DateTime?` | `null` | Nullable – events only |
| `activeStatus` | `ActiveStatus` | `UPCOMING` | Controls map filter pills |

**Design decision:** Treating vendors and events as the same Prisma model avoids a second table and keeps the booking flow unchanged — a planner can still book an event exactly like a vendor.

---

### Task 2 – API Routes

#### `GET /api/vendors` (updated)

- Accepts new `?type=events` query param.
- When present, adds `where.isEvent = true` and `where.activeStatus = { in: ["LIVE", "UPCOMING"] }`.
- All existing filters (`city`, `category`, `maxPrice`) remain composable.
- Results ordered: `activeStatus asc` (LIVE → UPCOMING → ENDED), then `createdAt desc`.

#### `GET /api/search` (new — `app/api/search/route.ts`)

- Accepts `?q=string` (min 2 chars, returns `[]` otherwise).
- Searches `user.name`, `description`, and `city` via Prisma `contains` with `mode: "insensitive"`.
- Returns a **unified list** of vendors + events, capped at 20 results.
- Adds `_type: "event" | "vendor"` discriminator to each result for client-side badge rendering.
- Events surfaced first (`orderBy isEvent desc`).

---

### Task 3 – Frontend

#### `components/GlobalSearchBar.tsx` (new)

- `"use client"` component, used on Landing and Discover pages.
- **280 ms debounce** on keystrokes before hitting `/api/search`.
- Fetch is cancellable (cleanup via cancelled flag in `useEffect`).
- **ARIA combobox** pattern: `role="combobox"`, `aria-expanded`, `aria-activedescendant`.
- Keyboard navigation: `↑ ↓` move through results, `Enter` navigates, `Escape` closes.
- Result rows show: icon (MapPin for events, Store for vendors), name, category · city, status dot + label.
- Status dot colours: 🔴 LIVE (red-500), 🟡 UPCOMING (amber-400), ⚫ ENDED (gray-400).
- Loading spinner replaces clear button while fetching.

#### `app/discover/page.tsx` + `app/discover/DiscoverMapClient.tsx` (new)

- Server Component shell (`page.tsx`) delegates all interactivity to the Client Component.
- **`DiscoverMapClient`** is the full-screen map view:
  - Removes `body.padding-bottom` via `map-page` CSS class (so bottom nav doesn't overlap).
  - Fetches `/api/vendors?type=events` on mount; filters out pins with null coordinates.
  - **`StaticMapFallback`** renders until Day 3 (no Mapbox token needed):
    - Dark navy gradient background + SVG grid overlay to communicate "map".
    - Pins positioned via lat/lng → percentage calculation against Cameroon's bounding box.
    - **CSS pulse animation** (`event-pin-pulse` class in `globals.css`) on LIVE pins.
    - Selected pin scales up and shows a name label bubble.
  - **Filter pills** (ALL / 🔴 Live / 🟡 Upcoming) — tap to filter visible pins.
  - **`EventPopupCard`** — slides up from bottom when a pin is tapped:
    - Status strip (red for LIVE, amber for UPCOMING).
    - Event name, category badge, formatted date + time range, city.
    - "View Details" CTA navigates to `/vendors/[id]` (reuses the existing vendor profile page).
  - **`GlobalSearchBar`** floated at the top of the map screen.
  - Legend (bottom-left) and Layers button (bottom-right — hole for Day 3 map style picker).
- **Mapbox hole** fully commented in `DiscoverMapClient.tsx` with complete `react-map-gl` implementation ready to uncomment.

#### `app/page.tsx` (updated)

- Replaced static `<form>` search with `<GlobalSearchBar />`.
- Added a **Discover Events** gradient CTA banner linking to `/discover`.
- Removed old "Search" button (now implicit via debounced fetch).

#### `components/Navbar.tsx` (updated)

- Added **Discover** route (`/discover`, `Map` icon) as the 3rd nav item.
- Nav now has 5 items: Home · Explore · Discover · Dashboard · Profile.

#### `app/globals.css` (updated)

- Added `body.map-page { padding-bottom: 0 }` override.
- Added `@keyframes ping-slow` and `@keyframes ping-medium` for the dual-ring pulse effect.
- Added `.event-pin-pulse::before` and `::after` pseudo-elements applying the animations with a 0.4 s offset for the staggered ring effect.

---

### Task 4 – Seed Data (`prisma/seed.ts`)

Five mock events created — all `isEvent: true`, with real Cameroon coordinates:

| #   | Name                              | City    | Status      | Lat    | Lng     |
| --- | --------------------------------- | ------- | ----------- | ------ | ------- |
| 1   | Live Jazz Night – Akwa            | Douala  | 🔴 LIVE     | 4.0511 | 9.7085  |
| 2   | Fashion Week Douala 2026          | Douala  | 🟡 UPCOMING | 4.0406 | 9.6934  |
| 3   | Art Expo Yaoundé – Bastos Gallery | Yaoundé | 🟡 UPCOMING | 3.8895 | 11.5174 |
| 4   | Afrobeats Open Air – Bassa        | Douala  | 🔴 LIVE     | 4.0753 | 9.7420  |
| 5   | Wedding & Events Showcase Yaoundé | Yaoundé | 🟡 UPCOMING | 3.8480 | 11.5021 |

- Each event creates a synthetic `User` (role `VENDOR`) and a `Vendor` row with `isEvent = true`.
- Seed uses `upsert` — fully **idempotent**, safe to re-run without duplicates.
- `ts-node` added as a dev dependency; `prisma.seed` config added to `package.json`.
- Run with: `npm run db:seed` or `npx prisma db seed`.

---

### Files Modified / Created (Day 2)

| File                                 | Change                                                  |
| ------------------------------------ | ------------------------------------------------------- |
| `prisma/schema.prisma`               | Added `ActiveStatus` enum + 6 new Vendor fields         |
| `prisma/seed.ts`                     | New – 5 mock events with real coordinates               |
| `package.json`                       | Added `ts-node`, `db:seed` script, `prisma.seed` config |
| `app/api/vendors/route.ts`           | Added `?type=events` filter logic                       |
| `app/api/search/route.ts`            | New – unified fuzzy search endpoint                     |
| `app/discover/page.tsx`              | New – Server Component shell                            |
| `app/discover/DiscoverMapClient.tsx` | New – full-screen map client, pins, popup, filters      |
| `app/page.tsx`                       | GlobalSearchBar + Discover CTA banner                   |
| `app/globals.css`                    | map-page override + pulse keyframes                     |
| `components/GlobalSearchBar.tsx`     | New – debounced search + ARIA dropdown                  |
| `components/Navbar.tsx`              | Added Discover nav item                                 |

---

### Updated Sprint Checklist

#### Day 2 ✅ – Event Discovery & Global Search

- [x] Extended Prisma schema with event fields
- [x] `GET /api/vendors?type=events` filter
- [x] `GET /api/search` unified search endpoint
- [x] `GlobalSearchBar` component (debounced, accessible, keyboard nav)
- [x] `/discover` full-screen map page with static fallback + CSS pulse pins
- [x] Event Popup card with "View Details" CTA
- [x] Filter pills (ALL / LIVE / UPCOMING)
- [x] Seed script with 5 real-coordinate events
- [x] Navbar updated with Discover route
- [x] Landing page updated with GlobalSearchBar + Discover CTA

#### Day 3 (Next) – Real Mapbox Integration

- [ ] Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`
- [ ] Install `mapbox-gl`, `react-map-gl`, `@types/mapbox-gl`
- [ ] Replace `StaticMapFallback` with real `react-map-gl` `<Map>` + `<Marker>` + `<Popup>`
- [ ] `MapboxVendorMap` component on landing page
- [ ] `MapboxEmbed` on vendor profile page
- [ ] `MapboxVenuePicker` (geocoding) in `BookingModal`
- [ ] Add `lat`/`lng` fields to vendor creation form, run `prisma migrate dev`
- [ ] Map style picker (Layers button hole already in `DiscoverMapClient`)

---

## ✅ Day 3 – Mapbox, TalkJS & Make.com Integrations

### Overview

All three external service integrations from the original spec were wired in today. The code honours the "do not rewrite existing code, fill the holes" constraint — every change was a targeted addition to the exact commented-out slots left in Day 1–2.

---

### Task 1 – Mapbox Integration

#### `package.json`

Added pinned dependencies:

- `mapbox-gl@3.7.0` — Mapbox GL JS core
- `react-map-gl@7.1.7` — React wrapper (v7 is compatible with mapbox-gl v3)
- `talkjs@0.24.0` — TalkJS browser SDK (also used here for npm install)
- `@types/mapbox-gl@3.4.0` (devDep) — TypeScript types

#### `app/api/map-token/route.ts` (new)

- `GET /api/map-token` — serves `NEXT_PUBLIC_MAPBOX_TOKEN` from the server so it never leaks into the JS bundle via static analysis.
- Origin check in production: rejects cross-origin requests.
- `Cache-Control: private, max-age=3600` — clients cache for 1 h, no unnecessary round-trips.
- Returns `503` with a clear message when the env var is not set.

#### `app/discover/DiscoverMapClient.tsx` (rewritten)

Full `react-map-gl` implementation replacing the `StaticMapFallback`:

| Feature             | Implementation                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Token source        | Fetched from `/api/map-token` on mount (never hardcoded)                                      |
| Map                 | `<Map>` with `dark-v11` default style, centred on Yaoundé (3.848, 11.502), zoom 6.5           |
| Event pins          | `<Marker>` per event with `<EventMarkerPin>` (CSS pulse on LIVE)                              |
| Popup               | `<Popup anchor="bottom" offset={24}>` wrapping `<EventPopupCard>`                             |
| Controls            | `<NavigationControl>` + `<GeolocateControl>` (track user position)                            |
| Map style picker    | `<MapStylePicker>` with 4 styles (Dark, Streets, Satellite, Outdoors), wired to Layers button |
| Fallback            | `<StaticMapFallback>` still renders when token is absent — zero-breakage                      |
| Click outside popup | Map `onClick` closes selected event                                                           |

**Design decision:** token is loaded separately from events so both fetches run in parallel on mount via two independent `useEffect` calls, not sequentially.

#### `components/MapboxVenuePicker.tsx` (new)

- Geocoding search input backed by `https://api.mapbox.com/geocoding/v5/mapbox.places/`.
- **320 ms debounce** — fewer API calls than GlobalSearchBar (longer query expected).
- Biased to `country=cm` (Cameroon) and `language=fr`.
- `types=place,address,poi` — shows cities, street addresses, and points of interest.
- Token fetched from `/api/map-token` (same pattern as map, never hardcoded).
- `onLocationSelect(VenueLocation)` prop returns `{ placeName, latitude, longitude }`.
- Confirmation pill shows selected place name + truncated coordinates.
- Graceful `tokenError` state shows an inline message instead of crashing.

#### `components/BookingModal.tsx` (updated)

- Replaced the `<!-- HOLE -->` comment with the live `<MapboxVenuePicker>`.
- `venueLocation` field added to the Zustand `BookingDraft` type in `lib/stores/useBookingStore.ts`.
- `venueLocation` is passed through in the `POST /api/bookings` body for future persistence.

---

### Task 2 – TalkJS Integration

#### `components/TalkJSChat.tsx` (new)

- Dynamically imports `talkjs` (`import("talkjs")`) — browser-only SDK, safe in Next.js.
- Waits for `Talk.default.ready` before initialising to avoid race conditions.
- **Lifecycle:** creates `Session` → `getOrCreateConversation(conversationId)` → `createChatbox()` → `chatbox.mount(ref)`.
- `conversationId` is deterministic (`booking-{bookingId}` or `vendor-{vendorId}-user-{userId}`) so the same thread is always resumed.
- Session `destroy()` called in `useEffect` cleanup — prevents memory leaks and WebSocket orphans.
- Three UI states: `loading` (spinner), `no-token` (instructional message), `error` (retry prompt), `ready` (chatbox visible).
- Props: `currentUser: TalkJSUser`, `otherUser: TalkJSUser`, `conversationId: string`, `height?: number`.

#### `app/vendors/[id]/page.tsx` (updated)

- Server Component now fetches both the vendor and the logged-in `currentUser` in parallel (`Promise.all`).
- Passes `currentUser` (id, name, email, role) down to `<VendorActionButtons>`.

#### `app/vendors/[id]/VendorActionButtons.tsx` (new)

- Client Component owning both the BookingModal and the TalkJS dialog state.
- Two buttons: **Book Now** (opens Zustand modal) + **Chat with Vendor** (opens Dialog).
- Unauthenticated users see a "Sign in" prompt inside the chat dialog instead of a broken TalkJS init.
- Replaces the old `BookNowButton.tsx` (which only handled the booking modal).

#### `app/dashboard/VendorLeads.tsx` (updated)

- Converted to `"use client"` (was already a candidate since it needed dialog state).
- Each lead card now has a **Reply via Chat** button.
- Clicking opens a `<Dialog>` with `<TalkJSChat>` pre-populated with the vendor as `currentUser` and the planner as `otherUser`.
- `conversationId` is `booking-{lead.id}` — matches the thread created server-side on booking creation.
- Accepts new `vendorUser` prop (passed from `dashboard/page.tsx`).

#### `app/dashboard/page.tsx` (updated)

- Passes `vendorUser: { id, name, email }` to `<VendorLeads>` when the logged-in user is a VENDOR.

---

### Task 3 – Make.com Automation

#### `lib/make.ts` (new)

- `triggerMakeWebhook(payload: MakeWebhookPayload): Promise<boolean>`
- **Error isolation pattern:** entire function wrapped in `try/catch`; errors are `console.error`'d and `false` is returned — the caller is never blocked.
- **Timeout:** `AbortSignal.timeout(8000)` — 8 s hard ceiling prevents a slow Make.com response from stalling the booking API.
- Silent skip when `MAKE_WEBHOOK_URL` is unset in development; `console.warn` in production.
- **Payload fields:** `eventType`, `plannerEmail`, `plannerPhone`, `plannerName`, `vendorName`, `vendorCity`, `vendorCategory`, `eventDate`, `guestCount`, `message`, `bookingId`, `firedAt`.

#### `app/api/bookings/route.ts` (updated)

Two fire-and-forget calls added after `prisma.booking.create`:

1. **`triggerMakeWebhook`** — sends the full booking payload to Make.com. Uses `void` to explicitly discard the promise so TypeScript doesn't warn about unhandled rejections.

2. **`createTalkJSConversation`** (inline server helper) — calls the TalkJS REST API in sequence:
   - `PUT /users/{plannerId}` — upsert planner
   - `PUT /users/{vendorUserId}` — upsert vendor
   - `PUT /conversations/{conversationId}` — create/update thread with both participants
   - All three calls have independent 8 s timeouts and a shared `try/catch`.

**Design decision:** TalkJS conversation is created server-side at booking time (not lazily on first chat open) so both parties can receive TalkJS push notifications immediately.

#### `app/api/automate/route.ts` (new)

Inbound webhook receiver — Make.com calls this URL to push status updates back into the app.

| Feature             | Detail                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| Auth                | `X-Automate-Secret` header matched against `AUTOMATE_WEBHOOK_SECRET` env var |
| `BOOKING_CONFIRMED` | Updates `Booking.status` → `CONFIRMED` via Prisma                            |
| `BOOKING_CANCELED`  | Updates `Booking.status` → `CANCELED` via Prisma                             |
| `SEND_REMINDER`     | Placeholder logged; push notification hook for Day 5                         |
| Unknown events      | Logged and acknowledged with `200` — forward-compatible                      |
| `GET /api/automate` | Health-check endpoint for Make.com connection test                           |

---

### `.env.example` (updated)

Added all new required variables:

| Variable                    | Service  | Notes                                                 |
| --------------------------- | -------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_MAPBOX_TOKEN`  | Mapbox   | Public token, served via `/api/map-token`             |
| `NEXT_PUBLIC_TALKJS_APP_ID` | TalkJS   | Public app ID, used in browser SDK                    |
| `TALKJS_SECRET_KEY`         | TalkJS   | Server-only, used in bookings route REST calls        |
| `MAKE_WEBHOOK_URL`          | Make.com | Outbound – CamEventFlow → Make scenario               |
| `AUTOMATE_WEBHOOK_SECRET`   | Make.com | Inbound auth header – Make scenario → `/api/automate` |

---

### Files Modified / Created (Day 3)

| File                                       | Change                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `package.json`                             | Added `mapbox-gl`, `react-map-gl`, `talkjs`, `@types/mapbox-gl`         |
| `app/api/map-token/route.ts`               | New – secure Mapbox token endpoint                                      |
| `app/api/bookings/route.ts`                | Added `triggerMakeWebhook` + `createTalkJSConversation` calls           |
| `app/api/automate/route.ts`                | New – inbound Make.com webhook receiver                                 |
| `app/discover/DiscoverMapClient.tsx`       | Full rewrite: real `react-map-gl` map, style picker, fallback retained  |
| `app/vendors/[id]/page.tsx`                | Added `currentUser` fetch, passes to `VendorActionButtons`              |
| `app/vendors/[id]/VendorActionButtons.tsx` | New – Book Now + Chat with Vendor client wrapper                        |
| `app/dashboard/VendorLeads.tsx`            | Converted to client component, Reply via Chat wired                     |
| `app/dashboard/page.tsx`                   | Passes `vendorUser` to `VendorLeads`                                    |
| `components/BookingModal.tsx`              | `MapboxVenuePicker` wired into form                                     |
| `components/MapboxVenuePicker.tsx`         | New – geocoding venue search with `onLocationSelect`                    |
| `components/TalkJSChat.tsx`                | New – TalkJS chatbox with session lifecycle management                  |
| `lib/make.ts`                              | New – `triggerMakeWebhook` with error isolation                         |
| `lib/stores/useBookingStore.ts`            | Added `venueLocation` to `BookingDraft` type                            |
| `.env.example`                             | Added `TALKJS_SECRET_KEY`, `AUTOMATE_WEBHOOK_SECRET`, improved comments |

---

### Updated Sprint Checklist

#### Day 3 ✅ – External Integrations

- [x] `mapbox-gl` + `react-map-gl` installed
- [x] Secure `/api/map-token` endpoint
- [x] Real interactive map in `/discover` (Marker + Popup + NavigationControl + GeolocateControl)
- [x] Map style picker (Dark / Streets / Satellite / Outdoors)
- [x] `MapboxVenuePicker` in BookingModal with geocoding
- [x] `TalkJSChat` component (session lifecycle, no-token/error states)
- [x] Chat with Vendor dialog on vendor profile
- [x] Reply via Chat on vendor dashboard leads
- [x] TalkJS conversation auto-created server-side on booking
- [x] `triggerMakeWebhook` (fire-and-forget, 8 s timeout, error isolated)
- [x] Inbound `/api/automate` receiver (secret auth, CONFIRMED/CANCELED/REMINDER)
- [x] `.env.example` fully documented with all integration variables

#### Day 4 (Next) – Auth, Polish & PWA

- [ ] Supabase Auth login/signup pages (`/login`, `/signup`)
- [ ] Next.js middleware for Supabase session refresh
- [ ] User auto-creation on first sign-in (Supabase `onAuthStateChange` or DB webhook)
- [ ] Vendor profile creation flow for VENDOR role users
- [ ] Push notifications for `SEND_REMINDER` events via `/api/automate`
- [ ] Lighthouse PWA audit – add `public/icons/icon-192.png` + `icon-512.png`
- [ ] Error boundaries and loading skeletons across all pages
- [ ] End-to-end test: planner books → Make.com fires → vendor sees lead → chat opens

---

## ✅ Day 4 – Authentication, Onboarding & PWA Polish

### Overview

Completed the full authentication loop (sign up → DB sync → onboarding → dashboard), the multi-step vendor profile creation flow, and all PWA/SEO polish needed for a Day 5 production demo. No existing APIs or map code was touched.

---

### Task 1 – Supabase Auth Pages & Middleware

#### `app/login/page.tsx` (new)

- Email + password sign-in using `createBrowserClient().signInWithPassword`.
- Show/hide password toggle (accessible `aria-label`).
- On success: `router.push("/dashboard")` + `router.refresh()` to flush server component cache.
- Error displayed inline with `role="alert"`.
- Links to `/signup`.

#### `app/signup/page.tsx` (new)

- **Role toggle** — two icon cards (User = Planner, Building2 = Vendor) with `aria-pressed`, colour transitions, and a contextual description line explaining each role.
- Full name, email, password (min 8 chars) fields.
- Calls `supabase.auth.signUp` with `user_metadata: { name, role }` and `emailRedirectTo: /api/auth/callback`.
- If a session is returned immediately (email confirm disabled in Supabase dashboard), fires `POST /api/users` inline.
- Redirects: VENDOR → `/onboarding/vendor`, PLANNER → `/dashboard`.

#### `middleware.ts` (new)

- Uses `@supabase/ssr` `createServerClient` (not the app-router version) so it works in the Edge runtime.
- `getUser()` called on every request — this is the Supabase-recommended session refresh mechanism.
- **Protected prefixes:** `/dashboard`, `/discover`, `/onboarding`.
- **Public routes:** `/vendors`, `/vendors/[id]` (browse is unauthenticated; booking API is gated separately).
- Unauthenticated → redirect to `/login?next={pathname}` (preserves intended destination).
- Authenticated on `/login` or `/signup` → redirect to `/dashboard`.
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `icons/`, `manifest.json`, and `api/` from middleware runs.

---

### Task 2 – User Auto-Creation

#### `app/api/auth/callback/route.ts` (new)

Handles all Supabase Auth redirect scenarios:

- Email confirmation links
- OAuth provider callbacks (Google/GitHub — ready for Day 5)

Flow:

1. `supabase.auth.exchangeCodeForSession(code)` — swaps the PKCE `code` for a session and sets the auth cookies.
2. Extracts `name` and `role` from `user.user_metadata` (set at `signUp` time).
3. `POST /api/users` — upserts the DB row (non-fatal; errors are logged).
4. Redirects: VENDOR → `/onboarding/vendor`, PLANNER → `/dashboard` (or `?next=` param).

#### `app/api/users/route.ts` (new)

- `POST /api/users` — accepts `{ supabaseId, email, name, role }`.
- Checks for existing user by `supabaseId` — returns `200 { created: false }` if found.
- Creates new row and returns `201 { created: true }` otherwise.
- **Fully idempotent**: safe to call from signup page, callback route, and `onAuthStateChange` without race conditions.

#### `lib/supabase.ts` (updated)

Added `initAuthListener()`:

- Calls `supabase.auth.onAuthStateChange`.
- On `SIGNED_IN` event: fires `POST /api/users` with user metadata.
- Returns the `unsubscribe` function for cleanup.
- Reads `name` and `role` from `user.user_metadata` — consistent with how `signUp` stores them.

#### `components/AuthProvider.tsx` (new)

- `"use client"` wrapper that calls `initAuthListener()` inside `useEffect` and cleans up on unmount.
- Wraps the entire app in `app/layout.tsx` so the listener is active on every page.
- Renders no UI — purely a side-effect component.

**Design decision:** Three separate sync paths (signup page inline, callback route, onAuthStateChange) ensure the DB row always exists regardless of whether the user confirms via email, signs in via OAuth, or reuses an existing session.

---

### Task 3 – Vendor Onboarding

#### `lib/stores/useVendorOnboardingStore.ts` (new)

4-step data model managed by Zustand:

| Step | Fields                                                                                |
| ---- | ------------------------------------------------------------------------------------- |
| 1    | `category` (VendorCategory enum), `city` (VendorCity enum)                            |
| 2    | `basePrice` (number), `description` (string, min 20 chars)                            |
| 3    | `profileImageUrl` (Supabase Storage public URL), `profileImageFile` (File, transient) |
| 4    | `latitude`, `longitude`, `placeName` (from MapboxVenuePicker)                         |

Actions: `nextStep`, `prevStep`, `setStep`, `updateData`, `setSubmitting`, `setSubmitError`, `reset`.

#### `app/onboarding/vendor/page.tsx` (new)

Full 4-step form with animated step indicator (growing pill dots):

- **Step 1 — Category & City:** Grid of category pills (Venue / Caterer / Decorator / Sound / Photographer) + city toggle buttons. Continue disabled until both selected.
- **Step 2 — Pricing & Description:** Number input with live XAF formatting preview. Textarea (min 20 chars counter shown). Continue disabled until both valid.
- **Step 3 — Profile Image:** Click-to-upload dropzone with local object URL preview and inline Supabase Storage upload (`vendor-images` bucket). Loading spinner overlay during upload. Skip allowed (image is optional).
- **Step 4 — Location:** `<MapboxVenuePicker>` from Day 3. Confirmation pill shows place name + coordinates on selection. Final submit calls `POST /api/vendors/create`.

On success: `reset()` store, `router.push("/dashboard")`, `router.refresh()`.

#### `app/api/vendors/create/route.ts` (new)

- Auth-guarded: resolves `supabaseId → User`.
- **Idempotency guard:** returns `409` if `user.vendor` already exists.
- Validates `category` against `VendorCategory` enum, `city` against `City` enum, `basePrice ≥ 0`.
- Creates `Vendor` row with `isEvent: false`, `availability: true`, `activeStatus: UPCOMING`.
- Ensures `user.role` is set to `VENDOR` (corrects edge cases where the role was not set at signup).

---

### Task 4 – PWA Polish & UI

#### PWA Icons (`public/icons/`)

Two SVG icons created programmatically (no external tools needed):

- `icon-192.svg` — 192×192, rounded rect background `#2563EB`, calendar icon with grid dots, amber accent dot `#FBBF24`.
- `icon-512.svg` — 512×512, same design scaled up for high-DPI displays.
- `public/manifest.json` updated to reference SVGs (`type: image/svg+xml`, `purpose: maskable any`).

**Why SVG?** Browsers that support PWA install (Chrome, Safari 17+, Firefox) all accept SVG icons in the manifest. No build tooling needed to convert to PNG for the demo; swap for rasterised PNGs before production if needed.

#### `app/layout.tsx` (updated)

Added to `metadata`:

- `icons` array with `icon`, `apple`, and `shortcut` entries pointing to the SVG icons.
- `twitter: { card: "summary", title, description }` — Twitter/X card support.
- `robots: { index: true, follow: true }`.
- `metadataBase` using `NEXT_PUBLIC_SITE_URL` env var (falls back to Vercel URL).
- `lang="fr"` on `<html>` (primary language of target market).
- `<AuthProvider>` wrapping `<main>` and `<Navbar>`.

#### `components/ui/skeleton.tsx` (new)

Standard Shadcn-style `<Skeleton>` component (`animate-pulse bg-muted`).

#### `app/vendors/loading.tsx` (new)

- 4 `VendorCardSkeleton` items (image placeholder + 4 text lines + button).
- 3-column filter bar skeleton.
- `aria-busy="true"` on wrapper for screen readers.

#### `app/dashboard/loading.tsx` (new)

- 3 `BookingCardSkeleton` items (title + badge + 3 detail lines).
- Tab bar skeleton.
- `aria-busy="true"` on wrapper.

#### `app/dashboard/page.tsx` (updated)

Added vendor onboarding prompt banner:

- Shown **only** when `user.role === "VENDOR"` AND `user.vendor === null`.
- Amber-coloured alert card with `AlertCircle` icon, explanatory copy, and a "Set up profile" `Button` → `/onboarding/vendor`.
- No UI change for PLANNER users or vendors with complete profiles.

---

### Files Modified / Created (Day 4)

| File                                     | Change                                   |
| ---------------------------------------- | ---------------------------------------- |
| `middleware.ts`                          | New – session refresh + route protection |
| `app/login/page.tsx`                     | New – email/password sign-in UI          |
| `app/signup/page.tsx`                    | New – sign-up with role toggle           |
| `app/api/auth/callback/route.ts`         | New – PKCE callback + DB sync            |
| `app/api/users/route.ts`                 | New – idempotent User upsert             |
| `app/api/vendors/create/route.ts`        | New – Vendor profile creation            |
| `app/onboarding/vendor/page.tsx`         | New – 4-step vendor onboarding form      |
| `app/dashboard/page.tsx`                 | Onboarding prompt added                  |
| `app/dashboard/loading.tsx`              | New – skeleton loader                    |
| `app/vendors/loading.tsx`                | New – skeleton loader                    |
| `app/layout.tsx`                         | AuthProvider, full SEO/icon metadata     |
| `components/AuthProvider.tsx`            | New – mounts onAuthStateChange listener  |
| `components/ui/skeleton.tsx`             | New – Skeleton primitive                 |
| `lib/supabase.ts`                        | Added `initAuthListener()`               |
| `lib/stores/useVendorOnboardingStore.ts` | New – 4-step onboarding Zustand store    |
| `public/icons/icon-192.svg`              | New – PWA icon 192×192                   |
| `public/icons/icon-512.svg`              | New – PWA icon 512×512                   |
| `public/manifest.json`                   | Updated to SVG icon entries              |

---

### Supabase Configuration Checklist (required before demo)

These settings must be applied in the Supabase dashboard — they cannot be set in code:

- [ ] **Authentication → URL Configuration → Site URL:** set to your Vercel deployment URL.
- [ ] **Authentication → URL Configuration → Redirect URLs:** add `https://{your-domain}/api/auth/callback`.
- [ ] **Storage → New bucket:** create bucket named `vendor-images`, set to **public**.
- [ ] **Storage → Policies:** add INSERT policy for authenticated users on `vendor-images`.
- [ ] _(Optional)_ **Authentication → Email:** disable "Confirm email" for demo so signups log in immediately without checking inbox.

---

### Updated Sprint Checklist

#### Day 4 ✅ – Auth, Onboarding & Polish

- [x] Login page (email/password, show/hide, redirect)
- [x] Signup page (role toggle, metadata, DB sync)
- [x] Middleware (session refresh, route protection, ?next= redirect)
- [x] Auth callback route (PKCE, DB upsert, role-based redirect)
- [x] `POST /api/users` (idempotent upsert)
- [x] `initAuthListener` + `AuthProvider` (onAuthStateChange → DB sync)
- [x] `useVendorOnboardingStore` (4-step Zustand store)
- [x] Vendor onboarding page (category, city, price, desc, image, location)
- [x] `POST /api/vendors/create` (auth-guarded, idempotent)
- [x] SVG PWA icons (192 + 512)
- [x] Full SEO metadata in layout.tsx
- [x] Skeleton loaders for /vendors and /dashboard
- [x] Dashboard onboarding prompt for incomplete vendor profiles

#### Day 5 (Final) – Deploy & Demo Prep

- [ ] Run `npm install` to install all new deps
- [ ] Run `npm run db:migrate` to apply any pending schema changes
- [ ] Run `npm run db:seed` to populate 5 demo events on the map
- [ ] Configure Supabase dashboard (URL, redirect, storage bucket — see checklist above)
- [ ] Set all env vars in Vercel: DATABASE_URL, Supabase keys, Mapbox token, TalkJS keys, Make.com webhooks
- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] End-to-end smoke test: sign up → onboard vendor → planner books → Make webhook fires → TalkJS chat opens
- [ ] Lighthouse PWA audit (target ≥ 90)
- [ ] Replace SVG icons with rasterised PNG if needed for full iOS PWA support
- [ ] Add error boundaries (`error.tsx`) to /vendors and /dashboard

---

## ✅ Day 4 (Pivot) – Mapbox → OpenStreetMap / react-leaflet

### Reason for pivot

Mapbox account creation was blocked. The map was switched to **react-leaflet + OpenStreetMap** which requires zero API keys and is fully open-source.

---

### Changes

#### `package.json`

| Removed                         | Added                          |
| ------------------------------- | ------------------------------ |
| `mapbox-gl@^3.7.0`              | `leaflet@^1.9.4`               |
| `react-map-gl@^7.1.7`           | `react-leaflet@^4.2.1`         |
| `@types/mapbox-gl@^3.4.0` (dev) | `@types/leaflet@^1.9.14` (dev) |

#### `app/discover/DiscoverMapClient.tsx` (rewritten)

- All `react-map-gl` imports removed.
- All `NEXT_PUBLIC_MAPBOX_TOKEN` and `/api/map-token` fetch logic removed.
- Map now renders immediately with zero configuration.
- The real Leaflet map is split into a separate `LeafletMap.tsx` module and loaded via `next/dynamic` with `ssr: false` — Leaflet is browser-only and crashes if executed server-side.
- `StaticMapFallback` retained as a safety net if Leaflet throws a runtime error (caught via `window.addEventListener("error")`).
- `EventPopupCard` and helpers (`formatTime`, `formatDate`) exported so `LeafletMap.tsx` can share them without circular deps.
- All overlay UI (search bar, filter pills, legend) uses `z-[1000]` to sit above Leaflet's default `z-index: 400` tiles.

#### `app/discover/LeafletMap.tsx` (new)

- `"use client"` module, **never SSR'd** (loaded only via `dynamic()`).
- Imports `leaflet/dist/leaflet.css` for tile + control styles.
- Fixes Leaflet's broken default icon paths in webpack by pointing `L.Icon.Default` at the unpkg CDN images.
- Two custom `L.divIcon` markers: red (`#ef4444`) for **LIVE**, amber (`#f59e0b`) for **UPCOMING**.
- LIVE pins include an inline CSS `@keyframes leaflet-pin-pulse` animation ring.
- `<KeyboardFix>` child component disables Leaflet's keyboard handler so the GlobalSearchBar input still works on the map page.
- `<Marker>` with `eventHandlers.click` → `onPinClick` callback.
- `<Popup>` with `closeButton={false}` wrapping `<EventPopupCard>`.
- Pin `iconAnchor: [18, 36]` anchors at the bottom-centre; `popupAnchor: [0, -36]` opens the popup above.

#### `app/globals.css` (updated)

- Added `.leaflet-popup-reset` CSS rules: strips Leaflet's default white popup chrome so `EventPopupCard`'s own border/shadow design shows through.
- Added `@keyframes leaflet-pin-pulse` for the LIVE pin ring animation.

#### `.env.example` (updated)

- Removed `NEXT_PUBLIC_MAPBOX_TOKEN` as a map requirement; kept it with a note that it is only needed by `MapboxVenuePicker` for address geocoding in the booking modal.
- Added `NEXT_PUBLIC_OSM_TILE_URL` (optional override for the OpenStreetMap tile server).
- Added `NEXT_PUBLIC_SITE_URL` (used by `metadataBase` in `app/layout.tsx`).
- Added OSM tile usage policy link for production awareness.

---

### Architecture notes

- **No API key ever needed** for the map — OpenStreetMap tiles are free.
- The geocoding venue picker in `BookingModal` still calls the Mapbox Geocoding REST API. If Mapbox access remains blocked, replace `components/MapboxVenuePicker.tsx` with a [Nominatim](https://nominatim.openstreetmap.org/ui/search.html)-backed component (free, no key) and remove `NEXT_PUBLIC_MAPBOX_TOKEN` entirely.
- `react-leaflet` v4 requires React 18+; compatible with the project's React 19.

---

### Run after this change

```bash
npm install          # picks up leaflet + react-leaflet, removes mapbox-gl + react-map-gl
npm run dev          # map should render immediately at /discover
npm run db:seed      # re-seed events if DB was reset
```

---

## ✅ Day 5 – Database Provider Migration: Supabase → Neon

### Reason

Persistent `P1001` (unreachable) and authentication errors with the Supabase direct PostgreSQL connection. Supabase Auth and Storage are retained — only the database layer moves to Neon.

### Architecture after migration

| Layer    | Provider                         | Purpose                              |
| -------- | -------------------------------- | ------------------------------------ |
| Database | **Neon** (serverless PostgreSQL) | All Prisma queries, migrations, seed |
| Auth     | **Supabase** (unchanged)         | Sign-up, sign-in, session cookies    |
| Storage  | **Supabase** (unchanged)         | `vendor-images` bucket               |

---

### Changes

#### `prisma/schema.prisma`

- Header comment updated: "PostgreSQL via Neon (serverless)"
- `directUrl = env("DATABASE_URL")` → `directUrl = env("DIRECT_URL")`
- Inline comments explain the purpose of each URL variable

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled  – runtime
  directUrl = env("DIRECT_URL")     // direct  – Prisma CLI
}
```

#### `package.json`

- `"build"` script updated to `"prisma generate && next build"` so Vercel always regenerates the Prisma client before the Next.js build. This prevents stale client errors after schema changes.

#### `.env.example`

- `DATABASE_URL` and `DIRECT_URL` documented with Neon URL shapes
- Detailed comments explaining pooled vs direct distinction and how to get both URLs from the Neon console
- Old single Supabase `DATABASE_URL` removed
- All other variables unchanged

#### `.env`

- Old Supabase `DATABASE_URL` line replaced with Neon placeholder block (`DATABASE_URL` + `DIRECT_URL`)
- Supabase Auth keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) left untouched

---

### Why two connection strings?

|          | `DATABASE_URL` (pooled)                                                  | `DIRECT_URL` (direct)                                                                     |
| -------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Hostname | `<host>-pooler.<region>.aws.neon.tech`                                   | `<host>.<region>.aws.neon.tech`                                                           |
| Port     | `5432`                                                                   | `5432`                                                                                    |
| Used by  | Next.js app at runtime                                                   | Prisma CLI only                                                                           |
| Why      | PgBouncer multiplexes connections — essential for serverless cold starts | Migrations require a persistent session; PgBouncer transaction mode breaks DDL statements |

---

### Setup steps (fill in after creating your Neon project)

```
1. console.neon.tech → New Project → choose a region close to your users
2. Connection Details → toggle Pooled ON  → copy → paste as DATABASE_URL in .env
3. Connection Details → toggle Pooled OFF → copy → paste as DIRECT_URL in .env
4. npx prisma db push          (applies schema to Neon)
5. npm run db:seed             (seeds 5 demo events)
6. npm run dev                 (verify app connects)
```

No code changes are needed anywhere else — `lib/prisma.ts`, all API routes, and the seed script all use the `prisma` singleton which now points to Neon automatically.

---

## ✅ Day 5 (Final) – Database Migration: Neon → Turso (libSQL)

### Reason

Persistent P1013 connection string errors with both Supabase direct and Neon pooled PostgreSQL endpoints. Turso uses libSQL (SQLite-compatible, serverless) with a simple URL + token auth model that has no connection pooler complexities.

### Architecture after migration

| Layer    | Provider                    | Purpose                              |
| -------- | --------------------------- | ------------------------------------ |
| Database | **Turso** (libSQL / SQLite) | All Prisma queries, migrations, seed |
| Auth     | **Supabase** (unchanged)    | Sign-up, sign-in, session cookies    |
| Storage  | **Supabase** (unchanged)    | `vendor-images` bucket               |

---

### Files changed

#### `package.json`

Added to `dependencies`:

- `@libsql/client@^0.14.0` — Turso's official libSQL JavaScript client
- `@prisma/adapter-libsql@^5.22.0` — Prisma driver adapter for libSQL

No removals — `@prisma/client` and `prisma` remain at the same versions.

#### `prisma/schema.prisma`

| Before                          | After                                     |
| ------------------------------- | ----------------------------------------- |
| `provider = "postgresql"`       | `provider = "sqlite"`                     |
| `url = env("DATABASE_URL")`     | `url = env("TURSO_DATABASE_URL")`         |
| `directUrl = env("DIRECT_URL")` | removed (not needed with adapter)         |
| Prisma enum types               | `String` fields with valid-value comments |
| `previewFeatures` absent        | `previewFeatures = ["driverAdapters"]`    |

**Why enums became Strings:** SQLite has no native `ENUM` type. Prisma's sqlite provider does not support enum declarations. Valid values are enforced at the application layer (API route validation) and documented inline in the schema.

#### `lib/prisma.ts`

Complete rewrite using the driver adapter pattern:

```ts
const libsql = createClient({ url, authToken });
const adapter = new PrismaLibSQL(libsql);
export const prisma = new PrismaClient({ adapter });
```

- `createClient` from `@libsql/client` handles both `libsql://` (remote Turso) and `file://` (local dev) URLs transparently.
- `authToken` is only passed when set — file-based URLs don't require it.
- Singleton pattern retained for Next.js hot-reload safety.
- Dev logging (`query`, `error`, `warn`) retained.

#### `prisma/seed.ts`

- Imports `PrismaLibSQL` + `createClient` and builds the adapter directly (same pattern as `lib/prisma.ts`).
- All enum string literals changed from TypeScript `as const` casts to plain strings (`"VENDOR"`, `"LIVE"`, etc.) since the schema no longer has enum types.
- `latitude` and `longitude` explicitly cast with `parseFloat()` to guarantee numeric storage.
- `Date` objects passed directly — Prisma's libSQL adapter converts them to ISO-8601 text.

#### `.env`

- `DATABASE_URL` and `DIRECT_URL` removed.
- Added `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` placeholders.

#### `.env.example`

- Old Neon PostgreSQL block replaced with Turso block.
- Step-by-step Turso CLI setup instructions included.
- All other variables (Supabase, OSM, Mapbox, TalkJS, Make.com, site URL) unchanged.

---

### Setup steps

```bash
# 1. Install new dependencies
npm install

# 2. Fill in your Turso credentials in .env
#    Get them from: turso.tech (free tier) or use local file for dev:
#    TURSO_DATABASE_URL="file:./dev.db"
#    TURSO_AUTH_TOKEN=""

# 3. Generate the Prisma client with the new schema
npx prisma generate

# 4. Push schema to Turso (creates tables)
npx prisma db push

# 5. Seed demo events
npm run db:seed

# 6. Start dev server
npm run dev
```

### Local development without a Turso account

Set these two lines in `.env` to use a local SQLite file — no signup needed:

```
TURSO_DATABASE_URL="file:./dev.db"
TURSO_AUTH_TOKEN=""
```

Then run `npx prisma db push` and `npm run db:seed` as normal.

---

## ✅ Database Layer Stabilisation – MySQL / XAMPP (Final local dev state)

### Journey summary

The database provider went through three iterations before landing on a stable local setup:

| Attempt         | Provider                     | Outcome                                                                     |
| --------------- | ---------------------------- | --------------------------------------------------------------------------- |
| 1               | Supabase PostgreSQL (direct) | `P1001` unreachable / `P1013` auth errors                                   |
| 2               | Neon serverless PostgreSQL   | Persistent pooler connection timeouts                                       |
| 3               | Turso (libSQL / SQLite)      | Working, but SQLite limitations (no enums, text coercions) created friction |
| **4 (current)** | **MySQL via XAMPP**          | **Stable – full local dev, zero cloud dependency**                          |

---

### Changes applied in this session

#### `package.json`

Removed all adapter/driver packages that are no longer needed for standard MySQL:

| Removed                     | Reason                                                                  |
| --------------------------- | ----------------------------------------------------------------------- |
| `@libsql/client`            | Turso libSQL client – not needed for MySQL                              |
| `@prisma/adapter-libsql`    | Turso driver adapter – not needed for MySQL                             |
| `@tidbcloud/prisma-adapter` | TiDB Cloud adapter – premature; will be re-added when deploying to TiDB |
| `@tidbcloud/serverless`     | TiDB Cloud serverless driver – same as above                            |

The `build` script `prisma generate && next build` and the `ts-node` seed config remain unchanged.

#### `prisma/schema.prisma`

Already correct from the previous session — confirmed clean:

- `provider = "mysql"`
- `url = env("DATABASE_URL")`
- No `previewFeatures` (removed `"driverAdapters"` that was needed for libSQL)
- `description` and `message` fields use `@db.Text` to avoid MySQL's `utf8mb4` 191-char `VARCHAR` index limit
- All constrained string fields (`role`, `category`, `city`, `activeStatus`, `status`) use `String` with valid-value comments — compatible with both MySQL and TiDB Cloud

#### `lib/prisma.ts`

Already correct — standard `new PrismaClient()` singleton with no adapter imports. Dev logging enabled in development mode.

#### `prisma/seed.ts`

Already correct — standard `new PrismaClient()`, plain `Date` objects for timestamps, numeric literals for `latitude`/`longitude`. No libSQL adapter code.

#### `.env`

Already correct — `DATABASE_URL="mysql://root:@127.0.0.1:3306/cameventflow"`. All Turso variables removed. All Supabase, TalkJS, Make.com, and site URL variables untouched.

---

### Current architecture

| Layer                      | Provider                          | How                                                    |
| -------------------------- | --------------------------------- | ------------------------------------------------------ |
| Database (local dev)       | **MySQL via XAMPP**               | `DATABASE_URL` in `.env`                               |
| Database (production path) | **TiDB Cloud** (MySQL-compatible) | Same schema, swap connection string + add TiDB adapter |
| Auth                       | **Supabase**                      | `lib/supabase.ts`, `middleware.ts`                     |
| Storage                    | **Supabase**                      | `vendor-images` bucket                                 |
| Map                        | **OpenStreetMap** (react-leaflet) | No API key required                                    |
| Messaging                  | **TalkJS**                        | `components/TalkJSChat.tsx`                            |
| Notifications              | **Make.com**                      | `lib/make.ts`, `app/api/automate/route.ts`             |

---

### Commands to run after any fresh clone or `npm install`

```powershell
# 1. Ensure XAMPP MySQL is running and 'cameventflow' database exists in phpMyAdmin

# 2. Install dependencies (libSQL packages are gone, install is faster)
npm install

# 3. Generate Prisma client for MySQL provider
npx prisma generate

# 4. Push schema to local MySQL (creates tables)
npx prisma db push

# 5. Seed 5 demo events
npm run db:seed

# 6. Start dev server
npm run dev
```

### Future TiDB Cloud migration (when ready)

1. Create a TiDB Cloud Serverless cluster
2. Update `DATABASE_URL` in `.env` (and Vercel env vars) to the TiDB connection string
3. Re-add `@tidbcloud/prisma-adapter` and `@tidbcloud/serverless` to `package.json`
4. Add `previewFeatures = ["driverAdapters"]` back to the generator block
5. Update `lib/prisma.ts` to use the TiDB adapter (same pattern as the previous libSQL implementation)
6. No schema changes required — the MySQL-compatible schema works as-is on TiDB

---

## ✅ Post-Sprint Fixes & Enhancements

### 1 – Supabase `next/headers` Client-Side Crash

**Problem:** `lib/supabase.ts` imported `cookies` from `next/headers` at the top level. `AuthProvider` (a `"use client"` component) imported from that file, pulling `next/headers` into the browser bundle and crashing compilation.

**Fix:** Split into two files:

| File                     | Contains                                  | Safe to import in                 |
| ------------------------ | ----------------------------------------- | --------------------------------- |
| `lib/supabase.ts`        | `createServerClient`, `getSupabaseUser`   | Server Components, Route Handlers |
| `lib/supabase.client.ts` | `createBrowserClient`, `initAuthListener` | `"use client"` components only    |

Files updated to use `lib/supabase.client`:

- `components/AuthProvider.tsx`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/onboarding/vendor/page.tsx`

---

### 2 – Auth Navigation Flow Fixes

**Problems:**

1. After signup, users were redirected to `/login` instead of their dashboard — Supabase returned a user but no session (email confirmation required), and the code redirected anyway.
2. Login returned "email not recognised" for unconfirmed accounts with no actionable message.

**Fixes in `app/signup/page.tsx`:**

- Check `data.session` after `signUp()`. If `null` → show a "Check your email" screen instead of redirecting.
- Added resend confirmation email button on that screen.

**Fixes in `app/login/page.tsx`:**

- `friendlyError()` function maps raw Supabase error strings to plain English.
- Detects `"email not confirmed"` specifically and shows an inline "Resend confirmation email" button.
- `useSearchParams` wrapped in `<Suspense>` (required by Next.js 15).
- On successful login, fires `POST /api/users` as a safety net in case the DB row was never created.
- Respects `?next=` redirect param set by middleware.

---

### 3 – `.env.local` Override Bug

**Problem:** `.env.local` contained an old Neon `postgresql://` `DATABASE_URL` which silently overrode the correct `mysql://` value in `.env`. Next.js always prioritises `.env.local`.

**Fix:** Rewrote `.env.local` to use `DATABASE_URL="mysql://root:@127.0.0.1:3306/cameventflow"` and removed all stale Neon/Turso variables.

---

### 4 – Leaflet "Map container is already initialized" (Three attempts)

**Root cause:** `react-leaflet`'s `<MapContainer>` uses React reconciliation which reuses DOM nodes across hot-reloads without unmounting them. Leaflet stamps `_leaflet_id` on the DOM node on first init and throws when it sees the stamp on re-init.

**Final fix:** Abandoned `react-leaflet` entirely. Rewrote `app/discover/LeafletMap.tsx` using the raw imperative Leaflet API:

- `L.map()` called once inside `useEffect` with a `mapRef.current` guard.
- `map.remove()` called in the cleanup function — Leaflet's own teardown, guaranteed before next mount.
- Leaflet imported dynamically (`await import("leaflet")`) so it never runs during SSR.
- Component loaded via `next/dynamic({ ssr: false })` to enforce the browser-only boundary.

Additional fixes:

- Removed `import "leaflet/dist/leaflet.css"` from `DiscoverMapClient.tsx` (parent file) — kept only in `LeafletMap.tsx` inside the dynamic boundary.
- Icon fix and pin creation moved inside `useEffect`, not at module scope.

---

### 5 – Map Not Interactive (Drag / Zoom / Touch Broken)

**Problems:**

1. Overlay divs (`z-[1000]`) stretched across the full screen and intercepted all pointer events before they reached the map.
2. Container `div` missing `position: relative` — Leaflet requires it to correctly translate mouse/touch coordinates.
3. `keyboard: false` was too aggressive, disabling more than intended.

**Fixes:**

- All overlay wrapper divs set to `pointer-events-none`; only the actual buttons inside use `pointer-events-auto`.
- Container div given `position: relative` inline style.
- All map interactions explicitly enabled: `dragging`, `scrollWheelZoom`, `touchZoom`, `doubleClickZoom`, `tap`, `inertia`, `boxZoom`, `keyboard`.
- Initial zoom raised from `6` (country) to `14` (street level).

---

### 6 – Immediate User Geolocation on Map Open

**Problem:** Map opened on a hardcoded Yaoundé center, then `getCurrentPosition` fired and called `flyTo` — users saw the wrong location first, then a jarring animation.

**Fix:** `getUserLocation()` promise resolves **before** `L.map()` is called:

- 3-second timeout races `getCurrentPosition`; if denied or slow → falls back to Yaoundé silently.
- Map is created with `center: userCenter` from the first render — no jump.
- Blue "you are here" dot + accuracy circle added immediately at the known position.
- `watchPosition` keeps the dot updated as the user moves.
- `clearWatch` called in cleanup to prevent memory leaks.

---

### 7 – `useRouter` Crash Inside Leaflet Popup

**Problem:** `EventPopupCard` used `useRouter()` but was rendered via `createRoot()` into a detached DOM node managed by Leaflet — outside the Next.js `<AppRouterContext>` provider tree. Any context-dependent hook throws in that environment.

**Fix:**

- Removed `useRouter` from `EventPopupCard`.
- Replaced `<Button onClick={() => router.push(...)}>` with a plain `<a href="/vendors/${event.id}">` anchor — no router context needed.
- Replaced all Tailwind class names in `EventPopupCard` with inline styles (detached nodes are also outside Tailwind's JIT scope).

---

### 8 – Filter Button Highlight

Active filter buttons now have `ring-2 ring-white ring-offset-1 scale-105` applied so the selected state is visually distinct from inactive buttons. Inactive buttons dimmed to `text-white/70` to increase contrast.

---

### 9 – Production Demo Seed (`prisma/seed.ts`)

Complete rewrite with realistic Cameroonian data:

- **8 Planners** — Marie Ngassa, Jean-Pierre Eto'o, Aïcha Bello, Boris Kamga, Sandrine Ngo Bassa, Paul Mbianda, Céline Ateba, Hervé Fouda
- **10 Vendors** — 6 regular profiles (Palace des Fêtes Akwa, Traiteur Excellence, Déco Élégance, Son & Lumière Pro, Photo Mémoire Studio, Buea Mountain Garden), 4 event vendors with real Douala/Yaoundé GPS coordinates
- **22 Bookings** — 15 CONFIRMED (past + future), 5 PENDING, 2 CANCELED; all with realistic French-language messages
- All users have `demo-supabase-id-N` placeholder IDs — no real Supabase auth required to view data
- Fully idempotent — safe to re-run

---

### 10 – PWA Conversion

**Package:** `@ducanh2912/next-pwa@10.2.9` (the maintained Next.js 15-compatible fork of `next-pwa`).

**Files created / modified:**

| File                         | Change                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `package.json`               | Added `@ducanh2912/next-pwa`                                                        |
| `next.config.ts`             | Wrapped with `withPWA`; disabled in dev; 4 runtime caching strategies               |
| `app/manifest.ts`            | `MetadataRoute.Manifest` — name, icons (maskable + any), display, colors            |
| `app/offline/page.tsx`       | Offline fallback page shown by SW when navigation fails                             |
| `public/sw.js`               | Fallback Network-First SW (overwritten by Workbox at build time)                    |
| `components/PWARegister.tsx` | Deferred SW registration, `updatefound` handler                                     |
| `app/layout.tsx`             | `manifest` → `/manifest.webmanifest`, `appleWebApp` iOS metadata, `<PWARegister />` |

**Runtime caching strategies:**

- OSM map tiles → CacheFirst (30 days)
- API routes → NetworkFirst (10s timeout, 24h cache)
- Static assets (images, fonts, icons) → CacheFirst (30 days)
- Google Fonts → StaleWhileRevalidate (1 year)

**Build fix:** Removed `@ts-expect-error` directives and `screenshots` field from `app/manifest.ts` — Next.js's metadata route webpack loader does a raw parse before TypeScript runs, making TypeScript comment directives in that file position cause a parse failure.

---

### Current Full Architecture

| Layer                 | Provider                         | Notes                                        |
| --------------------- | -------------------------------- | -------------------------------------------- |
| Database (local dev)  | MySQL via XAMPP                  | `DATABASE_URL` in `.env.local`               |
| Database (production) | TiDB Cloud (MySQL-compatible)    | Same schema, swap connection string          |
| Auth                  | Supabase                         | `lib/supabase.ts` + `lib/supabase.client.ts` |
| Storage               | Supabase                         | `vendor-images` bucket                       |
| Map                   | OpenStreetMap (Leaflet)          | Imperative API, no API key                   |
| Messaging             | TalkJS                           | `components/TalkJSChat.tsx`                  |
| Notifications         | Make.com                         | `lib/make.ts` + `/api/automate`              |
| PWA                   | `@ducanh2912/next-pwa` + Workbox | SW cached tiles, API, assets                 |

---

### Commands Reference

```powershell
# Install all dependencies (including PWA package)
npm install

# Generate Prisma client
npx prisma generate

# Create tables in MySQL
npx prisma db push

# Populate demo data (18 users, 22 bookings, 4 map events)
npm run db:seed

# Development (PWA disabled, no SW)
npm run dev

# Production build (generates Workbox SW in public/)
npm run build
npm start
```
