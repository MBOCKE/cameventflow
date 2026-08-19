import Link from "next/link";
import Image from "next/image";
import { MapPin, Tag } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface VendorCardProps {
  id: string;
  name: string;
  category: string;
  city: string;
  basePrice: number;
  availability: boolean;
  profileImageUrl?: string | null;
}

export function VendorCard({
  id,
  name,
  category,
  city,
  basePrice,
  availability,
  profileImageUrl,
}: VendorCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Vendor image */}
      <div className="relative h-40 w-full bg-muted">
        {profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt={`${name} profile`}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Availability badge overlaid on image */}
        <div className="absolute top-2 right-2">
          {availability ? (
            <Badge variant="success">Available</Badge>
          ) : (
            <Badge variant="secondary">Unavailable</Badge>
          )}
        </div>
      </div>

      <CardContent className="pt-4 space-y-2">
        <h3 className="font-semibold text-base leading-tight">{name}</h3>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Tag className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{category}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{city}</span>
        </div>

        <p className="text-sm font-medium text-foreground">
          From{" "}
          <span className="text-primary">
            {new Intl.NumberFormat("fr-CM", {
              style: "currency",
              currency: "XAF",
              minimumFractionDigits: 0,
            }).format(basePrice)}
          </span>
        </p>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full" size="sm">
          <Link href={`/vendors/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
