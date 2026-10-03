import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DeliveryLocation, useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import { cn } from "@/lib/utils";

interface PostalRecord {
  pincode: string;
  office_name: string;
  district: string;
  state: string;
}

const POSTAL_SEARCH_URL = "https://api.pincodeapi.in/api/v1/search";
const POSTAL_PIN_URL = "https://api.pincodeapi.in/api/v1/pincode";
const PIN_QUERY = /^\d{0,6}$/;
const VALID_PIN = /^[1-9]\d{5}$/;

function IndiaFlag() {
  return <span aria-hidden="true" className="text-lg leading-none">🇮🇳</span>;
}

function normalizeRecords(payload: unknown, query: string): PostalRecord[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: { post_offices?: unknown[] } }).data;
  if (!Array.isArray(data?.post_offices)) return [];
  const seen = new Set<string>();
  return data.post_offices.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const pincode = String(row.pincode ?? "");
    const office = String(row.office_name ?? "").trim();
    const district = String(row.district ?? "").trim();
    const state = String(row.state ?? "").trim();
    if (!VALID_PIN.test(pincode) || !pincode.startsWith(query) || !district || !state) return [];
    const key = `${pincode}:${office}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ pincode, office_name: office || district, district, state }];
  }).slice(0, 8);
}

function toDeliveryLocation(record: PostalRecord): DeliveryLocation {
  return {
    countryCode: "IN",
    countryName: "India",
    pincode: record.pincode,
    locality: record.office_name,
    city: record.district,
    state: record.state,
    displayLabel: [record.office_name, record.district, record.state, record.pincode].filter(Boolean).join(", "),
  };
}

function HighlightedPin({ pincode, query }: { pincode: string; query: string }) {
  const matchLength = pincode.startsWith(query) ? query.length : 0;
  return <><strong>{pincode.slice(0, matchLength)}</strong>{pincode.slice(matchLength)}</>;
}

function LocationForm({ mobile, onConfirmed }: { mobile: boolean; onConfirmed: () => void }) {
  const { location, saveLocation } = useDeliveryLocation();
  const [query, setQuery] = useState(location?.pincode ?? "");
  const [results, setResults] = useState<PostalRecord[]>([]);
  const [selected, setSelected] = useState<PostalRecord | null>(location ? {
    pincode: location.pincode,
    office_name: location.locality,
    district: location.city,
    state: location.state,
  } : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestNumber = useRef(0);

  useEffect(() => {
    if (query.length < 3 || selected?.pincode === query) {
      setResults([]);
      setError("");
      return;
    }
    const currentRequest = ++requestNumber.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const exact = VALID_PIN.test(query);
        const url = exact ? `${POSTAL_PIN_URL}/${encodeURIComponent(query)}` : `${POSTAL_SEARCH_URL}?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("lookup failed");
        const found = normalizeRecords(await response.json(), query);
        if (currentRequest !== requestNumber.current) return;
        setResults(found);
        setActiveIndex(found.length ? 0 : -1);
        if (!found.length) setError("No location found for this pincode.");
      } catch (lookupError) {
        if (controller.signal.aborted || currentRequest !== requestNumber.current) return;
        setResults([]);
        setError("Unable to fetch location. Please try again.");
      } finally {
        if (currentRequest === requestNumber.current) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected?.pincode]);

  const choose = (record: PostalRecord) => {
    setSelected(record);
    setQuery(record.pincode);
    setResults([]);
    setError("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  };

  const confirm = () => {
    if (!selected || selected.pincode !== query || !VALID_PIN.test(query)) return;
    saveLocation(toDeliveryLocation(selected));
    onConfirmed();
  };

  return (
    <div className={cn("flex min-h-0 flex-col", mobile && "h-[min(70dvh,620px)]")}>
      {!mobile && (
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-accent" />Let's Personalize Your Experience!</DialogTitle>
          <DialogDescription>Find the perfect products for you and your loved ones.</DialogDescription>
        </DialogHeader>
      )}
      <div className={cn("min-h-0 flex-1", mobile ? "overflow-y-auto px-4 pb-4" : "mt-1")}>
        <div className="flex h-12 items-center justify-between rounded-md border border-input bg-card px-3 font-semibold">
          <span className="flex items-center gap-2"><IndiaFlag />India</span>
          <ChevronDown className="h-5 w-5" />
        </div>
        <div className="relative mt-3">
          <Input
            value={query}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 6);
              if (!PIN_QUERY.test(value)) return;
              setQuery(value);
              setSelected(null);
              setError("");
            }}
            onKeyDown={onKeyDown}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder="Enter pincode"
            aria-label="Pincode"
            aria-autocomplete="list"
            aria-controls="pincode-suggestions"
            className="h-12 bg-card text-base"
          />
          {loading && <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-muted-foreground" aria-label="Searching locations" />}
        </div>
        {(results.length > 0 || error) && (
          <div id="pincode-suggestions" role="listbox" className="max-h-64 overflow-y-auto border-x border-b border-border bg-card shadow-sm">
            {results.map((record, index) => (
              <Button
                key={`${record.pincode}-${record.office_name}`}
                type="button"
                variant="ghost"
                role="option"
                aria-selected={activeIndex === index}
                className={cn("h-auto w-full justify-start rounded-none border-b border-border px-3 py-3 text-left font-normal last:border-b-0", activeIndex === index && "bg-secondary")}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(record)}
              >
                <MapPin className="mr-3 h-5 w-5 shrink-0 text-accent" />
                <span className="min-w-0 whitespace-normal text-sm"><HighlightedPin pincode={record.pincode} query={query} />, {record.office_name}, {record.district}, {record.state}</span>
              </Button>
            ))}
            {error && <p className="px-3 py-4 text-sm text-destructive" role="status">{error}</p>}
          </div>
        )}
        {query.length > 0 && query.length < 3 && <p className="mt-2 text-xs text-muted-foreground">Enter at least 3 digits to search.</p>}
        {query.length >= 3 && query.length < 6 && !loading && !results.length && !error && <p className="mt-2 text-xs text-muted-foreground">Continue typing or choose a matching location.</p>}
        {selected && selected.pincode === query && (
          <div className="mt-3 flex gap-2 rounded-md bg-success/10 p-3 text-sm text-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>{selected.pincode}, {selected.office_name}, {selected.district}, {selected.state}</span>
          </div>
        )}
      </div>
      <div className={cn("border-t border-border bg-card", mobile ? "p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" : "mt-4 pt-4")}>
        <Button type="button" className="h-12 w-full" disabled={!selected || selected.pincode !== query || loading} onClick={confirm}>Confirm</Button>
      </div>
    </div>
  );
}

export function LocationPicker({ className }: { className?: string }) {
  const { location, isHydrated } = useDeliveryLocation();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (isHydrated && isMobile && !location) setOpen(true);
  }, [isHydrated, isMobile, location]);

  const trigger = useMemo(() => isMobile ? (
    <Button type="button" variant="ghost" onClick={() => setOpen(true)} className={cn("h-11 w-full justify-between rounded-none px-3 text-left", className)}>
      <span className="flex min-w-0 items-center gap-2">
        <IndiaFlag />
        <span className="truncate text-sm font-medium">{location ? `Deliver to ${location.pincode}, ${location.city}, ${location.state}` : "Enter location to check availability"}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-accent" />
    </Button>
  ) : (
    <Button type="button" variant="ghost" onClick={() => setOpen(true)} className={cn("h-14 max-w-[190px] justify-start gap-2 px-2 text-left", className)}>
      <IndiaFlag />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-xs font-semibold">{location ? `Deliver to ${location.city}` : "Where to deliver?"}</span>
        <span className={cn("mt-0.5 block truncate text-[11px]", location ? "text-muted-foreground" : "text-accent")}>{location ? `${location.locality}, ${location.pincode}` : "Location missing"}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-accent" />
    </Button>
  ), [className, isMobile, location]);

  return (
    <>
      {trigger}
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl border-border bg-card p-0">
            <SheetHeader className="border-b border-border px-4 py-4 text-left">
              <SheetTitle className="text-xl">Delivery Location</SheetTitle>
            </SheetHeader>
            <LocationForm mobile onConfirmed={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-[480px] gap-0 overflow-hidden rounded-xl bg-card p-5 shadow-xl">
            <LocationForm mobile={false} onConfirmed={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}