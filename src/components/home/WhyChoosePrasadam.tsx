const BG = "https://ik.imagekit.io/4hcna271xz/banner%201%20about%20us.png?updatedAt=1787551782146";

const items = [
  {
    icon: "https://ik.imagekit.io/4hcna271xz/Icon/100_%20Pure%20&%20Premium%20Ingredients.png?updatedAt=1787553430578",
    title: "100% Pure &\nPremium Ingredients",
    text: "No Preservatives,\nOnly Goodness",
  },
  {
    icon: "https://ik.imagekit.io/4hcna271xz/Icon/Traditional%20Recipes.png?updatedAt=1787553430297",
    title: "Traditional\nRecipes",
    text: "Timeless Taste,\nAuthentic Flavours",
  },
  {
    icon: "https://ik.imagekit.io/4hcna271xz/Icon/Made%20with%20Devotion.png?updatedAt=1787553430398",
    title: "Made with\nDevotion",
    text: "Prasad Quality,\nBlessed with Love",
  },
  {
    icon: "https://ik.imagekit.io/4hcna271xz/Icon/Prefrect%20for%20Every%20Occasion.png?updatedAt=1787553430561",
    title: "Prefrect for\nEvery Occasion",
    text: "Festive Specials,\nGift Hampers",
  },
];

function Flourish({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 60 16"
      className={`h-4 w-10 sm:w-14 shrink-0 ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 8h34" stroke="#8a2b1f" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M40 8l6-4.5 6 4.5-6 4.5z" stroke="#8a2b1f" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="56" cy="8" r="1.2" fill="#8a2b1f" />
    </svg>
  );
}

export function WhyChoosePrasadam() {
  return (
    <section
      className="relative w-full bg-no-repeat bg-cover bg-center mb-5 overflow-hidden rounded-[10px]"
      style={{ backgroundImage: `url("${BG}")` }}
      aria-label="Why Choose Prasadaim"
    >
      <div className="mx-auto w-full px-4 py-6 sm:py-8 md:ml-[6.5%] md:mr-0 md:w-[62%] md:px-0 md:py-10">
        <div className="text-center">
          <h2 className="font-display text-xl sm:text-2xl md:text-[30px] font-medium text-[#6b1d16] flex items-center justify-center gap-2 sm:gap-3">
            <Flourish flip />
            <span>Why Choose Prasadaim?</span>
            <Flourish />
          </h2>
          <p className="mt-1 text-[11px] sm:text-xs md:text-sm tracking-wide text-[#8a4a2f]">
            Pure • Traditional • Divine
          </p>
        </div>

        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-5 md:w-4/5">
          {items.map((item, i) => (
            <div
              key={item.title}
              className={`flex flex-col items-center text-center px-1 md:px-2 ${
                i > 0 ? "md:border-l md:border-[#c9a06a]/40" : ""
              }`}
            >
              <img
                src={item.icon}
                alt={item.title.replace(/\n/g, " ")}
                loading="lazy"
                className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 object-contain"
              />
              <p className="mt-2 font-semibold text-[11px] sm:text-xs md:text-[13px] leading-tight text-[#6b1d16] whitespace-pre-line">
                {item.title}
              </p>
              <p className="mt-1 text-[10px] sm:text-[11px] leading-snug text-[#96552f] whitespace-pre-line">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
