import { useRef, useState } from "react";
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
  Tag, Search, ChevronRight, Package, Ticket, UserRound, XCircle, ArrowRight, Plus,
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
  { icon: MessageSquare, title: "WhatsApp Support", label: "Chat Now", mobile: "Chat Now", description: "Chat with us on WhatsApp", action: "https://wa.me/917551120242", tone: "bg-emerald-50 text-[#008c49]" },
  { icon: Phone, title: "Phone Support", label: "+91 75511 20242", mobile: "Call Us", description: "Mon–Sat, 9 AM–6 PM IST", action: "tel:+917551120242", tone: "bg-[#fff0ef] text-[#a60810]" },
  { icon: Mail, title: "Email Support", label: "Email Us", mobile: "Email Us", description: "Send us your question", action: "mailto:info@webgramitsolution", tone: "bg-blue-50 text-blue-700" },
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
  { icon: Package, title: "Track My Order", label: "Track Order", body: "Check your shipment status.", to: "/courier-tracking", tone: "bg-orange-100 text-orange-800" },
  { icon: RotateCcw, title: "Returns & Refunds", label: "View Policy", body: "Find answers about returns and refunds.", topic: "Returns & Warranty", tone: "bg-amber-100 text-amber-800" },
  { icon: Ticket, title: "Offers & Coupons", label: "Get Help", body: "Get help with discounts and coupon codes.", topic: "Offers & Coupons", tone: "bg-rose-100 text-rose-800" },
  { icon: UserRound, title: "Account & Payments", label: "View Guide", body: "Find help with billing and payments.", topic: "Payment & Invoicing", tone: "bg-sky-100 text-sky-800" },
];

const supportTopics = [...faqCategories, {
  icon: XCircle, title: "Cancellation",
  faqs: [{ question: "Can I cancel or modify my order?", answer: "Check the available actions under My Orders. For changes or cancellation assistance, contact support with your order number." }],
}, {
  icon: Tag, title: "Offers & Coupons",
  faqs: [{ question: "How do I apply a coupon?", answer: "Enter your coupon in the checkout coupon field and apply it before placing your order. Check the offer terms if a code is rejected." }],
}];
const popularTopics = [
  { icon: Truck, name: "Order & Delivery", topic: "Shipping & Delivery", detail: "Tracking, delivery time, late delivery", tone: "bg-blue-50 text-blue-700" },
  { icon: XCircle, name: "Cancellation", topic: "Cancellation", detail: "Cancel or modify an order", tone: "bg-red-50 text-red-700" },
  { icon: RotateCcw, name: "Returns & Refunds", topic: "Returns & Warranty", detail: "Return products and get a refund", tone: "bg-orange-50 text-orange-700" },
  { icon: Tag, name: "Offers & Coupons", topic: "Offers & Coupons", detail: "Apply coupons and get discounts", tone: "bg-violet-50 text-violet-700" },
  { icon: UserRound, name: "Account & Profile", topic: "Account & Registration", detail: "Login, profile and account settings", tone: "bg-cyan-50 text-cyan-700" },
  { icon: Package, name: "Products & Stock", topic: "RFQ (Request for Quotation)", detail: "Product availability and bulk orders", tone: "bg-violet-50 text-violet-700" },
];

const card = "rounded-xl border border-[#eee4dd] bg-white p-4 sm:p-5";
const title = "font-serif font-bold text-[#800b12]";

export function SupportCenter({ openChat }: { openChat?: () => void }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const faq = useRef<HTMLElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const focusFaq = () => faq.current?.scrollIntoView({ block: "nearest" });
  function chooseTopic(value: string) {
    setTopic(value); setQuery(""); setDraftQuery(""); setShowAll(false); focusFaq();
  }
  const search = query.trim().toLowerCase();
  const results = supportTopics.filter(category => !topic || category.title === topic)
    .map(category => ({ ...category, faqs: category.faqs.filter(faq =>
      `${category.title} ${faq.question} ${faq.answer}`.toLowerCase().includes(search)) }))
    .filter(category => category.faqs.length);

  const questions = results.flatMap(category => category.faqs);
  const featured = ["How do I track my order?", "What is your return policy?", "How long does delivery take?", "Can I cancel or modify my order?", "How do I apply a coupon?"];
  const visible = showAll || topic || search ? questions : featured.flatMap(question => questions.filter(faq => faq.question === question));
  const searchForm = (mobile: boolean) => (
    <form role="search" className={mobile ? "flex gap-1 lg:hidden" : "mt-3 hidden gap-2 lg:flex"} onSubmit={event => {
      event.preventDefault(); setTopic(""); setQuery(draftQuery); setShowAll(false); focusFaq();
    }}>
      <div className="relative min-w-0 flex-1"><Search aria-hidden className="absolute left-3 top-3 size-4 text-slate-500" />
        <Input className="h-10 bg-white pl-9" aria-label="Search help articles" placeholder="Search for help articles…" value={draftQuery} onChange={event => setDraftQuery(event.target.value)} />
      </div>
      <Button type="submit" className="h-10 bg-[#850800] px-3 text-white hover:bg-[#650600]" aria-label="Search"><Search size={17} className="lg:hidden" /><span className="hidden lg:inline">Search</span></Button>
    </form>
  );

  const hero = (
    <div className="relative isolate flex min-h-24 items-center overflow-hidden rounded-lg bg-[#fae8e6] px-3 py-3 lg:min-h-36 lg:px-6 lg:py-4">
      <img src="/cdn/support-center-hero.webp" alt="" className="absolute inset-y-0 left-0 -z-10 h-full w-2/5 object-cover object-[80%_center] lg:left-auto lg:right-0 lg:w-[34%]" />
      <div className="ml-[36%] w-[64%] rounded-md bg-[#fff7f6]/90 p-2 lg:ml-0 lg:w-[72%] lg:bg-transparent lg:p-0">
        <div className="flex items-center gap-4"><Headphones aria-hidden className="hidden size-10 text-[#850800] lg:block" />
          <div>{openChat ? <h2 className={`${title} text-lg lg:text-2xl`}>How can we help you?</h2> : <h1 id="support-hero-heading" className={`${title} text-lg lg:text-2xl`}>How can we help you?</h1>}
            <p className="mt-1 text-xs text-slate-600 lg:text-sm">Search for answers or browse our help topics.</p></div>
        </div>
        {searchForm(false)}
      </div>
    </div>
  );

  return <section className="space-y-4" aria-labelledby={openChat ? "support-heading" : "support-hero-heading"}>
    {openChat && <div>
      <h1 id="support-heading" className={`${title} text-3xl`}>Support</h1>
      <p className="mt-1 text-muted-foreground">Find answers, contact us or raise a support request.</p>
    </div>}
    {searchForm(true)}
    {!openChat && hero}
    <div className="grid grid-cols-4 gap-2 lg:gap-3">
      {shortcuts.map(({ icon: Icon, title: name, label, body, to, topic: shortcut, tone }) => {
        const content = <><span className={`mb-2 inline-flex rounded-full p-2 ${tone}`}><Icon size={21} /></span>
          <span className={`block text-xs leading-tight lg:text-base ${title}`}>{name}</span><span className="mt-1 hidden text-sm text-slate-600 lg:block">{body}</span>
          <span className="mt-2 hidden items-center gap-1 text-sm font-semibold text-[#a50709] lg:inline-flex">{label}<ArrowRight size={14} /></span></>;
        const classes = "block rounded-lg border border-[#eee9e6] bg-white px-1 py-3 text-center hover:border-[#bc7775] lg:p-4 lg:text-left";
        return to ? <Link className={classes} key={name} to={to}>{content}</Link> :
          <button className={classes} key={name} type="button" onClick={() => chooseTopic(shortcut ?? "")}>{content}</button>;
      })}
    </div>
    {openChat && hero}
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,27%)]">
      <div className={`min-w-0 space-y-3 ${openChat ? "lg:max-h-[min(65dvh,40rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2" : ""}`}>
        <section className={card}><h2 className={`${title} text-xl`}>Popular Help Topics</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {popularTopics.map(({ icon: Icon, name, topic: key, detail, tone }) => <button type="button" key={name}
              onClick={() => chooseTopic(topic === key ? "" : key)} aria-pressed={topic === key}
              className="flex items-center gap-2 rounded-md border border-slate-100 p-2 text-left hover:bg-[#fcf4ee] aria-pressed:bg-[#fbe8e6]">
              <span className={`shrink-0 rounded-full p-2 ${tone}`}><Icon size={18} /></span><span className="min-w-0 flex-1 text-xs font-semibold">{name}<span className="mt-0.5 block font-normal text-slate-600">{detail}</span></span><ChevronRight size={14} />
            </button>)}
          </div>
        </section>
        <section ref={faq} className={card}><div className="flex flex-wrap items-center justify-between gap-1">
          <h2 className={`${title} text-xl`}>{topic || "Frequently Asked Questions"}</h2>
          <Button type="button" variant="link" className="text-[#9b0908]" onClick={() => { chooseTopic(""); setShowAll(true); }}>View All FAQs <ArrowRight size={14} className="ml-1" /></Button>
        </div>
          {visible.length ? <div role="region" aria-label="FAQ answers" tabIndex={0} className={`mt-2 rounded focus-visible:outline focus-visible:outline-[#850d12] ${openChat ? "" : "lg:max-h-[min(52dvh,29rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-3"}`}><Accordion type="single" collapsible>
            {visible.map(faq => <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="justify-start gap-2 py-3 text-left [&>svg:last-child]:hidden"><Plus aria-hidden size={16} className="shrink-0" />{faq.question}</AccordionTrigger><AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>)}
          </Accordion></div> : <p className="mt-3 text-sm text-muted-foreground">No matching answers. Try another search or contact support.</p>}
        </section>
      </div>
      <aside className={`${card} lg:sticky ${openChat ? "lg:top-0" : "lg:top-40"}`}><h2 className={`${title} text-xl`}>Contact Us</h2>
        <p className="mt-1 text-sm text-muted-foreground">Get in touch with our support team.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-1">
          {contactOptions.map(({ icon: Icon, title: name, label, mobile, description, action, tone }) =>
            <a key={name} href={action} className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-slate-100 p-2 text-center hover:bg-[#fcf4ee] lg:flex-row lg:text-left">
              <span className={`shrink-0 rounded-full p-2 ${tone}`}><Icon size={19} /></span>
              <span className="min-w-0 text-xs"><strong className="lg:hidden">{mobile}</strong><strong className="hidden lg:block">{name}</strong>
                <span className="hidden text-slate-600 lg:block">{description}</span><span className={`mt-1 hidden font-semibold lg:inline-block ${name === "WhatsApp Support" ? "rounded border border-emerald-600 px-2 py-1 text-emerald-800" : "text-[#850800]"}`}>{label}</span>
              </span>
            </a>)}
        </div>
        <div className="my-3 hidden items-center gap-2 text-xs text-slate-500 lg:flex"><span className="h-px flex-1 bg-slate-200" />OR<span className="h-px flex-1 bg-slate-200" /></div>
        <Button type="button" className="mt-3 w-full gap-2 bg-[#850800] px-2 text-xs text-white hover:bg-[#650600] lg:mt-0" onClick={() => setShowRequest(true)}><Ticket size={16} />Raise a Support Request</Button>
        <Link to="/chat" onClick={event => { if (openChat) { event.preventDefault(); openChat(); } }} className="mt-2 block text-center text-xs text-[#850800] underline">Start Live Chat</Link>
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
