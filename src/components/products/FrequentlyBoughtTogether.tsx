import { useEffect, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/common/SignedImage";
import { supabase } from "@/integrations/supabase/client";

interface FrequentlyBoughtProduct {
  id: string;
  name: string;
  images: string[] | null;
  guest_price: number;
  retail_price: number;
  regular_price: number;
}

interface FrequentlyBoughtTogetherProps {
  currentProduct: FrequentlyBoughtProduct;
  categoryId?: string | null;
  onAdd: (productId: string) => Promise<boolean>;
}

export function FrequentlyBoughtTogether({ currentProduct, categoryId, onAdd }: FrequentlyBoughtTogetherProps) {
  const [products, setProducts] = useState<FrequentlyBoughtProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let query = supabase
        .from("products")
        .select("id, name, images, guest_price, retail_price, regular_price")
        .eq("is_active", true)
        .neq("id", currentProduct.id)
        .limit(3);
      if (categoryId) query = query.eq("category_id", categoryId);
      const { data } = await query.order("created_at", { ascending: false });
      if (!cancelled) setProducts((data || []) as FrequentlyBoughtProduct[]);
    };
    load();
    return () => { cancelled = true; };
  }, [categoryId, currentProduct.id]);

  if (products.length === 0) return null;

  const priceOf = (product: FrequentlyBoughtProduct) =>
    product.guest_price > 0 ? product.guest_price : product.retail_price;

  const addProduct = async (productId: string) => {
    setAddingId(productId);
    try {
      const added = await onAdd(productId);
      if (added) setSelected((previous) => new Set(previous).add(productId));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="md:hidden border-t border-border bg-background px-3 py-4" aria-labelledby="frequently-bought-heading">
      <h2 id="frequently-bought-heading" className="text-xl font-bold text-foreground">Frequently Bought Together</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">These products are usually bought together</p>

      <div className="mt-3 space-y-2">
        {[currentProduct, ...products].map((item, index) => {
          const price = priceOf(item);
          const mrp = item.regular_price > price ? item.regular_price : price;
          const isCurrent = index === 0;
          const isSelected = isCurrent || selected.has(item.id);
          return (
            <article
              key={item.id}
              className={isCurrent ? "flex min-h-24 items-center gap-3 rounded-md border border-accent/30 p-2" : "flex min-h-24 items-center gap-3 rounded-md border border-border p-2"}
            >
              <SignedImage
                src={item.images?.[0] || "/placeholder.svg"}
                alt={item.name}
                className="h-20 w-24 shrink-0 rounded-md bg-muted object-contain"
              />
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground">{item.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className={isSelected ? "flex h-5 w-5 items-center justify-center rounded border border-accent bg-accent text-accent-foreground" : "flex h-5 w-5 items-center justify-center rounded border border-muted-foreground"}>
                    {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="text-xs text-muted-foreground">{isCurrent ? "Current product" : isSelected ? "Added" : "Add this item"}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">₹{price.toLocaleString("en-IN")}</p>
                  {mrp > price && <p className="text-xs text-muted-foreground line-through">₹{mrp.toLocaleString("en-IN")}</p>}
                </div>
                {!isCurrent && !isSelected && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 min-w-20 gap-1"
                    onClick={() => addProduct(item.id)}
                    disabled={addingId === item.id}
                  >
                    {addingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}