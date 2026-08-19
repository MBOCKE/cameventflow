// app/discover/page.tsx  –  Event Discovery Map  (/discover)
// Full-screen mobile map page. Loads events from /api/vendors?type=events
// and renders interactive pins. Actual Mapbox token wired on Day 3.

import type { Metadata } from "next";
import { DiscoverMapClient } from "./DiscoverMapClient";

export const metadata: Metadata = {
  title: "Discover Events",
  description: "Find live and upcoming events near you on the map.",
};

export default function DiscoverPage() {
  return (
    // Full-screen – no max-w-md wrapper, no padding-bottom nav space.
    // The Client Component handles its own layout.
    <DiscoverMapClient />
  );
}
