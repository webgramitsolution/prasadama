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

interface PromoBannersProps {
  onFetchStatus?: (status: string) => void;
}

function CircleLink({
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

export const PromoBanners = ({ onFetchStatus }: PromoBannersProps) => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

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

  // Ensure "Shop All" is always first in the list
  const sortedBanners = [...banners];
  const shopAllIndex = sortedBanners.findIndex(b => b.title.toLowerCase().trim() === 'shop all');
  if (shopAllIndex > 0) {
    const shopAll = sortedBanners[shopAllIndex];
    if (shopAll) {
      sortedBanners.splice(shopAllIndex, 1);
      sortedBanners.unshift(shopAll);
    }
  }
  
  // Use loop for mobile/tablet marquee, but static list for desktop
  const loop = sortedBanners.length >= 4 ? [...sortedBanners, ...sortedBanners] : [...sortedBanners, ...sortedBanners, ...sortedBanners, ...sortedBanners];
  
  const itemWidth = "w-[85px] sm:w-[110px] lg:w-[130px]";

  const Item = ({ banner, className }: { banner: PromoBanner; className?: string }) => (
    <CircleLink
      to={banner.link}
      ariaLabel={banner.title}
      className={`group flex flex-col items-center flex-shrink-0 ${itemWidth} ${className || ""}`}
    >
      <div className="relative w-full aspect-square transition-transform duration-300 group-hover:scale-105">
        {/* Circular Image Wrapper - Ensured 100% circle */}
        <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-accent/30 bg-secondary relative z-0">
          {banner.mobile_image_url && (
            <SignedImage
              src={banner.mobile_image_url}
              alt={banner.title}
              className="block sm:hidden w-full h-full object-cover object-center"
            />
          )}
          <SignedImage
            src={banner.image_url || banner.mobile_image_url || null}
            alt={banner.title}
            className={`${banner.mobile_image_url ? "hidden sm:block" : "block"} w-full h-full object-cover object-center`}
          />
        </div>
        
        {/* Banner Title overlay at the center */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="relative w-full flex items-center justify-center">
            {/* The Ribbon Wrapper: A straight ribbon with V-notches at both ends */}
            <div className="relative w-[105%] flex items-center justify-center pointer-events-none">
              <svg 
                viewBox="0 0 100 24" 
                className="w-full drop-shadow-lg overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Main Ribbon Body: Straight with Inward V-Notches (Fish-tail ends) */}
                <path 
                  d="M 6 12 L 0 0 L 100 0 L 94 12 L 100 24 L 0 24 Z" 
                  fill="#ad1e2a" 
                />
                
                {/* Top Border Line (White, Straight) */}
                <line 
                  x1="8" y1="4" x2="92" y2="4" 
                  stroke="white" 
                  strokeWidth="0.8"
                  strokeOpacity="0.8"
                />

                {/* Bottom Border Line (White, Straight) */}
                <line 
                  x1="8" y1="20" x2="92" y2="20" 
                  stroke="white" 
                  strokeWidth="0.8"
                  strokeOpacity="0.8"
                />
              </svg>

              {/* Centered Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <p className="text-[7px] sm:text-[9px] lg:text-[10px] font-bold text-white text-center leading-none uppercase tracking-tight line-clamp-1">
                  {banner.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {banner.offer_text && (
        <p className="hidden sm:block text-[10px] lg:text-[11px] font-medium text-accent text-center leading-tight line-clamp-1 mt-1">
          {banner.offer_text}
        </p>
      )}
    </CircleLink>
  );

  return (
    <section className="w-full mb-[-30px] bg-[#f7f6f4] overflow-hidden pb-[30px]">
      <div className="w-full overflow-hidden py-2 marquee-track">
        <div className={`flex w-max gap-4 sm:gap-6 px-4 py-4 overflow-visible ${!isDesktop ? 'animate-marquee-slow' : 'justify-center mx-auto'}`}>
          {(!isDesktop ? loop : sortedBanners.slice(0, 8)).map((banner, i) => (
            <Item key={`${banner.id}-${i}`} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
};
