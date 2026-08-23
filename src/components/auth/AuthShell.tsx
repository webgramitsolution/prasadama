import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useIsMobile } from "@/hooks/use-mobile";


const SLIDES = [
  "https://ik.imagekit.io/Prasadam/Testimonial/Testimonial%202.png?updatedAt=1787421749821",
  "https://ik.imagekit.io/Prasadam/Testimonial/testimonial.png?updatedAt=1787421001373",
  "https://ik.imagekit.io/Prasadam/Testimonial/testimonial%201?updatedAt=1787420142981",
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

  // Login stays app-like and fixed; signup can scroll on small phones so the
  // "Create Account" CTA is always reachable.
  useEffect(() => {
    if (mode === "signup") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
              src="/prasadam-logo.png"
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
          className={`flex-1 bg-white rounded-t-[32px] px-5 pt-6 ${mode === "signup" ? "pb-9" : "pb-24"} shadow-[0_-8px_30px_rgba(0,0,0,0.15)] overflow-y-auto [&::-webkit-scrollbar]:hidden`}
          style={{ minHeight: 500, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <Tabs mode={mode} />
          <div className="bg-white rounded-2xl p-4">{children}</div>
          <img
            src="https://ik.imagekit.io/Prasadam/Status-scaled.jpg?updatedAt=1787405014112"
            alt="Prasadam divine offerings"
            loading="lazy"
            decoding="async"
            className="mt-6 w-full rounded-xl object-cover"
          />

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
      <Header />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0">
        {/* Left — tabbed form */}
        <div className="flex items-start justify-center px-5 sm:px-5 md:px-5 lg:px-5 py-6 md:py-8 bg-white overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="w-full max-w-2xl mt-5">
            <Tabs mode={mode} />
            <div className="bg-white rounded-2xl px-4 pb-4">{children}</div>

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
