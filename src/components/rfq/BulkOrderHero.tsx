import { Boxes, Headphones, Settings, Users } from "lucide-react";

const RFQ_HERO_URL = "https://ik.imagekit.io/webgramitsolution/bulk%20order%20page.png";

const highlights = [
  { icon: Boxes, title: "Bulk Order Enquiries", detail: "Special pricing for large quantities" },
  { icon: Settings, title: "Custom Product Requirements", detail: "Tailored to your requirements" },
  { icon: Headphones, title: "Dedicated Sales Assistance", detail: "Personalized support from our team" },
];

export function BulkOrderHero() {
  return (
    <section className="relative h-[190px] overflow-hidden border-b border-border sm:h-[220px] lg:h-[230px]">
      <img
        src={RFQ_HERO_URL}
        alt="Prasadam bulk sweets and festive gifting"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="relative mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-3 py-3 text-center">
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-[9px] font-bold text-accent shadow-sm sm:text-[10px]">
          <Users className="h-3 w-3" /> B2B PROCUREMENT
        </div>
        <h1 className="font-serif text-[26px] font-bold leading-none text-foreground sm:text-[34px] lg:text-[38px]">
          Bulk Orders &amp; <span className="text-accent">Custom Quotations</span>
        </h1>
        <p className="mt-1.5 max-w-xl text-[10px] leading-4 text-muted-foreground sm:text-xs">
          Looking to order in bulk? Share your product requirements and receive a tailored quotation from our team.
        </p>
        <div className="mt-3 grid w-full max-w-2xl grid-cols-3">
          {highlights.map(({ icon: Icon, title, detail }, index) => (
            <div key={title} className="flex min-w-0 items-center justify-center gap-2 px-2 sm:border-r sm:border-accent/20 sm:last:border-0">
              <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent bg-card text-accent sm:flex">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-center sm:text-left">
                <strong className="block text-[9px] leading-3 text-foreground sm:text-[10px]">{title}</strong>
                <span className="hidden text-[8px] leading-3 text-muted-foreground sm:block">{detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}