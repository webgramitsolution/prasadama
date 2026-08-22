import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useIsMobile } from "@/hooks/use-mobile";


const SLIDES = [
  "/products-hero-banner.jpg",
  "/auth-mithai.jpg",
  "/auth-pooja.jpg",
];

const BRAND = "#AD1E2A";

interface Props {
  mode: "login" | "signup";
  children: ReactNode;
}

function Tabs({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="flex bg-[#F5F5F5] p-1 rounded-full mb-8 relative w-full border border-gray-100">
      <Link
        to="/login"
        className={`flex-1 py-2.5 text-sm font-semibold text-center rounded-full transition-all duration-300 relative z-10 ${
          mode === "login" ? "text-white shadow-md" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Login
      </Link>
      <Link
        to="/signup"
        className={`flex-1 py-2.5 text-sm font-semibold text-center rounded-full transition-all duration-300 relative z-10 ${
          mode === "signup" ? "text-white shadow-md" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Signup
      </Link>
      <div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-500 ease-in-out shadow-lg"
        style={{
          left: mode === "login" ? "4px" : "calc(50%)",
          backgroundColor: BRAND,
        }}
      />
    </div>
  );
}

export function AuthShell({ mode, children }: Props) {
  const [idx, setIdx] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Login stays app-like and fixed; signup can scroll on small phones so CTA remains visible.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = mode === "signup" ? "auto" : "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mode]);

  if (isMobile) {
    return (
      <div className={mode === "signup" ? "min-h-[100dvh] flex flex-col" : "fixed inset-0 flex flex-col overflow-hidden"} style={{ backgroundColor: BRAND }}>
        {/* Hero — logo only (clickable, returns to home). Meets 44×44 tap-target
            guidance and shows a premium hover/active state with a soft ring. */}
        <div className="flex flex-col items-center justify-center pt-10 pb-6 shrink-0">
          <Link
            to="/"
            aria-label="Go to Prasadam home"
            className="group h-24 w-24 min-h-11 min-w-11 rounded-full bg-white flex items-center justify-center ring-2 ring-white/40 overflow-hidden shadow-lg transition-all duration-200 hover:ring-white/80 hover:shadow-2xl hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
          >
            <img
              src="/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png"
              alt="Prasadam"
              width={80}
              height={80}
              loading="eager"
              decoding="sync"
              // @ts-ignore - fetchpriority is valid HTML
              fetchpriority="high"
              className="h-20 w-20 object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        </div>


        {/* White sheet with form */}
        <div
          className={`flex-1 bg-white rounded-t-[32px] px-5 pt-6 ${mode === "signup" ? "pb-9" : "pb-24"} shadow-[0_-8px_30px_rgba(0,0,0,0.15)] overflow-y-auto`}
          style={{ minHeight: 500 }}
        >
          <Tabs mode={mode} />
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
      <Header />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0">
        {/* Left — tabbed form */}
        <div className="flex items-center justify-center px-4 sm:px-8 md:px-14 lg:px-20 py-8 md:py-12 bg-white overflow-y-auto">
          <div className="w-full max-w-xl">
            <Tabs mode={mode} />
            {children}
          </div>
        </div>

        {/* Right — slider */}
        <div className="hidden md:flex relative bg-secondary items-center justify-center overflow-hidden">
          {SLIDES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== idx}
            />
          ))}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === idx ? "w-6" : "w-2 bg-white/70"
                }`}
                style={i === idx ? { backgroundColor: BRAND, width: "1.5rem" } : undefined}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
