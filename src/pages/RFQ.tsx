import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  CheckCircle,
  FileText,
  Gift,
  Headphones,
  Loader2,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SignedImage } from "@/components/common/SignedImage";
import { LocationPicker } from "@/components/layout/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { useRFQCart } from "@/hooks/useRFQCart";
import { useAuth } from "@/contexts/AuthContext";
import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import { supabase } from "@/integrations/supabase/client";

const RFQ_HERO_URL = "https://ik.imagekit.io/webgramitsolution/bulk%20order%20page.png";

const highlights = [
  { icon: Boxes, title: "Bulk Order Enquiries", detail: "Special pricing for large quantities" },
  { icon: Settings, title: "Custom Product Requirements", detail: "Tailored to your requirements" },
  { icon: Headphones, title: "Dedicated Sales Assistance", detail: "Personalized support from our team" },
];

const benefits = [
  { icon: Truck, title: "Bulk Order Enquiries", detail: "Special pricing for large quantities" },
  { icon: Gift, title: "Custom Packaging Assistance", detail: "Tailored for your occasion or brand" },
  { icon: Users, title: "Dedicated Business Support", detail: "Personalized assistance from our team" },
  { icon: ShieldCheck, title: "Trusted Quality", detail: "Pure ingredients, authentic taste" },
];

export default function RFQ() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role } = useAuth();
  const { location } = useDeliveryLocation();
  const {
    items: rfqItems,
    itemCount,
    isLoading: isCartLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useRFQCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [buyerType, setBuyerType] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (role === "shop" || role === "retail") setBuyerType(role);
  }, [role]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    const validFiles = Array.from(selectedFiles).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds the 10MB limit.`, variant: "destructive" });
        return false;
      }
      return true;
    });
    setAttachments((current) => [...current, ...validFiles].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadAttachments = async (rfqId: string) => {
    if (!user || attachments.length === 0) return [] as string[];
    const uploadedPaths: string[] = [];
    for (const file of attachments) {
      const extension = file.name.split(".").pop() || "file";
      const fileName = `${user.id}/${rfqId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { data, error } = await supabase.storage.from("rfq-attachments").upload(fileName, file);
      if (!error && data) uploadedPaths.push(data.path);
    }
    return uploadedPaths;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in before submitting your quotation request." });
      navigate("/login?next=/rfq");
      return;
    }
    if (honeypot) {
      setSubmitted(true);
      return;
    }
    if (Date.now() - lastSubmitTime < 60000) {
      toast({ title: "Please wait", description: "You can submit another request after one minute.", variant: "destructive" });
      return;
    }
    if (rfqItems.length === 0) {
      toast({ title: "No products selected", description: "Add products to your bulk order before submitting.", variant: "destructive" });
      return;
    }
    const form = formRef.current;
    if (!form) return;

    setIsSubmitting(true);
    setLastSubmitTime(Date.now());
    try {
      const formData = new FormData(form);
      const fullName = String(formData.get("name") || "");
      const companyName = String(formData.get("company") || "");
      const email = String(formData.get("email") || "");
      const phone = String(formData.get("phone") || "");
      const gstNumber = String(formData.get("gst") || "");
      const message = String(formData.get("message") || "");
      const rfqNumber = `RFQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
      const productNames = rfqItems.map((item) => item.product?.name || "Product").join(", ");

      const requestPayload = {
          rfq_number: rfqNumber,
          full_name: fullName,
          company_name: companyName,
          email,
          phone: phone || null,
          gst_number: gstNumber || null,
          buyer_type: buyerType || null,
          product_name: productNames.length > 100 ? `${rfqItems.length} products` : productNames,
          quantity: itemCount,
          user_id: user.id,
          status: "pending",
          message: message || null,
          postal_code: location?.pincode || null,
          city: location?.city || null,
          state: location?.state || null,
          country: location?.countryName || "India",
        };
      const { data: rfqData, error: rfqError } = await supabase
        .from("rfq_requests")
        .insert(requestPayload as never)
        .select("id")
        .single();
      if (rfqError || !rfqData) throw rfqError || new Error("Unable to create quotation request.");

      if (attachments.length > 0) {
        setIsUploading(true);
        const uploadedPaths = await uploadAttachments(rfqData.id);
        if (uploadedPaths.length) {
          await supabase.from("rfq_requests").update({ attachments: uploadedPaths }).eq("id", rfqData.id);
        }
        setIsUploading(false);
      }

      const { error: itemError } = await supabase.from("rfq_items").insert(
        rfqItems.map((item) => ({
          rfq_id: rfqData.id,
          product_id: item.product_id,
          variation_id: item.variation_id,
          product_name: item.product?.name || "Product",
          product_image: item.product?.images?.[0] || null,
          variation_details: [item.variation?.size, item.variation?.color].filter(Boolean).join(" ") || null,
          quantity: item.quantity,
        })),
      );
      if (itemError) throw itemError;

      void supabase.functions.invoke("send-rfq-notification", {
        body: { rfqNumber, fullName, companyName, email, phone, productName: productNames, quantity: itemCount, message, buyerType, itemCount: rfqItems.length, gstNumber },
      });
      await clearCart();
      setSubmitted(true);
      toast({ title: "Quotation request submitted", description: `${rfqNumber} has been sent to the Prasadam team.` });
    } catch (error) {
      console.error("Error submitting RFQ:", error);
      toast({ title: "Submission failed", description: "Please check your details and try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-card">
        <Header />
        <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"><CheckCircle className="h-10 w-10 text-success" /></div>
          <h1 className="text-3xl font-bold text-foreground">Quotation Request Submitted</h1>
          <p className="mt-3 text-muted-foreground">Our bulk-order team will review your requirements and contact you with custom pricing.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => setSubmitted(false)}>Submit Another Request</Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent-hover"><Link to="/dashboard">View My Requests</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      <SEOHead title="Bulk Orders & Custom Quotations" description="Request custom pricing for Prasadam bulk orders, festive gifting and devotional offerings." />
      <Header />
      <main className="bg-card pb-20 md:pb-0">
        <section className="relative min-h-[250px] overflow-hidden border-b border-border md:min-h-[270px]">
          <img src={RFQ_HERO_URL} alt="Prasadam bulk sweets and festive gifting" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-card/20" />
          <div className="relative mx-auto flex min-h-[250px] max-w-6xl flex-col items-center justify-center px-4 py-7 text-center md:min-h-[270px]">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-1 text-xs font-bold text-accent"><Users className="h-3.5 w-3.5" />B2B PROCUREMENT</div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">Bulk Orders & <span className="text-accent">Custom Quotations</span></h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">Looking to order in bulk? Share your product requirements and receive a tailored quotation from our team.</p>
            <div className="mt-5 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex items-center justify-center gap-3 sm:border-r sm:border-accent/20 sm:last:border-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent bg-card/80 text-accent"><Icon className="h-5 w-5" /></span>
                  <span className="text-left"><strong className="block text-xs text-foreground">{title}</strong><span className="block text-[10px] text-muted-foreground">{detail}</span></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-4xl grid-cols-3 px-3 py-3">
            {[
              ["1", "Select Products", "Add items to your quote cart"],
              ["2", "Business Details", "Tell us your requirements"],
              ["3", "Submit Request", "Our team will get back to you"],
            ].map(([number, title, detail], index) => (
              <div key={number} className="relative flex min-w-0 items-start justify-center gap-2 px-1">
                {index < 2 && <span className="absolute left-[72%] right-[-28%] top-4 hidden h-px bg-border sm:block" />}
                <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${index === 0 ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-foreground"}`}>{number}</span>
                <span className="hidden min-w-0 sm:block"><strong className="block text-xs text-foreground">{title}</strong><span className="block text-[10px] text-muted-foreground">{detail}</span></span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[hsl(var(--promo-category))] px-3 py-5 md:px-5 md:py-7">
          <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-3"><ShoppingBag className="h-6 w-6 text-accent" /><div><h2 className="text-lg font-bold text-foreground">Your Bulk Order</h2><p className="text-[11px] text-muted-foreground">Review the products you want a quotation for.</p></div></div>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{rfqItems.length} Products</span>
              </header>

              <div className="px-4">
                {isCartLoading ? (
                  <div className="flex min-h-52 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
                ) : rfqItems.length === 0 ? (
                  <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center"><ShoppingBag className="mb-3 h-10 w-10 text-accent" /><p className="font-semibold">Your bulk-order cart is empty</p><p className="mt-1 max-w-xs text-xs text-muted-foreground">Choose a product and use “Ask for Bulk Qty Quote” to add it here.</p><Button asChild size="sm" className="mt-4 bg-accent text-accent-foreground hover:bg-accent-hover"><Link to="/products">Browse Products</Link></Button></div>
                ) : (
                  <div className="max-h-[310px] overflow-y-auto">
                    {rfqItems.map((item) => (
                      <article key={item.id} className="grid grid-cols-[58px_1fr_auto] items-center gap-3 border-b border-border py-3 last:border-0">
                        <div className="h-[58px] w-[58px] overflow-hidden rounded-md bg-muted"><SignedImage src={item.product?.images?.[0]} alt={item.product?.name || "Product"} className="h-full w-full object-cover" /></div>
                        <div className="min-w-0"><h3 className="truncate text-sm font-bold text-foreground">{item.product?.name || "Product"}</h3><p className="mt-0.5 truncate text-[10px] text-muted-foreground">SKU: {item.product_id.slice(0, 8).toUpperCase()}{item.variation?.size ? ` · ${item.variation.size}` : ""}{item.variation?.color ? ` · ${item.variation.color}` : ""}</p><p className="mt-1 text-[10px] text-muted-foreground">Minimum order quantity applies</p></div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 items-center rounded-md border border-border bg-card">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-r-none hover:bg-secondary hover:text-foreground" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} aria-label="Decrease quantity"><Minus className="h-3 w-3" /></Button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-l-none hover:bg-secondary hover:text-foreground" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity"><Plus className="h-3 w-3" /></Button>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeFromCart(item.id)} aria-label="Remove product"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="mx-4 mb-3 mt-3 rounded-lg bg-[hsl(var(--promo-category))] p-4">
                <div className="flex items-center gap-2 text-accent"><PackageCheck className="h-5 w-5" /><h3 className="text-sm font-bold">Order Summary</h3></div>
                <div className="mt-3 grid grid-cols-2 divide-x divide-border rounded-md bg-card/80 text-center">
                  <div className="p-3"><p className="text-[11px] text-muted-foreground">Total Products</p><strong className="text-xl text-foreground">{rfqItems.length}</strong></div>
                  <div className="p-3"><p className="text-[11px] text-muted-foreground">Total Requested Quantity</p><strong className="text-xl text-foreground">{itemCount}</strong></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <Button asChild variant="outline" className="border-accent text-accent hover:bg-card hover:text-accent"><Link to="/products"><ArrowLeft className="h-4 w-4" />Continue Browsing</Link></Button>
                <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent-hover" disabled={!rfqItems.length} onClick={() => void clearCart()}>Clear All</Button>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
              <header className="flex items-center gap-3 border-b border-border px-4 py-3"><FileText className="h-6 w-6 text-accent" /><div><h2 className="text-lg font-bold text-foreground">Business & Contact Details</h2><p className="text-[11px] text-muted-foreground">Tell us a little about your requirements so our team can prepare your quotation.</p></div></header>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 p-4">
                <div className="absolute -z-10 opacity-0" aria-hidden="true"><input name="website_url" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" /></div>
                <div className="rounded bg-accent/10 px-3 py-1 text-xs font-bold text-accent">Contact Information</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label htmlFor="name" className="text-[11px] font-semibold">Full Name *</Label><Input id="name" name="name" defaultValue={profile?.full_name || ""} placeholder="Enter your full name" className="mt-1 h-10 text-sm" required /></div>
                  <div><Label htmlFor="company" className="text-[11px] font-semibold">Company Name *</Label><Input id="company" name="company" defaultValue={profile?.company_name || ""} placeholder="Enter your company name" className="mt-1 h-10 text-sm" required /></div>
                  <div><Label htmlFor="email" className="text-[11px] font-semibold">Business Email *</Label><Input id="email" name="email" type="email" defaultValue={profile?.email || user?.email || ""} placeholder="name@company.com" className="mt-1 h-10 text-sm" required /></div>
                  <div><Label htmlFor="phone" className="text-[11px] font-semibold">Phone / WhatsApp *</Label><div className="mt-1 flex"><span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-secondary px-3 text-xs">+91</span><Input id="phone" name="phone" type="tel" defaultValue={profile?.phone?.replace(/^\+?91\s*/, "") || ""} placeholder="Enter mobile number" className="h-10 rounded-l-none text-sm" required /></div></div>
                </div>

                <div className="rounded bg-accent/10 px-3 py-1 text-xs font-bold text-accent">Business Information</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label htmlFor="gst" className="text-[11px] font-semibold">GST Number (Optional)</Label><Input id="gst" name="gst" defaultValue={profile?.gst_number || ""} placeholder="Enter GSTIN" className="mt-1 h-10 text-sm" /></div>
                  <div><Label className="text-[11px] font-semibold">Buyer Type *</Label><Select value={buyerType} onValueChange={setBuyerType} required><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue placeholder="Select buyer type" /></SelectTrigger><SelectContent><SelectItem value="shop">Wholesaler / Distributor</SelectItem><SelectItem value="retail">Retailer / Reseller</SelectItem></SelectContent></Select></div>
                </div>

                <div><Label className="text-[11px] font-semibold">Delivery Pincode (Optional)</Label><div className="mt-1 rounded-md border border-input"><LocationPicker className="h-10 max-w-none px-3" /></div></div>

                <div className="rounded bg-accent/10 px-3 py-1 text-xs font-bold text-accent">Additional Requirements</div>
                <Textarea id="message" name="message" maxLength={500} placeholder="Tell us about your bulk order requirements, customization needs, preferred delivery date, packaging specifications, or any other details." className="min-h-[78px] resize-none text-sm" />

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="border-dashed" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" />Add attachments</Button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={handleFileSelect} />
                  {attachments.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[10px]">{file.name}<Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="h-3 w-3" /></Button></span>)}
                </div>

                {!user && <div className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-foreground"><LockKeyhole className="h-4 w-4 text-warning" /><span>Please sign in to submit this quotation. Your selected products will remain in your quote cart.</span></div>}
                <Button type="submit" className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent-hover" disabled={isSubmitting || rfqItems.length === 0}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />{isUploading ? "Uploading files…" : "Submitting…"}</> : <><Send className="h-4 w-4" />Submit Quotation Request</>}</Button>
                <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><LockKeyhole className="h-3 w-3" />Your information will only be used to process your quotation request.</p>
              </form>
            </section>
          </div>

          <div className="mx-auto mt-5 grid max-w-6xl grid-cols-2 divide-x divide-border border-t border-border pt-4 md:grid-cols-4">
            {benefits.map(({ icon: Icon, title, detail }) => <div key={title} className="flex items-center gap-3 px-3 py-2"><Icon className="h-7 w-7 shrink-0 text-accent" /><span><strong className="block text-xs text-accent">{title}</strong><span className="text-[10px] text-muted-foreground">{detail}</span></span></div>)}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
