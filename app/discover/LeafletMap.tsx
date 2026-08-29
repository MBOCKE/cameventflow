"use client";

// app/discover/LeafletMap.tsx
// Imperative Leaflet map — initialised exactly once via raw Leaflet API.
// Fully interactive: drag, pinch-zoom, scroll-zoom, touch gestures.

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap } from "leaflet";
import { createRoot } from "react-dom/client";
import { EventPopupCard, type EventPin } from "./DiscoverMapClient";

interface Props {
  events:     EventPin[];
  onPinClick: (ev: EventPin) => void;
  onClose:    () => void;
  onError:    () => void;
}

export default function LeafletMapComponent({
  events,
  onPinClick,
  onClose,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let destroyed = false;
    let watchId: number | null = null;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;
        if (destroyed || !containerRef.current) return;

        // Fix default icon resolution in webpack
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // ── Get user location BEFORE creating the map ─────────────────
        // This way the map opens centered on the user immediately.
        // Timeout after 3 s so a slow/denied response doesn't stall init.
        const getUserLocation = (): Promise<[number, number]> =>
          new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve([3.848, 11.502]); // fallback: Yaoundé
              return;
            }
            const timer = setTimeout(() => resolve([3.848, 11.502]), 3000);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timer);
                resolve([pos.coords.latitude, pos.coords.longitude]);
              },
              () => {
                clearTimeout(timer);
                resolve([3.848, 11.502]); // denied or error → Yaoundé
              },
              { timeout: 3000, maximumAge: 30000, enableHighAccuracy: true }
            );
          });

        const userCenter = await getUserLocation();
        if (destroyed || !containerRef.current) return;

        // ── Create map centered on user's real position ───────────────
        const map = L.map(containerRef.current, {
          center:              userCenter,
          zoom:                14,              // street-level, feels local
          zoomControl:         true,
          scrollWheelZoom:     true,
          doubleClickZoom:     true,
          touchZoom:           true,
          dragging:            true,
          tap:                 true,
          tapTolerance:        15,
          keyboard:            true,
          boxZoom:             true,
          inertia:             true,
          inertiaDeceleration: 3000,
          worldCopyJump:       true,
        });

        mapRef.current = map;

        // ── OSM tile layer ────────────────────────────────────────────
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" ' +
            'target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          maxZoom:     19,
          tileSize:    256,
          zoomOffset:  0,
        }).addTo(map);

        // ── Show user dot immediately (location already known) ───────
        // Draw the blue "you are here" dot at the map center
        const userDotIcon = L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;border-radius:50%;
            background:#2563EB;border:3px solid white;
            box-shadow:0 0 0 3px rgba(37,99,235,0.35);"></div>`,
          iconSize:   [16, 16],
          iconAnchor: [8, 8],
        });

        const userMarker = L.marker(userCenter, { icon: userDotIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindTooltip("You are here", { permanent: false, direction: "top" });

        L.circle(userCenter, {
          radius:      40,
          color:       "#2563EB",
          fillColor:   "#3b82f6",
          fillOpacity: 0.12,
          weight:      2,
        }).addTo(map);

        // Keep dot updated if user moves (watch position)
        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (destroyed) return;
              const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
              userMarker.setLatLng(newPos);
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 10000 }
          );
        }

        // ── Icon factory ──────────────────────────────────────────────
        const makeIcon = (color: string, pulse: boolean) =>
          L.divIcon({
            className: "",
            html: `
              <div style="
                position:relative;width:40px;height:40px;
                display:flex;align-items:center;justify-content:center;
                border-radius:50%;background:${color};
                box-shadow:0 3px 10px rgba(0,0,0,0.45);cursor:pointer;
              ">
                ${pulse ? `
                  <span style="
                    position:absolute;inset:0;border-radius:50%;
                    background:${color};opacity:0.45;
                    animation:leaflet-pin-pulse 1.8s ease-out infinite;
                  "></span>
                  <span style="
                    position:absolute;inset:0;border-radius:50%;
                    background:${color};opacity:0.25;
                    animation:leaflet-pin-pulse 1.8s ease-out infinite 0.6s;
                  "></span>
                ` : ""}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                  viewBox="0 0 24 24" fill="none" stroke="white"
                  stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>`,
            iconSize:    [40, 40],
            iconAnchor:  [20, 40],
            popupAnchor: [0, -44],
          });

        // ── Add markers ───────────────────────────────────────────────
        events.forEach((ev) => {
          const icon = makeIcon(
            ev.activeStatus === "LIVE" ? "#ef4444" : "#f59e0b",
            ev.activeStatus === "LIVE"
          );

          const marker = L.marker([ev.latitude, ev.longitude], {
            icon,
            riseOnHover: true,
          }).addTo(map);

          // Each popup gets a fresh React root
          const popupEl = document.createElement("div");
          let popupRoot: ReturnType<typeof createRoot> | null = null;

          marker.bindPopup(
            L.popup({
              minWidth:    296,
              maxWidth:    296,
              closeButton: false,
              className:   "leaflet-popup-reset",
              autoPanPadding: [20, 80],  // keep popup away from overlays
            }).setContent(popupEl)
          );

          marker.on("click", () => onPinClick(ev));

          marker.on("popupopen", () => {
            popupRoot = createRoot(popupEl);
            popupRoot.render(
              <EventPopupCard
                event={ev}
                onClose={() => {
                  marker.closePopup();
                  onClose();
                }}
              />
            );
          });

          marker.on("popupclose", () => {
            // Defer unmount so React finishes the current render cycle first
            setTimeout(() => {
              popupRoot?.unmount();
              popupRoot = null;
            }, 0);
          });
        });

        // Force a size recalc in case the container was zero-sized at init
        setTimeout(() => map.invalidateSize(), 100);

      } catch (err) {
        console.error("[LeafletMap] init error:", err);
        if (!destroyed) onError();
      }
    }

    initMap();

    return () => {
      destroyed = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height:   "100vh",
        width:    "100%",
        position: "relative",   // required by Leaflet for correct event mapping
        zIndex:   0,
      }}
      aria-label="Interactive event map"
    />
  );
}
