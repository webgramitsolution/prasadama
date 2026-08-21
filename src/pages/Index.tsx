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
import InstagramFeed from "@/components/home/InstagramFeed";

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
        <InstagramFeed />
        {/* '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            Add an admin-only page to test the Instagram access token and show the exact failure reason from the Edge function.

Implement a graceful UI fallback when Instagram media fetch fails, including an actionable message and a retry button.

Add structured logging to the instagram-feed Edge function so failed requests include status codes, timestamps, and safe debug context.

Implement automatic retry with backoff for transient Instagram API errors and surface a clear “token expired/invalid” message when applicable.

Create a secure settings form to update and validate the INSTAGRAM_ACCESS_TOKEN without redeploying the app. - ye jitne bhi Instagram ke feed se related code complete remove kar do.  front bacekend i need neat andclean code 

Update my product names, descriptions, and images to Prasadam offerings instead of Houskase.

Verify my Google Search Console connection and submit my sitemap for the Prasadam site. ishe  bhe skeepd rakho after complete webite main change karunga. 

Test Razorpay checkout and SMTP email sending using the updated secrets. (ishe abhi skeep par kakho} after complete saare detail fill karunga

Deploy the remixed app to my production domain and run a full smoke test.  {
InstagramFeed.tsx} ko abhi skeeped hi rahne do baad main karenge. */}
        
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
