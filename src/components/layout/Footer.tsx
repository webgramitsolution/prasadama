import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Phone, Linkedin, Facebook, Youtube, MessageCircle, X as XIcon,
  HelpCircle, FileText, ShoppingBag, Instagram
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

  const displayPhone = store.storePhone || "+91 98512 95129";
  const displayEmail = store.storeEmail || "sales@houskase.com";

  return (
    <footer className="bg-[#45040A] text-white">
      <div className="container mx-auto px-4 pt-10 md:pt-14 pb-[5px]">
        {/* Company col is wider (2fr); remaining 4 cols equal */}
        <div className="grid grid-cols-2 md:[grid-template-columns:2fr_1fr_1fr_1fr_1fr] gap-8 md:gap-0 md:divide-x md:divide-white/20">
          {/* Company column — wider */}
          <div className="col-span-2 md:col-span-1 space-y-4 md:pr-6">
            <div className="flex flex-col gap-1.5">
              <img
                src={FOOTER_LOGO_URL}
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
            <h4 className="font-display font-semibold text-base md:text-lg mb-4">Categories</h4>
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
            <h4 className="font-display font-semibold text-base md:text-lg mb-4">Policy</h4>
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
            <h4 className="font-display font-semibold text-base md:text-lg mb-4">Support</h4>
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
            <h4 className="font-display font-semibold text-base md:text-lg mb-4">Connect</h4>
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
      <div className="border-t border-white/20 mt-[5px]">
        <div className="container mx-auto px-4 py-[10px]">
          <p className="text-white/70 text-xs text-center">
            © 2026 Prasadam International Private Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
