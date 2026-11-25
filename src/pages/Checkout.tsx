import { BulkOrderHero } from "@/components/rfq/BulkOrderHero";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Truck, FileText, AlertTriangle, CheckCircle, Loader2, WalletCards, Landmark, HandCoins, ShieldCheck, ShoppingCart, MapPin, Check, Plus, Minus, X, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { CouponInput } from "@/components/checkout/CouponInput";
import { getSavedAddresses, type AccountAddress } from "@/lib/accountAddresses";
import { RFQBenefits } from "@/components/rfq/RFQBenefits";
import { OrderSuccessFlow, type OrderFlowStage } from "@/components/checkout/OrderSuccessFlow";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/integrations/supabase/types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      let done = false;
      const finish = (ok: boolean) => { if (!done) { done = true; resolve(ok); } };
      existing.addEventListener("load", () => finish(!!window.Razorpay));
      existing.addEventListener("error", () => finish(false));
      // Poll in case script already loaded before we attached listeners
      let tries = 0;
      const iv = setInterval(() => {
        if (window.Razorpay) { clearInterval(iv); finish(true); }
        else if (++tries > 40) { clearInterval(iv); finish(false); }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role } = useAuth();
  const { items, buyerType, getItemPrice, subtotal, tax, allMoqValid, clearCart, updateQuantity, removeFromCart, getItemMoq } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [flowStage, setFlowStage] = useState<OrderFlowStage>("idle");
  const [placedTotal, setPlacedTotal] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [shippingConfig, setShippingConfig] = useState({
    enabled: true,
    freeThreshold: 500,
    rate: 25
  });
  const [billingPhoneValue, setBillingPhoneValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [updatingCart, setUpdatingCart] = useState(false);
  const savedAddresses = getSavedAddresses(user);

  function fillAddress(address: AccountAddress) {
    const fields = billingSameAsShipping
      ? { billingFullName: address.name, billingAddress: [address.street, address.landmark].filter(Boolean).join(", "),
          billingCity: address.city, billingState: address.state, billingPostalCode: address.postalCode, billingCountry: "India" }
      : { fullName: address.name, phone: address.phone, address: [address.street, address.landmark].filter(Boolean).join(", "),
          city: address.city, state: address.state, postalCode: address.postalCode, country: "India" };

    for (const [name, value] of Object.entries(fields)) {
      const input = formRef.current?.elements.namedItem(name);
      if (input instanceof HTMLInputElement && typeof value === "string") input.value = value;
    }
    if (billingSameAsShipping) setBillingPhoneValue(address.phone);
    setSelectedAddress(address.id);
  }

  async function changeCart(operation: () => Promise<boolean>) {
    setUpdatingCart(true);
    try { await operation(); } finally { setUpdatingCart(false); }
  }


  // Keep the billing phone in sync once the profile finishes loading
  useEffect(() => {
    if (profile?.phone && !billingPhoneValue) setBillingPhoneValue(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);



  useEffect(() => {
    async function fetchShippingConfig() {
      try {
        const { data: shipData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "shipping_settings")
          .maybeSingle();

        if (shipData?.value) {
          const s = shipData.value as any;
          setShippingConfig({
            enabled: s.enableShipping ?? true,
            freeThreshold: Number(s.freeShippingThreshold || 500),
            rate: Number(s.defaultShippingRate || 25)
          });
        }
      } catch (e) {
        console.error("Error fetching shipping config:", e);
      }
    }
    fetchShippingConfig();
  }, []);

  const shipping = !shippingConfig.enabled ? 0 : (subtotal > shippingConfig.freeThreshold ? 0 : shippingConfig.rate);
  const exclusiveTax = items.reduce((sum, item) => {
    const gst = Number((item.product as any)?.gst_percentage ?? 0);
    const enabled = (item.product as any)?.gst_enabled !== false && gst > 0;
    if (!enabled || (item.product as any)?.gst_pricing_mode === "inclusive") return sum;
    return sum + getItemPrice(item) * item.quantity * (gst / 100);
  }, 0);
  const total = subtotal + exclusiveTax + shipping - couponDiscount;

  const handleCouponApply = (discount: number, coupon: any) => {
    setCouponDiscount(discount);
    setAppliedCoupon(coupon);
  };

  const startRazorpayCheckout = async (order: any, formData: FormData) => {
    const scriptOk = await loadRazorpayScript();
    if (!scriptOk || !window.Razorpay) {
      throw new Error("Failed to load payment gateway. Please check your connection.");
    }

    const { data: rzp, error: rzpErr } = await supabase.functions.invoke("create-razorpay-order", {
      body: { order_id: order.id },
    });
    if (rzpErr || !rzp?.success) {
      throw new Error(rzp?.error || rzpErr?.message || "Failed to initialize payment");
    }

    return new Promise<void>((resolve, reject) => {
      const rz = new window.Razorpay({
        key: rzp.key_id,
        amount: rzp.amount,
        currency: rzp.currency,
        order_id: rzp.razorpay_order_id,
        name: "Prasadam",
        description: `Order ${rzp.order_number}`,
        prefill: {
          name: (formData.get("fullName") as string) || profile?.full_name || "",
          email: user?.email || "",
          contact: (formData.get("phone") as string) || profile?.phone || "",
        },
        theme: { color: `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()})` },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled")),
        },
        handler: async (response: any) => {
          try {
            const { data: verify, error: verifyErr } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                order_id: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            if (verifyErr || !verify?.success) {
              return reject(new Error(verify?.error || "Payment verification failed"));
            }
            if (!verify.confirmed) {
              toast({ title: "Payment confirmation pending", description: "Your order is saved. Confirmation will appear in My Orders after Razorpay confirms payment." });
              navigate("/dashboard?tab=orders");
              return reject(new Error("Payment confirmation pending. Please check My Orders."));
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        },
      });
      rz.on("payment.failed", (resp: any) => {
        reject(new Error(resp?.error?.description || "Payment failed"));
      });
      rz.open();
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (updatingCart) {
      toast({ title: "Cart is updating", description: "Please wait and submit again." });
      return;
    }
    if (!user || !allMoqValid) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const flowStartedAt = Date.now();
    if (paymentMethod === "cod") setFlowStage("processing");

    try {
      // Billing fields (Primary)
      const billingFullName = (formData.get("billingFullName") as string)?.trim();
      const billingCompany = (formData.get("billingCompany") as string)?.trim();
      const billingPhone = (formData.get("billingPhone") as string)?.trim();
      const billingEmail = (formData.get("billingEmail") as string)?.trim();
      const billingAddress = (formData.get("billingAddress") as string)?.trim();
      const billingCity = (formData.get("billingCity") as string)?.trim();
      const billingState = (formData.get("billingState") as string)?.trim();
      const billingPostalCode = (formData.get("billingPostalCode") as string)?.trim();
      const billingCountry = (formData.get("billingCountry") as string)?.trim();
      const gstNumber = (formData.get("gstNumber") as string)?.trim();

      // Shipping fields - use billing data if same
      const shippingFullName = billingSameAsShipping ? billingFullName : (formData.get("fullName") as string)?.trim();
      const shippingCompany = billingSameAsShipping ? billingCompany : (formData.get("company") as string)?.trim();
      const shippingPhone = billingSameAsShipping ? billingPhone : (formData.get("phone") as string)?.trim();
      const shippingAddress = billingSameAsShipping ? billingAddress : (formData.get("address") as string)?.trim();
      const shippingCity = billingSameAsShipping ? billingCity : (formData.get("city") as string)?.trim();
      const shippingState = billingSameAsShipping ? billingState : (formData.get("state") as string)?.trim();
      const shippingPostalCode = billingSameAsShipping ? billingPostalCode : (formData.get("postalCode") as string)?.trim();
      const shippingCountry = billingSameAsShipping ? billingCountry : (formData.get("country") as string)?.trim();

      const shippingAddr = {
        full_name: shippingFullName,
        company: shippingCompany,
        address: shippingAddress,
        city: shippingCity,
        state: shippingState,
        postal_code: shippingPostalCode,
        country: shippingCountry,
        phone: shippingPhone,
      };

      const billingAddr = {
        full_name: billingFullName,
        email: billingEmail,
        phone: billingPhone,
        address: billingAddress,
        city: billingCity,
        state: billingState,
        postal_code: billingPostalCode,
        country: billingCountry,
        company_name: billingCompany,
        company: billingCompany,
        gst_number: gstNumber,
      };

      // Use server-side order creation for price integrity
      const { data: orderResult, error: orderError } = await supabase.functions.invoke("create-order", {
        body: {
          items: items.map((item) => ({
            product_id: item.product_id,
            variation_id: item.variation_id || null,
            quantity: item.quantity,
          })),
          buyer_type: "retail",
          shipping_address: shippingAddr,
          billing_address: billingAddr,
          notes: (formData.get("notes") as string) || null,
          coupon_id: appliedCoupon?.id || null,
          payment_method: paymentMethod,
        },
      });

      if (orderError) {
        let serverMessage = "";
        const errorContext = (orderError as any).context;
        if (errorContext && typeof errorContext.json === "function") {
          try {
            const serverError = await errorContext.json();
            serverMessage = serverError?.error || "";
          } catch {}
        }

        // Check for auth errors - prompt re-login
        const isAuthError =
          serverMessage.toLowerCase().includes("unauthorized") ||
          serverMessage.toLowerCase().includes("invalid authentication") ||
          orderError.message?.toLowerCase().includes("unauthorized") ||
          (errorContext?.status === 401);

        if (isAuthError) {
          console.error("Authentication error during checkout:", serverMessage || orderError.message);
          toast({
            title: "Session Issue",
            description: "There was a problem with your session. Please try logging in again if this persists.",
            variant: "destructive",
          });
          // Only sign out if it's clearly a fatal auth error
          if (serverMessage.toLowerCase().includes("invalid jwt") || serverMessage.toLowerCase().includes("expired")) {
            await supabase.auth.signOut();
            navigate("/login");
          }
          return;
        }

        throw new Error(serverMessage || orderError.message || "Failed to place order");
      }

      if (!orderResult?.success) {
        throw new Error(orderResult?.error || "Order creation failed");
      }

      const order = orderResult.order;

      if (paymentMethod === "razorpay") {
        try {
          await startRazorpayCheckout(order, formData);
        } catch (payErr) {
          const msg = payErr instanceof Error ? payErr.message : "Payment failed";
          toast({ title: "Payment not completed", description: msg, variant: "destructive" });
          setIsSubmitting(false);
          setFlowStage("idle");
          return;
        }
        setFlowStage("processing");
      }

      setPlacedTotal(total);
      setOrderNumber(order.order_number);
      // Keep the branded processing animation visible for a moment
      const minWait = Math.max(0, (paymentMethod === "cod" ? 2200 : 1400) - (Date.now() - flowStartedAt));
      await new Promise((r) => setTimeout(r, minWait));
      setFlowStage("success");
      setOrderPlaced(true);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      await clearCart();
      
      toast({
        title: paymentMethod === "razorpay" ? "Payment Successful!" : "Order Placed!",
        description: `Your order ${order.order_number} has been placed successfully.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place order. Please try again.";
      console.error("Error placing order:", error);
      setFlowStage("idle");
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pb-20">
          <BulkOrderHero variant="checkout" />
          <div className="container mx-auto px-4 pt-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Login</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to checkout.</p>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </div>
        </main>
        <RFQBenefits />
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <OrderSuccessFlow
          stage={flowStage}
          orderNumber={orderNumber}
          total={placedTotal}
          onStageChange={setFlowStage}
          onViewOrder={() => navigate(`/track-order/${encodeURIComponent(orderNumber)}`)}
          onContinue={() => navigate("/products")}
          onClose={() => setFlowStage("idle")}
        />
        <Header />
        <main className="pb-20">
          <BulkOrderHero variant="checkout" />
          <div className="container mx-auto px-4 pt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                Order Placed Successfully!
              </h1>
              <p className="text-muted-foreground mb-2">
                Thank you for your order.
              </p>
              <p className="text-lg font-semibold text-foreground mb-8">
                Order Number: <span className="text-accent">{orderNumber}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate("/products")} variant="outline">
                  Continue Shopping
                </Button>
                <Button onClick={() => navigate(`/track-order/${encodeURIComponent(orderNumber)}`)} className="bg-gradient-accent">
                  Track Order
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <RFQBenefits />
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pb-20">
          <BulkOrderHero variant="checkout" />
          <div className="container mx-auto px-4 pt-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-6">Add some products to checkout.</p>
            <Button onClick={() => navigate("/products")}>Browse Products</Button>
          </div>
        </main>
        <RFQBenefits />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <OrderSuccessFlow
        stage={flowStage}
        orderNumber={orderNumber}
        total={total}
        onStageChange={setFlowStage}
        onViewOrder={() => {}}
        onContinue={() => {}}
        onClose={() => {}}
      />
      <SEOHead title="Checkout" description="Complete your order on Prasadam. Secure checkout with multiple payment options." noIndex />
      <Header />
      
      <main className="bg-[#fcf7f0] pb-16">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:py-7">
          <h1 className="mb-4 text-center font-serif text-2xl font-bold text-[#800b12]">Secure Checkout</h1>
          <ol aria-label="Checkout progress" className="flex items-center justify-between gap-2">
            {[[ShoppingCart, "Cart"], [MapPin, "Address"], [CreditCard, "Payment"], [Check, "Order Placed"]].map(([StepIcon, label], index) => {
              const Icon = StepIcon as typeof ShoppingCart;
              return <li key={String(label)} aria-current={index === 1 ? "step" : undefined} className="flex flex-1 flex-col items-center gap-1 text-center text-xs font-semibold sm:text-sm">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full border bg-white", index <= 1 && "border-[#850d12] bg-[#850d12] text-white")}><Icon size={17} /></span>
                {String(label)}
              </li>;
            })}
          </ol>
        </div>
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 overflow-x-hidden">
          {!allMoqValid && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive mb-6">
              <AlertTriangle className="h-5 w-5" />
              <span>Some items don't meet minimum order quantity. Please update your cart.</span>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="max-w-full overflow-x-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(400px,0.82fr)] gap-4 md:gap-6 items-start min-w-0">
              {/* Shipping & Billing */}
              <div className="min-w-0 space-y-4">
                {savedAddresses.length > 0 && <section className="rounded-lg border border-[#eee4dd] bg-white p-4 sm:p-5">
                  <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#800b12]"><MapPin size={20} />Delivery Address</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose a saved address or enter your details below.</p>
                  <div className="mt-3 space-y-2">{[...savedAddresses].sort((left, right) => Number(right.isDefault) - Number(left.isDefault)).map(address =>
                    <button type="button" key={address.id} aria-pressed={selectedAddress === address.id} onClick={() => fillAddress(address)}
                      className="block w-full rounded-lg border p-3 text-left text-sm hover:border-[#850d12] aria-pressed:border-[#850d12] aria-pressed:bg-[#fcf0ee]">
                      <span className="font-semibold">{address.name}</span><span className="ml-2 rounded bg-[#f9ead9] px-2 py-1 text-xs">{address.type}</span>
                      <span className="mt-1 block">{address.street}, {address.city} {address.postalCode}</span><span className="block text-muted-foreground">{address.phone}</span>
                    </button>)}</div>
                </section>}
                {/* Billing Address (Primary) */}
                <Card className="overflow-hidden max-w-full">
                  <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <FileText className="h-5 w-5" />
                      Billing & Delivery Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                      <div className="space-y-2">
                        <Label htmlFor="billingFullName">Full Name *</Label>
                        <Input
                          id="billingFullName"
                          name="billingFullName"
                          defaultValue={profile?.full_name || ""}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingPhone">Phone *</Label>
                        <Input
                          id="billingPhone"
                          name="billingPhone"
                          type="tel"
                          inputMode="tel"
                          pattern="[0-9+\-\s()]{7,15}"
                          title="Enter a valid phone number"
                          value={billingPhoneValue}
                          onChange={(e) => setBillingPhoneValue(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billingEmail">Email *</Label>
                      <Input 
                        id="billingEmail" 
                        name="billingEmail" 
                        type="email" 
                        defaultValue={user?.email || ""} 
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Address *</Label>
                      <Input id="billingAddress" name="billingAddress" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">City *</Label>
                        <Input id="billingCity" name="billingCity" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingState">State *</Label>
                        <Input id="billingState" name="billingState" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingPostalCode">Postal Code *</Label>
                        <Input id="billingPostalCode" name="billingPostalCode" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                      <div className="space-y-2">
                        <Label htmlFor="billingCountry">Country *</Label>
                        <Input id="billingCountry" name="billingCountry" defaultValue="India" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingCompany">Company Name (Optional)</Label>
                        <Input
                          id="billingCompany"
                          name="billingCompany"
                          defaultValue={profile?.company_name || ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                      <Input
                        id="gstNumber"
                        name="gstNumber"
                        placeholder="For GST invoice"
                        defaultValue={profile?.gst_number || ""}
                      />
                      <p className="text-xs text-muted-foreground">Enter GST number for a GST-compliant invoice</p>
                    </div>


                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="shipToDifferent"
                        checked={!billingSameAsShipping}
                        onCheckedChange={(checked) => { setBillingSameAsShipping(checked !== true); setSelectedAddress(""); }}
                      />
                      <Label htmlFor="shipToDifferent" className="text-sm font-medium cursor-pointer">
                        Ship to a different address?
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address (Optional if different) */}
                {!billingSameAsShipping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="overflow-hidden max-w-full">
                      <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Truck className="h-5 w-5" />
                          Shipping Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 px-4 sm:px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input id="fullName" name="fullName" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input id="phone" name="phone" type="tel" inputMode="tel" required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address *</Label>
                          <Input id="address" name="address" required />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
                          <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Input id="city" name="city" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State *</Label>
                            <Input id="state" name="state" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postalCode">Postal Code *</Label>
                            <Input id="postalCode" name="postalCode" required />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                          <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Input id="country" name="country" defaultValue="India" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company Name (Optional)</Label>
                            <Input id="company" name="company" />
                          </div>
                        </div>
                      </CardContent>

                    </Card>
                  </motion.div>
                )}

                <Card className="overflow-hidden max-w-full">
                  <CardContent className="pt-6 px-4 sm:px-6">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Delivery Instructions (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Leave at the gate, call before delivery, etc."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-[#eee4dd]">
                  <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-xl text-[#800b12]"><Package size={20} />Review Your Items</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                        {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="h-14 w-14 rounded-md object-cover" loading="lazy" />}
                        <div className="min-w-0 flex-1"><Link className="line-clamp-2 text-sm font-semibold hover:underline" to={`/product/${item.product_id}`}>{item.product?.name || "Product"}</Link>
                          <span className="text-sm text-muted-foreground">₹{getItemPrice(item).toLocaleString("en-IN")} each</span></div>
                        <div className="flex items-center rounded-md border">
                          <Button variant="ghost" size="icon" type="button" className="h-8 w-8" aria-label="Decrease quantity" disabled={updatingCart || isSubmitting || item.quantity <= Math.max(1, getItemMoq(item))} onClick={() => changeCart(() => updateQuantity(item.id, item.quantity - 1))}><Minus size={15} /></Button>
                          <span className="px-1 text-sm tabular-nums">{item.quantity}</span>
                          <Button variant="ghost" size="icon" type="button" className="h-8 w-8" aria-label="Increase quantity" disabled={updatingCart || isSubmitting} onClick={() => changeCart(() => updateQuantity(item.id, item.quantity + 1))}><Plus size={15} /></Button>
                        </div>
                        <span className="text-sm font-semibold">₹{(getItemPrice(item) * item.quantity).toLocaleString("en-IN")}</span>
                        <Button variant="ghost" size="icon" type="button" className="h-8 w-8" aria-label={`Remove ${item.product?.name || "item"}`} disabled={updatingCart || isSubmitting} onClick={() => changeCart(() => removeFromCart(item.id))}><X size={16} /></Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="min-w-0">
                <Card className="md:sticky md:top-6 overflow-hidden max-w-full">
                  <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <CreditCard className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 sm:px-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? "item" : "items"})</span>
                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          GST{(() => {
                            const rates = Array.from(new Set(items.filter(i => (i.product as any)?.gst_enabled !== false && Number((i.product as any)?.gst_percentage ?? 0) > 0).map(i => Number((i.product as any)?.gst_percentage ?? 0))));
                            if (rates.length === 1) return ` (${rates[0]}%)`;
                            if (subtotal > 0) return ` (~${Math.round((tax / subtotal) * 100)}%)`;
                            return "";
                          })()}
                        </span>
                        <span>₹{tax.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Charges</span>
                        <span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>
                            Coupon Discount
                            {appliedCoupon?.code && (
                              <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide bg-success/10 text-success px-1.5 py-0.5 rounded">
                                {appliedCoupon.code}
                              </span>
                            )}
                          </span>
                          <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <div className="text-right">
                          {couponDiscount > 0 && (
                            <div className="text-xs font-normal text-muted-foreground line-through">
                              ₹{(total + couponDiscount).toLocaleString("en-IN")}
                            </div>
                          )}
                          <span className="text-accent">₹{total.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      {couponDiscount > 0 && (
                        <p className="text-[11px] text-success text-right font-medium">
                          🎉 You saved ₹{couponDiscount.toLocaleString("en-IN")} on this order
                        </p>
                      )}
                    </div>

                    {/* Coupon Code Input */}
                    <CouponInput subtotal={subtotal} onApply={handleCouponApply} />

                    {/* Payment Method */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-semibold">Payment Method</Label>
                      <div className="hkcp" role="radiogroup" aria-label="Payment method">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={paymentMethod === "razorpay"}
                          onClick={() => setPaymentMethod("razorpay")}
                          className={cn("hkcp-card hkcp-online", paymentMethod === "razorpay" && "is-checked")}
                        >
                          <span className="hkcp-radio" aria-hidden="true" />
                          <span className="hkcp-head">
                            <span className="hkcp-avatar hkcp-avatar--blue">
                              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3" fill="#2a7de1"/><path d="M3 9.5h18" stroke="#fff" strokeWidth="1.6"/><rect x="14" y="12" width="5" height="3.5" rx="1.2" fill="#fff"/></svg>
                            </span>
                            <span className="hkcp-titlewrap">
                              <span className="hkcp-title">Pay Online</span>
                              <span className="hkcp-sub">UPI, Cards &amp; NetBanking</span>
                            </span>
                            <span className="hkcp-powered">
                              <span>Powered by</span>
                              <img
                                src="https://ik.imagekit.io/Prasadam/razor%20pay%20icon/Razorpay_logo.svg"
                                alt="Razorpay"
                                className="hkcp-rzp-logo"
                                loading="lazy"
                              />
                            </span>
                          </span>
                          <span className="hkcp-body">
                            <span className="hkcp-chips">
                              <span className="hkcp-chip hkcp-chip--upi">
                                <svg viewBox="0 0 64 22" aria-label="UPI" focusable="false"><text x="0" y="18" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="20" fontStyle="italic" fill="#6b6b6b">UPI</text><path d="M49 2 56 11 49 20Z" fill="#f47f24" /><path d="M53 2 60 11 53 20Z" fill="#2f9e44" /></svg>
                              </span>
                              <span className="hkcp-chip">
                                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3" fill="#2a7de1"/><rect x="2" y="9" width="20" height="3" fill="#fff"/><rect x="5" y="14" width="6" height="2" rx="1" fill="#fff"/></svg>
                                <span><b>Cards</b><small>Credit / Debit</small></span>
                              </span>
                              <span className="hkcp-chip">
                                <svg viewBox="0 0 24 24" fill="#2a7de1" aria-hidden="true"><path d="M12 3 2.5 8v1.5h19V8L12 3ZM4.5 11h2v6h-2zM9 11h2v6H9zM13 11h2v6h-2zM17.5 11h2v6h-2z"/><rect x="2.5" y="18.5" width="19" height="2.5" rx="1"/></svg>
                                <span><b>Net Banking</b></span>
                              </span>
                            </span>
                            <span className="hkcp-trust">
                              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="#1f9d55"/><path d="m8.5 12 2.4 2.4L15.8 9.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span><b>100% Secure Payment</b><small>Your payments are safe with Razorpay</small></span>
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={paymentMethod === "cod"}
                          onClick={() => setPaymentMethod("cod")}
                          className={cn("hkcp-card", paymentMethod === "cod" && "is-checked")}
                        >
                          <span className="hkcp-radio" aria-hidden="true" />
                          <span className="hkcp-head">
                            <span className="hkcp-avatar hkcp-avatar--orange">
                              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="10" height="8" rx="1.5" fill="#c77a17"/><path d="M12 3v3h4V3" stroke="#fff" strokeWidth="1.4"/><path d="M3 15c2-2 4-2.5 6.5-1.5L13 15c1 .4 1 2-.5 2H9M3 19.5c3 .5 6 .5 9 0l7-3.5c1-.5.4-2-.8-1.6L13 16" stroke="#c77a17" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                            <span className="hkcp-titlewrap">
                              <span className="hkcp-title">Cash on Delivery</span>
                              <span className="hkcp-sub">Pay securely when your order is delivered at your doorstep.</span>
                            </span>
                            <span className="hkcp-available">
                              <svg viewBox="0 0 24 24" fill="none" stroke="#1f9d55" strokeWidth="1.8" aria-hidden="true"><path d="M2 6h11v9H2zM13 9h4.5L21 12.5V15h-8z" strokeLinejoin="round"/><circle cx="6" cy="17" r="2" fill="#fff"/><circle cx="17" cy="17" r="2" fill="#fff"/></svg>
                              <span>Available for your location</span>
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>



                    <button
                      type="submit"
                      disabled={isSubmitting || !allMoqValid}
                      className="osf-place-btn w-full h-14 rounded-md bg-accent text-accent-foreground font-bold tracking-wide inline-flex items-center justify-center gap-2 px-3 hover:opacity-90 transition-opacity disabled:opacity-60 mt-4"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
                      <span className="text-sm sm:text-base whitespace-nowrap">
                        {isSubmitting
                          ? paymentMethod === "razorpay"
                            ? "PROCESSING PAYMENT..."
                            : "PLACING ORDER..."
                          : paymentMethod === "razorpay"
                            ? `PAY ₹${total.toLocaleString("en-IN")}`
                            : "PLACE ORDER"}
                      </span>
                      <img
                        src="https://ik.imagekit.io/4hcna271xz/upi-icons.svg?updatedAt=1787541720375"
                        alt=""
                        aria-hidden="true"
                        className="h-12 w-12 object-contain flex-shrink-0"
                      />
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                      By placing an order, you agree to our Terms of Service.
                    </p>

                    <img
                      src="https://ik.imagekit.io/Prasadam/Status-scaled.jpg?updatedAt=1787405014112"
                      alt="Prasadam divine offerings"
                      loading="lazy"
                      decoding="async"
                      className="mt-4 w-full rounded-md object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>

      <RFQBenefits />
      <Footer />
    </div>
  );
}