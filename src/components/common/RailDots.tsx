import { RefObject, useEffect, useState } from "react";

/**
 * Tracks horizontal scroll position of a rail and exposes page dots.
 * Pages are computed from item count / items visible per page (2 on phones).
 */
export function useRailDots(
  ref: RefObject<HTMLElement>,
  itemCount: number,
  perPage = 2
) {
  const [active, setActive] = useState(0);
  const pages = Math.max(1, Math.ceil(itemCount / perPage));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0 || pages <= 1) {
        setActive(0);
        return;
      }
      const ratio = el.scrollLeft / max;
      setActive(Math.min(pages - 1, Math.round(ratio * (pages - 1))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref, pages, itemCount]);

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: pages > 1 ? (max * i) / (pages - 1) : 0, behavior: "smooth" });
  };

  return { active, pages, goTo };
}

interface RailDotsProps {
  active: number;
  pages: number;
  goTo: (i: number) => void;
  className?: string;
}

export function RailDots({ active, pages, goTo, className = "" }: RailDotsProps) {
  if (pages <= 1) return null;
  return (
    <div className={`mt-3 flex sm:hidden items-center justify-center gap-1.5 ${className}`}>
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => goTo(i)}
          className={`h-1.5 rounded-full transition-all ${
            active === i ? "w-4 bg-accent" : "w-1.5 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}
