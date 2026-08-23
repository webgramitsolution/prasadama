import { useEffect, useState } from "react";
import { MapPin, Loader2, LocateFixed } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "prasadam_delivery_location";

interface StoredLocation {
  label: string;
  pincode?: string;
}

// Free, key-less reverse geocoding. BigDataCloud is primary (fast, CORS-friendly,
// accurate locality + postcode for India); Nominatim is the fallback.
async function reverseGeocode(lat: number, lon: number): Promise<StoredLocation | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (res.ok) {
      const d = await res.json();
      const city = d.locality || d.city || d.principalSubdivision || "";
      const pincode = d.postcode || "";
      const label = [city, pincode].filter(Boolean).join(" ");
      if (label.trim()) return { label: label.trim(), pincode };
    }
  } catch {
    /* fall through to Nominatim */
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lon}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data?.address ?? {};
    const city =
      a.suburb || a.neighbourhood || a.village || a.town || a.city_district || a.city || a.county || "";
    const pincode = a.postcode || "";
    const label = [city, pincode].filter(Boolean).join(" ") || data?.display_name?.split(",")[0];
    return label ? { label, pincode } : null;
  } catch {
    return null;
  }
}

  const applyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return;
    save({ label: pin, pincode: pin });
    setPin("");
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Set delivery location"
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition-colors text-left ${className ?? ""}`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-primary" />
          )}
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground">Deliver to</span>
            <span className="text-[12px] font-medium text-foreground max-w-[110px] truncate">
              {location?.label || "Select location"}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-3 space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm"
          onClick={detect}
          disabled={loading}
        >
          <LocateFixed className="h-4 w-4" />
          {loading ? "Detecting..." : "Use my current location"}
        </Button>
        <form onSubmit={applyPin} className="space-y-2">
          <p className="text-xs text-muted-foreground">Or enter a 6-digit pincode</p>
          <div className="flex gap-2">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="e.g. 110001"
              inputMode="numeric"
              className="h-9"
            />
            <Button type="submit" className="h-9" disabled={pin.length !== 6}>
              Set
            </Button>
          </div>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
