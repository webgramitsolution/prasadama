import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/common/SignedImage";

const isExternalHref = (href: string) => /^(https?:)?\/\//i.test(href) || /^(mailto:|tel:|whatsapp:)/i.test(href);

interface PromoBanner {
  id: string;
  title: string;
  offer_text: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  link: string | null;
}

interface CategoryLink {
  name: string;
  slug: string;
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

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j] ?? j;
      row[j] = Math.min(current + 1, (row[j - 1] ?? i) + 1, previous + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length] ?? Math.max(a.length, b.length);
}

function getCategoryHref(banner: PromoBanner, categories: CategoryLink[]) {
  const title = normalizeName(banner.title);
  const closest = categories
    .map((category) => ({ category, distance: editDistance(title, normalizeName(category.name)) }))
    .sort((a, b) => a.distance - b.distance)[0];

  // Category titles occasionally contain a small spelling difference in the promo manager.
  if (closest && closest.distance <= 2) {
    return `/products?category=${encodeURIComponent(closest.category.slug)}`;
  }
  return banner.link;
}

export const PromoBanners = ({ onFetchStatus }: PromoBannersProps) => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const [hasOverflow, setHasOverflow] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    (async () => {
      onFetchStatus?.("loading");
      const [bannerResult, categoryResult] = await Promise.all([
        supabase
          .from("promo_banners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("categories")
          .select("name, slug")
          .eq("is_active", true)
          .is("parent_id", null),
      ]);
      if (bannerResult.error || categoryResult.error) {
        onFetchStatus?.("error");
        return;
      }
      setBanners((bannerResult.data || []) as PromoBanner[]);
      setCategories((categoryResult.data || []) as CategoryLink[]);
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
  }, [banners.length]);

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
  }, [hasOverflow, banners.length]);

  if (banners.length === 0) return null;

  const sortedBanners = [...banners];
  const shopAllIndex = sortedBanners.findIndex((b) => b.title.toLowerCase().trim() === "shop all");
  if (shopAllIndex > 0) {
    const shopAll = sortedBanners[shopAllIndex];
    if (shopAll) {
      sortedBanners.splice(shopAllIndex, 1);
      sortedBanners.unshift(shopAll);
    }
  }

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
          {sortedBanners.map((banner, i) => (
            <CardLink
              key={banner.id}
              to={getCategoryHref(banner, categories)}
              ariaLabel={banner.title}
              className="group relative block w-[85px] shrink-0 snap-start no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:w-[110px] lg:w-[130px]"
            >
              <div className="relative aspect-square transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none">
                <div className="h-full w-full overflow-hidden rounded-full border-2 border-accent/30 bg-muted shadow-sm">
                <SignedImage
                  src={banner.image_url || banner.mobile_image_url || null}
                  alt={banner.title}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(max-width: 639px) 85px, (max-width: 1023px) 110px, 130px"
                  className="h-full w-full object-cover object-center"
                />
                </div>
                <CategoryRibbon title={banner.title} />
              </div>
            </CardLink>
          ))}
        </div>
      </div>
    </section>
  );
};
