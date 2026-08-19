// lib/stores/useVendorOnboardingStore.ts
// Zustand store managing the 4-step vendor onboarding form.
// Steps:
//   1 – Category & City
//   2 – Pricing & Description
//   3 – Profile Image upload
//   4 – Location pin (MapboxVenuePicker)

import { create } from "zustand";

export type VendorCategory = "Venue" | "Caterer" | "Decorator" | "Sound" | "Photographer";
export type VendorCity     = "Douala" | "Yaounde" | "Buea";

export interface OnboardingData {
  // Step 1
  category:    VendorCategory | "";
  city:        VendorCity | "";
  // Step 2
  basePrice:   number;
  description: string;
  // Step 3
  profileImageUrl: string | null;   // public URL after Supabase Storage upload
  profileImageFile: File | null;    // transient – not submitted to API
  // Step 4
  latitude:    number | null;
  longitude:   number | null;
  placeName:   string;
}

interface VendorOnboardingStore {
  step:        number;       // 1–4
  data:        OnboardingData;
  isSubmitting: boolean;
  submitError:  string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  nextStep:    () => void;
  prevStep:    () => void;
  setStep:     (step: number) => void;
  updateData:  (fields: Partial<OnboardingData>) => void;
  setSubmitting: (v: boolean) => void;
  setSubmitError: (msg: string | null) => void;
  reset:       () => void;
}

const INITIAL_DATA: OnboardingData = {
  category:         "",
  city:             "",
  basePrice:        0,
  description:      "",
  profileImageUrl:  null,
  profileImageFile: null,
  latitude:         null,
  longitude:        null,
  placeName:        "",
};

export const useVendorOnboardingStore = create<VendorOnboardingStore>((set) => ({
  step:          1,
  data:          { ...INITIAL_DATA },
  isSubmitting:  false,
  submitError:   null,

  nextStep: () =>
    set((s) => ({ step: Math.min(s.step + 1, 4) })),

  prevStep: () =>
    set((s) => ({ step: Math.max(s.step - 1, 1) })),

  setStep: (step) => set({ step }),

  updateData: (fields) =>
    set((s) => ({ data: { ...s.data, ...fields } })),

  setSubmitting:  (v)   => set({ isSubmitting: v }),
  setSubmitError: (msg) => set({ submitError: msg }),

  reset: () =>
    set({ step: 1, data: { ...INITIAL_DATA }, isSubmitting: false, submitError: null }),
}));
