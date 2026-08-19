"use client";

// components/MapboxVenuePicker.tsx
// Geocoding search input backed by the Mapbox Geocoding API.
// Used inside BookingModal so planners can pin their exact event location.
//
// Props:
//   onLocationSelect(result) – called when the user picks a suggestion.
//   placeholder              – input placeholder text (optional).
//   defaultValue             – pre-fill label when editing an existing booking.

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VenueLocation {
  placeName:  string;   // Full human-readable address
  latitude:   number;
  longitude:  number;
}

interface GeocodingFeature {
  id:          string;
  place_name:  string;
  center:      [number, number]; // [longitude, latitude]
}

interface MapboxVenuePickerProps {
  onLocationSelect: (location: VenueLocation) => void;
  placeholder?:     string;
  defaultValue?:    string;
  className?:       string;
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MapboxVenuePicker({
  onLocationSelect,
  placeholder = "Search for a venue or address…",
  defaultValue = "",
  className,
}: MapboxVenuePickerProps) {
  const [query, setQuery]               = useState(defaultValue);
  const [suggestions, setSuggestions]   = useState<GeocodingFeature[]>([]);
  const [loading, setLoading]           = useState(false);
  const [open, setOpen]                 = useState(false);
  const [selected, setSelected]         = useState<VenueLocation | null>(null);
  const [mapToken, setMapToken]         = useState<string | null>(null);
  const [tokenError, setTokenError]     = useState(false);
  const inputRef                        = useRef<HTMLInputElement>(null);
  const dropdownRef                     = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 320);

  // Fetch token once from the secure endpoint
  useEffect(() => {
    fetch("/api/map-token")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setMapToken(d.token ?? null))
      .catch(() => setTokenError(true));
  }, []);

  // Run geocoding when debounced query changes
  useEffect(() => {
    if (!mapToken || !debouncedQuery.trim() || debouncedQuery.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // If the user just selected a suggestion, don't re-fetch
    if (selected?.placeName === debouncedQuery) return;

    let cancelled = false;
    setLoading(true);

    const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/" +
      encodeURIComponent(debouncedQuery) + ".json");
    url.searchParams.set("access_token", mapToken);
    url.searchParams.set("country",      "cm");          // Cameroon first
    url.searchParams.set("language",     "fr");
    url.searchParams.set("limit",        "6");
    url.searchParams.set("types",        "place,address,poi");

    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSuggestions(data.features ?? []);
        setOpen((data.features ?? []).length > 0);
      })
      .catch(() => { if (!cancelled) setSuggestions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery, mapToken, selected]);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        inputRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const handleSelect = useCallback((feature: GeocodingFeature) => {
    const location: VenueLocation = {
      placeName:  feature.place_name,
      longitude:  feature.center[0],
      latitude:   feature.center[1],
    };
    setQuery(feature.place_name);
    setSelected(location);
    setOpen(false);
    setSuggestions([]);
    onLocationSelect(location);
  }, [onLocationSelect]);

  function clearSelection() {
    setQuery("");
    setSelected(null);
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  // No token yet – show a disabled placeholder
  if (tokenError) {
    return (
      <div className={cn("rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground", className)}>
        Venue picker unavailable – set <code className="text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center">
        <MapPin
          className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="venue-listbox"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <div className="absolute right-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button onClick={clearSelection} aria-label="Clear venue" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Selected location confirmation pill */}
      {selected && (
        <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
          <span className="truncate">{selected.placeName}</span>
          <span className="text-primary font-medium ml-auto whitespace-nowrap">
            {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
          </span>
        </p>
      )}

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="venue-listbox"
          role="listbox"
          aria-label="Venue suggestions"
          className="absolute top-full mt-1 left-0 right-0 z-50 max-h-52 overflow-y-auto rounded-xl border bg-background shadow-xl"
        >
          {suggestions.map((feat) => (
            <button
              key={feat.id}
              role="option"
              aria-selected={selected?.placeName === feat.place_name}
              onClick={() => handleSelect(feat)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
              <span className="line-clamp-2">{feat.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
