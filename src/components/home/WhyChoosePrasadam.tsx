import { SectionHeading } from "./SectionHeading";

const items = [
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Authentic%20Ingredient.png",
    title: "Authentic Ingredients",
    text: "Carefully selected for pure & rich taste.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Premium%20Quality.png",
    title: "Premium Quality",
    text: "Finest quality sweets & snacks, always.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Make%20with%20Devotion.png",
    title: "Made with Devotion",
    text: "Crafted with love, tradition & purity.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Perfect%20for%20Gifting.png",
    title: "Perfect for Gifting",
    text: "Beautifully packed for every occasion.",
  },
  {
    icon: "https://ik.imagekit.io/Prasadam/Why%20Choose%20/Hygienic%20&%20SAfe.png",
    title: "Hygienic & Safe",
    text: "Prepared & packed with utmost care.",
  },
];

export function WhyChoosePrasadam() {
  return (
    <section className="py-6 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="rounded-2xl border border-accent/30 bg-[#FBF4E9] p-3 sm:p-5 shadow-sm">
          <SectionHeading title="Why Choose Prasadam?" />

          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] items-stretch">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {items.map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center">
                  <img
                    src={item.icon}
                    alt={item.title}
                    loading="lazy"
                    className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
                  />
                  <p className="mt-2 text-[13px] sm:text-sm font-semibold text-primary">{item.title}</p>
                  <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-snug">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-accent/30 min-h-[180px]">
              <img
                src="/auth-pooja.jpg"
                alt="Prasadam festive gift box with diyas"
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
