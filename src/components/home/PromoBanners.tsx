import { useEffect, useState } from "react";
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
    <section className="w-full bg-white py-6 sm:py-10 lg:py-12">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-5 mb-5 sm:mb-8 lg:mb-10">
          <Ornament />
          <h2 className="font-display text-lg sm:text-2xl lg:text-[28px] font-medium text-foreground whitespace-nowrap">
            Shop By Category
          </h2>
          <Ornament flip />
        </div>

        <div className="flex overflow-x-auto gap-3 sm:gap-5 lg:justify-center lg:gap-6 snap-x snap-mandatory py-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sortedBanners.slice(0, 9).map((banner, i) => (
            <CardLink
              key={banner.id}
              to={getCategoryHref(banner, categories)}
              ariaLabel={banner.title}
              className="group relative block shrink-0 snap-start w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.84rem)] lg:w-[calc(14.285%-1.29rem)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
            >
              <div className="relative aspect-square overflow-hidden rounded-full border-2 border-accent/30 bg-muted/40 transition-all duration-300 group-hover:border-accent/60 group-hover:shadow-lg">
                <SignedImage
                  src={banner.image_url || banner.mobile_image_url || null}
                  alt={banner.title}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 15vw"
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]"
                />
              </div>

              <div className="absolute left-1/2 top-1/2 z-10 flex h-8 w-[106%] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-accent px-4 [clip-path:polygon(0_0,7%_50%,0_100%,100%_100%,93%_50%,100%_0)] sm:h-9 lg:h-8">
                <h3 className="max-w-full truncate text-center font-sans text-[11px] font-bold uppercase text-accent-foreground sm:text-xs lg:text-[11px]">
                  {banner.title}
                </h3>
              </div>
            </CardLink>
          ))}
        </div>
      </div>
    </section>
  );
};
