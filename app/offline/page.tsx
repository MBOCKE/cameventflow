// app/offline/page.tsx
// Shown by the service worker when a navigation request fails offline.

import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="space-y-2 max-w-xs">
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="text-sm text-muted-foreground">
          Check your internet connection and try again. Pages you have already
          visited are still available.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary/90 transition-colors"
      >
        Try Again
      </Link>
    </div>
  );
}
