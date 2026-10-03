import { Boxes, Headphones, Settings, Users } from "lucide-react";

const RFQ_HERO_URL = "https://ik.imagekit.io/webgramitsolution/bulk%20order%20page.png";

const highlights = [
  { icon: Boxes, title: "Bulk Order Enquiries", detail: "Special pricing for large quantities" },
  { icon: Settings, title: "Custom Product Requirements", detail: "Tailored to your requirements" },
  { icon: Headphones, title: "Dedicated Sales Assistance", detail: "Personalized support from our team" },
];

export function BulkOrderHero({ variant = "rfq" }: { variant?: "rfq" | "checkout" }) {
  const isCheckout = variant === "checkout";

  return (
    <section className={isCheckout
      ? "relative h-[152px] overflow-hidden border-b border-border sm:h-[170px] lg:h-[178px]"
      : "relative h-[172px] overflow-hidden border-b border-border sm:h-[194px] lg:h-[206px]"
    }>
      <img
        src={RFQ_HERO_URL}
        alt="Prasadam bulk sweets and festive gifting"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="relative mx-auto flex h-full w-[58%] max-w-[610px] flex-col items-center justify-center px-1 py-2 text-center sm:w-[54%] lg:w-[50%]">
        {!isCheckout && (
          <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-0.5 text-[7px] font-bold text-accent shadow-sm sm:text-[8px]">
            <Users className="h-2.5 w-2.5" /> B2B PROCUREMENT
          </div>
        )}
        <h1 className="whitespace-nowrap font-serif text-[15px] font-bold leading-none text-foreground sm:text-[24px] lg:text-[28px]">
          {isCheckout ? "Checkout" : <>Bulk Orders &amp; <span className="text-accent">Custom Quotations</span></>}
        </h1>
        {!isCheckout && (
          <>
            <p className="mt-1 max-w-[440px] text-[7px] leading-[10px] text-muted-foreground sm:text-[9px] sm:leading-3">
              Looking to order in bulk? Share your product requirements and receive<br className="hidden sm:block" /> a tailored quotation from our team.
            </p>
            <div className="mt-2 grid w-full max-w-[500px] grid-cols-3">
              {highlights.map(({ icon: Icon, title, detail }, index) => (
                <div key={title} className="flex min-w-0 items-center justify-center gap-1 px-1 sm:gap-2 sm:border-r sm:border-accent/20 sm:last:border-0">
                  <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent bg-card text-accent sm:flex">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 text-center sm:text-left">
                    <strong className="block text-[7px] leading-[9px] text-foreground sm:text-[8px] sm:leading-[10px]">{title}</strong>
                    <span className="hidden text-[6px] leading-[8px] text-muted-foreground sm:block">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}