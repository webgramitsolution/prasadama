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
  Search,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  ShieldCheck,
  Headphones,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";


const AWB_REGEX = /^[A-Za-z0-9\-]{6,32}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CourierTracking() {
  const { orderNumber } = useParams();
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    setCouponCode(null);
    const isId = UUID_REGEX.test(reference);
    const query = supabase.from("orders").select("*").eq("user_id", user.id);
    const { data: found, error: orderError } = isId
      ? await query.eq("id", reference).maybeSingle()
      : await query.or(`order_number.eq.${reference.toUpperCase()},tracking_number.eq.${reference}`).maybeSingle();
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
          detail: order.tracking_number ? `AWB ${order.tracking_number}` : "Awaiting dispatch",
          done: !!order.tracking_number,
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
    if (orderNumber && (UUID_REGEX.test(orderNumber) || AWB_REGEX.test(orderNumber))) void loadOrder(orderNumber);
  }, [orderNumber, user?.id]);


  const handleTrack = async (idOverride?: string) => {
    const raw = (idOverride ?? trackingId).trim();
    if (!UUID_REGEX.test(raw) && !AWB_REGEX.test(raw)) {
      setOrder(null);
      setError("Enter a valid order number or tracking number.");
      return;
    }
    await loadOrder(raw);
  };

  const handleReset = () => {
    setOrder(null);
    setOrderItems([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Track Your Shipment | Courier Tracking"
        description="View your Prasadam order status and saved tracking number."
      />
      <Header />

      <main className="pb-0 bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-b border-border">
          <div className="w-full px-[40px] py-10 sm:py-14">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex md:hidden justify-center items-center order-first">
                <motion.img
                  src="https://ik.imagekit.io/4hcna271xz/shipping_van.png"
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
                  Enter your order number or tracking number to view the latest saved order status.
                </p>

                <div className="bg-card rounded-2xl border border-border shadow-sm p-2 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Input
                      placeholder="Order Number or Tracking Number"
                      value={trackingId}
                      onChange={(e) => {
                        setTrackingId(e.target.value);
                        if (error) setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                      className="border-0 shadow-none focus-visible:ring-0 h-11 px-3 sm:px-4"
                      aria-invalid={!!error}
                    />
                  </div>
                  <Button
                    onClick={() => handleTrack()}
                    disabled={orderLoading}
                    className="h-11 px-5 bg-accent hover:bg-accent-hover"
                  >
                    {orderLoading ? (
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
                  Order status and saved tracking numbers
                </p>
              </div>

              <div className="hidden md:flex justify-center items-center">
                <motion.img
                  src="https://ik.imagekit.io/4hcna271xz/shipping_van.png"
                  alt="Courier delivery tracking illustration"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full max-w-md h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="w-full px-[40px] pt-8 pb-[25px] space-y-6 bg-white">
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
                  <Badge className={cn("border", "bg-primary/10 text-primary")}>{order.status || "pending"}</Badge>
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
                  <p className="text-sm text-muted-foreground">Tracking number</p>
                  <p className="font-medium">{order.tracking_number || "Awaiting dispatch"}</p>
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
            {orderLoading && (
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


          {/* Empty state hero card when nothing searched */}
          {!order && !orderLoading && !error && (
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
                    href="tel:+917551120242"
                    className="flex items-center gap-2 text-foreground"
                  >
                    <Phone className="h-4 w-4 text-accent" /> +91 75511 20242
                  </a>
                  <a
                    href="mailto:info@webgramitsolution"
                    className="flex items-center gap-2 text-foreground"
                  >
                    <Mail className="h-4 w-4 text-accent" /> info@webgramitsolution
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
