// app/page.tsx  –  Landing Page  (/)
// Hero, GlobalSearchBar, city shortcuts, category buttons, Discover CTA.

import Link from "next/link";
import { Music, Camera, UtensilsCrossed, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";

const CATEGORIES = [
  { label: "Venues",      icon: Building2,       query: "Venue"        },
  { label: "Caterers",    icon: UtensilsCrossed, query: "Caterer"      },
  { label: "Photography", icon: Camera,          query: "Photographer" },
  { label: "Sound",       icon: Music,           query: "Sound"        },
];

const CITIES = ["Douala", "Yaoundé", "Buea"];

export default function LandingPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-8 space-y-10">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          🇨🇲 Made for Cameroon
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          Plan your event,<br />
          <span className="text-primary">find the best vendors.</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Douala · Yaoundé · Buea — venues, caterers, photographers &amp; more.
        </p>
      </section>

      {/* ── Global Search Bar ───────────────────────────────────────── */}
      <section aria-label="Search vendors and events">
        {/* GlobalSearchBar is a Client Component – fetches /api/search live */}
        <GlobalSearchBar placeholder="Search vendors & events…" />
      </section>

      {/* ── Discover Events CTA ─────────────────────────────────────── */}
      <section aria-label="Discover live events">
        <Link
          href="/discover"
          className="flex items-center justify-between w-full rounded-2xl bg-gradient-to-r from-primary to-blue-600 px-5 py-4 text-white shadow-lg hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="space-y-0.5">
            <p className="text-xs font-medium opacity-80 uppercase tracking-wide">New</p>
            <p className="font-semibold text-base">Discover Live Events</p>
            <p className="text-xs opacity-70">See what&apos;s happening on the map</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
        </Link>
      </section>

      {/* ── City shortcuts ───────────────────────────────────────────── */}
      <section aria-label="Browse by city">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Browse by city
        </h2>
        <div className="flex gap-2 flex-wrap">
          {CITIES.map((city) => (
            <Button key={city} variant="outline" size="sm" asChild>
              <Link href={`/vendors?city=${encodeURIComponent(city)}`}>
                {city}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* ── Category buttons ────────────────────────────────────────── */}
      <section aria-label="Browse by category">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Browse by category
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(({ label, icon: Icon, query }) => (
            <Link
              key={query}
              href={`/vendors?category=${query}`}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOLE: Featured vendors map (Mapbox – Day 3) ─────────────── */}
      {/*
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Vendors near you
          </h2>
          <MapboxVendorMap vendors={featuredVendors} />
        </section>
      */}

      {/* ── Bottom CTAs ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 pt-2">
        <Button asChild size="lg" className="w-full">
          <Link href="/vendors">Browse All Vendors</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/dashboard">My Dashboard</Link>
        </Button>
      </section>
    </div>
  );
}
