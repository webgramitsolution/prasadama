import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";

interface Product {
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

interface RelatedProductsProps {
  currentProductId: string;
  categoryId?: string | null;
}

export function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || products.length === 0) return;
    const idx = Math.round((el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)) * (products.length - 1)) || 0;
    setActive(Math.min(products.length - 1, Math.max(0, idx)));
  };

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true);
      
      let query = supabase
        .from("products")
        .select("id, name, slug, images, guest_price, retail_price, shop_price, regular_price, has_variations")
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(10);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data } = await query.order("created_at", { ascending: false });

      if (!data || data.length < 10) {
        const existing = data?.map(p => p.id) || [];
        const { data: moreData } = await supabase
          .from("products")
          .select("id, name, slug, images, guest_price, retail_price, shop_price, regular_price, has_variations")
          .eq("is_active", true)
          .not("id", "in", `(${[currentProductId, ...existing].join(",")})`)
          .order("created_at", { ascending: false })
          .limit(10 - (data?.length || 0));

        setProducts([...(data || []), ...(moreData || [])] as unknown as Product[]);
      } else {
        setProducts(data as unknown as Product[]);
      }
      
      setLoading(false);
    };

    fetchRelatedProducts();
  }, [currentProductId, categoryId]);

  if (loading) {
    return (
      <div className="mt-8">
        <Skeleton className="h-8 w-48 mb-6 mx-auto" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="related-products-heading">
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-5">
        <span aria-hidden className="hidden sm:block h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-border" />
        <h2 id="related-products-heading" className="text-lg sm:text-xl font-display font-bold text-foreground text-center">
          Related Products
        </h2>
        <span aria-hidden className="hidden sm:block h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-border" />
      </div>

      {/* Horizontal horizontal scroller for all devices */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex gap-1.5 sm:gap-[10px] overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product, idx) => (
          <div 
            key={product.id} 
            className="snap-start shrink-0 w-[calc(50%-3px)] sm:w-[calc(25%-7.5px)] lg:w-[calc(20%-8px)]"
          >
            <ProductCard product={product} index={idx} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {products.map((p, i) => (
          <span
            key={p.id}
            aria-hidden
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-4 bg-primary" : "w-1.5 bg-border"}`}
            onClick={() => {
              const el = scrollerRef.current;
              if (!el) return;
              const max = el.scrollWidth - el.clientWidth;
              el.scrollTo({ left: (max * i) / (products.length - 1), behavior: "smooth" });
            }}
          />
        ))}
      </div>
    </section>
  );
}
