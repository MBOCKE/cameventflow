"use client";

// app/vendors/[id]/VendorActionButtons.tsx
// Client Component that renders "Book Now" + "Chat with Vendor" buttons
// and manages the TalkJSChat dialog state.

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useBookingStore } from "@/lib/stores/useBookingStore";
import { BookingModal } from "@/components/BookingModal";
import { TalkJSChat, type TalkJSUser } from "@/components/TalkJSChat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VendorActionButtonsProps {
  vendorId:     string;
  vendorName:   string;
  vendorUserId: string;
  vendorEmail:  string;
  isAvailable:  boolean;
  currentUser: {
    id:    string;
    name:  string;
    email: string;
    role:  "PLANNER" | "VENDOR";
  } | null;
}

export function VendorActionButtons({
  vendorId,
  vendorName,
  vendorUserId,
  vendorEmail,
  isAvailable,
  currentUser,
}: VendorActionButtonsProps) {
  const openModal    = useBookingStore((s) => s.openModal);
  const [chatOpen, setChatOpen] = useState(false);

  // Build TalkJS user objects from props
  const talkVendor: TalkJSUser = {
    id:    vendorUserId,
    name:  vendorName,
    email: vendorEmail,
    role:  "VENDOR",
  };

  const talkCurrentUser: TalkJSUser | null = currentUser
    ? {
        id:    currentUser.id,
        name:  currentUser.name,
        email: currentUser.email,
        role:  currentUser.role,
      }
    : null;

  // Conversation ID is stable: always the same vendor+planner pair
  const conversationId = talkCurrentUser
    ? `vendor-${vendorId}-user-${talkCurrentUser.id}`
    : `vendor-${vendorId}-guest`;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Book Now */}
        <Button
          size="lg"
          className="w-full"
          disabled={!isAvailable}
          onClick={() => openModal(vendorId, vendorName)}
          aria-label={`Book ${vendorName}`}
        >
          {isAvailable ? "Book Now" : "Currently Unavailable"}
        </Button>

        {/* Chat with Vendor */}
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => setChatOpen(true)}
          aria-label={`Chat with ${vendorName}`}
        >
          <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
          Chat with Vendor
        </Button>
      </div>

      {/* BookingModal (Zustand-controlled) */}
      <BookingModal />

      {/* TalkJS Chat dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
              Chat with {vendorName}
            </DialogTitle>
          </DialogHeader>

          {talkCurrentUser ? (
            <TalkJSChat
              currentUser={talkCurrentUser}
              otherUser={talkVendor}
              conversationId={conversationId}
              height={440}
            />
          ) : (
            <div className="px-4 pb-6 pt-2 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                You need to be signed in to chat with vendors.
              </p>
              <Button asChild size="sm">
                <a href="/login">Sign in</a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
