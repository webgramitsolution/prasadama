import { useState, useEffect } from "react";
import { Star, StarHalf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ReviewsSummaryProps {
  productId: string;
  variant?: "default" | "compact";
}

export function ReviewsSummary({ productId, variant = "default" }: ReviewsSummaryProps) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc("get_product_review_stats", { _product_id: productId });
      const row: any = Array.isArray(data) ? data[0] : data;
      if (row && Number(row.review_count) > 0) {
        setAvg(Math.round(Number(row.avg_rating) * 10) / 10);
        setCount(Number(row.review_count));
      } else {
        setCount(0);
        setAvg(0);
      }
    };
    fetch();
  }, [productId]);

  if (count === 0) return null;

  return (
    <div className={cn(
      "flex items-center bg-[#f3f9f2] rounded border border-[#e2e8e1] overflow-hidden px-2 py-0.5",
      variant === "compact" ? "h-6" : "h-7"
    )}>
      <div className={cn(
        "flex items-center gap-0.5 h-full",
        variant === "default" && "border-r border-[#d1d7d0] pr-1"
      )}>
        <div className={cn(
          "flex items-center gap-0.5",
          variant === "default" ? "mr-1" : "mr-1"
        )}>
          {variant === "compact" ? (
            <Star className="h-3.5 w-3.5 fill-[#ffa41c] text-[#ffa41c]" />
          ) : (
            [1, 2, 3, 4, 5].map((star) => {
              const fullStars = Math.floor(avg);
              const hasHalfStar = avg % 1 >= 0.3 && avg % 1 <= 0.7;
              
              if (star <= fullStars) {
                return <Star key={star} className="h-4 w-4 fill-[#ffa41c] text-[#ffa41c]" />;
              } else if (star === fullStars + 1 && hasHalfStar) {
                return <StarHalf key={star} className="h-4 w-4 fill-[#ffa41c] text-[#ffa41c]" />;
              } else if (star === fullStars + 1 && avg % 1 > 0.7) {
                 return <Star key={star} className="h-4 w-4 fill-[#ffa41c] text-[#ffa41c]" />;
              } else {
                return <Star key={star} className="h-4 w-4 text-muted-foreground" />;
              }
            })
          )}
        </div>
        <span className={cn(
          "font-bold text-foreground leading-none",
          variant === "compact" ? "text-sm" : "text-base"
        )}>
          {avg}{variant === "default" ? "/5" : ` / ${count}`}
        </span>
      </div>
      {variant === "default" && (
        <span className="text-sm font-medium text-foreground whitespace-nowrap leading-none pl-2">
          {count} reviews
        </span>
      )}
    </div>
  );
}
