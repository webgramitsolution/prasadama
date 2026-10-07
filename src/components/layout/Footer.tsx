import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Phone, Linkedin, Facebook, Youtube, MessageCircle, X as XIcon,
  HelpCircle, FileText, ShoppingBag, Instagram, Flower2, Headset, Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import mobileFooterLogo from "@/assets/footer-logo.png.asset.json";
import mobileFooterBackground from "@/assets/footer-background-mobile.jpg.asset.json";
import desktopFooterBackground from "@/assets/footer-computer.png.asset.json";

const FOOTER_LOGO_URL = "/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png";

const categoryLinks = [
  { label: "Temple Prasad", href: "/products?category=office" },
  { label: "Mithai & Sweets", href: "/products?category=face-face-towels" },
  { label: "Pooja Samagri", href: "/products?category=sports-towel-costumes" },
  { label: "Devotional Offerings", href: "/products?category=cleaning-accessories" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-of-service" },
  { label: "Refund and Cancellation", href: "/payment-terms" },
  { label: "Shipping Policy", href: "/shipping-delivery" },
  { label: "Sitemap", href: "/sitemap" },
];

const supportLinks = [
  { label: "Help & FAQ", href: "/help", icon: HelpCircle },
  { label: "About Us", href: "/about-us", icon: HelpCircle },
  
  { label: "Request Quote", href: "/rfq", icon: FileText },
  { label: "Track Order", href: "/courier-tracking", icon: ShoppingBag },
  { label: "Contact Sales", href: "/chat", icon: MessageCircle },
];

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
}

interface StoreInfo {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  logoUrl: string;
}

export function Footer() {
  const [store, setStore] = useState<StoreInfo>({
    storeName: "", storeEmail: "", storePhone: "", logoUrl: "",
  });
  const [social, setSocial] = useState<SocialLinks>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "store").maybeSingle();
      if (data?.value) {
        const v = data.value as any;
        setStore({
          storeName: v.storeName || "",
          storeEmail: v.storeEmail || "",
          storePhone: v.storePhone || "",
          logoUrl: v.logoUrl || "",
        });
        setSocial({
          facebook: v.socialFacebook || "",
          instagram: v.socialInstagram || "",
          youtube: v.socialYoutube || "",
          linkedin: v.socialLinkedin || "",
          whatsapp: v.socialWhatsapp || "",
        });
      }
    })();
  }, []);

  const socialItems = [
    { key: "Facebook", icon: Facebook, url: social.facebook || "#" },
    { key: "Instagram", icon: Instagram, url: social.instagram || "#" },
    { key: "LinkedIn", icon: Linkedin, url: social.linkedin || "#" },
    { key: "X", icon: XIcon, url: social.twitter || "#" },
  ];

  const displayPhone = store.storePhone || "+91 75511 20242";
  const displayEmail = store.storeEmail || "info@webgramitsolution";

  return (
    <footer className="prasadam-footer">
      <img src={mobileFooterBackground.url} alt="" aria-hidden="true" className="mobile-footer-art md:hidden" />
      <img src={desktopFooterBackground.url} alt="" aria-hidden="true" className="desktop-footer-art hidden md:block" />
      <div className="footer-content container mx-auto px-4 pt-0 md:pt-14 pb-[5px]">
        {/* Company col is wider (2fr); remaining 4 cols equal */}
        {/* Mobile: accordion */}
        <div className="mobile-footer md:hidden">
          <div className="mobile-footer-brand">
            <img src={mobileFooterLogo.url} alt="Prasadam — Divine to your door" className="mobile-footer-logo" />
            <p className="mobile-footer-description">
              Prasadam delivers thoughtfully crafted devotional offerings and temple prasad for your spiritual journey — premium sweets, pooja samagri, bhog and more. Trusted quality, delivered across India.
            </p>
          </div>
          <Accordion type="single" collapsible className="mobile-footer-accordion w-full">
            <AccordionItem value="categories" className="mobile-footer-item">
              <AccordionTrigger className="mobile-footer-trigger hover:no-underline"><span><Flower2 aria-hidden="true" />Categories</span></AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2.5 pb-2">
                  {categoryLinks.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-primary-foreground/75 hover:text-accent transition-colors text-sm">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="policy" className="mobile-footer-item">
              <AccordionTrigger className="mobile-footer-trigger hover:no-underline"><span><FileText aria-hidden="true" />Policy</span></AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2.5 pb-2">
                  {policyLinks.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-primary-foreground/75 hover:text-accent transition-colors text-sm">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support" className="mobile-footer-item">
              <AccordionTrigger className="mobile-footer-trigger hover:no-underline"><span><Headset aria-hidden="true" />Support</span></AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2.5 pb-2">
                  {supportLinks.map(({ label, href }) => (
                    <li key={label}>
                      <Link to={href} className="text-primary-foreground/75 hover:text-accent transition-colors text-sm">{label}</Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="connect" className="border-b-0">
              <AccordionTrigger className="mobile-footer-trigger hover:no-underline"><span><Share2 aria-hidden="true" />Connect</span></AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2.5 pb-2">
                  {socialItems.map(({ key, icon: Icon, url }) => (
                    <li key={key}>
                      <a
                        href={url}
                        target={url !== "#" ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        aria-label={key}
                        className="flex items-center gap-2.5 text-primary-foreground/75 hover:text-accent transition-colors text-sm"
                      >
                        <span className="w-7 h-7 rounded-full bg-accent/15 text-primary-foreground ring-1 ring-primary-foreground/20 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {key}
                      </a>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Desktop / tablet grid */}
        <div className="desktop-footer-grid hidden md:grid gap-8 md:gap-0">

          {/* Company column — wider */}
          <div className="col-span-2 md:col-span-1 space-y-4 md:pr-6">
            <div className="flex flex-col gap-1.5">
              <img
                src={mobileFooterLogo.url}
                alt="Prasadam"
                className="h-11 w-auto object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.getAttribute('data-fallback')) {
                    img.setAttribute('data-fallback', '1');
                    img.src = FOOTER_LOGO_URL;
                  }
                }}
              />
            </div>
            <p className="text-primary-foreground/85 text-[15px] leading-relaxed">
              Prasadam delivers thoughtfully crafted devotional offerings and temple prasad for your spiritual journey — premium sweets, pooja samagri, bhog and more. Trusted quality, delivered across India.
            </p>
          </div>

          {/* Categories */}
          <div className="md:px-6">
             <h4 className="font-display font-semibold text-base md:text-lg mb-4"><Flower2 aria-hidden="true" />Categories</h4>
            <ul className="space-y-2.5">
              {categoryLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-primary-foreground/75 hover:text-accent transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy */}
          <div className="md:px-6">
             <h4 className="font-display font-semibold text-base md:text-lg mb-4"><FileText aria-hidden="true" />Policy</h4>
            <ul className="space-y-2.5">
              {policyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-primary-foreground/75 hover:text-accent transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="md:px-6">
             <h4 className="font-display font-semibold text-base md:text-lg mb-4"><Headset aria-hidden="true" />Support</h4>
            <ul className="space-y-2.5">
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-primary-foreground/75 hover:text-accent transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect — icon + name */}
          <div className="md:px-6">
             <h4 className="font-display font-semibold text-base md:text-lg mb-4"><Share2 aria-hidden="true" />Connect</h4>
            <ul className="space-y-2.5">
              {socialItems.map(({ key, icon: Icon, url }) => (
                <li key={key}>
                  <a
                    href={url}
                    target={url !== "#" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex items-center gap-2.5 text-primary-foreground/75 hover:text-accent transition-colors text-sm"
                  >
                    <span className="w-7 h-7 rounded-full bg-accent/15 text-primary-foreground ring-1 ring-primary-foreground/20 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {key}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar — centered copyright */}
      <div className="footer-copyright border-t border-primary-foreground/20 mt-[5px]">
        <div className="footer-copyright-inner container mx-auto px-4 pt-[10px] pb-[5px]">
          <span className="footer-copyright-ornament" aria-hidden="true"><Flower2 /></span>
          <p className="text-primary-foreground/70 text-xs text-center">
            © 2026 Prasadam International Private Limited. All rights reserved.
          </p>
          <span className="footer-copyright-ornament" aria-hidden="true"><Flower2 /></span>
        </div>
      </div>
    </footer>
  );
}
