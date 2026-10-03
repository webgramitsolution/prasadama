import { Gift, ShieldCheck, Truck, Users } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Bulk Order Enquiries", detail: "Special pricing for large quantities" },
  { icon: Gift, title: "Custom Packaging Assistance", detail: "Tailored for your occasion or brand" },
  { icon: Users, title: "Dedicated Business Support", detail: "Personalized assistance from our team" },
  { icon: ShieldCheck, title: "Trusted Quality", detail: "Pure ingredients, authentic taste" },
];

export function RFQBenefits() {
  return (
    <section className="bg-promo-category px-4 py-4" aria-label="Bulk order benefits">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border border-t border-border pt-4 md:grid-cols-4">
        {benefits.map(({ icon: Icon, title, detail }) => (
          <div key={title} className="flex items-center gap-3 px-3 py-2">
            <Icon className="h-7 w-7 shrink-0 text-accent" />
            <span>
              <strong className="block text-xs text-accent">{title}</strong>
              <span className="text-[10px] text-muted-foreground">{detail}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}