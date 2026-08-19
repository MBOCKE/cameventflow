"use client";

// BookNowButton.tsx
// Thin client wrapper: opens the BookingModal via the Zustand store.

import { useBookingStore } from "@/lib/stores/useBookingStore";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@/components/ui/button";

interface BookNowButtonProps {
  vendorId:   string;
  vendorName: string;
  disabled?:  boolean;
}

export function BookNowButton({ vendorId, vendorName, disabled }: BookNowButtonProps) {
  const openModal = useBookingStore((s) => s.openModal);

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        disabled={disabled}
        onClick={() => openModal(vendorId, vendorName)}
        aria-label={`Book ${vendorName}`}
      >
        {disabled ? "Currently Unavailable" : "Book Now"}
      </Button>

      {/* Modal is rendered here so it has access to the same store slice */}
      <BookingModal />
    </>
  );
}
