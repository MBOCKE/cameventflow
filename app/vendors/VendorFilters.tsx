"use client";

// VendorFilters.tsx
// Client Component – dropdown filters that update URL search params.

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const CITIES     = ["Douala", "Yaounde", "Buea"];
const CATEGORIES = ["Venue", "Caterer", "Decorator", "Sound", "Photographer"];
const MAX_PRICES = [
  { label: "Up to 50 000 XAF",  value: "50000"  },
  { label: "Up to 100 000 XAF", value: "100000" },
  { label: "Up to 250 000 XAF", value: "250000" },
  { label: "Up to 500 000 XAF", value: "500000" },
];

interface VendorFiltersProps {
  currentCity?:     string;
  currentCategory?: string;
  currentMaxPrice?: string;
}

export function VendorFilters({
  currentCity,
  currentCategory,
  currentMaxPrice,
}: VendorFiltersProps) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const hasFilters = currentCity || currentCategory || currentMaxPrice;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {/* City filter */}
        <Select
          value={currentCity ?? ""}
          onValueChange={(v) => updateParam("city", v === "all" ? null : v)}
        >
          <SelectTrigger aria-label="Filter by city">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={currentCategory ?? ""}
          onValueChange={(v) => updateParam("category", v === "all" ? null : v)}
        >
          <SelectTrigger aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Max price filter */}
        <Select
          value={currentMaxPrice ?? ""}
          onValueChange={(v) => updateParam("maxPrice", v === "all" ? null : v)}
        >
          <SelectTrigger aria-label="Filter by max price">
            <SelectValue placeholder="Max price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any price</SelectItem>
            {MAX_PRICES.map(({ label, value }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters button */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 px-2"
          onClick={() => router.push(pathname)}
        >
          <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
