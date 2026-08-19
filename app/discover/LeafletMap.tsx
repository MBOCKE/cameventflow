"use client";

// app/discover/LeafletMap.tsx
// The actual Leaflet map rendered inside a dynamic() boundary so it is
// never executed during SSR.  Imported exclusively by DiscoverMapClient.

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { EventPopupCard, type EventPin } from "./DiscoverMapClient";

// ── Fix Leaflet's broken default icon paths in webpack/Next.js ───────────────
// Leaflet tries to resolve icon images relative to its own CSS file which
// doesn't work in a bundled environment. We point it at the CDN instead.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom coloured div-icons for LIVE vs UPCOMING pins ──────────────────────
function makePin(color: string): L.DivIcon {
  return L.divIcon({
    className: "",   // suppress Leaflet's default white square
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        cursor: pointer;
      ">
        <!-- pulse ring (LIVE only) -->
        ${color === "#ef4444" ? `
          <span style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: ${color};
            opacity: 0.5;
            animation: leaflet-pin-pulse 1.8s ease-out infinite;
          "></span>
        ` : ""}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize:   [36, 36],
    iconAnchor: [18, 36],   // anchor at bottom-centre of the pin
    popupAnchor:[0, -36],   // popup opens above the pin
  });
}

const LIVE_ICON     = makePin("#ef4444");   // red-500
const UPCOMING_ICON = makePin("#f59e0b");   // amber-400

// ── Keyboard zoom fix – prevents Leaflet swallowing page keyboard events ──────
function KeyboardFix() {
  const map = useMap();
  useEffect(() => {
    map.keyboard.disable();
  }, [map]);
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface LeafletMapProps {
  events:        EventPin[];
  selectedEvent: EventPin | null;
  onPinClick:    (ev: EventPin) => void;
  onClose:       () => void;
  onError:       () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LeafletMap({
  events,
  selectedEvent,
  onPinClick,
  onClose,
  onError,
}: LeafletMapProps) {
  // Surface errors to the parent so it can swap in the StaticMapFallback
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message?.toLowerCase().includes("leaflet")) onError();
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, [onError]);

  return (
    <MapContainer
      center={[3.848, 11.502]}   // Yaoundé, Cameroon
      zoom={6}
      style={{ height: "100vh", width: "100%" }}
      zoomControl={false}         // we use the browser's pinch-zoom on mobile
      attributionControl={true}
    >
      {/* ── OpenStreetMap tile layer – no API key required ──────────── */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {/* Disable keyboard capture so the search bar still works */}
      <KeyboardFix />

      {/* ── Event markers ────────────────────────────────────────────── */}
      {events.map((ev) => (
        <Marker
          key={ev.id}
          position={[ev.latitude, ev.longitude]}
          icon={ev.activeStatus === "LIVE" ? LIVE_ICON : UPCOMING_ICON}
          eventHandlers={{
            click: () => onPinClick(ev),
          }}
        >
          {/* Leaflet Popup wraps EventPopupCard */}
          <Popup
            minWidth={288}
            maxWidth={288}
            closeButton={false}
            className="leaflet-popup-reset"
          >
            <EventPopupCard
              event={ev}
              onClose={() => {
                onClose();
              }}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
