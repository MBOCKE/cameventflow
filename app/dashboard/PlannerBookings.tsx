// app/dashboard/PlannerBookings.tsx
// Shows bookings created by a PLANNER user.

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Status is a plain string in the MySQL schema (no Prisma enum)
type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELED";

interface Booking {
  id:         string;
  eventDate:  Date;
  guestCount: number;
  status:     string;   // string from DB, narrowed via STATUS_VARIANT lookup
  message:    string;
  vendor: {
    id:   string;
    city: string;
    user: { name: string };
  };
}

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive"> = {
  PENDING:   "warning",
  CONFIRMED: "success",
  CANCELED:  "destructive",
};

export function PlannerBookings({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="py-14 text-center space-y-3">
        <p className="text-muted-foreground text-sm">You have no bookings yet.</p>
        <Button asChild size="sm">
          <Link href="/vendors">Find a Vendor</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3 mt-3" aria-label="My bookings">
      {bookings.map((b) => (
        <li key={b.id}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{b.vendor.user.name}</CardTitle>
                <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {new Date(b.eventDate).toLocaleDateString("fr-CM", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {b.guestCount} guests
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {b.vendor.city}
              </div>
              {b.message && (
                <p className="pt-1 text-xs line-clamp-2 text-foreground/70">
                  &ldquo;{b.message}&rdquo;
                </p>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
