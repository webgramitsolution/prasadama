import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/common/SignedImage";
import { RailDots, useRailDots } from "@/components/common/RailDots";

interface WideBanner {
  id: string;
  title: string | null;
  offer_text: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link: string | null;
}

const isExternal = (href: string) => /^(https?:)?\/\//i.test(href);

export function WidePromoBanners() {
  const [banners, setBanners] = useState<WideBanner[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const { active, pages, goTo } = useRailDots(railRef, banners.length, 1);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("promo_banners")
      .select("id, title, offer_text, image_url, mobile_image_url, link")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (mounted) setBanners((data as WideBanner[] | null) || []);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || banners.length <= 1) return;

    const phone = window.matchMedia("(max-width: 639px)");
    const interval = window.setInterval(() => {
      if (!phone.matches) return;
      const cards = Array.from(rail.children) as HTMLElement[];
      if (cards.length < 2) return;
      const current = cards.findIndex((card) => Math.abs(card.offsetLeft - rail.scrollLeft) < card.offsetWidth / 2);
      const next = cards[(current + 1) % cards.length];
      next?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }, 3500);

    return () => window.clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="bg-background py-7 sm:py-9" aria-label="Promo banners">
      <div className="container mx-auto px-3 sm:px-4">
        <div ref={railRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
          {banners.map((banner) => {
            const href = banner.link?.trim() || "/products";
            const content = (
              <div className="relative aspect-[16/7] overflow-hidden rounded-[8px] bg-muted sm:aspect-[21/7]">
                {banner.mobile_image_url && <SignedImage src={banner.mobile_image_url} alt={banner.title || "Prasadam offer"} className="absolute inset-0 h-full w-full object-cover sm:hidden" />}
                <SignedImage src={banner.image_url} alt={banner.title || "Prasadam offer"} className={`${banner.mobile_image_url ? "hidden sm:block" : "block"} absolute inset-0 h-full w-full object-cover`} />
                {(banner.title || banner.offer_text) && (
                  <div className="absolute inset-x-0 bottom-0 bg-foreground/70 px-4 py-3 text-card">
                    {banner.title && <p className="text-base font-bold sm:text-xl">{banner.title}</p>}
                    {banner.offer_text && <p className="text-xs sm:text-sm">{banner.offer_text}</p>}
                  </div>
                )}
              </div>
            );
            return isExternal(href) ? (
              <a key={banner.id} href={href} target="_blank" rel="noopener noreferrer" className="w-full shrink-0 snap-start sm:w-[calc(50%-0.5rem)]">{content}</a>
            ) : (
              <Link key={banner.id} to={href} className="w-full shrink-0 snap-start sm:w-[calc(50%-0.5rem)]">{content}</Link>
            );
          })}
        </div>
        <RailDots active={active} pages={pages} goTo={goTo} />
      </div>
    </section>
  );
}