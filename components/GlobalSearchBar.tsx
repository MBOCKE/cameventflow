"use client";

// components/GlobalSearchBar.tsx
// Floating persistent search bar with debounced live results dropdown.
// Used on the Home page and Discover page.

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Store } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  isEvent: boolean;
  _type: "event" | "vendor";
  category: string;
  city: string;
  activeStatus: string;
  profileImageUrl: string | null;
  user: { id: string; name: string };
}

// ── Hook: debounce ─────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface GlobalSearchBarProps {
  /** Extra Tailwind classes for the wrapper – lets each page position it */
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function GlobalSearchBar({
  className,
  placeholder = "Search vendors & events…",
  autoFocus = false,
}: GlobalSearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debouncedQuery = useDebounce(query, 280);

  // ── Fetch results whenever debounced query changes ─────────────────────────
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: SearchResult[]) => {
        if (cancelled) return;
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
        setActiveIdx(-1);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      navigateTo(results[activeIdx].id);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const navigateTo = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/vendors/${id}`);
    },
    [router]
  );

  function clearQuery() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  // ── Status badge colour ────────────────────────────────────────────────────
  function statusColor(status: string) {
    if (status === "LIVE")     return "bg-red-500";
    if (status === "UPCOMING") return "bg-amber-400";
    return "bg-gray-400";
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="search-listbox"
          aria-activedescendant={activeIdx >= 0 ? `search-item-${activeIdx}` : undefined}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full h-11 rounded-full border border-input bg-background pl-10 pr-10 text-sm shadow-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />

        {/* Loading spinner or clear button */}
        <div className="absolute right-3 flex items-center">
          {loading ? (
            <span
              className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"
              aria-label="Searching…"
            />
          ) : query.length > 0 ? (
            <button
              onClick={clearQuery}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Dropdown results ───────────────────────────────────────────────── */}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-listbox"
          role="listbox"
          aria-label="Search results"
          className="absolute top-full mt-2 left-0 right-0 z-50 max-h-72 overflow-y-auto rounded-xl border bg-background shadow-xl"
        >
          {results.map((result, idx) => (
            <button
              key={result.id}
              id={`search-item-${idx}`}
              role="option"
              aria-selected={activeIdx === idx}
              onClick={() => navigateTo(result.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                activeIdx === idx && "bg-accent text-accent-foreground"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {result.isEvent ? (
                  <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{result.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {result.category} · {result.city}
                </p>
              </div>

              {/* Badge */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                {result.isEvent && (
                  <span className={cn("h-2 w-2 rounded-full", statusColor(result.activeStatus))} />
                )}
                <span className="text-xs text-muted-foreground">
                  {result.isEvent ? result.activeStatus : "Vendor"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border bg-background shadow-xl px-4 py-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
