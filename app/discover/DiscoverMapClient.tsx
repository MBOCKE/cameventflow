"use client";

// app/discover/DiscoverMapClient.tsx
// Full-screen Snap-Map style event discovery page.
//
// Map engine: react-leaflet v4 + OpenStreetMap tiles (no API key required).
// Falls back to <StaticMapFallback> if Leaflet fails to mount (SSR guard).

import "leaflet/dist/leaflet.css";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// react-leaflet is browser-only; we import dynamically so Next.js SSR
// never tries to execute it on the server.
import dynamic from "next/dynamic";
import { MapPin, X, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Dynamic import of Leaflet components (browser-only) ───────────────────────
// We wrap the real map in a dynamic import so it is never rendered on the server.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-3 text-white/60">
        <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export interface EventPin {
  id: string;
  latitude: number;
  longitude: number;
  activeStatus: "LIVE" | "UPCOMING" | "ENDED";
  isEvent: boolean;
  city: string;
  category: string;
  eventStartTime: string | null;
  eventEndTime: string | null;
  user: { name: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatTime(iso: string | null): string {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleTimeString("fr-CM", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-CM", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Static fallback (shown only if Leaflet mount fails) ───────────────────────
const CAMEROON_BOUNDS = {
  minLat: 1.65, maxLat: 13.08,
  minLng: 8.4,  maxLng: 16.19,
};

function latLngToPercent(lat: number, lng: number) {
  const x = ((lng - CAMEROON_BOUNDS.minLng) / (CAMEROON_BOUNDS.maxLng - CAMEROON_BOUNDS.minLng)) * 100;
  const y = ((CAMEROON_BOUNDS.maxLat - lat) / (CAMEROON_BOUNDS.maxLat - CAMEROON_BOUNDS.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

function StaticMapFallback({
  events,
  onPinClick,
  selectedId,
}: {
  events: EventPin[];
  onPinClick: (e: EventPin) => void;
  selectedId: string | null;
}) {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(160deg,#1a2e4a 0%,#1e3a5f 40%,#16304d 100%)",
      }}
      aria-label="Static event map – Leaflet could not load"
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-white/20 text-xs font-medium tracking-widest uppercase select-none">
          Cameroon
        </p>
      </div>

      {events.map((ev) => {
        const { x, y } = latLngToPercent(ev.latitude, ev.longitude);
        const isLive   = ev.activeStatus === "LIVE";
        const selected = ev.id === selectedId;
        return (
          <button
            key={ev.id}
            onClick={() => onPinClick(ev)}
            aria-label={`View event: ${ev.user.name}`}
            style={{ left: `${x}%`, top: `${y}%`, position: "absolute" }}
            className="-translate-x-1/2 -translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full transition-transform",
                selected && "scale-125",
                isLive ? "bg-red-500 event-pin-pulse" : "bg-amber-400"
              )}
            >
              <MapPin className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            {selected && (
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-900 shadow-lg">
                {ev.user.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Event popup card ─────────────────────────────────────────────────────────
// Exported so LeafletMap (a sibling module) can import it too.
export function EventPopupCard({
  event,
  onClose,
}: {
  event: EventPin;
  onClose: () => void;
}) {
  const router = useRouter();
  const isLive = event.activeStatus === "LIVE";

  return (
    <div
      className="w-72 rounded-2xl bg-background shadow-2xl border overflow-hidden"
      role="dialog"
      aria-label={`Event details: ${event.user.name}`}
    >
      <div className={cn("h-1.5 w-full", isLive ? "bg-red-500" : "bg-amber-400")} />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isLive ? (
                <Badge
                  variant="destructive"
                  className="text-xs px-2 py-0.5 uppercase tracking-wide"
                >
                  🔴 Live
                </Badge>
              ) : (
                <Badge
                  variant="warning"
                  className="text-xs px-2 py-0.5 uppercase tracking-wide"
                >
                  Upcoming
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{event.category}</span>
            </div>
            <h3 className="font-semibold text-sm leading-tight">{event.user.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close event details"
            className="flex-shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span>
            {event.eventStartTime
              ? `${formatDate(event.eventStartTime)} · ${formatTime(event.eventStartTime)} – ${formatTime(event.eventEndTime)}`
              : "Date & time TBA"}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span>{event.city}</span>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          className="w-full"
          onClick={() => router.push(`/vendors/${event.id}`)}
        >
          View Details
          <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────
export function DiscoverMapClient() {
  const [events, setEvents]               = useState<EventPin[]>([]);
  const [loading, setLoading]             = useState(true);
  const [leafletError, setLeafletError]   = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventPin | null>(null);
  const [filter, setFilter]               = useState<"ALL" | "LIVE" | "UPCOMING">("ALL");

  // Remove body bottom padding so map is truly full-screen
  useEffect(() => {
    document.body.classList.add("map-page");
    return () => document.body.classList.remove("map-page");
  }, []);

  // Fetch events from the API – no token needed
  useEffect(() => {
    fetch("/api/vendors?type=events")
      .then((r) => r.json())
      .then((data) => {
        const pins: EventPin[] = (Array.isArray(data) ? data : []).filter(
          (v: EventPin) => v.latitude != null && v.longitude != null
        );
        setEvents(pins);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePinClick = useCallback((ev: EventPin) => {
    setSelectedEvent((prev) => (prev?.id === ev.id ? null : ev));
  }, []);

  const filteredEvents = events.filter(
    (ev) => filter === "ALL" || ev.activeStatus === filter
  );
  const liveCount     = events.filter((e) => e.activeStatus === "LIVE").length;
  const upcomingCount = events.filter((e) => e.activeStatus === "UPCOMING").length;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">

      {/* ── Map canvas ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-full items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3 text-white/60">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm">Loading events…</p>
          </div>
        </div>
      ) : leafletError ? (
        /* Static fallback if Leaflet throws */
        <StaticMapFallback
          events={filteredEvents}
          onPinClick={handlePinClick}
          selectedId={selectedEvent?.id ?? null}
        />
      ) : (
        /* Real Leaflet map — dynamically imported, never SSR'd */
        <LeafletMap
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onPinClick={handlePinClick}
          onClose={() => setSelectedEvent(null)}
          onError={() => setLeafletError(true)}
        />
      )}

      {/* ── Floating search bar ──────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <GlobalSearchBar
          placeholder="Search events & vendors…"
          className="drop-shadow-xl"
        />
      </div>

      {/* ── Filter pills ─────────────────────────────────────────────── */}
      <div
        className="absolute top-20 left-4 z-[1000] flex gap-2"
        role="group"
        aria-label="Filter events"
      >
        {(["ALL", "LIVE", "UPCOMING"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setSelectedEvent(null);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-colors backdrop-blur-sm",
              filter === f
                ? f === "LIVE"
                  ? "bg-red-500 text-white"
                  : f === "UPCOMING"
                  ? "bg-amber-400 text-gray-900"
                  : "bg-primary text-white"
                : "bg-black/50 text-white/80 hover:bg-black/70"
            )}
          >
            {f === "ALL"
              ? `All (${events.length})`
              : f === "LIVE"
              ? `🔴 Live (${liveCount})`
              : `🟡 Upcoming (${upcomingCount})`}
          </button>
        ))}
      </div>

      {/* ── Legend (bottom-left) ─────────────────────────────────────── */}
      <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-1.5 rounded-xl bg-black/60 px-3 py-2.5 backdrop-blur-sm text-white text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          Live now
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          Upcoming
        </div>
      </div>
    </div>
  );
}
