// app/vendors/[id]/page.tsx  –  Vendor Profile  (/vendors/:id)
// Server Component: loads vendor data, renders profile + "Book Now" + "Chat" buttons.

import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Tag, Users, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookNowButton } from "./BookNowButton";
import { VendorActionButtons } from "./VendorActionButtons";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  if (!vendor) return { title: "Vendor not found" };
  return { title: vendor.user.name, description: vendor.description };
}

export default async function VendorProfilePage({ params }: Props) {
  const { id } = await params;

  // Fetch vendor + current session user in parallel
  const [vendor, supabaseUser] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { bookings: true } },
      },
    }),
    getSupabaseUser(),
  ]);

  if (!vendor) notFound();

  // Resolve the internal User if logged in (needed to pass IDs to TalkJS)
  const currentUser = supabaseUser
    ? await prisma.user.findUnique({
        where: { supabaseId: supabaseUser.id },
        select: { id: true, name: true, email: true, role: true },
      })
    : null;

  const priceFormatted = new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(vendor.basePrice);

  return (
    <div className="max-w-md mx-auto pb-8">

      {/* ── Profile image ─────────────────────────────────────────────── */}
      <div className="relative h-56 w-full bg-muted">
        {vendor.profileImageUrl ? (
          <Image
            src={vendor.profileImageUrl}
            alt={`${vendor.user.name} profile photo`}
            fill priority
            className="object-cover"
            sizes="448px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No photo yet
          </div>
        )}
        <div className="absolute top-3 right-3">
          {vendor.availability ? (
            <Badge variant="success">Available</Badge>
          ) : (
            <Badge variant="secondary">Unavailable</Badge>
          )}
        </div>
      </div>

      {/* ── Details ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 space-y-5">

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{vendor.user.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              {vendor.category}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {vendor.city}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {vendor._count.bookings} booking{vendor._count.bookings !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-primary">{priceFormatted}</span>
          <span className="text-sm text-muted-foreground">starting price</span>
        </div>

        <Separator />

        {/* Description */}
        <section aria-label="About this vendor">
          <h2 className="text-sm font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {vendor.description}
          </p>
        </section>

        {/* Reviews placeholder */}
        <section aria-label="Reviews" className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400" aria-hidden="true" />
            Reviews
          </h2>
          <p className="text-sm text-muted-foreground italic">Reviews coming soon.</p>
        </section>

        {/* ── HOLE: Mapbox location embed (Day 3 – static map tile) ─── */}
        {/*
          <section aria-label="Location">
            <h2 className="text-sm font-semibold mb-2">Location</h2>
            <MapboxEmbed city={vendor.city} lat={vendor.latitude} lng={vendor.longitude} />
          </section>
        */}

        <Separator />

        {/* ── Action buttons: Book Now + Chat with Vendor ─────────────── */}
        {/* VendorActionButtons is a Client Component so it can manage
            the TalkJSChat dialog state without making the page client-side */}
        <VendorActionButtons
          vendorId={vendor.id}
          vendorName={vendor.user.name}
          vendorUserId={vendor.user.id}
          vendorEmail={vendor.user.email}
          isAvailable={vendor.availability}
          currentUser={currentUser
            ? {
                id:    currentUser.id,
                name:  currentUser.name,
                email: currentUser.email,
                role:  currentUser.role as "PLANNER" | "VENDOR",
              }
            : null}
        />
      </div>
    </div>
  );
}
