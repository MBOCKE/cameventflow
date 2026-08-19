// prisma/seed.ts
// Run with:  npx prisma db seed
// or:        npm run db:seed
//
// Creates 5 mock event entries (isEvent = true) in Douala and Yaoundé
// so the /discover map looks populated immediately on launch.
// Each event gets a synthetic User (role = VENDOR) that owns it.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Seed data ─────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    // 1 ─ Live Jazz Night · Douala Akwa district
    user: {
      email:      "jazz.douala@cameventflow.dev",
      name:       "Live Jazz Night – Akwa",
      supabaseId: "seed-user-001",
      phone:      "+237 6 55 00 11",
    },
    vendor: {
      category:       "Sound"      as const,
      city:           "Douala"     as const,
      basePrice:      5000,
      availability:   true,
      description:    "An unforgettable evening of live jazz in the heart of Akwa. Featuring top Cameroonian jazz musicians, cocktails, and an open-air stage.",
      profileImageUrl: null,
      isEvent:        true,
      latitude:       4.0511,
      longitude:      9.7085,
      activeStatus:   "LIVE"       as const,
      eventStartTime: new Date("2026-08-18T20:00:00+01:00"),
      eventEndTime:   new Date("2026-08-18T23:30:00+01:00"),
    },
  },
  {
    // 2 ─ Fashion Week Douala · Bonanjo
    user: {
      email:      "fashionweek.douala@cameventflow.dev",
      name:       "Fashion Week Douala 2026",
      supabaseId: "seed-user-002",
      phone:      "+237 6 55 00 22",
    },
    vendor: {
      category:       "Decorator"  as const,
      city:           "Douala"     as const,
      basePrice:      15000,
      availability:   true,
      description:    "Cameroon's premier fashion event showcasing the best of African designers. Runway shows, pop-up boutiques, and after-parties across Bonanjo.",
      profileImageUrl: null,
      isEvent:        true,
      latitude:       4.0406,
      longitude:      9.6934,
      activeStatus:   "UPCOMING"   as const,
      eventStartTime: new Date("2026-08-22T18:00:00+01:00"),
      eventEndTime:   new Date("2026-08-22T22:00:00+01:00"),
    },
  },
  {
    // 3 ─ Art Expo Yaoundé · Bastos
    user: {
      email:      "artexpo.yaounde@cameventflow.dev",
      name:       "Art Expo Yaoundé – Bastos Gallery",
      supabaseId: "seed-user-003",
      phone:      "+237 6 55 00 33",
    },
    vendor: {
      category:       "Venue"      as const,
      city:           "Yaounde"    as const,
      basePrice:      2000,
      availability:   true,
      description:    "A weekend celebration of contemporary Central African art. Over 40 artists, live painting performances, sculpture installations, and photography exhibits.",
      profileImageUrl: null,
      isEvent:        true,
      latitude:       3.8895,
      longitude:      11.5174,
      activeStatus:   "UPCOMING"   as const,
      eventStartTime: new Date("2026-08-23T10:00:00+01:00"),
      eventEndTime:   new Date("2026-08-24T18:00:00+01:00"),
    },
  },
  {
    // 4 ─ Afrobeats Open Air · Douala Bassa
    user: {
      email:      "afrobeats.douala@cameventflow.dev",
      name:       "Afrobeats Open Air – Bassa",
      supabaseId: "seed-user-004",
      phone:      "+237 6 55 00 44",
    },
    vendor: {
      category:       "Sound"      as const,
      city:           "Douala"     as const,
      basePrice:      7500,
      availability:   true,
      description:    "Open-air Afrobeats concert in the vibrant Bassa neighbourhood. Featuring headline acts from Cameroon, Nigeria, and Ivory Coast. Outdoor bar and food trucks on site.",
      profileImageUrl: null,
      isEvent:        true,
      latitude:       4.0753,
      longitude:      9.7420,
      activeStatus:   "LIVE"       as const,
      eventStartTime: new Date("2026-08-18T19:00:00+01:00"),
      eventEndTime:   new Date("2026-08-19T02:00:00+01:00"),
    },
  },
  {
    // 5 ─ Wedding Showcase · Yaoundé Centre
    user: {
      email:      "weddingshow.yaounde@cameventflow.dev",
      name:       "Wedding & Events Showcase Yaoundé",
      supabaseId: "seed-user-005",
      phone:      "+237 6 55 00 55",
    },
    vendor: {
      category:       "Venue"      as const,
      city:           "Yaounde"    as const,
      basePrice:      3000,
      availability:   true,
      description:    "The largest wedding industry showcase in Cameroon. Meet top caterers, decorators, photographers, and venue owners all under one roof. Free entry for couples planning their big day.",
      profileImageUrl: null,
      isEvent:        true,
      latitude:       3.8480,
      longitude:      11.5021,
      activeStatus:   "UPCOMING"   as const,
      eventStartTime: new Date("2026-08-25T09:00:00+01:00"),
      eventEndTime:   new Date("2026-08-25T17:00:00+01:00"),
    },
  },
];

// ── Seed runner ───────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱  Starting seed…");

  for (const mock of MOCK_EVENTS) {
    // Upsert User (idempotent – safe to re-run)
    const user = await prisma.user.upsert({
      where:  { supabaseId: mock.user.supabaseId },
      update: { name: mock.user.name, email: mock.user.email },
      create: {
        supabaseId: mock.user.supabaseId,
        email:      mock.user.email,
        name:       mock.user.name,
        phone:      mock.user.phone,
        role:       "VENDOR",
      },
    });

    // Upsert Vendor / Event (keyed on userId – unique)
    const vendor = await prisma.vendor.upsert({
      where:  { userId: user.id },
      update: {
        activeStatus:   mock.vendor.activeStatus,
        eventStartTime: mock.vendor.eventStartTime,
        eventEndTime:   mock.vendor.eventEndTime,
      },
      create: {
        userId:         user.id,
        category:       mock.vendor.category,
        city:           mock.vendor.city,
        basePrice:      mock.vendor.basePrice,
        availability:   mock.vendor.availability,
        description:    mock.vendor.description,
        profileImageUrl: mock.vendor.profileImageUrl,
        isEvent:        mock.vendor.isEvent,
        latitude:       mock.vendor.latitude,
        longitude:      mock.vendor.longitude,
        activeStatus:   mock.vendor.activeStatus,
        eventStartTime: mock.vendor.eventStartTime,
        eventEndTime:   mock.vendor.eventEndTime,
      },
    });

    console.log(`  ✓  ${mock.user.name} (${vendor.activeStatus}) [${vendor.latitude}, ${vendor.longitude}]`);
  }

  console.log(`\n✅  Seeded ${MOCK_EVENTS.length} events successfully.`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
