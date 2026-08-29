// app/vendors/page.tsx  –  Search Results  (/vendors)
// Server Component: fetches vendors from the DB via API, renders cards + filters.

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { VendorCard } from "@/components/VendorCard";
import { VendorFilters } from "./VendorFilters";

interface SearchParams {
  city?:     string;
  category?: string;
  maxPrice?: string;
  q?:        string;
}

async function fetchVendors(params: SearchParams) {
  const { city, category, maxPrice } = params;

  return prisma.vendor.findMany({
    where: {
      ...(city     && { city }),
      ...(category && { category }),
      ...(maxPrice && { basePrice: { lte: parseFloat(maxPrice) } }),
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: [
      { availability: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params  = await searchParams;
  const vendors = await fetchVendors(params);

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-8 space-y-6">

      {/* ── Page heading ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">Find Vendors</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} found
          {params.city     ? ` in ${params.city}`     : ""}
          {params.category ? ` · ${params.category}s` : ""}
        </p>
      </div>

      {/* ── Filters (Client Component) ─────────────────────────────── */}
      <Suspense>
        <VendorFilters
          currentCity={params.city}
          currentCategory={params.category}
          currentMaxPrice={params.maxPrice}
        />
      </Suspense>

      {/* ── Vendor grid ────────────────────────────────────────────── */}
      {vendors.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-muted-foreground">No vendors match your filters.</p>
          <p className="text-sm text-muted-foreground">
            Try removing a filter or selecting a different city.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              id={vendor.id}
              name={vendor.user.name}
              category={vendor.category}
              city={vendor.city}
              basePrice={vendor.basePrice}
              availability={vendor.availability}
              profileImageUrl={vendor.profileImageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
