// app/layout.tsx
// Root layout – SEO metadata, PWA meta tags, global styles, persistent Navbar,
// and the AuthProvider (mounts onAuthStateChange listener client-side).

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "CamEventFlow",
    template: "%s | CamEventFlow",
  },
  description:
    "Find and book the best event vendors in Cameroon – Douala, Yaoundé & Buea. Venues, caterers, photographers, sound & more.",
  manifest: "/manifest.json",

  // ── Apple PWA ────────────────────────────────────────────────────────────
  appleWebApp: {
    capable:         true,
    statusBarStyle:  "default",
    title:           "CamEventFlow",
    startupImage:    "/icons/icon-512.svg",
  },

  // ── Icons ────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    shortcut: "/icons/icon-192.svg",
  },

  // ── Open Graph ───────────────────────────────────────────────────────────
  openGraph: {
    type:        "website",
    siteName:    "CamEventFlow",
    title:       "CamEventFlow – Event Vendors in Cameroon",
    description: "Find and book venues, caterers, photographers & more across Douala, Yaoundé and Buea.",
    locale:      "fr_CM",
  },

  // ── Twitter card ─────────────────────────────────────────────────────────
  twitter: {
    card:        "summary",
    title:       "CamEventFlow",
    description: "Book the best event vendors in Cameroon.",
  },

  // ── Misc ─────────────────────────────────────────────────────────────────
  formatDetection:  { telephone: false },
  robots:           { index: true, follow: true },
  metadataBase:     new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cameventflow.vercel.app"
  ),
};

export const viewport: Viewport = {
  themeColor:    "#2563EB",
  width:         "device-width",
  initialScale:  1,
  maximumScale:  1,
  userScalable:  false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/*
          AuthProvider mounts the Supabase onAuthStateChange listener so that
          every sign-in (email, OAuth, magic link) syncs a DB User row.
          It renders no UI — purely a side-effect wrapper.
        */}
        <AuthProvider>
          <main className="min-h-screen">{children}</main>
          <Navbar />
        </AuthProvider>
      </body>
    </html>
  );
}
