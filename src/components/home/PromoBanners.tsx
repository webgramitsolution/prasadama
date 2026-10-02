import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/common/SignedImage";

const isExternalHref = (href: string) => /^(https?:)?\/\//i.test(href) || /^(mailto:|tel:|whatsapp:)/i.test(href);

interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  ribbon_label: string | null;
}

interface PromoBannersProps {
  onFetchStatus?: (status: string) => void;
}

function CardLink({
  to,
  className,
  children,
  ariaLabel,
}: {
  to?: string | null;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const href = to?.trim() || "/products";
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

function CategoryRibbon({ title }: { title: string }) {
  return (
    <div className="promo-category-ribbon" aria-hidden="true">
      <svg viewBox="0 0 100 24" preserveAspectRatio="none">
        <path d="M 6 12 L 0 0 L 100 0 L 94 12 L 100 24 L 0 24 Z" fill="currentColor" />
        <line x1="8" y1="4" x2="92" y2="4" stroke="hsl(var(--accent-foreground))" strokeWidth="0.8" strokeOpacity="0.8" />
        <line x1="8" y1="20" x2="92" y2="20" stroke="hsl(var(--accent-foreground))" strokeWidth="0.8" strokeOpacity="0.8" />
      </svg>
      <span>{title}</span>
    </div>
  );
}

export const PromoBanners = ({ onFetchStatus }: PromoBannersProps) => {
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [hasOverflow, setHasOverflow] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    (async () => {
      onFetchStatus?.("loading");
      const categoryResult = await supabase
          .from("categories")
          .select("id, name, slug, image_url, ribbon_label")
          .eq("is_active", true)
          .eq("show_on_home", true)
          .is("parent_id", null)
          .order("sort_order", { ascending: true });
      if (categoryResult.error) {
        onFetchStatus?.("error");
        return;
      }
      const rows = (categoryResult.data || []) as HomeCategory[];
      setCategories([
        { id: "shop-all", name: "Shop All", slug: "", image_url: rows[0]?.image_url || null, ribbon_label: "Shop All" },
        ...rows,
      ]);
      onFetchStatus?.("success");
    })();
  }, [onFetchStatus]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateOverflow = () => setHasOverflow(rail.scrollWidth > rail.clientWidth + 2);
    updateOverflow();

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(rail);
    Array.from(rail.children).forEach((child) => resizeObserver.observe(child));

    return () => resizeObserver.disconnect();
  }, [categories.length]);

  useEffect(() => {
    const rail = railRef.current;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!rail || !hasOverflow || prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      if (isInteractingRef.current) return;
      const firstCard = rail.firstElementChild as HTMLElement | null;
      if (!firstCard) return;

      const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
      const step = firstCard.offsetWidth + gap;
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      const next = rail.scrollLeft + step;
      rail.scrollTo({ left: next >= maxScroll - 2 ? 0 : next, behavior: "smooth" });
    }, 3500);

    return () => window.clearInterval(timer);
  }, [hasOverflow, categories.length]);

  if (categories.length === 0) return null;

  return (
    <section className="w-full overflow-hidden bg-promo-category py-[8px] pb-[30px]">
      <div className="w-full py-2">
        <div
          ref={railRef}
          aria-label="Shop by category"
          onPointerDown={() => { isInteractingRef.current = true; }}
          onPointerUp={() => { isInteractingRef.current = false; }}
          onPointerCancel={() => { isInteractingRef.current = false; }}
          onPointerLeave={() => { isInteractingRef.current = false; }}
          onFocusCapture={() => { isInteractingRef.current = true; }}
          onBlurCapture={() => { isInteractingRef.current = false; }}
          className={`flex overflow-x-auto gap-6 snap-x snap-mandatory scroll-smooth px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${hasOverflow ? "justify-start" : "justify-center"}`}
        >
          {categories.map((category, i) => (
            <CardLink
              key={category.id}
              to={category.slug ? `/products?category=${encodeURIComponent(category.slug)}` : "/products"}
              ariaLabel={category.name}
              className="group relative block w-[92px] shrink-0 snap-start no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:w-[118px] lg:w-[138px]"
            >
              <div className="relative aspect-square transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none">
                <div className="h-full w-full overflow-hidden rounded-full border-2 border-accent/30 bg-muted shadow-sm">
                <SignedImage
                  src={category.image_url}
                  alt={category.name}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(max-width: 639px) 92px, (max-width: 1023px) 118px, 138px"
                  className="h-full w-full object-cover object-center"
                />
                </div>
                <CategoryRibbon title={category.ribbon_label?.trim() || category.name} />
              </div>
            </CardLink>
          ))}
        </div>
      </div>
    </section>
  );
};
