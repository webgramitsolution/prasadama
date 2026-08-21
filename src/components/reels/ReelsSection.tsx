import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X as XIcon, Volume2, VolumeX, Play, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { parseReelUrl } from "./reelUtils";
import { cn } from "@/lib/utils";
import { SignedImage } from "@/components/common/SignedImage";
import { Header } from "@/components/layout/Header";
import { useReducedMotionReels } from "@/hooks/useReducedMotionReels";
import { SectionHeading } from "@/components/home/SectionHeading";
import { useCart } from "@/contexts/CartContext";
import { RailDots, useRailDots } from "@/components/common/RailDots";

interface ReelRow {
  id: string;
  video_url: string;
  title: string | null;
  object_fit?: "contain" | "cover" | null;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[] | null;
    guest_price: number;
    retail_price: number;
    regular_price: number;
    short_description: string | null;
    has_variations: boolean | null;
  } | null;
}

interface ReelsSectionProps {
  title?: string;
  excludeProductId?: string;
  limit?: number;
  placement?: "home" | "product";
}

export function ReelsSection({ title = "Featured Videos", excludeProductId, limit = 12, placement = "home" }: ReelsSectionProps) {
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const { active: dotActive, pages: dotPages, goTo: dotGoTo } = useRailDots(scrollerRef, reels.length, 2);
  const { autoplayDisabled } = useReducedMotionReels();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const placementCol = placement === "home" ? "show_on_home" : "show_on_product";
      const effectiveLimit = Math.min(limit, 8);
      const { data } = await supabase
        .from("product_reels")
        .select("id, video_url, title, show_on_home, show_on_product, object_fit, product:products(id, name, slug, images, guest_price, retail_price, regular_price, short_description, has_variations)")
        .eq(placementCol, true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(effectiveLimit);
      const rows = ((data || []) as unknown as ReelRow[]).filter((r) => r.product);
      setReels(rows);
      setLoading(false);
    })();
  }, [excludeProductId, limit, placement]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-10 bg-background -mt-10">
        <div className="container mx-auto px-3 sm:px-4">
          <SectionHeading title={title} />
          <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-[calc((100%-12px)/2)] sm:w-[30%] md:w-[23%] lg:w-[18%] flex-shrink-0 space-y-2 snap-start">
                <Skeleton className="aspect-[9/16] w-full rounded-xl" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reels.length === 0) return null;

  return (
    <section className="pt-8 sm:pt-10 pb-4 sm:pb-5 bg-background -mt-10">
      <div className="container mx-auto px-3 sm:px-4 relative">
        <SectionHeading title={title} />
        <div className="relative">
          <button type="button" onClick={() => scrollBy(-1)} className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-background border border-border shadow-md rounded-full p-2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-background border border-border shadow-md rounded-full p-2">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div ref={scrollerRef} className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {reels.map((reel, idx) => (
              <ReelCard key={reel.id} reel={reel} onOpen={() => setActiveIndex(idx)} autoplayDisabled={autoplayDisabled} />
            ))}
          </div>
        </div>
        <RailDots active={dotActive} pages={dotPages} goTo={dotGoTo} />
      </div>
      {activeIndex !== null && reels[activeIndex] && (
        <ReelModal reels={reels} index={activeIndex} onClose={() => setActiveIndex(null)} onIndexChange={setActiveIndex} />
      )}
    </section>
  );
}

function ReelCard({ reel, onOpen, autoplayDisabled }: { reel: ReelRow; onOpen: () => void; autoplayDisabled: boolean }) {
  const product = reel.product!;
  const objectFit = reel.object_fit === "contain" ? "contain" : "cover";
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const price = product.guest_price > 0 ? product.guest_price : product.retail_price;
  const mrp = product.regular_price > 0 ? product.regular_price : price;
  const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

  useEffect(() => {
    if (!videoRef.current || autoplayDisabled) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [autoplayDisabled]);

  return (
    <div onClick={onOpen} className="snap-start flex-shrink-0 w-[calc((100%-12px)/2)] sm:w-[30%] md:w-[23%] lg:w-[19%] group relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm cursor-pointer aspect-[9/16]">
      <div className="absolute inset-0 bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={reel.video_url}
          muted
          loop
          playsInline
          className={cn("w-full h-full", objectFit === "contain" ? "object-contain" : "object-cover")}
          poster={product.images?.[0] || ""}
        />
        {autoplayDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Play className="h-8 w-8 text-white fill-white/20" />
          </div>
        )}
      </div>
      
      {/* Floating Info Card at Bottom */}
      <div className="absolute left-2 right-2 bottom-[10px] z-10">
        <div className="bg-white rounded-xl shadow-lg p-2 flex items-center gap-2">
           <div className="w-9 h-9 rounded-lg overflow-hidden bg-secondary shrink-0 border border-border/50">
             <SignedImage src={product.images?.[0] || ""} alt="" className="w-full h-full object-cover" />
           </div>
           <div className="flex-1 min-w-0">
             <p className="text-[10px] font-bold truncate text-foreground leading-none mb-0.5">{product.name}</p>
             <div className="flex items-baseline gap-1">
               <span className="text-[11px] font-extrabold text-[#d97706]">₹{price.toLocaleString("en-IN")}</span>
               {discount > 0 && (
                 <span className="text-[9px] text-muted-foreground line-through opacity-70">₹{mrp.toLocaleString("en-IN")}</span>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ReelModal({ reels, index, onClose, onIndexChange }: { reels: ReelRow[]; index: number; onClose: () => void; onIndexChange: (i: number) => void }) {
  const reel = reels[index];
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!reel) return null;
  const product = reel.product!;
  
  const price = product.guest_price > 0 ? product.guest_price : product.retail_price;
  const mrp = product.regular_price > 0 ? product.regular_price : price;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);
    try {
      await addToCart(product.id, 1, null);
    } finally {
      setIsAdding(false);
    }
  };

  const prevIdx = index > 0 ? index - 1 : reels.length - 1;
  const nextIdx = index < reels.length - 1 ? index + 1 : 0;
  const prevReel = reels[prevIdx];
  const nextReel = reels[nextIdx];

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col overflow-hidden" onClick={onClose}>
      {/* Show App Header inside Modal */}
      <div className="w-full shrink-0 relative z-[200]" onClick={e => e.stopPropagation()}>
        <div className="[&>header]:!relative [&>header]:!top-0 [&>header]:!z-0 [&>header]:!shadow-none [&>header>div]:!shadow-none">
          <Header />
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-0 overflow-hidden">
        {/* Carousel: prev / active / next reels visible */}
        <div className="relative flex items-center justify-center gap-0 sm:gap-0" onClick={e => e.stopPropagation()}>
          {/* Previous Reel (peeking behind, smaller & dimmed) */}
          {prevReel && prevIdx !== index && (
            <div
              className="relative w-[180px] h-[300px] sm:w-[200px] sm:h-[336px] bg-black rounded-3xl overflow-hidden opacity-50 scale-90 cursor-pointer shrink-0 -mr-[22px]"
              onClick={(e) => { e.stopPropagation(); onIndexChange(prevIdx); }}
            >
              <SignedImage src={prevReel.product?.images?.[0] || ""} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}

          {/* Active Reel */}
          <div
            className="relative w-[250px] h-[420px] bg-black rounded-3xl overflow-hidden z-[105] my-[30px] shrink-0"
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              src={reel.video_url}
              autoPlay
              loop
              muted={muted}
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Top Shadow Gradient */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

            {/* Top Controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                className="bg-black/30 backdrop-blur-md rounded-full p-2.5 text-white border border-white/20 hover:bg-black/50 transition-colors"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>

            {/* Center Play Icon (appears when paused) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10">
                <div className="bg-black/30 backdrop-blur-sm rounded-full p-6 border border-white/10">
                  <Play className="h-12 w-12 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Bottom Shadow Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10" />

            {/* Product Info Card - MATCHING HOME GRID DESIGN */}
            <div className="absolute bottom-[10px] left-4 right-4 z-20" onClick={e => e.stopPropagation()}>
              <Link
                to={`/product/${product.slug}`}
                className="bg-white rounded-xl p-2 flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-gray-100 transition-transform active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                  <SignedImage
                    src={product.images?.[0] || ""}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-[10px] font-bold text-gray-900 truncate leading-none mb-0.5 uppercase tracking-tight">
                    {product.name}
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] font-extrabold text-[#d97706]">₹{price.toLocaleString("en-IN")}</span>
                    {mrp > price && (
                      <span className="text-[9px] text-gray-400 line-through opacity-70">₹{mrp.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Next Reel (peeking behind, smaller & dimmed) */}
          {nextReel && nextIdx !== index && (
            <div
              className="relative w-[180px] h-[300px] sm:w-[200px] sm:h-[336px] bg-black rounded-3xl overflow-hidden opacity-50 scale-90 cursor-pointer shrink-0 -ml-[22px]"
              onClick={(e) => { e.stopPropagation(); onIndexChange(nextIdx); }}
            >
              <SignedImage src={nextReel.product?.images?.[0] || ""} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1 z-[120] pointer-events-none w-full max-w-[950px] mx-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange(prevIdx); }}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-black bg-white hover:bg-gray-100 rounded-full transition-all pointer-events-auto shadow-xl active:scale-95"
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange(nextIdx); }}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-black bg-white hover:bg-gray-100 rounded-full transition-all pointer-events-auto shadow-xl active:scale-95"
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
