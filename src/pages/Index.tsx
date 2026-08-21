import { useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SocialRail } from "@/components/layout/SocialRail";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { HeroSection } from "@/components/home/HeroSection";
import { HeroMarquee } from "@/components/home/HeroMarquee";
import { PromoBanners } from "@/components/home/PromoBanners";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TaggedProductSection } from "@/components/home/TaggedProductSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { AboutUsSection } from "@/components/home/AboutUsSection";
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

        <ReelsSection title="Products Reels" />
        <AboutUsSection />
        
        <BlogSection />
        <TrustedFamilies />
        {/* '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            For the code present, I get the error below.

Please think step-by-step in order to resolve it.
```
Edge function returned 400: Error, {"error":"SMTP Error: failed to lookup address information: Name or service not known. The environment restricts raw sockets. Please upload 'mailer.php' to your Hostinger server and set MAIL_BRIDGE_URL secret."}

{
  "timestamp": 1787304342629,
  "error_type": "RUNTIME_ERROR",
  "filename": "supabase/functions/send-signup-otp/index.ts",
  "lineno": 0,
  "colno": 0,
  "stack": "not_applicable",
  "has_blank_screen": true
}
``` */}
        
      </main>
      <TrustSection />
      <AvailableOnBanner />
      <Footer />
      <BottomNavigation />
      <VoiceAssistant />
    </div>
  );
};

export default Index;
