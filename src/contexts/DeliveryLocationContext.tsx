import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export const DELIVERY_LOCATION_STORAGE_KEY = "prasadam_delivery_location";

export interface DeliveryLocation {
  countryCode: "IN";
  countryName: "India";
  pincode: string;
  locality: string;
  city: string;
  state: string;
  displayLabel: string;
}

interface DeliveryLocationContextValue {
  location: DeliveryLocation | null;
  isHydrated: boolean;
  saveLocation: (location: DeliveryLocation) => void;
  clearLocation: () => void;
}

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null);

function readStoredLocation(): DeliveryLocation | null {
  try {
    const raw = localStorage.getItem(DELIVERY_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeliveryLocation>;
    if (!/^[1-9]\d{5}$/.test(parsed.pincode ?? "")) return null;
    if (!parsed.city || !parsed.state) return null;
    return {
      countryCode: "IN",
      countryName: "India",
      pincode: parsed.pincode ?? "",
      locality: parsed.locality ?? parsed.city,
      city: parsed.city,
      state: parsed.state,
      displayLabel: parsed.displayLabel ?? [parsed.locality, parsed.city, parsed.state, parsed.pincode].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  }
}

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setLocation(readStoredLocation());
    setIsHydrated(true);
  }, []);

  const value = useMemo<DeliveryLocationContextValue>(() => ({
    location,
    isHydrated,
    saveLocation: (nextLocation) => {
      localStorage.setItem(DELIVERY_LOCATION_STORAGE_KEY, JSON.stringify(nextLocation));
      setLocation(nextLocation);
      window.dispatchEvent(new CustomEvent("prasadam:delivery-location", { detail: nextLocation }));
    },
    clearLocation: () => {
      localStorage.removeItem(DELIVERY_LOCATION_STORAGE_KEY);
      setLocation(null);
    },
  }), [isHydrated, location]);

  return <DeliveryLocationContext.Provider value={value}>{children}</DeliveryLocationContext.Provider>;
}

export function useDeliveryLocation() {
  const context = useContext(DeliveryLocationContext);
  if (!context) throw new Error("useDeliveryLocation must be used within DeliveryLocationProvider");
  return context;
}