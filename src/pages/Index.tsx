import { useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SocialRail } from "@/components/layout/SocialRail";
import { HeroSection } from "@/components/home/HeroSection";
import { HeroMarquee } from "@/components/home/HeroMarquee";
import { PromoBanners } from "@/components/home/PromoBanners";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TaggedProductSection } from "@/components/home/TaggedProductSection";
import { AboutUsSection } from "@/components/home/AboutUsSection";
import { WhyChoosePrasadam } from "@/components/home/WhyChoosePrasadam";

import { BlogSection } from "@/components/home/BlogSection";
import { TrustedFamilies } from "@/components/home/TrustedFamilies";
import { ReelsSection } from "@/components/reels/ReelsSection";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";

import { TrustSection } from "@/components/home/TrustSection";
import { AvailableOnBanner } from "@/components/home/AvailableOnBanner";

import { SEOHead, SchemaGenerators } from "@/components/SEOHead";
import { ResponsiveDebug } from "@/components/debug/ResponsiveDebug";

const Index = () => {
  const siteUrl = "https://houskase.com";
  const noop = useCallback(() => {}, []);

  const jsonLd = [
    SchemaGenerators.website("Prasadam", siteUrl),
    SchemaGenerators.localBusiness({
      name: "Prasadam - A Divine Taste",
      url: siteUrl,
    }),
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <ResponsiveDebug />
      <SEOHead
        title="Prasadam — A Divine Taste | Temple Prasad & Devotional Offerings"
        description="Prasadam delivers blessed temple prasad, mithai, dry fruit prasad and pooja samagri — devotional offerings crafted with purity and delivered with care across India."
        keywords="Prasadam, temple prasad, mithai, dry fruit prasad, pooja samagri, devotional offerings, India"
        jsonLd={jsonLd}
      />
      <Header />
      <SocialRail />
      <main className="pt-0">
        <HeroSection onFetchStatus={noop} />
        <HeroMarquee />
        <PromoBanners />
        <FeaturedProducts onFetchStatus={noop} />
        <TaggedProductSection tag="mega saver packs" title="Mega Saver Packs" className="bg-[#ffffff]" limit={12} />
        <TaggedProductSection
          tag="bestseller"
          title="Bestseller"
          variant="showcase"
          panelLabelTop="BEST"
          panelLabelBottom="Sellers"
        />

        <AboutUsSection />
        <WhyChoosePrasadam />
        <ReelsSection title="Festive Reels" />

        
        <BlogSection />
        <TrustedFamilies />
        {/* '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            still opning buyer dashboard why please fix it. */}
        
      </main>
      <TrustSection />
      <AvailableOnBanner />
      <Footer />
      <VoiceAssistant />
    </div>
  );
};

export default Index;
