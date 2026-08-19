// app/vendors/loading.tsx
// Shown automatically by Next.js while vendors/page.tsx is streaming.

import { Skeleton } from "@/components/ui/skeleton";

function VendorCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </div>
  );
}

export default function VendorsLoading() {
  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-8 space-y-6" aria-busy="true" aria-label="Loading vendors">
      {/* Page heading skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Filter bar skeleton */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-10 rounded-md" />
        <Skeleton className="h-10 rounded-md" />
        <Skeleton className="h-10 rounded-md" />
      </div>

      {/* Card skeletons */}
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <VendorCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
