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

export const PromoBanners = ({ onFetchStatus }: PromoBannersProps) => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);

  useEffect(() => {
    (async () => {
      onFetchStatus?.("loading");
      const { data, error } = await supabase
        .from("promo_banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) {
        onFetchStatus?.("error");
        return;
      }
      setBanners((data || []) as PromoBanner[]);
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
    <section className="w-full bg-background py-8 sm:py-12">
      <div className="w-full px-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-6 sm:mb-10">
          <Ornament />
          <h2 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-semibold text-foreground whitespace-nowrap">
            Shop By Category
          </h2>
          <Ornament flip />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {sortedBanners.slice(0, 9).map((banner) => (
            <CardLink
              key={banner.id}
              to={banner.link}
              ariaLabel={banner.title}
              className="group block rounded-[18px] border border-accent/25 bg-card/60 p-2 sm:p-2.5 shadow-[0_2px_16px_rgba(102,23,20,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_28px_rgba(102,23,20,0.14)]"
            >
              <div className="overflow-hidden rounded-[14px]">
                <SignedImage
                  src={banner.image_url || banner.mobile_image_url || null}
                  alt={banner.title}
                  className="w-full aspect-[16/9] object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-4 sm:py-5">
                <div className="min-w-0">
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground leading-tight">
                    {banner.title}
                  </h3>
                  {banner.offer_text && (
                    <p className="mt-1.5 text-[13px] sm:text-sm text-muted-foreground leading-snug line-clamp-2">
                      {banner.offer_text}
                    </p>
                  )}
                </div>
                <span className="shrink-0 grid place-items-center h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-accent text-accent-foreground transition-transform duration-300 group-hover:translate-x-1">
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </div>
            </CardLink>
          ))}
        </div>
      </div>
    </section>
  );
};
