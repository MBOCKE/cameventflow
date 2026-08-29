// app/layout.tsx
// Root layout – SEO metadata, PWA meta tags, global styles, persistent Navbar,
// AuthProvider (Supabase auth state sync), and PWARegister (service worker).

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar }       from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { PWARegister }  from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default:  "CamEventFlow",
    template: "%s | CamEventFlow",
  },
  description:
    "Find and book the best event vendors in Cameroon – Douala, Yaoundé & Buea. " +
    "Venues, caterers, photographers, sound & more.",

  // Next.js 15 serves app/manifest.ts at /manifest.webmanifest automatically.
  // Explicit reference here ensures <link rel="manifest"> is injected in <head>.
  manifest: "/manifest.webmanifest",

  // ── Apple PWA (iOS "Add to Home Screen") ─────────────────────────────────
  appleWebApp: {
    capable:        true,
    statusBarStyle: "black-translucent", // lets the app extend behind the status bar
    title:          "CamEventFlow",
    startupImage: [
      // iPhone 14 Pro / 15 (390 × 844 logical px)
      {
        url:   "/icons/icon-512.svg",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // Generic fallback
      { url: "/icons/icon-512.svg" },
    ],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple:   [{ url: "/icons/icon-192.svg", sizes: "180x180", type: "image/svg+xml" }],
    shortcut: "/icons/icon-192.svg",
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type:        "website",
    siteName:    "CamEventFlow",
    title:       "CamEventFlow – Event Vendors in Cameroon",
    description: "Find and book venues, caterers, photographers & more across Douala, Yaoundé and Buea.",
    locale:      "fr_CM",
  },

  // ── Twitter card ──────────────────────────────────────────────────────────
  twitter: {
    card:        "summary",
    title:       "CamEventFlow",
    description: "Book the best event vendors in Cameroon.",
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
  formatDetection: { telephone: false },
  robots:          { index: true, follow: true },
  metadataBase:    new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cameventflow.vercel.app"
  ),
};

export const viewport: Viewport = {
  themeColor:   "#2563EB",
  width:        "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen">{children}</main>
          <Navbar />
        </AuthProvider>

        {/*
          PWARegister is rendered outside AuthProvider intentionally —
          service worker registration is independent of auth state and
          should never be blocked by an auth error.
        */}
        <PWARegister />
      </body>
    </html>
  );
}
