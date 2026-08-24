import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** Rendered on the far right, vertically centered with the title (e.g. "View All" link) */
  action?: ReactNode;
  /** Use light colours when placed on a dark/maroon panel */
  tone?: "default" | "onDark";
}

/** Premium ornament: tapered rule, faceted lozenge, paisley curl and beads */
function Flourish({ flip, tone }: { flip?: boolean; tone: "default" | "onDark" }) {
  const stroke = tone === "onDark" ? "hsl(45 80% 70%)" : "hsl(var(--accent))";
  const id = `orn-${flip ? "b" : "a"}-${tone}`;
  return (
    <svg
      viewBox="0 0 140 18"
      className={`h-[18px] w-[80px] sm:w-[140px] shrink-0 ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0" />
          <stop offset="0.55" stopColor={stroke} stopOpacity="0.55" />
          <stop offset="1" stopColor={stroke} stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* double tapered rule */}
      <path d="M2 9H74" stroke={`url(#${id})`} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M18 12.6H74" stroke={`url(#${id})`} strokeWidth="0.7" strokeLinecap="round" opacity="0.55" />
      <path d="M18 5.4H74" stroke={`url(#${id})`} strokeWidth="0.7" strokeLinecap="round" opacity="0.55" />
      {/* beads */}
      <circle cx="79" cy="9" r="1.1" fill={stroke} opacity="0.8" />
      {/* faceted lozenge */}
      <path d="M84 9l7-5.5 7 5.5-7 5.5z" stroke={stroke} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M84 9h14M91 3.5v11" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
      {/* paisley curls */}
      <path d="M102 9c3.6-6.4 9.6-6.4 11.6-1.2 1 2.6-1.4 4.4-2.9 3-1.2-1.1-.3-3 1.5-3" stroke={stroke} strokeWidth="1.05" strokeLinecap="round" />
      <path d="M102 9c3.6 6.4 9.6 6.4 11.6 1.2" stroke={stroke} strokeWidth="1.05" strokeLinecap="round" opacity="0.8" />
      {/* trailing beads */}
      <circle cx="121" cy="9" r="1.6" fill={stroke} opacity="0.9" />
      <circle cx="128" cy="9" r="1.1" fill={stroke} opacity="0.6" />
      <circle cx="134" cy="9" r="0.8" fill={stroke} opacity="0.4" />
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
