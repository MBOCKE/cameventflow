// app/manifest.ts
// Next.js 15 App Router dynamic web app manifest.
// Served at /manifest.webmanifest automatically by the framework.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "CamEventFlow",
    short_name:       "CamEvent",
    description:      "Find and book event vendors in Cameroon – Douala, Yaoundé & Buea.",
    start_url:        "/",
    scope:            "/",
    display:          "standalone",
    orientation:      "portrait-primary",
    theme_color:      "#2563EB",
    background_color: "#ffffff",
    categories:       ["lifestyle", "business"],
    icons: [
      {
        src:     "/icons/icon-192.svg",
        sizes:   "192x192",
        type:    "image/svg+xml",
        purpose: "maskable",
      },
      {
        src:     "/icons/icon-512.svg",
        sizes:   "512x512",
        type:    "image/svg+xml",
        purpose: "maskable",
      },
      // "any" purpose entries so browsers use them for splash screens too
      {
        src:     "/icons/icon-192.svg",
        sizes:   "192x192",
        type:    "image/svg+xml",
        purpose: "any",
      },
      {
        src:     "/icons/icon-512.svg",
        sizes:   "512x512",
        type:    "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src:          "/screenshots/home.png",
        sizes:        "390x844",
        type:         "image/png",
        // @ts-expect-error – form_factor is valid per spec but not yet in Next.js types
        form_factor:  "narrow",
        label:        "Home – Browse vendors and events",
      },
      {
        src:          "/screenshots/discover.png",
        sizes:        "390x844",
        type:         "image/png",
        // @ts-expect-error
        form_factor:  "narrow",
        label:        "Discover – Live event map",
      },
    ],
  };
}
