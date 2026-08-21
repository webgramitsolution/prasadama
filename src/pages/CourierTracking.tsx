import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import {
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Calendar,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  ShieldCheck,
  Headphones,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";


interface TrackEvent {
  status: string;
  desc: string;
  ctime: number;
  location?: string;
  ndrStatus?: string;
}

interface TrackData {
  tracking_id: string;
  order_number: string | null;
  edd: number | null;
  current: {
    status: string | null;
    desc: string | null;
    location: string | null;
    ctime: number | null;
    pickupTime: number | null;
    ndrStatus: string | null;
    attempts: number | null;
  };
  history: TrackEvent[];
  public_url: string;
}

const statusTone = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver")) return "bg-success/10 text-success border-success/20";
  if (s.includes("out for")) return "bg-info/10 text-info border-info/20";
  if (s.includes("transit") || s.includes("shipped") || s.includes("dispatched"))
    return "bg-accent/10 text-accent border-accent/20";
  if (s.includes("pick")) return "bg-primary/10 text-primary border-primary/20";
  if (s.includes("cancel") || s.includes("rto") || s.includes("undelivered"))
    return "bg-destructive/10 text-destructive border-destructive/20";
  if (s.includes("ndr") || s.includes("hold"))
    return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
};

const fmtTime = (ts?: number | null) => {
  if (!ts) return "";
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDate = (ts?: number | null) => {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const AWB_REGEX = /^[A-Za-z0-9\-]{6,32}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CourierTracking() {
  const { orderNumber } = useParams();
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState("");
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<Tables<"orders"> | null>(null);
  const [orderItems, setOrderItems] = useState<Tables<"order_items">[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const loadOrder = async (reference: string) => {
    if (!user) {
      setError("Please log in to view order details.");
      return;
    }
    setOrderLoading(true);
    setError(null);
    setData(null);
    setCouponCode(null);
    const isId = UUID_REGEX.test(reference);
    const query = supabase.from("orders").select("*");
    const { data: found, error: orderError } = isId
      ? await query.eq("id", reference).maybeSingle()
      : await query.eq("order_number", reference.toUpperCase()).maybeSingle();
    if (orderError || !found) {
      setOrder(null);
      setOrderItems([]);
      setError("Order not found in your account. Check the order ID and try again.");
      setOrderLoading(false);
      return;
    }
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", found.id);
    setOrder(found);
    setOrderItems(items || []);
    setTrackingId(found.order_number || reference);
    if (found.coupon_id) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("code")
        .eq("id", found.coupon_id)
        .maybeSingle();
      setCouponCode((coupon as { code?: string } | null)?.code ?? null);
    }
    setOrderLoading(false);
  };

  const statusTimeline = order
    ? [
        {
          label: "Order placed",
          detail: new Date(order.created_at).toLocaleString("en-IN"),
          done: true,
        },
        {
          label: "Payment " + (order.payment_status || "pending"),
          detail: order.razorpay_payment_id ? `Payment ID ${order.razorpay_payment_id}` : undefined,
          done: (order.payment_status || "").toLowerCase() === "paid",
        },
        {
          label: "Shipment created",
          detail: order.ekart_last_error
            ? `Sync error: ${order.ekart_last_error}`
            : order.ekart_last_attempt_at
              ? new Date(order.ekart_last_attempt_at).toLocaleString("en-IN")
              : "Awaiting courier sync",
          done: (order.ekart_sync_status || "").toLowerCase() === "success" || !!order.tracking_number,
        },
        {
          label: "In transit",
          detail: order.tracking_number ? `AWB ${order.tracking_number}` : "Not dispatched yet",
          done: !!order.tracking_number && (order.status || "").toLowerCase() !== "pending",
        },
        {
          label: "Delivered",
          detail: undefined as string | undefined,
          done: (order.status || "").toLowerCase() === "delivered",
        },
      ]
    : [];

  useEffect(() => {
    if (orderNumber) loadOrder(decodeURIComponent(orderNumber));
  }, [orderNumber, user?.id]);


  const handleTrack = async (idOverride?: string) => {
    const raw = (idOverride ?? trackingId).trim();
    setError(null);

    if (!raw) {
      setError("Please enter an order number or tracking number to continue.");
      setData(null);
      return;
    }
    if (raw.toUpperCase().startsWith("ORD-") || UUID_REGEX.test(raw)) {
      await loadOrder(UUID_REGEX.test(raw) ? raw : raw.toUpperCase());
      return;
    }
    if (!AWB_REGEX.test(raw)) {
      setError(
        "Invalid tracking ID. Use 6–32 characters (letters, digits, or hyphens only)."
      );
      setData(null);
      return;
    }

    setLoading(true);
    setData(null);
    try {
      const { data: res, error: fnErr } = await supabase.functions.invoke(
        "ekart-track",
        { body: { tracking_id: raw } }
      );
      if (fnErr || !res || (res as any).error) {
        setError(
          (res as any)?.error === "Tracking details not found"
            ? "No tracking details found for this ID. Please check and try again."
            : "Unable to fetch tracking right now. Please try again in a moment."
        );
      } else {
        setData(res as TrackData);
        setLastUpdated(new Date());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.tracking_id);
      setCopied(true);
      toast({ title: "Copied", description: "Tracking ID copied to clipboard." });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleReset = () => {
    setData(null);
    setOrder(null);
    setOrderItems([]);
    setError(null);
    setLastUpdated(null);
  };

  const sortedHistory = data
    ? [...data.history].sort((a, b) => (a.ctime || 0) - (b.ctime || 0))
    : [];
  const latestIdx = sortedHistory.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Track Your Shipment | Courier Tracking"
        description="Track your Prasadam order and view courier shipment updates."
      />
      <Header />

      <main className="pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-b border-border">
          <div className="container mx-auto px-4 pl-[20px] py-10 sm:py-14">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex md:hidden justify-center items-center order-first">
                <motion.img
                  src="/products-hero-banner.jpg"
                  alt="Courier delivery tracking illustration"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full max-w-xs h-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                  Track Your Shipment
                </h1>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Enter your order number or tracking number to get real-time updates.
                </p>

                <div className="bg-card rounded-2xl border border-border shadow-sm p-2 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 pl-3">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Order Number or Tracking Number"
                      value={trackingId}
                      onChange={(e) => {
                        setTrackingId(e.target.value);
                        if (error) setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                      className="border-0 shadow-none focus-visible:ring-0 h-11 px-0"
                      aria-invalid={!!error}
                    />
                  </div>
                  <Button
                    onClick={() => handleTrack()}
                    disabled={loading}
                    className="h-11 px-5 bg-accent hover:bg-accent-hover"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Track Now </span>
                        <ArrowRight className="h-4 w-4 sm:ml-1" />
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-4">
                  <span className="text-accent font-medium">Supports:</span>{" "}
                  Ekart & partner couriers
                </p>
              </div>

              <div className="hidden md:flex justify-center items-center">
                <motion.img
                  src="/products-hero-banner.jpg"
                  alt="Courier delivery tracking illustration"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full max-w-md h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 space-y-6">
          {orderLoading && (
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Loading your order…</p>
            </div>
          )}

          {order && !orderLoading && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Order</p>
                    <h2 className="text-xl font-bold">{order.order_number}</h2>
                  </div>
                  <Badge className={cn("border", statusTone(order.status))}>{order.status || "pending"}</Badge>
                </div>
                <div className="divide-y divide-border">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4 py-3 first:pt-0">
                      <div><p className="font-medium">{item.product_name}</p>{item.variation_details && <p className="text-xs text-muted-foreground">{item.variation_details}</p>}</div>
                      <div className="text-right"><p className="font-semibold">₹{Number(item.total_price ?? item.total).toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">Qty {item.quantity}</p></div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{Number(order.subtotal || 0).toLocaleString("en-IN")}</span></div>
                  {Number(order.discount_amount || 0) > 0 && <div className="flex justify-between text-success"><span>Discount{couponCode ? ` (${couponCode})` : order.coupon_id ? " (coupon applied)" : ""}</span><span>-₹{Number(order.discount_amount).toLocaleString("en-IN")}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{Number(order.tax || 0).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>₹{Number(order.shipping || 0).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span>₹{Number(order.total || order.total_amount).toLocaleString("en-IN")}</span></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-semibold mb-3">Status history</h3>
                  <ol className="space-y-3">
                    {statusTimeline.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", step.done ? "bg-primary" : "bg-muted-foreground/30")} />
                        <div>
                          <p className={cn("text-sm font-medium", !step.done && "text-muted-foreground")}>{step.label}</p>
                          {step.detail && <p className="text-xs text-muted-foreground">{step.detail}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-semibold mb-3">Delivery</h3>
                  <p className="text-sm text-muted-foreground">Ekart sync</p>
                  <p className="font-medium capitalize">{order.ekart_sync_status || "pending"}</p>
                  {order.ekart_last_attempt_at && <p className="text-xs text-muted-foreground mt-1">Last attempt: {new Date(order.ekart_last_attempt_at).toLocaleString("en-IN")}</p>}
                  {order.tracking_number && <Button className="mt-4 w-full" onClick={() => handleTrack(order.tracking_number || "")}>Track courier</Button>}
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-semibold mb-3">Billing & shipping</h3>
                  {[order.billing_address, order.shipping_address].map((address, index) => {
                    const value = address as Record<string, unknown> | null;
                    if (!value) return null;
                    return <div key={index} className={cn("text-sm", index > 0 && "border-t border-border mt-3 pt-3")}><p className="text-xs font-medium text-muted-foreground mb-1">{index === 0 ? "Billing" : "Shipping"}</p><p>{[value["full_name"], value["address"], value["city"], value["state"], value["postal_code"], value["country"]].filter(Boolean).join(", ")}</p></div>;
                  })}
                </div>
                <Button asChild variant="outline" className="w-full"><Link to="/dashboard">View order history</Link></Button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">
                    Fetching latest tracking updates…
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {data && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {/* Summary */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-sm text-accent hover:underline mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Search
                  </button>

                  <p className="text-xs text-muted-foreground">Tracking ID</p>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xl font-bold text-foreground break-all">
                      {data.tracking_id}
                    </h2>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      aria-label="Copy tracking ID"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <Badge
                    className={cn(
                      "border rounded-full font-medium mb-4",
                      statusTone(data.current.status)
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />
                    {data.current.status || "In Progress"}
                  </Badge>

                  {data.current.desc && (
                    <p className="text-sm text-muted-foreground mb-5">
                      {data.current.desc}
                      {data.edd && (
                        <>
                          {" "}
                          Expected delivery by{" "}
                          <span className="text-accent font-medium">
                            {fmtDate(data.edd)}
                          </span>
                          .
                        </>
                      )}
                    </p>
                  )}

                  <div className="space-y-3">
                    {data.edd && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">
                            Estimated Delivery
                          </p>
                          <p className="text-sm font-semibold">{fmtDate(data.edd)}</p>
                        </div>
                      </div>
                    )}
                    {data.current.location && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">
                            Current Location
                          </p>
                          <p className="text-sm font-semibold">
                            {data.current.location}
                          </p>
                        </div>
                      </div>
                    )}
                    {data.current.ctime && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">
                            Last Scan
                          </p>
                          <p className="text-sm font-semibold">
                            {fmtTime(data.current.ctime)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {data.current.ndrStatus && (
                    <div className="mt-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
                      <p className="font-semibold text-warning">
                        NDR: {data.current.ndrStatus}
                      </p>
                      {data.current.attempts != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Delivery attempts: {data.current.attempts}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {lastUpdated
                        ? `Last updated: ${lastUpdated.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : ""}
                    </span>
                    <button
                      onClick={() => handleTrack(data.tracking_id)}
                      className="text-accent hover:underline font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-base font-bold text-foreground mb-5">
                    Tracking History
                  </h3>

                  {sortedHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {data.current.desc || "No scan updates yet."}
                    </p>
                  ) : (
                    <div className="relative pl-7">
                      <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
                      {sortedHistory
                        .slice()
                        .reverse()
                        .map((ev, idx) => {
                          const originalIdx = sortedHistory.length - 1 - idx;
                          const isLatest = originalIdx === latestIdx;
                          const isDone = originalIdx < latestIdx;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="relative pb-5 last:pb-0"
                            >
                              <div
                                className={cn(
                                  "absolute -left-7 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  isLatest
                                    ? "bg-accent/10 border-accent"
                                    : isDone
                                    ? "bg-success border-success"
                                    : "bg-card border-border"
                                )}
                              >
                                {isLatest ? (
                                  <span className="w-2 h-2 rounded-full bg-accent" />
                                ) : isDone ? (
                                  <CheckCircle className="h-3 w-3 text-white" />
                                ) : (
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  isLatest ? "text-accent" : "text-foreground"
                                )}
                              >
                                {ev.status}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {fmtTime(ev.ctime)}
                              </p>
                              {ev.desc && (
                                <p
                                  className={cn(
                                    "text-xs mt-1",
                                    isLatest
                                      ? "bg-accent/5 text-accent rounded-md px-2 py-1.5"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {ev.desc}
                                </p>
                              )}
                              {ev.location && (
                                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {ev.location}
                                </p>
                              )}
                            </motion.div>
                          );
                        })}
                    </div>
                  )}

                  <a
                    href={data.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-4 text-xs text-accent hover:underline"
                  >
                    View on courier site <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state hero card when nothing searched */}
          {!data && !order && !loading && !orderLoading && !error && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-1">
                  Need Assistance?
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  We're here to help with your shipments.
                </p>
                <div className="space-y-2 text-sm">
                  <a
                    href="tel:+919876543210"
                    className="flex items-center gap-2 text-foreground"
                  >
                    <Phone className="h-4 w-4 text-accent" /> +91 98765 43210
                  </a>
                  <a
                    href="mailto:sales@houskase.com"
                    className="flex items-center gap-2 text-foreground"
                  >
                    <Mail className="h-4 w-4 text-accent" /> sales@houskase.com
                  </a>
                </div>
              </div>

              <div className="bg-success/5 border border-success/10 rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-1">
                  Real-Time Updates
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get instant status of your shipment as it moves.
                </p>
                <div className="flex items-center gap-2 text-sm text-success">
                  <MessageCircle className="h-4 w-4" />
                  <span>Live scan history</span>
                </div>
              </div>

              <div className="bg-warning/5 border border-warning/10 rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-2">FAQ</h3>
                <Accordion type="single" collapsible className="text-sm">
                  <AccordionItem value="q1" className="border-b-warning/20">
                    <AccordionTrigger className="py-2 text-left">
                      How long does delivery take?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Standard shipments typically deliver in 3–7 business days
                      depending on your pincode.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q2" className="border-b-warning/20">
                    <AccordionTrigger className="py-2 text-left">
                      Why is my tracking not updating?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Scan updates can take a few hours after pickup. Please
                      check again shortly.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q3" className="border-0">
                    <AccordionTrigger className="py-2 text-left">
                      What if delivery attempt fails?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      The courier will re-attempt automatically. You can also
                      contact us for a re-schedule.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          {/* Trust strip */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/30 rounded-2xl p-4 border border-border">
            {[
              { icon: Globe, title: "Pan India", sub: "Wide coverage" },
              { icon: ShieldCheck, title: "Secure", sub: "Your data is safe" },
              { icon: Search, title: "Real-Time", sub: "Live updates" },
              { icon: Headphones, title: "24/7 Support", sub: "We're here to help" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
