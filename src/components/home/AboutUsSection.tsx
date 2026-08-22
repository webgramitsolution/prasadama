import { Link } from "react-router-dom";
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./SectionHeading";




const highlights = [
  { icon: Leaf, title: "Pure & Sattvik", text: "Prepared with devotion using pure, natural ingredients." },
  { icon: ShieldCheck, title: "Hygiene assured", text: "Every batch checked for freshness and purity before it reaches you." },
  { icon: Sparkles, title: "Blessed offerings", text: "Thoughtfully packed prasad and pooja samagri for home & temple." },
];

export function AboutUsSection() {
  return (
    <section className="py-8 sm:py-10 bg-white">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="overflow-hidden rounded-xl border border-border h-full max-h-[340px] lg:max-h-[380px] mt-5">
            <img
              src="https://ik.imagekit.io/Prasadam/Product%20B/Product%20B%20(6).png?updatedAt=1787383431347"
              alt="Prasadam blessed temple offerings"
              loading="lazy"
              className="w-full h-full min-h-[200px] sm:min-h-[260px] max-h-[320px] lg:max-h-[360px] object-cover object-top bg-white"
            />
          </div>



          <div className="flex flex-col justify-center">
            <SectionHeading title="About Us" />

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">

              Prasadam is an Indian devotional brand bringing you thoughtfully prepared temple prasad, mithai,
              dry fruit prasad and pooja samagri for homes and temples alike. We obsess over the small things —
              purity of ingredients, hygienic packing, freshness in every box — so every offering feels truly blessed.
            </p>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              From single boxes to bulk temple orders, we serve devotees across 20,000+ pincodes with honest pricing,
              responsive support and offerings we happily bring into our own homes and pujas.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-lg border border-border bg-card p-3">
                  <Icon className="h-5 w-5 text-accent mb-2" />
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{text}</p>
                </div>
              ))}
            </div>

            <Link to="/about-us" className="block w-full mt-5">
              <Button className="w-full bg-accent hover:bg-accent-hover text-sm">
                Know More <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>

          </div>
        </div>

      </div>
    </section>
  );
}
