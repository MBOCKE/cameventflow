// prisma/seed.ts
// Production-grade demo seed for CamEventFlow.
// Creates 8 Planners, 10 Vendors (4 of which are live/upcoming events),
// and 22 deeply interconnected Bookings with realistic Cameroonian data.
//
// Safe to run repeatedly – all operations use upsert (idempotent).
// Does NOT require a real Supabase auth connection.
// Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  PLANNER users  (8 total)
// ─────────────────────────────────────────────────────────────────────────────

const PLANNERS = [
  {
    supabaseId: "demo-supabase-id-1",
    email:      "marie.planner@gmail.com",
    name:       "Marie Ngassa",
    phone:      "+237 6 70 11 22 33",
    role:       "PLANNER",
  },
  {
    supabaseId: "demo-supabase-id-2",
    email:      "jean.planner@gmail.com",
    name:       "Jean-Pierre Eto'o",
    phone:      "+237 6 71 44 55 66",
    role:       "PLANNER",
  },
  {
    supabaseId: "demo-supabase-id-3",
    email:      "aicha.bello@gmail.com",
    name:       "Aïcha Bello",
    phone:      "+237 6 72 77 88 99",
    role:       "PLANNER",
  },
  {
    supabaseId: "demo-supabase-id-4",
    email:      "boris.kamga@gmail.com",
    name:       "Boris Kamga",
    phone:      "+237 6 73 00 11 22",
    role:       "PLANNER",
  },
  {
    supabaseId: "demo-supabase-id-5",
    email:      "sandrine.ngobassa@gmail.com",
    name:       "Sandrine Ngo Bassa",
    phone:      "+237 6 74 33 44 55",
    role:       "PLANNER",
  },
  {
    supabaseId: "demo-supabase-id-6",
    email:      "paul.mbianda@gmail.com",
    name:       "Paul Mbianda",
    phone:      "+237 6 75 66 77 88",
    role:       "PLANNER",
  },
  {
    supabaseId: "demo-supabase-id-7",
    email:      "celine.ateba@gmail.com",
    name:       "Céline Ateba",
    phone:      "+237 6 76 99 00 11",
    role:       "PLANNER",
  },
  {
    supabaseId: "demo-supabase-id-8",
    email:      "herve.fouda@gmail.com",
    name:       "Hervé Fouda",
    phone:      "+237 6 77 22 33 44",
    role:       "PLANNER",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2.  VENDOR users + profiles  (10 total, 4 are events)
// ─────────────────────────────────────────────────────────────────────────────

const VENDORS = [
  // ── Regular vendors (isEvent: false) ────────────────────────────────────

  {
    user: {
      supabaseId: "demo-supabase-id-9",
      email:      "palace.akwa@gmail.com",
      name:       "Palace des Fêtes Akwa",
      phone:      "+237 6 60 10 20 30",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Venue",
      city:            "Douala",
      basePrice:       2_500_000,
      availability:    true,
      description:     "Palace des Fêtes Akwa est la salle de réception la plus prisée du quartier Akwa à Douala. Avec une capacité de 600 personnes assises, une scène de 200 m², une cuisine professionnelle intégrée, climatisation centrale et un parking sécurisé de 150 places, nous accueillons mariages, réceptions d'entreprise et galas depuis 2008. Notre équipe de décoration en interne peut transformer la salle selon vos thèmes.",
      profileImageUrl: null,
      isEvent:         false,
      latitude:        4.0483,
      longitude:       9.6999,
      activeStatus:    "UPCOMING",
      eventStartTime:  null,
      eventEndTime:    null,
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-10",
      email:      "traiteur.excellence@gmail.com",
      name:       "Traiteur Excellence Yaoundé",
      phone:      "+237 6 61 40 50 60",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Caterer",
      city:            "Yaounde",
      basePrice:       850_000,
      availability:    true,
      description:     "Traiteur Excellence est spécialisé dans la cuisine camerounaise et internationale pour des événements de 50 à 800 convives. Nos menus incluent ndolé, poulet DG, couscous de maïs, buffet continental et cocktails dînatoires. Nos chefs diplômés de l'École Hôtelière de Paris opèrent avec une flotte de camions réfrigérés pour garantir la fraîcheur à domicile. Service de personnel (serveurs, barmans) inclus.",
      profileImageUrl: null,
      isEvent:         false,
      latitude:        3.8667,
      longitude:       11.5167,
      activeStatus:    "UPCOMING",
      eventStartTime:  null,
      eventEndTime:    null,
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-11",
      email:      "deco.elegance@gmail.com",
      name:       "Déco Élégance Douala",
      phone:      "+237 6 62 70 80 90",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Decorator",
      city:            "Douala",
      basePrice:       450_000,
      availability:    true,
      description:     "Déco Élégance crée des univers féeriques pour mariages, baptêmes et événements corporate. Notre équipe de 15 décorateurs professionnels maîtrise les styles baroque, minimaliste, afro-chic et tropical. Nous fournissons fleurs fraîches importées, arches, toiles de fond personnalisées, éclairage LED ambiant et mobilier de prestige en location. Portfolio de plus de 300 événements depuis 2015.",
      profileImageUrl: null,
      isEvent:         false,
      latitude:        4.0611,
      longitude:       9.7085,
      activeStatus:    "UPCOMING",
      eventStartTime:  null,
      eventEndTime:    null,
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-12",
      email:      "son.lumiere.pro@gmail.com",
      name:       "Son & Lumière Pro",
      phone:      "+237 6 63 11 22 33",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Sound",
      city:            "Douala",
      basePrice:       350_000,
      availability:    true,
      description:     "Son & Lumière Pro est le prestataire son et lumière de référence à Douala depuis 2010. Notre parc matériel comprend des consoles Yamaha CL5, enceintes L-Acoustics, systèmes de projection 4K, LED Wash et moving heads. Nous équipons des salles de 100 à 5000 personnes et assurons la sonorisation de concerts, mariages, conférences et festivals. Groupe électrogène de secours systématiquement inclus.",
      profileImageUrl: null,
      isEvent:         false,
      latitude:        4.0400,
      longitude:       9.7100,
      activeStatus:    "UPCOMING",
      eventStartTime:  null,
      eventEndTime:    null,
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-13",
      email:      "photo.memoire@gmail.com",
      name:       "Photo Mémoire Studio",
      phone:      "+237 6 64 44 55 66",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Photographer",
      city:            "Yaounde",
      basePrice:       280_000,
      availability:    true,
      description:     "Photo Mémoire Studio est un studio de photographie et vidéographie haut de gamme basé à Yaoundé. Nous couvrons mariages, séances de fiançailles, événements d'entreprise et soirées privées. Notre équipe de 4 photographes utilise du matériel Canon EOS R5 et Sony A7 IV. Livraison des photos retouchées sous 7 jours via galerie privée en ligne. Forfaits drone disponibles.",
      profileImageUrl: null,
      isEvent:         false,
      latitude:        3.8480,
      longitude:       11.5021,
      activeStatus:    "UPCOMING",
      eventStartTime:  null,
      eventEndTime:    null,
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-14",
      email:      "buea.garden.venue@gmail.com",
      name:       "Buea Mountain Garden Venue",
      phone:      "+237 6 65 77 88 99",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Venue",
      city:            "Buea",
      basePrice:       1_200_000,
      availability:    true,
      description:     "Buea Mountain Garden est un espace événementiel en plein air à flanc du Mont Cameroun, offrant une vue panoramique imprenable. Capacité de 400 personnes sous tente. Idéal pour mariages champêtres, lancements de produits et team-buildings. Hébergement disponible sur site (20 bungalows). Cuisine ouverte pour traiteurs externes. Location possible du vendredi au dimanche.",
      profileImageUrl: null,
      isEvent:         false,
      latitude:        4.1527,
      longitude:       9.2454,
      activeStatus:    "UPCOMING",
      eventStartTime:  null,
      eventEndTime:    null,
    },
  },

  // ── Event vendors (isEvent: true) — appear on the discovery map ──────────

  {
    user: {
      supabaseId: "demo-supabase-id-15",
      email:      "jazz.akwa.live@gmail.com",
      name:       "Live Jazz Night – Akwa",
      phone:      "+237 6 55 00 11",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Sound",
      city:            "Douala",
      basePrice:       5_000,
      availability:    true,
      description:     "Une soirée jazz inoubliable en plein cœur d'Akwa. Musiciens camerounais de renommée internationale, cocktails artisanaux et scène en plein air. Places limitées.",
      profileImageUrl: null,
      isEvent:         true,
      latitude:        4.0511,
      longitude:       9.7085,
      activeStatus:    "LIVE",
      eventStartTime:  daysFromNow(0),
      eventEndTime:    daysFromNow(0),
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-16",
      email:      "fashionweek.dla@gmail.com",
      name:       "Fashion Week Douala 2026",
      phone:      "+237 6 55 00 22",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Decorator",
      city:            "Douala",
      basePrice:       15_000,
      availability:    true,
      description:     "La plus grande semaine de la mode du Cameroun. Défilés, pop-up boutiques de créateurs africains, ateliers et soirées after. Entrée sur réservation.",
      profileImageUrl: null,
      isEvent:         true,
      latitude:        4.0406,
      longitude:       9.6934,
      activeStatus:    "UPCOMING",
      eventStartTime:  daysFromNow(5),
      eventEndTime:    daysFromNow(7),
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-17",
      email:      "afrobeats.bassa@gmail.com",
      name:       "Afrobeats Open Air – Bassa",
      phone:      "+237 6 55 00 44",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Sound",
      city:            "Douala",
      basePrice:       7_500,
      availability:    true,
      description:     "Concert Afrobeats en plein air dans le quartier Bassa. Têtes d'affiche du Cameroun, Nigeria et Côte d'Ivoire. Bar extérieur et food trucks sur place.",
      profileImageUrl: null,
      isEvent:         true,
      latitude:        4.0753,
      longitude:       9.7420,
      activeStatus:    "LIVE",
      eventStartTime:  daysFromNow(0),
      eventEndTime:    daysFromNow(1),
    },
  },
  {
    user: {
      supabaseId: "demo-supabase-id-18",
      email:      "weddingshow.yde@gmail.com",
      name:       "Salon du Mariage – Yaoundé",
      phone:      "+237 6 55 00 55",
      role:       "VENDOR",
    },
    vendor: {
      category:        "Venue",
      city:            "Yaounde",
      basePrice:       3_000,
      availability:    true,
      description:     "Le plus grand salon du mariage au Cameroun. Rencontrez les meilleurs prestataires (traiteurs, décorateurs, photographes, DJ) en un seul endroit. Entrée gratuite pour les couples.",
      profileImageUrl: null,
      isEvent:         true,
      latitude:        3.8480,
      longitude:       11.5021,
      activeStatus:    "UPCOMING",
      eventStartTime:  daysFromNow(12),
      eventEndTime:    daysFromNow(13),
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Booking definitions  (22 total, referencing planners/vendors by index)
//     plannerIdx = index into PLANNERS array (0–7)
//     vendorIdx  = index into VENDORS array  (0–9)
// ─────────────────────────────────────────────────────────────────────────────

interface BookingDef {
  plannerIdx:  number;
  vendorIdx:   number;
  eventDate:   Date;
  guestCount:  number;
  status:      string;
  message:     string;
}

const BOOKING_DEFS: BookingDef[] = [
  // ── CONFIRMED bookings (~15) ─────────────────────────────────────────────

  {
    plannerIdx: 0, vendorIdx: 0,
    eventDate:  daysAgo(45),
    guestCount: 250,
    status:     "CONFIRMED",
    message:    "Bonjour, nous organisons le mariage de ma fille le 15 juillet. Nous avons besoin de la grande salle pour 250 personnes avec service traiteur intégré. Pouvez-vous nous confirmer la disponibilité et le menu ?",
  },
  {
    plannerIdx: 1, vendorIdx: 3,
    eventDate:  daysAgo(30),
    guestCount: 400,
    status:     "CONFIRMED",
    message:    "Nous avons un concert Gospel le 2 août à Douala. Besoin d'un système son professionnel pour 400 personnes en salle. Est-ce que vous disposez d'un groupe électrogène de secours ? Nous avons déjà eu des problèmes de coupure.",
  },
  {
    plannerIdx: 2, vendorIdx: 1,
    eventDate:  daysAgo(20),
    guestCount: 150,
    status:     "CONFIRMED",
    message:    "Anniversaire surprise pour 150 invités. Nous souhaitons un buffet camerounais et continental. Menu souhaité : ndolé, poulet DG, plantains, et un buffet de desserts. Livraison à Yaoundé centre.",
  },
  {
    plannerIdx: 3, vendorIdx: 4,
    eventDate:  daysAgo(60),
    guestCount: 80,
    status:     "CONFIRMED",
    message:    "Mariage civil suivi d'une réception intime pour 80 personnes. Nous cherchons un photographe et vidéaste pour couvrir les deux cérémonies. Forfait drone disponible ? Budget max 350 000 XAF.",
  },
  {
    plannerIdx: 4, vendorIdx: 2,
    eventDate:  daysAgo(15),
    guestCount: 200,
    status:     "CONFIRMED",
    message:    "Gala d'entreprise pour notre anniversaire des 10 ans. Thème : Or et Noir. Nous avons besoin d'une décoration complète incluant scène, tables rondes, éclairage ambiant et fleurs fraîches. Budget : 600 000 XAF.",
  },
  {
    plannerIdx: 5, vendorIdx: 5,
    eventDate:  daysAgo(90),
    guestCount: 120,
    status:     "CONFIRMED",
    message:    "Team-building de notre entreprise pour 120 employés. Nous souhaitons louer votre espace en plein air au Mont Cameroun pour la journée de samedi. Y a-t-il des activités de team-building disponibles sur place ?",
  },
  {
    plannerIdx: 6, vendorIdx: 0,
    eventDate:  daysAgo(10),
    guestCount: 300,
    status:     "CONFIRMED",
    message:    "Réception de mariage traditionnel (dot) pour 300 personnes. Nous avons besoin de la salle principale avec disposition en banquet. Avez-vous un espace pour les danses traditionnelles Bamiléké ?",
  },
  {
    plannerIdx: 7, vendorIdx: 1,
    eventDate:  daysAgo(5),
    guestCount: 100,
    status:     "CONFIRMED",
    message:    "Déjeuner de baptême pour 100 personnes ce dimanche. Menu : couscous de maïs, poulet rôti, salade de légumes. Nous avons des invités végétariens, est-ce que vous avez des options adaptées ?",
  },
  {
    plannerIdx: 0, vendorIdx: 3,
    eventDate:  daysFromNow(20),
    guestCount: 500,
    status:     "CONFIRMED",
    message:    "Grand concert de fin d'année de notre école de musique. Nous accueillerons 500 personnes et avons besoin d'une installation son et lumière complète. Scène de 10x8m. Pouvez-vous faire un devis détaillé ?",
  },
  {
    plannerIdx: 1, vendorIdx: 2,
    eventDate:  daysFromNow(35),
    guestCount: 180,
    status:     "CONFIRMED",
    message:    "Soirée de remise de diplômes universitaires pour 180 étudiants et leurs familles. Thème académique sobre mais élégant. Avez-vous des références pour ce type d'événement ?",
  },
  {
    plannerIdx: 2, vendorIdx: 4,
    eventDate:  daysFromNow(14),
    guestCount: 60,
    status:     "CONFIRMED",
    message:    "Séance photo de fiançailles pour mon couple le week-end prochain. Nous souhaitons des photos en extérieur dans le quartier Bastos ainsi qu'une séance studio. Est-ce que le forfait drone est disponible pour cette date ?",
  },
  {
    plannerIdx: 3, vendorIdx: 5,
    eventDate:  daysFromNow(60),
    guestCount: 200,
    status:     "CONFIRMED",
    message:    "Séminaire résidentiel de 2 jours pour 200 cadres d'entreprise. Nous avons besoin des bungalows pour l'hébergement et de la salle de conférence. Menu pour les repas inclus dans le package ?",
  },
  {
    plannerIdx: 4, vendorIdx: 0,
    eventDate:  daysFromNow(45),
    guestCount: 350,
    status:     "CONFIRMED",
    message:    "Lancement de notre nouveau produit cosmétique pour 350 invités (presse, influenceurs, distributeurs). Nous avons besoin de la salle principale avec scène pour présentations et espace cocktail.",
  },
  {
    plannerIdx: 5, vendorIdx: 1,
    eventDate:  daysFromNow(28),
    guestCount: 75,
    status:     "CONFIRMED",
    message:    "Dîner de gala caritatif pour 75 convives VIP. Menu gastronomique 5 plats avec accord mets et vins. Nous avons besoin de la prestation la plus haut de gamme de votre catalogue.",
  },
  {
    plannerIdx: 6, vendorIdx: 3,
    eventDate:  daysFromNow(10),
    guestCount: 1200,
    status:     "CONFIRMED",
    message:    "Festival de musique urbaine en plein air à Douala. 1200 personnes attendues. Nous avons besoin de 2 scènes simultanées avec systèmes son indépendants. Pouvez-vous gérer cette installation ?",
  },

  // ── PENDING bookings (~5) ────────────────────────────────────────────────

  {
    plannerIdx: 7, vendorIdx: 2,
    eventDate:  daysFromNow(25),
    guestCount: 90,
    status:     "PENDING",
    message:    "Bonjour, nous planifions une soirée de fiançailles pour 90 personnes en style bohème. Nous souhaitons des installations de lumières twinkle, des arches florales blanches et des tables en bois rustique. Quel est votre délai de réponse pour les devis ?",
  },
  {
    plannerIdx: 0, vendorIdx: 4,
    eventDate:  daysFromNow(40),
    guestCount: 50,
    status:     "PENDING",
    message:    "Mariage religieux pour 50 personnes à Yaoundé. Nous cherchons un photographe discret qui respecte le caractère sacré de la cérémonie. Avez-vous déjà travaillé dans la cathédrale Notre-Dame de Yaoundé ?",
  },
  {
    plannerIdx: 1, vendorIdx: 5,
    eventDate:  daysFromNow(55),
    guestCount: 160,
    status:     "PENDING",
    message:    "Retraite spirituelle pour 160 participants pendant 3 jours. Nous cherchons un cadre calme et verdoyant. Est-ce que votre établissement peut accueillir des réunions en plein air avec tentes ? Avez-vous un accès à l'eau chaude dans tous les bungalows ?",
  },
  {
    plannerIdx: 2, vendorIdx: 0,
    eventDate:  daysFromNow(30),
    guestCount: 280,
    status:     "PENDING",
    message:    "Mariage mixte camerounais-français pour 280 invités. Cérémonie en après-midi, réception le soir. Nous aurons besoin de la salle pour toute la journée. Y a-t-il un espace séparé pour la préparation de la mariée ?",
  },
  {
    plannerIdx: 3, vendorIdx: 1,
    eventDate:  daysFromNow(18),
    guestCount: 130,
    status:     "PENDING",
    message:    "Conférence internationale sur le développement durable avec déjeuner de travail pour 130 délégués. Menu végétarien requis pour 40 participants. Pouvez-vous garantir des produits locaux et bio ? Livraison à l'Hôtel Hilton Yaoundé.",
  },

  // ── CANCELED bookings (~2) ───────────────────────────────────────────────

  {
    plannerIdx: 6, vendorIdx: 4,
    eventDate:  daysAgo(25),
    guestCount: 70,
    status:     "CANCELED",
    message:    "Shooting photo pour notre catalogue mode. Annulé suite au décès d'un membre de notre équipe. Nous reviendrons vers vous pour reporter la date. Merci pour votre compréhension.",
  },
  {
    plannerIdx: 4, vendorIdx: 3,
    eventDate:  daysAgo(50),
    guestCount: 300,
    status:     "CANCELED",
    message:    "Soirée d'entreprise annulée en raison d'un changement de budget imposé par notre direction. La salle avait été provisoirement réservée pour 300 personnes. Nous espérons travailler avec vous lors d'une prochaine occasion.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Starting production demo seed…\n");

  // ── Step 1: Upsert planners ──────────────────────────────────────────────
  console.log("👤  Seeding planners…");
  const plannerRecords = [];

  for (const p of PLANNERS) {
    const user = await prisma.user.upsert({
      where:  { supabaseId: p.supabaseId },
      update: { name: p.name, email: p.email, phone: p.phone },
      create: {
        supabaseId: p.supabaseId,
        email:      p.email,
        name:       p.name,
        phone:      p.phone,
        role:       p.role,
      },
    });
    plannerRecords.push(user);
    console.log(`  ✓  ${user.name} (${user.role})`);
  }

  // ── Step 2: Upsert vendor users + vendor profiles ────────────────────────
  console.log("\n🏪  Seeding vendors…");
  const vendorRecords = [];

  for (const v of VENDORS) {
    const user = await prisma.user.upsert({
      where:  { supabaseId: v.user.supabaseId },
      update: { name: v.user.name, email: v.user.email, phone: v.user.phone },
      create: {
        supabaseId: v.user.supabaseId,
        email:      v.user.email,
        name:       v.user.name,
        phone:      v.user.phone,
        role:       v.user.role,
      },
    });

    const vendor = await prisma.vendor.upsert({
      where:  { userId: user.id },
      update: {
        basePrice:      v.vendor.basePrice,
        availability:   v.vendor.availability,
        activeStatus:   v.vendor.activeStatus,
        eventStartTime: v.vendor.eventStartTime,
        eventEndTime:   v.vendor.eventEndTime,
        description:    v.vendor.description,
      },
      create: {
        userId:          user.id,
        category:        v.vendor.category,
        city:            v.vendor.city,
        basePrice:       v.vendor.basePrice,
        availability:    v.vendor.availability,
        description:     v.vendor.description,
        profileImageUrl: v.vendor.profileImageUrl,
        isEvent:         v.vendor.isEvent,
        latitude:        v.vendor.latitude,
        longitude:       v.vendor.longitude,
        activeStatus:    v.vendor.activeStatus,
        eventStartTime:  v.vendor.eventStartTime,
        eventEndTime:    v.vendor.eventEndTime,
      },
    });

    vendorRecords.push(vendor);

    const tag = v.vendor.isEvent
      ? `🔴 EVENT [${v.vendor.activeStatus}]`
      : `🏪 ${v.vendor.category}`;
    console.log(`  ✓  ${user.name} — ${tag} — ${new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(v.vendor.basePrice)}`);
  }

  // ── Step 3: Upsert bookings ──────────────────────────────────────────────
  console.log("\n📅  Seeding bookings…");

  let confirmed = 0, pending = 0, canceled = 0;

  for (const def of BOOKING_DEFS) {
    const planner = plannerRecords[def.plannerIdx];
    const vendor  = vendorRecords[def.vendorIdx];

    // Idempotent key: same planner + vendor + eventDate = same booking
    const existing = await prisma.booking.findFirst({
      where: {
        plannerId: planner.id,
        vendorId:  vendor.id,
        eventDate: def.eventDate,
      },
    });

    if (!existing) {
      await prisma.booking.create({
        data: {
          plannerId:  planner.id,
          vendorId:   vendor.id,
          eventDate:  def.eventDate,
          guestCount: def.guestCount,
          status:     def.status,
          message:    def.message,
        },
      });
    } else {
      await prisma.booking.update({
        where: { id: existing.id },
        data:  { status: def.status, guestCount: def.guestCount },
      });
    }

    if (def.status === "CONFIRMED")  confirmed++;
    if (def.status === "PENDING")    pending++;
    if (def.status === "CANCELED")   canceled++;

    const icon = def.status === "CONFIRMED" ? "✅"
               : def.status === "PENDING"   ? "⏳"
                                            : "❌";
    console.log(
      `  ${icon}  ${planner.name} → ${VENDORS[def.vendorIdx].user.name} ` +
      `(${def.guestCount} guests · ${def.status})`
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log(`✅  Seed complete!`);
  console.log(`   👤  ${PLANNERS.length} planners`);
  console.log(`   🏪  ${VENDORS.length} vendors (${VENDORS.filter(v => v.vendor.isEvent).length} live events on map)`);
  console.log(`   📅  ${BOOKING_DEFS.length} bookings:`);
  console.log(`       • ${confirmed} confirmed`);
  console.log(`       • ${pending} pending`);
  console.log(`       • ${canceled} canceled`);
  console.log("─────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
