import { useState, useEffect } from "react";
import { BadgePercent, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  code: string;
  title?: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
}

interface ProductCouponsProps {
  categoryId?: string | null;
}

// Dashed-border green coupon strip.
export function ProductCoupons({ categoryId }: ProductCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCoupons = async () => {
      const { data } = await supabase.rpc("list_public_coupons" as any, {
        _category_id: categoryId ?? null,
      });
      const filtered = (Array.isArray(data) ? data : []).filter((c: any) => c.show_on_product);
      setCoupons(filtered.slice(0, 4) as Coupon[]);
    };
    fetchCoupons();
  }, [categoryId]);

  if (coupons.length === 0) return null;

  const handleCopy = (coupon: Coupon) => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedId(coupon.id);
    toast({ title: "Copied!", description: `Coupon code ${coupon.code} copied.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-2.5">
      {coupons.map((c) => {
        const isCopied = copiedId === c.id;
        const label =
          c.title ||
          c.description ||
          (c.discount_type === "percentage"
            ? `Get flat ${c.discount_value}% Discount.`
            : `Get flat ₹${c.discount_value} Discount.`);
        return (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-xl border border-dashed border-[#1e7a3c]/50 bg-[#f1f8f2] px-3 py-2.5 sm:px-4 sm:py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e7a3c] text-white">
              <BadgePercent className="h-4 w-4" />
            </span>

            <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] sm:text-[14px] font-medium text-[#1b5e33]">
              <span className="truncate">{label} Use code</span>
              <span className="rounded-md bg-[#e2efe4] px-2 py-0.5 text-[13px] sm:text-[14px] font-semibold tracking-wide text-[#14532d]">
                {c.code}
              </span>
            </p>

            <button
              type="button"
              onClick={() => handleCopy(c)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#1e7a3c]/40 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-[#1b5e33] transition-colors hover:bg-[#e9f4ea]"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{isCopied ? "Copied" : "Copy Code"}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
