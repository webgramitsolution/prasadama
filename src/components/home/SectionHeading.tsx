import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** Rendered on the far right, vertically centered with the title (e.g. "View All" link) */
  action?: ReactNode;
  /** Use light colours when placed on a dark/maroon panel */
  tone?: "default" | "onDark";
}

/** Ornamental flourish: tapered line + diamond + small curls (festive Indian motif) */
function Flourish({ flip, tone }: { flip?: boolean; tone: "default" | "onDark" }) {
  const stroke = tone === "onDark" ? "hsl(45 80% 70%)" : "hsl(var(--accent))";
  return (
    <svg
      viewBox="0 0 120 16"
      className={`h-4 w-[70px] sm:w-[120px] shrink-0 ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fl-${flip ? "b" : "a"}-${tone}`} x1="0" x2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0" />
          <stop offset="1" stopColor={stroke} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d="M2 8H82" stroke={`url(#fl-${flip ? "b" : "a"}-${tone})`} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M86 8l5-4.5 5 4.5-5 4.5z" stroke={stroke} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M100 8c4-6 10-6 12 0" stroke={stroke} strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
      <path d="M100 8c4 6 10 6 12 0" stroke={stroke} strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
      <circle cx="118" cy="8" r="1.4" fill={stroke} />
    </svg>
  );
}

export function SectionHeading({ title, subtitle, action, tone = "default" }: SectionHeadingProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="relative flex items-center justify-center gap-2 sm:gap-4">
        <Flourish flip tone={tone} />
        <h2
          className={`text-lg sm:text-2xl md:text-3xl font-display font-medium whitespace-nowrap leading-none text-center ${
            tone === "onDark" ? "text-[hsl(45,80%,88%)]" : "text-foreground"
          }`}
        >
          {title}
        </h2>
        <Flourish tone={tone} />

        {action && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 leading-none hidden sm:flex items-center">
            {action}
          </div>
        )}
      </div>
      {action && <div className="mt-2 flex justify-center sm:hidden">{action}</div>}
      {subtitle && (
        <p className={`mt-1.5 text-xs sm:text-sm text-center ${tone === "onDark" ? "text-[hsl(45,60%,82%)]" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
