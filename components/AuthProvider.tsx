"use client";

// components/AuthProvider.tsx
// Mounts the Supabase onAuthStateChange listener once at the app root.
// Renders nothing — purely a side-effect component.

import { useEffect } from "react";
import { initAuthListener } from "@/lib/supabase";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Returns the unsubscribe fn; React will call it on unmount
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, []);

  return <>{children}</>;
}
