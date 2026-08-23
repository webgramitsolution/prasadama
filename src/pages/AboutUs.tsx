import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Gift,
  Headphones,
  Heart,
  Home,
  ArrowRight,
  MapPin,
  Sparkles,
  Package,
  Leaf,
  Recycle,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Star,
  Truck,
  Users,
  WandSparkles,
  WashingMachine,
  Wind,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/common/SignedImage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ProductLite {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  images: string[] | null;
}

const HERO_BG = "https://ik.imagekit.io/prasadam1/about%20us%20banner.png";
const WHO_IMAGE = "/auth-pooja.jpg";
const ECO_IMAGE = "/auth-mithai.jpg";

/** Small festive flourish: tapered rule + diamond + curls */
function Ornament({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 96 14"
      className={`h-3.5 w-[70px] shrink-0 text-brand-red ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 7h44" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M50 7l4-4 4 4-4 4z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M62 7c3-5 8-5 10 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <path d="M62 7c3 5 8 5 10 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <circle cx="78" cy="7" r="1.3" fill="currentColor" />
    </svg>
  );
}


export default function AboutUs() {
  const [products, setProducts] = useState<ProductLite[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [perView, setPerView] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [quickView, setQuickView] = useState<ProductLite | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, short_description, images")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      setProducts((data as ProductLite[]) || []);
    })();
  }, []);

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // responsive per-view
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerView(w >= 1024 ? 5 : w >= 768 ? 4 : w >= 640 ? 3 : 2);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(products.slice(0, 10).length / perView));
    setSlideCount(total);
    setActiveSlide((s) => Math.min(s, total - 1));
  }, [products, perView]);

  // auto-slide (paused on hover/focus or when reduced-motion is on)
  useEffect(() => {
    if (slideCount <= 1 || isPaused || reducedMotion) return;
    const id = setInterval(() => {
      setActiveSlide((s) => {
        const next = (s + 1) % slideCount;
        const el = sliderRef.current;
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [slideCount, isPaused, reducedMotion]);

  const goToSlide = (i: number) => {
    setActiveSlide(i);
    const el = sliderRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About Prasadam | A Divine Taste"
        description="Prasadam brings you pure, blessed temple prasad, mithai, dry fruit prasad and pooja samagri — devotional offerings delivered with care from temple to your home."
      />
      <Header />
      <main>
        {/* HERO BANNER */}
        <section
          className="relative overflow-hidden bg-[#fbf5ec] bg-cover bg-center md:min-h-[380px]"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-3/5 bg-gradient-to-r from-[#fbf5ec] via-[#fbf5ec]/80 to-transparent md:block" />
          <div className="pointer-events-none absolute inset-0 bg-[#fbf5ec]/85 md:hidden" />
          <div className="container relative mx-auto px-4 py-6 md:py-10">

            <div className="max-w-[560px]">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-red/80">Our Story</span>
                <Ornament />
              </div>
              <h1 className="font-display text-[2rem] leading-[1.12] text-foreground md:text-[3rem]">
                Rooted in Tradition,
                <br />
                <span className="text-brand-red">Crafted with Devotion</span>
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                Prasadam was born out of a simple belief — that every celebration deserves to be made special with pure,
                authentic and delicious sweets. From traditional recipes passed down for generations to modern hygienic
                packaging, we bring you the perfect blend of taste, purity and love.
              </p>
              <Button asChild size="lg" className="mt-7 rounded bg-brand-red px-6 text-sm text-white hover:bg-brand-red/90">
                <Link to="/products">Our Journey <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SINCE 2015 + STATS */}
        <section className="bg-white py-12 md:py-16">
          <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-10">
            <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
              <div className="overflow-hidden rounded-xl shadow-card">
                <img src={WHO_IMAGE} alt="Prasadam store front" className="h-full max-h-[260px] w-full object-cover" loading="lazy" />
              </div>
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-red/80">Since 2015</span>
                  <Ornament />
                </div>
                <h2 className="font-display text-2xl leading-snug text-foreground md:text-[26px]">
                  Creating Moments
                  <br />
                  <span className="text-brand-red">of Happiness</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  What started as a small home kitchen with a passion for authentic sweets has now become a trusted name
                  in thousands of homes across India.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Traditional recipes & authentic taste",
                    "Carefully selected premium ingredients",
                    "Hygienic preparation & packaging",
                    "Delivered with love across India",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-8 border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {[
                { Icon: MapPin, num: "500+", label: "Cities Covered", sub: "From metros to small towns" },
                { Icon: Star, num: "4.8/5", label: "Customer Rating", sub: "For quality, taste & service" },
                { Icon: Users, num: "50,000+", label: "Happy Customers", sub: "Trust & love from thousands of families" },
                { Icon: Gift, num: "1,00,000+", label: "Orders Delivered", sub: "Successfully delivered across India" },

              ].map(({ Icon, num, label, sub }) => (
                <div key={label} className="flex flex-col items-center px-3 text-center lg:border-r lg:border-border last:lg:border-r-0">
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#fbf1e6]">
                    <Icon className="h-6 w-6 text-brand-red" strokeWidth={1.6} />
                  </span>
                  <span className="font-display text-2xl font-semibold text-brand-red">{num}</span>
                  <span className="mt-1 text-sm font-medium text-foreground">{label}</span>
                  <span className="mt-1 text-xs leading-snug text-muted-foreground">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT MAKES US SPECIAL */}
        <section className="bg-white pb-14 md:pb-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-center gap-4">
              <Ornament flip />
              <h2 className="font-display text-2xl text-foreground md:text-[28px]">What Makes Us Special</h2>
              <Ornament />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { Icon: Leaf, title: "Premium Ingredients", body: "We use only the finest quality nuts, dry fruits and natural ingredients." },
                { Icon: ShieldCheck, title: "Hygienically Prepared", body: "Made in a clean, hygienic environment with strict quality standards." },
                { Icon: Heart, title: "Made with Devotion", body: "Every sweet is crafted with love, care and traditional techniques." },
                { Icon: Gift, title: "Beautifully Packaged", body: "Elegant packaging to make your gifts even more special." },
                { Icon: Truck, title: "Pan India Delivery", body: "Timely and safe delivery to every corner of India." },
                { Icon: Headphones, title: "Customer First", body: "We are always here to make your experience delightful." },
              ].map(({ Icon, title, body }) => (
                <div key={title} className="rounded-lg border border-[#eadfd0] bg-white p-4">
                  <Icon className="mb-3 h-7 w-7 text-brand-red" strokeWidth={1.4} />
                  <h4 className="mb-1.5 text-sm font-bold text-foreground">{title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>




        {/* WHY CUSTOMERS LOVE (badges strip) */}
        <section className="bg-brand-red py-10 text-primary-foreground">
          <div className="container mx-auto px-4">
            <h3 className="mb-8 text-center font-display text-lg font-bold md:text-2xl">WHY DEVOTEES LOVE PRASADAM</h3>
            <div className="grid grid-cols-2 text-center sm:grid-cols-3 md:grid-cols-6">
              {[
                { Icon: Droplets, label: "Pure Ghee Used" },
                { Icon: Wind, label: "Freshly Prepared" },
                { Icon: WashingMachine, label: "Hygienically Packed" },
                { Icon: Recycle, label: "Sustainable Packaging" },
                { Icon: ShieldCheck, label: "Premium Quality" },
                { Icon: WandSparkles, label: "For Every Occasion" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-3 border-l border-r border-primary-foreground/25 px-3 py-3 first:border-l-0 last:border-r-0">
                  <div
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-md md:h-20 md:w-20"
                    style={{
                      background: "linear-gradient(135deg,#fdf3d4 0%,#e6c176 28%,#b8862f 55%,#f4e3ad 78%,#c9993f 100%)",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6)",
                    }}
                  >
                    <Icon className="h-10 w-10 text-[#6b4a12] md:h-12 md:w-12" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold tracking-wide md:text-sm">{label}</span>
                </div>


              ))}
            </div>
          </div>
        </section>

        {/* ECO INNOVATION */}
        <section className="container mx-auto px-4 py-14 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-brand-green-soft">
              <img src={ECO_IMAGE} alt="Sustainable Prasadam packaging initiative" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <Leaf className="h-5 w-5 text-[#661714]" />
                <h2 className="font-display text-lg font-medium text-[#661714] md:text-xl">SUSTAINABLE & MINDFUL PACKAGING</h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed mb-6 md:text-lg">
                Our eco-friendly packaging uses <b>recyclable and biodegradable materials</b>, significantly reducing single-use waste while keeping every offering fresh. Every Prasadam box is designed to bring blessings to your home with mindful, sustainable care.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { Icon: Sparkles, label: "Give Better." },
                  { Icon: Recycle, label: "Waste Less." },
                  { Icon: Sparkles, label: "Bless More." },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-3 border-x border-border/70 px-2">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#661714] text-primary-foreground shadow-sm md:h-16 md:w-16">
                      <Icon className="h-8 w-8 md:h-10 md:w-10" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-[#661714]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* CTA FOOTER STRIP */}
        <section className="relative overflow-hidden py-10 text-primary-foreground" style={{ backgroundColor: "#AD1E2A" }}>
          <img
            src="/products-hero-banner.jpg"
            alt="Prasadam devotional offerings collection"
            className="absolute inset-0 h-full w-full object-cover object-[75%_top]"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(173,30,42,0.86) 0%, rgba(173,30,42,0.44) 40%, rgba(173,30,42,0) 70%)" }}
          />
          <div className="container relative mx-auto flex min-h-[210px] md:min-h-[260px] flex-col items-start justify-center gap-4 px-4 text-left">
            <div className="max-w-xl">
              <p className="font-display font-bold text-2xl md:text-3xl">
                PRASADAM<sup className="text-lg">™</sup> <span className="italic font-normal opacity-90">— A Divine Taste.</span>
              </p>
              <p className="mt-1 text-sm text-primary-foreground/80">Blessed Temple Prasad & Devotional Offerings, Delivered With Care.</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="rounded px-6">
              <Link to="/products">EXPLORE COLLECTION <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Dialog open={!!quickView} onOpenChange={(o) => !o && setQuickView(null)}>
        <DialogContent className="max-w-lg">
          {quickView && (
            <>
              <DialogHeader>
                <DialogTitle className="text-brand-navy">{quickView.name}</DialogTitle>
                {quickView.short_description && (
                  <DialogDescription>{quickView.short_description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-secondary/30">
                {quickView.images?.[0] ? (
                  <SignedImage src={quickView.images[0]} alt={quickView.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <DialogFooter className="sm:justify-end">
                <Button asChild className="bg-brand-navy hover:bg-primary-dark">
                  <Link to={`/product/${quickView.slug}`}>
                    View Full Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}