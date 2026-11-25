import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageSquare,
  Phone,
  Mail,
  FileText,
  ShoppingCart,
  Truck,
  CreditCard,
  Shield,
  RotateCcw,
  Send,
  CheckCircle2,
  Headphones,
  Tag, Search, ChevronRight, Package,
} from "lucide-react";

export const faqCategories = [
  {
    title: "Orders & Purchasing",
    icon: ShoppingCart,
    faqs: [
      { question: "How do I place a bulk order?", answer: "You can place bulk orders directly through our products page. Select the items, choose your quantity (meeting the MOQ), and proceed to checkout. For very large orders, we recommend using our RFQ (Request for Quotation) system for better pricing." },
      { question: "What is MOQ (Minimum Order Quantity)?", answer: "MOQ is the minimum number of units you need to purchase. We have different MOQs for shop buyers (wholesale) and retail buyers. Shop buyers typically have higher MOQs but get better per-unit pricing." },
      { question: "Can I get a custom quote for large orders?", answer: 'Yes! Use our RFQ system to submit a request. Go to the "Request Quote" page, add the products you need, specify quantities and your target price, and our team will respond with a competitive quote within 2-8 hours.' },
      { question: "How do I track my order?", answer: "Log into your dashboard and navigate to the Orders tab. You can see the status of all your orders including pending, confirmed, processing, shipped, and delivered statuses." },
    ],
  },
  {
    title: "Shipping & Delivery",
    icon: Truck,
    faqs: [
      { question: "What are the shipping charges?", answer: "Shipping charges vary based on order weight, volume, and delivery location. For bulk orders, we offer competitive freight rates. Shipping costs are calculated at checkout." },
      { question: "How long does delivery take?", answer: "Standard delivery takes 5-7 business days within India. For remote areas, it may take up to 10 business days. Express shipping options are available at additional cost." },
      { question: "Do you deliver pan-India?", answer: "Yes, we deliver across India and also ship to 20+ countries internationally. Our logistics network covers all major industrial hubs and cities." },
    ],
  },
  {
    title: "Payment & Invoicing",
    icon: CreditCard,
    faqs: [
      { question: "What payment methods do you accept?", answer: "We accept bank transfers (NEFT/RTGS), UPI, credit/debit cards, and net banking. For bulk orders, we also offer credit terms for verified businesses." },
      { question: "Can I get a GST invoice?", answer: "Yes, we provide GST-compliant invoices for all orders. Make sure your GST number is updated in your profile for accurate invoicing." },
      { question: "Do you offer credit terms?", answer: "Yes, we offer 30/60/90 day credit terms for verified businesses with a good track record. Contact our sales team for credit term discussions." },
    ],
  },
  {
    title: "Returns & Warranty",
    icon: RotateCcw,
    faqs: [
      { question: "What is your return policy?", answer: "We accept returns within 7 days of delivery for manufacturing defects or wrong items. The product must be unused and in original packaging." },
      { question: "How do I initiate a return?", answer: "Contact our support team via chat or email with your order number and reason for return. Our team will guide you through the process." },
      { question: "Do products come with warranty?", answer: "Yes, most products come with manufacturer warranty. Warranty duration varies by product category. Check individual product pages for specific warranty information." },
    ],
  },
  {
    title: "Account & Registration",
    icon: Shield,
    faqs: [
      { question: "How do I register as a buyer?", answer: 'Click on "Login" and then "Sign Up" to create your account. You can register as either a shop (wholesale) buyer or retail buyer.' },
      { question: "What is the difference between Shop and Retail buyers?", answer: "Shop buyers are wholesale/business buyers who purchase in larger quantities and get better pricing. Retail buyers can purchase in smaller quantities at retail pricing." },
    ],
  },
  {
    title: "RFQ (Request for Quotation)",
    icon: FileText,
    faqs: [
      { question: "What is the RFQ process?", answer: "RFQ allows you to request custom pricing for bulk orders. Browse products, add them to your RFQ cart with desired quantities, submit the request, and our team will respond with a detailed quotation." },
      { question: "How long does it take to get a quote?", answer: "We typically respond to RFQ requests within 2-8 business hours. Complex requirements may take up to 1-2 business days." },
    ],
  },
];

const contactOptions = [
  { icon: MessageSquare, title: "Live Chat", description: "Chat with our support team in real-time", action: "/chat", buttonText: "Start Chat", isLink: true },
  { icon: Phone, title: "Call Us", description: "Mon-Sat, 9:00 AM - 6:00 PM IST", action: "tel:+917551120242", buttonText: "+91 75511 20242", isLink: false },
  { icon: Mail, title: "Email Support", description: "We respond within 24 hours", action: "mailto:info@webgramitsolution", buttonText: "info@webgramitsolution", isLink: false },
];

function ContactForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(Date.now());

  const validate = () => {
    const e: Record<string, string> = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();
    if (name.length < 2) e['name'] = "Please enter your full name (min 2 characters).";
    else if (name.length > 100) e['name'] = "Name must be under 100 characters.";
    if (!email) e['email'] = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e['email'] = "Please enter a valid email address.";
    else if (email.length > 255) e['email'] = "Email is too long.";
    if (phone && !/^[+\d\s\-()]{7,20}$/.test(phone)) e['phone'] = "Please enter a valid phone number.";
    if (form.subject.length > 200) e['subject'] = "Subject must be under 200 characters.";
    if (message.length < 10) e['message'] = "Message should be at least 10 characters.";
    else if (message.length > 2000) e['message'] = "Message must be under 2000 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: "Please fix the errors below", variant: "destructive" });
      return;
    }
    // Bot: honeypot filled OR submitted in < 2s
    if (form.website || Date.now() - startedAt < 2000) {
      setSubmitted(true);
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-form", {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          honeypot: form.website,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error("Contact form error:", err);
      const msg = err?.message?.includes("Too many")
        ? "You've submitted too many inquiries. Please try again in a few minutes."
        : "Please try again or email us directly at info@webgramitsolution.";
      toast({ title: "Failed to send", description: msg, variant: "destructive" });
    }
    setSending(false);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-display font-bold text-foreground">Thank you! Inquiry received.</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Our team will contact you shortly — typically within <strong>2–8 hours</strong> (Mon–Sat, 9 AM–6 PM IST).
          A confirmation email is on its way to <strong>{form.email}</strong>.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            setForm({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
            setErrors({});
            setSubmitted(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot (hidden from users) */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
        style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm">Full Name *</Label>
          <Input id="name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" aria-invalid={!!errors['name']} maxLength={100} />
          {errors['name'] && <p className="text-xs text-destructive">{errors['name']}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm">Email *</Label>
          <Input id="email" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" aria-invalid={!!errors['email']} maxLength={255} />
          {errors['email'] && <p className="text-xs text-destructive">{errors['email']}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm">Phone</Label>
          <Input id="phone" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 9876543210" aria-invalid={!!errors['phone']} maxLength={20} />
          {errors['phone'] && <p className="text-xs text-destructive">{errors['phone']}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject" className="text-sm">Subject</Label>
          <Input id="subject" value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="How can we help?" aria-invalid={!!errors['subject']} maxLength={200} />
          {errors['subject'] && <p className="text-xs text-destructive">{errors['subject']}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-sm">Message *</Label>
        <Textarea id="message" value={form.message} onChange={e => set("message", e.target.value)} placeholder="Describe your query..." rows={4} aria-invalid={!!errors['message']} maxLength={2000} />
        <div className="flex items-center justify-between">
          {errors['message'] ? <p className="text-xs text-destructive">{errors['message']}</p> : <span />}
          <p className="text-xs text-muted-foreground">{form.message.length}/2000</p>
        </div>
      </div>
      <Button type="submit" className="bg-accent hover:bg-accent-hover w-full sm:w-auto" disabled={sending}>
        <Send className="h-4 w-4 mr-2" />
        {sending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}

const shortcuts = [
  { icon: Package, title: "Track My Order", label: "Track order", body: "Check your shipment status.", to: "/courier-tracking", tone: "bg-orange-100 text-orange-800" },
  { icon: RotateCcw, title: "Returns & Refunds", label: "View policy", body: "Find answers about returns and refunds.", topic: "Returns & Warranty", tone: "bg-amber-100 text-amber-800" },
  { icon: Tag, title: "Offers & Coupons", label: "Get help", body: "Get help with discounts and coupon codes.", topic: "Offers & Coupons", tone: "bg-rose-100 text-rose-800" },
  { icon: CreditCard, title: "Account & Payments", label: "View guide", body: "Find help with billing and payments.", topic: "Payment & Invoicing", tone: "bg-sky-100 text-sky-800" },
];

const supportTopics = [...faqCategories, {
  icon: Tag, title: "Offers & Coupons",
  faqs: [{ question: "How do I apply a coupon?", answer: "Enter your coupon in the checkout coupon field and apply it before placing your order. Check the offer terms if a code is rejected." }],
}];
const card = "rounded-xl border border-[#eee4dd] bg-white p-4 sm:p-5";
const title = "font-serif font-bold text-[#800b12]";

export function SupportCenter({ openChat }: { openChat?: () => void }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const search = query.trim().toLowerCase();
  const results = supportTopics.filter(category => !topic || category.title === topic)
    .map(category => ({ ...category, faqs: category.faqs.filter(faq =>
      `${category.title} ${faq.question} ${faq.answer}`.toLowerCase().includes(search)) }))
    .filter(category => category.faqs.length);

  return <section className="space-y-4" aria-labelledby="support-heading">
    <div>
      <h1 id="support-heading" className={`${title} text-3xl`}>Support</h1>
      <p className="mt-1 text-muted-foreground">Find answers, contact us or raise a support request.</p>
    </div>
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
      {shortcuts.map(({ icon: Icon, title: name, label, body, to, topic: shortcut, tone }) => {
        const content = <><span className={`mb-2 inline-flex rounded-full p-2 ${tone}`}><Icon size={21} /></span>
          <span className={`block ${title}`}>{name}</span><span className="mt-1 hidden text-sm text-muted-foreground sm:block">{body}</span>
          <span className="mt-2 inline-flex items-center text-sm font-semibold text-[#850d12]">{label}<ChevronRight size={15} /></span></>;
        const classes = `${card} block text-left hover:border-[#bc7775]`;
        return to ? <Link className={classes} key={name} to={to}>{content}</Link> :
          <button className={classes} key={name} type="button" onClick={() => { setTopic(shortcut ?? ""); setQuery(""); }}>{content}</button>;
      })}
    </div>
    <div className="grid items-center gap-3 rounded-xl border border-[#f2ddda] bg-gradient-to-r from-[#fbe8e6] to-[#fff6ef] p-4 sm:p-6 md:grid-cols-[1fr_auto]">
      <div><h2 className={`${title} text-2xl`}>How can we help you?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Search for answers or browse our help topics.</p>
        <label className="relative mt-3 block"><Search aria-hidden className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="bg-white pl-9" aria-label="Search help articles" placeholder="Search delivery, refunds, coupons…" value={query}
            onChange={event => { setQuery(event.target.value); setTopic(""); }} />
        </label>
      </div>
      <Headphones aria-hidden size={74} strokeWidth={1.25} className="mx-6 hidden text-[#951819] md:block" />
    </div>
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="space-y-3">
        <section className={card}><h2 className={`${title} text-xl`}>Popular Help Topics</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {supportTopics.map(({ icon: Icon, title: name }) => <button type="button" key={name}
              onClick={() => { setTopic(topic === name ? "" : name); setQuery(""); }} aria-pressed={topic === name}
              className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium hover:bg-[#fcf4ee] aria-pressed:bg-[#fbe8e6]">
              <Icon size={18} className="shrink-0 text-[#850d12]" /><span className="flex-1">{name}</span><ChevronRight size={15} />
            </button>)}
          </div>
        </section>
        <section className={card}><div className="flex flex-wrap items-center justify-between gap-1">
          <h2 className={`${title} text-xl`}>{topic || "Frequently Asked Questions"}</h2>
          {(topic || search) && <Button type="button" variant="link" onClick={() => { setQuery(""); setTopic(""); }}>View all FAQs</Button>}
        </div>
          {results.length ? <Accordion type="single" collapsible>
            {results.flatMap(category => category.faqs).map(faq => <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger><AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>)}
          </Accordion> : <p className="mt-3 text-sm text-muted-foreground">No matching answers. Try another search or contact support.</p>}
        </section>
      </div>
      <aside className={card}><h2 className={`${title} text-xl`}>Contact Us</h2>
        <p className="mt-1 text-sm text-muted-foreground">Get in touch with our support team.</p>
        <div className="mt-3 space-y-2">{contactOptions.map(option => <div key={option.title} className="flex items-start gap-2 rounded-lg border p-3">
          <option.icon size={18} className="mt-1 shrink-0 text-[#850d12]" />
          <div className="min-w-0"><p className="text-sm font-semibold">{option.title}</p><p className="text-xs text-muted-foreground">{option.description}</p>
            {option.isLink ? openChat ? <button type="button" className="mt-1 text-sm font-medium text-[#850d12] underline" onClick={openChat}>{option.buttonText}</button> :
              <Link className="mt-1 block text-sm font-medium text-[#850d12] underline" to={option.action}>{option.buttonText}</Link> :
              <a className="mt-1 block break-all text-sm font-medium text-[#850d12] underline" href={option.action}>{option.buttonText}</a>}
          </div>
        </div>)}</div>
        <Button type="button" className="mt-3 w-full bg-[#850d12] text-white hover:bg-[#6c090e]" onClick={() => setShowRequest(true)}>Raise a Support Request</Button>
      </aside>
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className={title}>Raise a Support Request</DialogTitle></DialogHeader>
          <ContactForm />
        </DialogContent>
      </Dialog>
    </div>
  </section>;
}
