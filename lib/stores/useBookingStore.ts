// lib/stores/useBookingStore.ts
// Zustand store that holds transient booking data while the user fills the
// "Book Now" modal before the form is submitted to POST /api/bookings.

import { create } from "zustand";

export interface VenueLocation {
  placeName:  string;
  latitude:   number;
  longitude:  number;
}

export interface BookingDraft {
  vendorId: string;
  vendorName: string;
  eventDate: string;        // ISO date string "YYYY-MM-DD"
  guestCount: number;
  message: string;
  venueLocation: VenueLocation | null;  // set by MapboxVenuePicker
}

interface BookingStore {
  // ── Draft data (populated by the modal) ────────────────────────────────────
  draft: BookingDraft | null;

  // ── UI state ────────────────────────────────────────────────────────────────
  isModalOpen: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────────
  openModal: (vendorId: string, vendorName: string) => void;
  closeModal: () => void;
  updateDraft: (fields: Partial<BookingDraft>) => void;
  resetDraft: () => void;
  setSubmitting: (value: boolean) => void;
  setSubmitError: (message: string | null) => void;
  setSubmitSuccess: (value: boolean) => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  draft: null,
  isModalOpen: false,
  isSubmitting: false,
  submitError: null,
  submitSuccess: false,

  openModal: (vendorId, vendorName) =>
    set({
      isModalOpen: true,
      submitError: null,
      submitSuccess: false,
      draft: {
        vendorId,
        vendorName,
        eventDate: "",
        guestCount: 50,
        message: "",
        venueLocation: null,
      },
    }),

  closeModal: () =>
    set({
      isModalOpen: false,
      submitError: null,
      submitSuccess: false,
    }),

  updateDraft: (fields) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, ...fields } : null,
    })),

  resetDraft: () =>
    set({
      draft: null,
      isSubmitting: false,
      submitError: null,
      submitSuccess: false,
    }),

  setSubmitting: (value) => set({ isSubmitting: value }),
  setSubmitError: (message) => set({ submitError: message }),
  setSubmitSuccess: (value) => set({ submitSuccess: value }),
}));
