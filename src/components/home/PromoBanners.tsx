import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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

function Ornament({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 24"
      className={`h-4 w-[70px] sm:w-[110px] text-accent/70 ${flip ? "scale-x-[-1]" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 12 H70" stroke="currentColor" strokeWidth="1" />
      <path d="M70 12 C80 4, 90 4, 96 12 C90 20, 80 20, 70 12 Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="104" cy="7" r="2" fill="currentColor" />
      <circle cx="104" cy="17" r="2" fill="currentColor" />
      <circle cx="112" cy="12" r="2.5" fill="currentColor" />
      <circle cx="96" cy="12" r="2" fill="currentColor" />
    </svg>
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
    <section className="w-full bg-background py-6 sm:py-10 lg:py-12">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-5 mb-5 sm:mb-8 lg:mb-10">
          <Ornament />
          <h2 className="font-display text-lg sm:text-2xl lg:text-[28px] font-medium text-foreground whitespace-nowrap">
            Shop By Category
          </h2>
          <Ornament flip />
        </div>

        <div className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sortedBanners.slice(0, 9).map((banner, i) => (
            <CardLink
              key={banner.id}
              to={getCategoryHref(banner, categories)}
              ariaLabel={banner.title}
              className="group block snap-start flex-shrink-0 w-[78vw] sm:w-[300px] lg:w-[320px] rounded-[16px] sm:rounded-[18px] border border-accent/25 bg-card/60 p-2 sm:p-2.5 shadow-[0_2px_16px_rgba(102,23,20,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_10px_30px_rgba(102,23,20,0.16)]"
            >
              <div className="overflow-hidden rounded-[12px] sm:rounded-[14px] bg-muted/40">
                <SignedImage
                  src={banner.image_url || banner.mobile_image_url || null}
                  alt={banner.title}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(max-width: 640px) 78vw, 320px"
                  className="w-full aspect-[16/9] object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3.5 sm:py-5">
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg lg:text-xl font-semibold text-foreground leading-tight">
                    {banner.title}
                  </h3>
                  {banner.offer_text && (
                    <p className="mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] lg:text-sm text-muted-foreground leading-snug line-clamp-2">
                      {banner.offer_text}
                    </p>
                  )}
                </div>
                <span className="shrink-0 grid place-items-center h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-full bg-accent text-accent-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-105">
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </CardLink>
          ))}
        </div>
      </div>
    </section>
  );
};
