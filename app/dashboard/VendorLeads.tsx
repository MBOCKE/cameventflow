"use client";

// app/dashboard/VendorLeads.tsx
// Shows incoming booking requests received by a VENDOR user.
// Includes a "Reply via Chat" button that opens a TalkJS dialog per lead.

import { useState } from "react";
import { CalendarDays, Mail, MessageCircle, Phone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TalkJSChat, type TalkJSUser } from "@/components/TalkJSChat";

// Status is a plain string in the MySQL schema (no Prisma enum)
interface Lead {
  id:         string;
  eventDate:  Date;
  guestCount: number;
  status:     string;   // string from DB
  message:    string;
  planner: {
    id:    string;
    name:  string;
    email: string;
    phone: string | null;
  };
}

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive"> = {
  PENDING:   "warning",
  CONFIRMED: "success",
  CANCELED:  "destructive",
};

interface VendorLeadsProps {
  bookings:    Lead[];
  isVendor:    boolean;
  /** The logged-in vendor's own user data – needed to init TalkJS as currentUser */
  vendorUser?: {
    id:    string;
    name:  string;
    email: string;
  };
}

export function VendorLeads({ bookings, isVendor, vendorUser }: VendorLeadsProps) {
  // Track which lead's chat dialog is open (null = closed)
  const [activeChatLeadId, setActiveChatLeadId] = useState<string | null>(null);

  if (!isVendor) {
    return (
      <div className="py-14 text-center space-y-3">
        <p className="text-muted-foreground text-sm">This section is for vendors only.</p>
        <p className="text-xs text-muted-foreground">Sign up as a vendor to receive booking requests.</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="py-14 text-center space-y-2">
        <p className="text-muted-foreground text-sm">No incoming leads yet.</p>
        <p className="text-xs text-muted-foreground">Keep your profile up to date to attract planners.</p>
      </div>
    );
  }

  const activeLead = bookings.find((b) => b.id === activeChatLeadId) ?? null;

  // Build TalkJS user objects only when needed
  const talkVendor: TalkJSUser | null = vendorUser
    ? { id: vendorUser.id, name: vendorUser.name, email: vendorUser.email, role: "VENDOR" }
    : null;

  const talkPlanner: TalkJSUser | null = activeLead
    ? { id: activeLead.planner.id, name: activeLead.planner.name, email: activeLead.planner.email, role: "PLANNER" }
    : null;

  return (
    <>
      <ul className="space-y-3 mt-3" aria-label="Incoming leads">
        {bookings.map((lead) => (
          <li key={lead.id}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{lead.planner.name}</CardTitle>
                  <Badge variant={STATUS_VARIANT[lead.status]}>{lead.status}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {new Date(lead.eventDate).toLocaleDateString("fr-CM", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {lead.guestCount} guests
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {lead.planner.email}
                </div>
                {lead.planner.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {lead.planner.phone}
                  </div>
                )}
                {lead.message && (
                  <p className="pt-1 text-xs line-clamp-3 text-foreground/70">
                    &ldquo;{lead.message}&rdquo;
                  </p>
                )}

                {/* ── Reply via Chat (TalkJS) ──────────────────────────── */}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => setActiveChatLeadId(lead.id)}
                  aria-label={`Reply to ${lead.planner.name} via chat`}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Reply via Chat
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {/* ── TalkJS Chat dialog ───────────────────────────────────────── */}
      <Dialog
        open={activeChatLeadId !== null}
        onOpenChange={(open) => !open && setActiveChatLeadId(null)}
      >
        <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
              {activeLead ? `Chat with ${activeLead.planner.name}` : "Chat"}
            </DialogTitle>
          </DialogHeader>

          {talkVendor && talkPlanner && activeLead ? (
            <TalkJSChat
              currentUser={talkVendor}
              otherUser={talkPlanner}
              // Stable ID: one thread per booking
              conversationId={`booking-${activeLead.id}`}
              height={440}
            />
          ) : (
            <div className="px-4 pb-6 pt-2 text-center">
              <p className="text-sm text-muted-foreground">
                Unable to open chat. Please refresh and try again.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
