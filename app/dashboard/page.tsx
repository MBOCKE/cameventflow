// app/dashboard/page.tsx  –  Dashboard  (/dashboard)
// Server Component: fetches the user's bookings, renders role-aware tabs.
// Shows a vendor onboarding prompt when a VENDOR user has no profile yet.

import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlannerBookings } from "./PlannerBookings";
import { VendorLeads } from "./VendorLeads";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: {
      vendor: true,
      bookings: {
        include: {
          vendor: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { eventDate: "asc" },
      },
    },
  });

  if (!user) redirect("/login");

  // Incoming bookings for VENDOR users with a completed profile
  const incomingBookings =
    user.role === "VENDOR" && user.vendor
      ? await prisma.booking.findMany({
          where: { vendorId: user.vendor.id },
          include: {
            planner: { select: { id: true, name: true, email: true, phone: true } },
          },
          orderBy: { eventDate: "asc" },
        })
      : [];

  // A VENDOR user who hasn't finished onboarding yet
  const needsOnboarding = user.role === "VENDOR" && !user.vendor;

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back,{" "}
          <span className="font-medium text-foreground">{user.name}</span>
        </p>
      </div>

      {/* ── Vendor onboarding prompt ────────────────────────────────── */}
      {needsOnboarding && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle
            className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-amber-900">
              Complete your vendor profile
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Planners can&apos;t find you yet. Set up your profile to start
              receiving booking requests.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/onboarding/vendor">
                Set up profile
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <Tabs defaultValue={user.role === "VENDOR" ? "leads" : "bookings"}>
        <TabsList className="w-full">
          <TabsTrigger value="bookings" className="flex-1">
            My Bookings
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex-1">
            Incoming Leads
          </TabsTrigger>
        </TabsList>

        {/* Planner: outgoing bookings */}
        <TabsContent value="bookings">
          <PlannerBookings bookings={user.bookings} />
        </TabsContent>

        {/* Vendor: incoming booking leads */}
        <TabsContent value="leads">
          <VendorLeads
            bookings={incomingBookings}
            isVendor={user.role === "VENDOR"}
            vendorUser={
              user.role === "VENDOR"
                ? { id: user.id, name: user.name, email: user.email }
                : undefined
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
