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
                                        
                                            
                                            Verify that sheepikagupta@gmail.com can access all admin-only pages by adding a quick admin-only test page and checking permissions.

Implement an admin account management screen that lets me add/remove admins securely (with invitation or password reset) instead of entering passwords directly.

Improve the header logo sizing with responsive CSS (desktop/mobile) so it stays clear and properly aligned at all screen widths.

Add an on-screen confirmation message after my admin role is updated so I can clearly see when the change for sheepikagupta@gmail.com is applied.

Add an automatic admin-role assignment flow when the first user signs up with a specific email like sheepikagupta@gmail.com.

Improve the login page to show a clear message when a user is not yet registered or not assigned an admin role, instead of showing an “invalid” state.

Implement a dashboard/admin utility that verifies whether my email has an admin role and shows how to fix it if not. ye abhi bhi "INvalid Login Credentials" show ho rha hai please deep chck fix it and make me admin */}
        
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
