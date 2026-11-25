import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead, SchemaGenerators } from "@/components/SEOHead";
import { SupportCenter, faqCategories } from "@/components/support/SupportCenter";

export default function Help() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#fcf7f0]">
      <SEOHead title="Help & FAQ" description="Find answers about Prasadam orders, delivery, payments and returns."
        jsonLd={SchemaGenerators.faqPage(faqCategories.flatMap(category => category.faqs))} />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9"><SupportCenter /></main>
      <Footer />
    </div>
  );
}
