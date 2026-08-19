"use client";

// app/onboarding/vendor/page.tsx  –  Vendor Onboarding  (/onboarding/vendor)
// 4-step form using useVendorOnboardingStore (Zustand).
// Step 1: Category & City
// Step 2: Pricing & Description
// Step 3: Profile Image (upload to Supabase Storage)
// Step 4: Business Location pin (MapboxVenuePicker)

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Check, ChevronRight, ChevronLeft,
  Loader2, MapPin, Upload, ImageIcon,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { useVendorOnboardingStore, type VendorCategory, type VendorCity } from "@/lib/stores/useVendorOnboardingStore";
import { MapboxVenuePicker } from "@/components/MapboxVenuePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES: VendorCategory[] = ["Venue", "Caterer", "Decorator", "Sound", "Photographer"];
const CITIES:     VendorCity[]     = ["Douala", "Yaounde", "Buea"];

const CITY_LABELS: Record<VendorCity, string> = {
  Douala: "Douala",
  Yaounde: "Yaoundé",
  Buea: "Buea",
};

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={cn(
            "h-2 rounded-full transition-all",
            s < current  ? "w-6 bg-primary"
            : s === current ? "w-8 bg-primary"
                           : "w-4 bg-muted"
          )}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VendorOnboardingPage() {
  const router  = useRouter();
  const {
    step, data, isSubmitting, submitError,
    nextStep, prevStep, updateData,
    setSubmitting, setSubmitError, reset,
  } = useVendorOnboardingStore();

  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview,   setImagePreview]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload to Supabase Storage ──────────────────────────────────────
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    updateData({ profileImageFile: file, profileImageUrl: null });

    setImageUploading(true);
    try {
      const supabase  = createBrowserClient();
      const ext       = file.name.split(".").pop();
      const fileName  = `vendor-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("vendor-images")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("vendor-images")
        .getPublicUrl(fileName);

      updateData({ profileImageUrl: urlData.publicUrl });
    } catch (err) {
      console.error("[image upload]", err);
      // Non-fatal – proceed without image if upload fails
    } finally {
      setImageUploading(false);
    }
  }

  // ── Final submit ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/vendors/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category:        data.category,
          city:            data.city,
          basePrice:       data.basePrice,
          description:     data.description,
          profileImageUrl: data.profileImageUrl,
          latitude:        data.latitude,
          longitude:       data.longitude,
        }),
      });

      const body = await res.json();

      if (!res.ok && res.status !== 409) {
        throw new Error(body.error ?? "Failed to create vendor profile.");
      }

      reset();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const canProceedStep1 = data.category !== "" && data.city !== "";
  const canProceedStep2 = data.basePrice > 0 && data.description.trim().length >= 20;

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-10 pb-20">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-bold">Set up your vendor profile</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Step {step} of 4 — {
              step === 1 ? "What do you offer?"
              : step === 2 ? "Tell us about your pricing"
              : step === 3 ? "Add a profile photo"
              : "Pin your business location"
            }
          </p>
          <StepIndicator current={step} total={4} />
        </div>

        {/* ── Step 1: Category & City ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Service Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateData({ category: cat })}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      data.category === cat
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input bg-background text-foreground hover:bg-accent"
                    )}
                    aria-pressed={data.category === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <div className="flex gap-2 flex-wrap">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateData({ city: c })}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      data.city === c
                        ? "border-primary bg-primary text-white"
                        : "border-input bg-background hover:bg-accent"
                    )}
                    aria-pressed={data.city === c}
                  >
                    {CITY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={nextStep}
              disabled={!canProceedStep1}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Pricing & Description ────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="basePrice">Starting Price (XAF)</Label>
              <Input
                id="basePrice"
                type="number"
                min={0}
                placeholder="e.g. 50000"
                value={data.basePrice || ""}
                onChange={(e) => updateData({ basePrice: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {data.basePrice > 0
                  ? new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(data.basePrice)
                  : "Enter your base price"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                About your service
                <span className="text-muted-foreground font-normal ml-1">(min. 20 chars)</span>
              </Label>
              <textarea
                id="description"
                rows={5}
                placeholder="Describe what you offer, your experience, and what makes you stand out…"
                value={data.description}
                onChange={(e) => updateData({ description: e.target.value })}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {data.description.length} characters
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Back
              </Button>
              <Button className="flex-1" onClick={nextStep} disabled={!canProceedStep2}>
                Continue <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Profile Image ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
                imagePreview ? "border-primary" : "border-input hover:border-primary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload profile image"
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="h-40 w-40 rounded-2xl object-cover"
                />
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium">Tap to upload a photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP · Max 5 MB</p>
                </>
              )}

              {imageUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />

            {imagePreview && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline w-full text-center"
                onClick={() => {
                  setImagePreview(null);
                  updateData({ profileImageUrl: null, profileImageFile: null });
                }}
              >
                Remove photo
              </button>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Back
              </Button>
              <Button
                className="flex-1"
                onClick={nextStep}
                disabled={imageUploading}
              >
                {data.profileImageUrl ? (
                  <><Check className="h-4 w-4 mr-1 text-green-400" aria-hidden="true" /> Photo saved</>
                ) : "Skip for now"}
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Location pin ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                Business Location
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Drop a pin so customers can find you on the discovery map.
              </p>
              <MapboxVenuePicker
                onLocationSelect={(loc) =>
                  updateData({
                    latitude:  loc.latitude,
                    longitude: loc.longitude,
                    placeName: loc.placeName,
                  })
                }
                defaultValue={data.placeName}
                placeholder="Search for your business address…"
              />
            </div>

            {data.latitude && data.longitude && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{data.placeName}</span>
              </div>
            )}

            {submitError && (
              <p className="text-sm text-destructive" role="alert">{submitError}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep} disabled={isSubmitting}>
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />Saving…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-1.5" aria-hidden="true" />Launch Profile</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
