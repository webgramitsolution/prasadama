import { useState, useEffect } from "react";
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
import { CreditCard, Truck, FileText, AlertTriangle, CheckCircle, Loader2, WalletCards, Landmark, HandCoins, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { CouponInput } from "@/components/checkout/CouponInput";
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
  const { items, buyerType, getItemPrice, subtotal, tax, allMoqValid, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [shippingConfig, setShippingConfig] = useState({
    enabled: true,
    freeThreshold: 500,
    rate: 25
  });
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [billingPhoneValue, setBillingPhoneValue] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Keep the billing phone in sync once the profile finishes loading
  useEffect(() => {
    if (profile?.phone && !billingPhoneValue) setBillingPhoneValue(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);


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
        theme: { color: "#AD1E2A" },
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

  const OTP_TTL_MS = 5 * 60 * 1000;
  const RESEND_COOLDOWN = 30;

  const handleSendOtp = async (phone: string) => {
    const cleaned = (phone || "").replace(/[^\d]/g, "");
    if (cleaned.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid 10-digit mobile number before requesting an OTP.",
        variant: "destructive",
      });
      return;
    }
    if (resendIn > 0) return;

    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("checkout-otp", {
        body: { action: "send", phone: cleaned },
      });

      if (error) throw new Error(error.message || "Verification service unreachable");
      if (data && (data as any).error) throw new Error((data as any).error);

      const expiresAt = (data as any)?.expires_at
        ? new Date((data as any).expires_at).getTime()
        : Date.now() + OTP_TTL_MS;
      setOtpExpiresAt(expiresAt);
      setOtpValue("");
      setShowOtpField(true);
      setResendIn(RESEND_COOLDOWN);
      toast({
        title: "OTP sent",
        description: `A 6-digit code was sent to ${cleaned}. It expires in 5 minutes.`,
      });
    } catch (err: any) {
      console.error("Failed to send OTP:", err);
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      toast({
        title: "Could not send OTP",
        description: offline
          ? "You appear to be offline. Check your connection and try again."
          : err?.message
            ? `${err.message}`
            : "SMS could not be sent. Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    try {
      const cleaned = (billingPhoneValue || "").replace(/[^\d]/g, "");
      const { data, error } = await supabase.functions.invoke("checkout-otp", {
        body: { action: "verify", phone: cleaned, otp: otpValue.trim() },
      });

      if (error) throw new Error(error.message || "Verification failed");
      if (data && (data as any).error) throw new Error((data as any).error);

      if ((data as any)?.verified) {
        setIsOtpVerified(true);
        setShowOtpField(false);
        setOtpExpiresAt(null);
        toast({ title: "Verified", description: "Phone number verified successfully." });
      } else {
        throw new Error("The code you entered is incorrect.");
      }
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err?.message || "Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !allMoqValid) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

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
          return;
        }
      }

      setOrderNumber(order.order_number);
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
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Login</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to checkout.</p>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4">
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
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-6">Add some products to checkout.</p>
            <Button onClick={() => navigate("/products")}>Browse Products</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead title="Checkout" description="Complete your order on Prasadam. Secure checkout with multiple payment options." noIndex />
      <Header />
      
      <main className="pb-20 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 pt-4"
          >
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              Checkout
            </h1>
            <p className="text-muted-foreground">
              Complete your order
            </p>
          </motion.div>

          {!allMoqValid && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive mb-6">
              <AlertTriangle className="h-5 w-5" />
              <span>Some items don't meet minimum order quantity. Please update your cart.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-full overflow-x-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-4 md:gap-6 items-start min-w-0">
              {/* Shipping & Billing */}
              <div className="space-y-4 sm:space-y-6 min-w-0">
                {/* Billing Address (Primary) */}
                <Card className="overflow-hidden max-w-full">
                  <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <FileText className="h-5 w-5" />
                      Billing Details
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
                        {isOtpVerified ? (
                          <div className="relative">
                            <Input
                              id="billingPhone"
                              name="billingPhone"
                              type="tel"
                              inputMode="tel"
                              pattern="[0-9+\-\s()]{7,15}"
                              title="Enter a valid phone number"
                              value={billingPhoneValue}
                              readOnly
                              required
                              className="pr-24"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs font-medium text-success">
                              <CheckCircle className="h-3.5 w-3.5" /> Verified
                            </span>
                          </div>
                        ) : showOtpField ? (
                          <div className="space-y-1.5">
                            <div className="flex gap-2">
                              <Input
                                id="billingOtp"
                                placeholder="Enter 6-digit OTP"
                                inputMode="numeric"
                                maxLength={6}
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={isVerifyingOtp || otpValue.length < 6}
                                className="shrink-0"
                              >
                                {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                              </Button>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Code sent to {billingPhoneValue}</span>
                              <button
                                type="button"
                                className="underline disabled:no-underline disabled:opacity-60"
                                disabled={resendIn > 0 || isSendingOtp}
                                onClick={() => handleSendOtp(billingPhoneValue)}
                              >
                                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                              </button>
                            </div>
                            <button
                              type="button"
                              className="text-[11px] underline text-muted-foreground"
                              onClick={() => {
                                setShowOtpField(false);
                                setOtpValue("");
                              }}
                            >
                              Change phone number
                            </button>
                            <input type="hidden" name="billingPhone" value={billingPhoneValue} />
                          </div>
                        ) : (
                          <div className="flex gap-2">
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
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleSendOtp(billingPhoneValue)}
                              disabled={isSendingOtp}
                              className="shrink-0"
                            >
                              {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                            </Button>
                          </div>
                        )}
                        {!isOtpVerified && !showOtpField && (
                          <p className="text-[10px] text-muted-foreground mt-1">Verify your mobile number to place the order.</p>
                        )}
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
                        onCheckedChange={(checked) => setBillingSameAsShipping(checked !== true)}
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
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Special delivery instructions, etc."
                        rows={3}
                      />
                    </div>
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
                    {/* Items */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 text-sm min-w-0">
                          <div className="flex-1 min-w-0">
                            <Link to={`/product/${item.product_id}`} className="font-medium truncate hover:text-accent transition-colors block">{item.product?.name}</Link>
                            <p className="text-muted-foreground">
                              {item.quantity} x ₹{getItemPrice(item).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <p className="font-semibold">
                            ₹{(getItemPrice(item) * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
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
                        <span className="text-muted-foreground">Shipping</span>
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
                      <div className="space-y-3">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPaymentMethod("razorpay")}
                          className={cn(
                            "payment-option payment-option-online relative h-auto min-h-[132px] w-full justify-start overflow-hidden rounded-[8px] px-4 py-4 text-left sm:min-h-[138px] sm:px-6",
                            paymentMethod === "razorpay"
                              ? "payment-option-selected"
                              : "payment-option-idle"
                          )}
                        >
                          <span className="payment-radio" aria-hidden="true"><span /></span>
                          <span className="flex min-w-0 flex-1 flex-col gap-4">
                            <span className="flex flex-wrap items-start justify-between gap-3">
                              <span className="flex items-center gap-3">
                                <span className="payment-main-icon"><WalletCards className="h-7 w-7" /></span>
                                <span>
                                  <span className="block text-lg font-extrabold text-foreground sm:text-xl">Pay Online</span>
                                  <span className="mt-0.5 block text-xs font-medium text-muted-foreground sm:text-sm">UPI, Cards &amp; NetBanking</span>
                                </span>
                              </span>
                              <span className="razorpay-mark"><span>Powered by</span><strong><i>1</i>Razorpay</strong></span>
                            </span>
                            <span className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="payment-mini-tile upi-mark">UPI<span className="upi-arrow" /></span>
                              <span className="payment-mini-tile"><CreditCard className="h-5 w-5" /><span><b>Cards</b><small>Credit / Debit</small></span></span>
                              <span className="payment-mini-tile"><Landmark className="h-5 w-5" /><span><b>Net Banking</b></span></span>
                              <span className="payment-secure"><ShieldCheck className="h-6 w-6" /><span><b>100% Secure Payment</b><small>Your payments are safe</small></span></span>
                            </span>
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPaymentMethod("cod")}
                          className={cn(
                            "payment-option h-auto min-h-[105px] w-full justify-start rounded-[8px] px-4 py-4 text-left sm:px-6",
                            paymentMethod === "cod"
                              ? "payment-option-selected"
                              : "payment-option-idle"
                          )}
                        >
                          <span className="payment-radio" aria-hidden="true"><span /></span>
                          <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="payment-main-icon payment-cod-icon"><HandCoins className="h-7 w-7" /></span>
                              <span className="min-w-0">
                                <span className="block text-lg font-extrabold text-foreground sm:text-xl">Cash on Delivery</span>
                                <span className="mt-1 block whitespace-normal text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">Pay securely when your order is delivered at your doorstep.</span>
                              </span>
                            </span>
                            <span className="payment-availability"><Truck className="h-5 w-5" />Available for your location</span>
                          </span>
                        </Button>
                      </div>
                    </div>



                    <button
                      type="submit"
                      disabled={isSubmitting || !allMoqValid || !isOtpVerified}
                      className="w-full h-14 rounded-md bg-[#AD1E2A] text-white font-bold tracking-wide inline-flex items-center justify-center gap-2 px-3 hover:opacity-90 transition-opacity disabled:opacity-60 mt-4"
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

      <Footer />
    </div>
  );
}