import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgePercent } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "./SectionHeading";
import { RailDots, useRailDots } from "@/components/common/RailDots";

interface DealProduct {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  guest_price: number;
  retail_price: number;
  shop_price: number;
  regular_price: number;
  has_variations: boolean | null;
}

export function OffersDeals() {
  const [products, setProducts] = useState<DealProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const railRef = useRef<HTMLDivElement>(null);
  const { active, pages, goTo } = useRailDots(railRef, products.length, 2);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("products")
      .select("id, name, slug, images, guest_price, retail_price, shop_price, regular_price, has_variations")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => {
        if (!mounted) return;
        const deals = ((data as DealProduct[] | null) || [])
          .filter((product) => {
            const sellingPrice = product.guest_price > 0 ? product.guest_price : product.retail_price;
            return product.regular_price > sellingPrice;
          })
          .slice(0, 10);
        setProducts(deals);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-card py-7 sm:py-9" aria-label="Offers and deals">
      <div className="container mx-auto px-3 sm:px-4">
        <SectionHeading
          title="Offers & Deals"
          action={
            <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="w-[calc((100%-12px)/2)] shrink-0 space-y-2 sm:w-[31%] lg:w-[calc((100%-48px)/5)]">
                <Skeleton className="aspect-square rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div ref={railRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} className={`w-[calc((100%-12px)/2)] shrink-0 snap-start sm:w-[31%] lg:w-full ${index >= 5 ? "lg:hidden" : ""}`} />
              ))}
            </div>
            <RailDots active={active} pages={pages} goTo={goTo} />
          </>
        )}
        {!loading && products.length > 0 && (
          <div className="sr-only"><BadgePercent />Products with current savings</div>
        )}
      </div>
    </section>
  );
}