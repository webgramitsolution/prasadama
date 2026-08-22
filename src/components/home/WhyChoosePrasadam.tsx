import { SectionHeading } from "./SectionHeading";

const items = [
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Authentic%20Ingredient.png",
    title: "Authentic Ingredients",
    text: "Carefully selected\nfor pure & rich taste.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Premium%20Quality.png",
    title: "Premium Quality",
    text: "Finest quality sweets\n& snacks, always.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Make%20with%20Devotion.png",
    title: "Made with Devotion",
    text: "Crafted with love,\ntradition & purity.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Perfect%20for%20Gifting.png",
    title: "Perfect for Gifting",
    text: "Beautifully packed\nfor every occasion.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Hygienic%20&%20SAfe.png",
    title: "Hygienic & Safe",
    text: "Prepared & packed\nwith utmost care.",
  },
];

export function WhyChoosePrasadam() {
  return (
    <section className="py-6 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="overflow-hidden rounded-2xl border border-accent/25 bg-[#f6eae0] shadow-sm">
          <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px] items-stretch">
            <div className="p-4 sm:p-6">
              <SectionHeading title="Why Choose Prasadam?" />

              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {items.map((item) => (
                  <div key={item.title} className="flex flex-col items-center text-center">
                    <img
                      src={item.icon}
                      alt={item.title}
                      loading="lazy"
                      className="h-14 w-14 sm:h-16 sm:w-16 md:h-[68px] md:w-[68px] object-contain"
                    />
                    <p className="mt-2 font-display text-[12px] sm:text-[13px] md:text-sm font-semibold text-primary leading-tight">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[10px] sm:text-[11px] md:text-xs text-muted-foreground leading-snug whitespace-pre-line">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[180px] md:h-auto">
              <img
                src="https://ik.imagekit.io/Prasadam/Why%20Choose%20/why.png"
                alt="Prasadam festive gift box with diyas and sweets"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
