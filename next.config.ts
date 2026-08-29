import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest:              "public",       // output: public/sw.js + workbox files
  disable:           process.env.NODE_ENV === "development", // no SW in dev
  register:          true,           // auto-register the SW in the browser
  skipWaiting:       true,           // activate new SW immediately on update
  reloadOnOnline:    true,           // reload page when connection restores
  fallbacks: {
    document: "/offline",            // show /offline page when navigating offline
  },
  workboxOptions: {
    // Cache strategies ─────────────────────────────────────────────────────
    runtimeCaching: [
      // 1. OSM map tiles – CacheFirst (tiles rarely change)
      {
        urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
        handler:    "CacheFirst",
        options: {
          cacheName:       "osm-tiles",
          expiration: {
            maxEntries:    500,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // 2. API routes – NetworkFirst (fresh data preferred, cache as fallback)
      {
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler:    "NetworkFirst",
        options: {
          cacheName:           "api-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries:    64,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // 3. Static assets (fonts, images, icons) – CacheFirst
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/i,
        handler:    "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries:    128,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // 4. Google Fonts – StaleWhileRevalidate
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler:    "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries:    16,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:  "*.supabase.co",
        port:      "",
        pathname:  "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff"       },
          { key: "X-Frame-Options",          value: "DENY"          },
          { key: "X-XSS-Protection",         value: "1; mode=block" },
          // Allow SW to be served from the root scope
          { key: "Service-Worker-Allowed",   value: "/"             },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
