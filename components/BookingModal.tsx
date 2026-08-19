"use client";

import { useRouter } from "next/navigation";
import { useBookingStore } from "@/lib/stores/useBookingStore";
import { MapboxVenuePicker, type VenueLocation } from "@/components/MapboxVenuePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BookingModal() {
  const router = useRouter();
  const {
    draft,
    isModalOpen,
    isSubmitting,
    submitError,
    submitSuccess,
    closeModal,
    updateDraft,
    setSubmitting,
    setSubmitError,
    setSubmitSuccess,
    resetDraft,
  } = useBookingStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId:      draft.vendorId,
          eventDate:     draft.eventDate,
          guestCount:    draft.guestCount,
          message:       draft.message,
          // venueLocation is passed through for record-keeping; the API
          // can persist lat/lng to the Booking model in a future migration
          venueLocation: draft.venueLocation ?? null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create booking.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        resetDraft();
        closeModal();
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Book {draft?.vendorName ?? "Vendor"}</DialogTitle>
          <DialogDescription>
            Fill in the event details and we will send your request to the vendor.
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-green-600 font-semibold text-lg">Booking sent!</p>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Event date */}
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={draft?.eventDate ?? ""}
                onChange={(e) => updateDraft({ eventDate: e.target.value })}
              />
            </div>

            {/* Guest count */}
            <div className="space-y-1.5">
              <Label htmlFor="guestCount">Number of Guests</Label>
              <Input
                id="guestCount"
                type="number"
                required
                min={1}
                max={10000}
                value={draft?.guestCount ?? 50}
                onChange={(e) =>
                  updateDraft({ guestCount: parseInt(e.target.value, 10) || 1 })
                }
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="message">Message to Vendor</Label>
              <textarea
                id="message"
                required
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Describe your event, theme, or special requirements…"
                value={draft?.message ?? ""}
                onChange={(e) => updateDraft({ message: e.target.value })}
              />
            </div>

            {/* ── Mapbox venue picker ───────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label>Event Venue <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <MapboxVenuePicker
                onLocationSelect={(loc: VenueLocation) =>
                  updateDraft({ venueLocation: loc })
                }
                defaultValue={draft?.venueLocation?.placeName ?? ""}
                placeholder="Search for venue address…"
              />
            </div>

            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send Request"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
