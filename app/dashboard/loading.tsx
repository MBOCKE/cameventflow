// app/dashboard/loading.tsx
// Shown automatically by Next.js while dashboard/page.tsx is streaming.

import { Skeleton } from "@/components/ui/skeleton";

function BookingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-8 space-y-6" aria-busy="true" aria-label="Loading dashboard">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Tab bar */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Booking card skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
