import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Truck, ShoppingBag, X, ArrowRight } from "lucide-react";

export type OrderFlowStage = "idle" | "processing" | "success" | "confirmed" | "thanks";

interface Props {
  stage: OrderFlowStage;
  orderNumber: string;
  total: number;
  onStageChange: (s: OrderFlowStage) => void;
  onViewOrder: () => void;
  onContinue: () => void;
  onClose: () => void;
}

const LOGO = "/cdn/prasadam-logo-transparent.png";

function estimatedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function useIsDesktop() {
  const [v, setV] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  useEffect(() => {
    const on = () => setV(window.innerWidth >= 768);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

/** Rose/marigold petal confetti burst */
function Petals({ count = 22 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 110 + Math.random() * 90;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.85,
          r: Math.random() * 360,
          s: 0.7 + Math.random() * 0.7,
          gold: i % 3 === 0,
          delay: Math.random() * 0.25,
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {petals.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 40], opacity: [0, 1, 1, 0.85], scale: p.s, rotate: p.r }}
          transition={{ duration: 1.6, delay: 0.15 + p.delay, ease: "easeOut" }}
          style={{
            width: 10,
            height: 14,
            borderRadius: "60% 40% 60% 40%",
            background: p.gold ? "hsl(var(--osf-gold))" : "hsl(var(--osf-rose))",
          }}
        />
      ))}
    </div>
  );
}

function Mandala({ size = 220, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="absolute"
      aria-hidden="true"
      animate={spin ? { rotate: 360 } : undefined}
      transition={spin ? { duration: 30, repeat: Infinity, ease: "linear" } : undefined}
    >
      <g fill="none" stroke="hsl(var(--osf-gold))" strokeOpacity="0.35" strokeWidth="1">
        {Array.from({ length: 16 }).map((_, i) => (
          <ellipse key={i} cx="100" cy="52" rx="14" ry="40" transform={`rotate(${i * 22.5} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="92" strokeDasharray="2 4" />
      </g>
    </motion.svg>
  );
}

function CheckBadge({ size = 120 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 1.9, height: size * 1.9 }}>
      <Mandala size={size * 1.9} />
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size * 1.25,
          height: size * 1.25,
          background: "hsl(var(--osf-gold) / 0.18)",
          clipPath:
            "polygon(50% 0%,61% 11%,77% 6%,82% 22%,98% 27%,93% 43%,100% 50%,93% 57%,98% 73%,82% 78%,77% 94%,61% 89%,50% 100%,39% 89%,23% 94%,18% 78%,2% 73%,7% 57%,0% 50%,7% 43%,2% 27%,18% 22%,23% 6%,39% 11%)",
        }}
      >
        <div
          className="flex items-center justify-center rounded-full shadow-lg"
          style={{ width: size * 0.82, height: size * 0.82, background: "hsl(var(--osf-maroon))", border: "3px solid hsl(var(--osf-gold))" }}
        >
          <svg viewBox="0 0 52 52" width={size * 0.45} height={size * 0.45} aria-hidden="true">
            <motion.path
              d="M14 27 l8 8 l17 -18"
              fill="none"
              stroke="hsl(var(--osf-gold))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
            />
          </svg>
        </div>
      </motion.div>
      <Petals />
    </div>
  );
}

function Logo({ className = "h-14" }: { className?: string }) {
  return <img src={LOGO} alt="Prasadam" className={`${className} w-auto object-contain mx-auto`} />;
}

const screen = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.4 },
};

export function OrderSuccessFlow({ stage, orderNumber, total, onStageChange, onViewOrder, onContinue, onClose }: Props) {
  const isDesktop = useIsDesktop();
  const eta = useMemo(estimatedDelivery, [orderNumber]);

  // Auto-advance mobile sequence: success -> confirmed -> thanks
  useEffect(() => {
    if (isDesktop) return;
    if (stage === "success") {
      const t = setTimeout(() => onStageChange("confirmed"), 2200);
      return () => clearTimeout(t);
    }
    if (stage === "confirmed") {
      const t = setTimeout(() => onStageChange("thanks"), 2600);
      return () => clearTimeout(t);
    }
  }, [stage, isDesktop, onStageChange]);

  useEffect(() => {
    if (stage === "idle") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [stage]);

  if (stage === "idle") return null;
  const done = stage !== "processing";

  const OrderCard = (
    <div className="rounded-xl bg-card shadow-[0_6px_24px_-10px_hsl(var(--osf-maroon)/0.35)] p-4 text-left">
      <div className="flex items-center justify-between font-semibold text-foreground">
        <span>Order #{orderNumber}</span>
        <span>₹{total.toLocaleString("en-IN")}</span>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
        <Truck className="h-5 w-5" style={{ color: "hsl(var(--osf-maroon))" }} />
        <div>
          <p className="text-[11px] text-muted-foreground">Estimated Delivery</p>
          <p className="text-sm font-medium text-foreground">{eta}</p>
        </div>
      </div>
      <button onClick={onViewOrder} className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline" style={{ color: "hsl(var(--osf-maroon))" }}>
        Track Order <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const Buttons = ({ row = false }: { row?: boolean }) => (
    <div className={row ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
      <button onClick={onViewOrder} className="osf-btn-primary">View Order Details</button>
      <button onClick={onContinue} className="osf-btn-outline">Continue Shopping</button>
    </div>
  );

  return (
    <div className="osf fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" aria-live="polite" aria-label="Order status">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" />

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative w-full h-full md:h-auto md:max-w-[520px] md:rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--osf-cream))" }}
      >
        {done && (
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex h-full flex-col items-center justify-center px-6 py-10 md:py-8 text-center">
          <AnimatePresence mode="wait">
            {stage === "processing" && (
              <motion.div key="p" {...screen} className="flex flex-col items-center">
                <Logo />
                <div className="relative mt-6 flex h-[240px] w-[240px] items-center justify-center">
                  <Mandala size={240} spin />
                  <svg className="absolute" width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
                    <circle cx="100" cy="100" r="88" fill="hsl(var(--card))" stroke="hsl(var(--osf-gold) / 0.3)" strokeWidth="8" />
                    <motion.circle
                      cx="100" cy="100" r="88" fill="none"
                      stroke="hsl(var(--osf-maroon))" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray="553"
                      initial={{ strokeDashoffset: 553 }}
                      animate={{ strokeDashoffset: [553, 140, 553] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      style={{ rotate: -90, transformOrigin: "100px 100px" }}
                    />
                  </svg>
                  <motion.img
                    src="/cdn/osf-cart.webp" alt="" aria-hidden="true"
                    className="relative w-[110px] h-[110px] object-contain"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </div>
                <h2 className="osf-title mt-6">Processing<br />Your Order...</h2>
                <p className="mt-3 max-w-[240px] text-sm text-muted-foreground">Please wait, we are confirming your order.</p>
              </motion.div>
            )}

            {stage === "success" && (
              <motion.div key="s" {...screen} className="flex flex-col items-center">
                <Logo className={isDesktop ? "h-10" : "h-14"} />
                <CheckBadge size={isDesktop ? 72 : 100} />
                <h2 className="osf-title">Order Placed Successfully!</h2>
                <p className="mt-2 max-w-[300px] text-sm text-muted-foreground">Thank you for shopping with Prasadam by Divine Taste.</p>
                {isDesktop && (
                  <div className="mt-5 w-full">
                    <div className="mb-4 grid grid-cols-2 gap-3 text-left">
                      <div className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-sm">
                        <ShoppingBag className="h-5 w-5" style={{ color: "hsl(var(--osf-maroon))" }} />
                        <span className="text-sm text-foreground">Order #{orderNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-sm">
                        <Truck className="h-5 w-5" style={{ color: "hsl(var(--osf-maroon))" }} />
                        <div>
                          <p className="text-[11px] text-muted-foreground">Estimated Delivery</p>
                          <p className="text-sm font-medium text-foreground">{eta}</p>
                        </div>
                      </div>
                    </div>
                    <Buttons row />
                  </div>
                )}
              </motion.div>
            )}

            {stage === "confirmed" && (
              <motion.div key="c" {...screen} className="flex w-full max-w-[320px] flex-col items-center">
                <Logo />
                <div className="relative my-4 h-[170px] w-full">
                  <Petals count={14} />
                  <motion.img
                    src="/cdn/osf-truck.webp" alt="" aria-hidden="true"
                    className="absolute inset-0 m-auto h-full w-full object-contain"
                    initial={{ x: -220, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 90, damping: 14 }}
                  />
                </div>
                <h2 className="osf-title">Your Order<br />is Confirmed!</h2>
                <p className="mt-2 mb-5 text-sm text-muted-foreground">We have received your order and will start preparing it soon.</p>
                <div className="w-full">{OrderCard}</div>
              </motion.div>
            )}

            {stage === "thanks" && (
              <motion.div key="t" {...screen} className="flex w-full max-w-[320px] flex-col items-center">
                <Logo />
                <motion.img
                  src="/cdn/osf-thankyou.webp" alt="" aria-hidden="true"
                  className="my-4 h-[190px] w-full object-contain"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 160, damping: 14 }}
                />
                <h2 className="osf-title text-4xl">Thank You!</h2>
                <p className="mt-2 mb-6 text-sm text-muted-foreground">Your order has been placed successfully. We appreciate your trust in us.</p>
                <div className="w-full"><Buttons /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
