"use client";

// components/PWARegister.tsx
// Registers the service worker once on first mount.
// In production: @ducanh2912/next-pwa auto-registers its Workbox SW.
// This component registers the fallback public/sw.js for environments
// where the Workbox SW hasn't been generated yet (dev mode / first run).
// It is safe to include in production — the Workbox SW will simply take over.

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new SW is waiting — optionally notify the user here
              console.info("[PWA] New service worker available. Reload to update.");
            }
          });
        });

        console.info("[PWA] Service worker registered:", registration.scope);
      } catch (err) {
        // SW registration failing should never break the app
        console.warn("[PWA] Service worker registration failed:", err);
      }
    }

    // Defer registration until after the page has loaded so it doesn't
    // compete with critical resources on first paint
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  // Renders nothing – purely a side-effect component
  return null;
}
