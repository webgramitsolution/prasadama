import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead, SchemaGenerators } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ChevronRight, Droplets, Leaf, Shield, ArrowRight, Sparkles, Scale, ShoppingBag } from "lucide-react";

const faqs = [
  {
    question: "What is the significance of Temple Prasad?",
    answer:
      "Prasad is a material substance that is first offered to a deity and then consumed by devotees. It is considered to be infused with the deity's blessing and is a key part of Hindu worship, representing divine grace and the sharing of spiritual merit.",
  },
  {
    question: "How to ensure the purity of Bhog?",
    answer:
      "Purity in Bhog is maintained by using Sattvic ingredients like pure ghee, organic grains, and fresh fruits. The preparation should be done in a clean, dedicated space with a meditative and devotional mindset, avoiding any prohibited ingredients.",
  },
  {
    question: "Which Prasad is best for different occasions?",
    answer:
      "Ladoo and Modak are traditional for Ganesh Chaturthi, while Halwa or Kheer are often offered during Purnima or Navratri. Dry fruits and Mishri are versatile options that have a long shelf life and are suitable for daily offerings.",
  },
  {
    question: "Is it better to buy Prasad or make it at home?",
    answer:
      "While home-made Prasad is ideal for personal devotion, authentic Temple Prasad sourced from sacred sites carries unique spiritual energy. Prasadam ensures that even when you buy, you get offerings prepared with traditional methods and pure ingredients.",
  },
  {
    question: "Are these offerings suitable for daily pooja?",
    answer:
      "Yes. Our offerings are specially curated to be suitable for daily rituals (Nitya Pooja) as well as special occasions. They are packaged to maintain freshness and sanctity.",
  },
];

const rows: Array<{
  property: string;
  bamboo: string;
  cotton: string;
  winner: "bamboo" | "cotton" | "tie";
}> = [
  { property: "Purity & Sanctity", bamboo: "High (Traditional Prep)", cotton: "Variable (Commercial)", winner: "bamboo" },
  { property: "Ingredient Quality", bamboo: "Pure Ghee & Natural", cotton: "Often uses substitutes", winner: "bamboo" },
  { property: "Spiritual Significance", bamboo: "High (Sacred Tradition)", cotton: "General Sweet", winner: "bamboo" },
  { property: "Preparation Mindset", bamboo: "Devotional & Meditative", cotton: "Production Focused", winner: "bamboo" },
  { property: "Shelf Life (Natural)", bamboo: "Longer (Dry Fruit/Mithai)", cotton: "Short (Standard)", winner: "bamboo" },
  { property: "Authenticity", bamboo: "Temple-Style Authentic", cotton: "Modern Variations", winner: "bamboo" },
  { property: "Price", bamboo: "Premium (for purity)", cotton: "Economical", winner: "cotton" },
  { property: "Customizability", bamboo: "Ritual-Specific", cotton: "Generic", winner: "bamboo" },
  { property: "Packaging", bamboo: "Sanitary & Sacred", cotton: "Commercial Standard", winner: "bamboo" },
  { property: "Divine Blessing", bamboo: "Core Focus", cotton: "Not Applicable", winner: "bamboo" },
];


export default function BambooVsCottonTowels() {
  const url = "https://houskase.com/guides/bamboo-vs-cotton-towels";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Guide to Pure Temple Prasad & Devotional Offerings",
      description:
        "A guide to choosing the purest temple prasad and devotional offerings. Understand the significance of different types of Bhog for your pooja.",
      author: { "@type": "Organization", name: "Prasadam" },
      publisher: {
        "@type": "Organization",
        name: "Prasadam",
        logo: { "@type": "ImageObject", url: "https://houskase.com/icon-512.png" },
      },
      mainEntityOfPage: url,
      inLanguage: "en-IN",
      datePublished: "2026-07-16",
    },
    SchemaGenerators.breadcrumb([
      { name: "Home", url: "https://houskase.com/" },
      { name: "Guides", url: "https://houskase.com/guides/bamboo-vs-cotton-towels" },
      { name: "Guide to Pure Temple Prasad", url },
    ]),
    SchemaGenerators.faqPage(faqs),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Guide to Pure Temple Prasad & Devotional Offerings"
        description="Explore the tradition of temple prasad and learn how to select the best offerings for your devotional needs."
        keywords="temple prasad, devotional offerings, best mithai for pooja, dry fruit prasad, pure bhog India"
        canonical={url}
        ogType="article"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="pt-4 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/products" className="hover:text-foreground">Guides</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Guide to Pure Temple Prasad</span>
          </nav>

          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Scale className="h-3.5 w-3.5" /> Buyer's Guide
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Guide to Pure Temple Prasad & Devotional Offerings
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl">
              Authentic temple offerings are not just sweets; they are a medium of divine grace. Here's a guide to understanding the purity and significance of the Prasad we offer.
            </p>
          </motion.header>

          {/* Verdict card */}
          <section aria-labelledby="verdict" className="mb-12 rounded-2xl border border-accent/30 bg-accent/5 p-6 md:p-8">
            <h2 id="verdict" className="text-xl md:text-2xl font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" /> Our Promise
            </h2>
            <p className="text-foreground leading-relaxed">
              At <strong>Prasadam</strong>, we believe that devotional offerings must be pure and authentic. Our Prasad is prepared using traditional recipes and Sattvic ingredients like pure A2 ghee and organic grains, ensuring that your pooja is performed with the highest standards of sanctity.
            </p>
          </section>

          {/* Comparison table */}
          <section aria-labelledby="comparison" className="mb-14">
            <h2 id="comparison" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
              Prasadam vs. Market Sweets
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Property</th>
                    <th className="text-left px-4 py-3 font-semibold">Prasadam</th>
                    <th className="text-left px-4 py-3 font-semibold">Commercial Sweets</th>
                    <th className="text-left px-4 py-3 font-semibold">Winner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.property} className="bg-card">
                      <td className="px-4 py-3 font-medium text-foreground">{r.property}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.bamboo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.cotton}</td>
                      <td className="px-4 py-3">
                        <span className={
                          r.winner === "bamboo"
                            ? "inline-flex items-center rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-semibold"
                            : r.winner === "cotton"
                              ? "inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold"
                              : "text-xs text-muted-foreground"
                        }>
                          {r.winner === "tie" ? "Tie" : r.winner === "bamboo" ? "Prasadam" : "Market"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Spiritual Significance */}
          <section aria-labelledby="significance" className="mb-14">
            <h2 id="significance" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Droplets className="h-6 w-6 text-accent" /> Spiritual Significance of Bhog
            </h2>
            <p className="text-foreground leading-relaxed mb-3">
              Bhog is the food offered to a deity. In the Bhagavad Gita, Lord Krishna says that he accepts whatever is offered with love and devotion—be it a leaf, a flower, a fruit, or water. When we offer Bhog, it becomes Prasad, sanctified by the Lord's acceptance.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Using pure ingredients is essential because the food we offer should be 'Sattvic'—pure, clean, and wholesome. This purity helps in calming the mind and elevating our spiritual state.
            </p>
          </section>

          {/* Purity Standards */}
          <section aria-labelledby="purity" className="mb-14">
            <h2 id="purity" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Leaf className="h-6 w-6 text-accent" /> Our Purity Standards
            </h2>
            <ul className="space-y-2 text-foreground">
              <li className="flex gap-2"><span className="text-accent font-bold">•</span> Sourced from certified Sattvic kitchens that follow traditional preparation rules.</li>
              <li className="flex gap-2"><span className="text-accent font-bold">•</span> Only pure cow ghee and natural sweeteners are used in our mithai.</li>
              <li className="flex gap-2"><span className="text-accent font-bold">•</span> No artificial preservatives, colors, or flavors are added.</li>
              <li className="flex gap-2"><span className="text-accent font-bold">•</span> Packaged in eco-friendly and sanitary containers to maintain sanctity.</li>
            </ul>
          </section>

          {/* Choosing the Right Offering */}
          <section aria-labelledby="choosing" className="mb-14">
            <h2 id="choosing" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> Choosing the Right Offering
            </h2>
            <p className="text-foreground leading-relaxed mb-3">
              Depending on the deity and the occasion, different types of Prasad are preferred:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary font-bold">•</span> <span><strong className="text-foreground">Daily Pooja</strong> — Dry fruits, Mishri, or simple Besan Ladoo are perfect.</span></li>
              <li className="flex gap-2"><span className="text-primary font-bold">•</span> <span><strong className="text-foreground">Special Festivals</strong> — Modak for Ganesh, Halwa for Devi, or seasonal fruits.</span></li>
              <li className="flex gap-2"><span className="text-primary font-bold">•</span> <span><strong className="text-foreground">Bhog for Annakut</strong> — A variety of 56 dishes (Chhappan Bhog) for grand occasions.</span></li>
              <li className="flex gap-2"><span className="text-primary font-bold">•</span> <span><strong className="text-foreground">Travel & Distant Pooja</strong> — Dry fruit mixes are best as they stay fresh longer.</span></li>
            </ul>
          </section>


          {/* FAQs */}
          <section aria-labelledby="faq" className="mb-14">
            <h2 id="faq" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <details key={f.question} className="group rounded-xl border border-border bg-card p-5">
                  <summary className="cursor-pointer font-semibold text-foreground list-none flex justify-between items-center">
                    {f.question}
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Related reads */}
          <section aria-labelledby="related" className="mb-14">
            <h2 id="related" className="text-lg font-semibold text-foreground mb-3">Keep reading</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/products"
                className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow flex items-start gap-3"
              >
                <ShoppingBag className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Shop Prasadam offerings</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Temple prasad, mithai & sweets, and pooja samagri — delivered with divine care.</div>
                </div>
              </Link>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 p-6 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              Experience the Divine Taste
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Pure, authentic, and prepared with devotion. Elevate your spiritual experience with our curated offerings.
            </p>
            <Link to="/products">
              <Button size="lg" className="bg-accent hover:bg-accent-hover text-accent-foreground">
                Shop Prasad
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
