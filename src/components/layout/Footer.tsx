import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Facebook,
  FileText,
  Headphones,
  Instagram,
  Linkedin,
  Flower2,
  Share2,
  X as XIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FOOTER_LOGO_URL = "/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png";
const SHOP_ALL_IMAGE = "https://ik.imagekit.io/Prasadam/shop%20All.png?updatedAt=1791171289075";

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
  { label: "Help & FAQ", href: "/help" },
  { label: "About Us", href: "/about-us" },
  { label: "Request Quote", href: "/rfq" },
  { label: "Track Order", href: "/courier-tracking" },
  { label: "Contact Sales", href: "/chat" },
];

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

const FooterLinkList = ({ links }: { links: Array<{ label: string; href: string }> }) => (
  <ul className="space-y-2.5">
    {links.map((link) => (
      <li key={link.label}>
        <Link to={link.href} className="group flex items-center gap-2 text-sm text-footer-foreground/85 transition-colors hover:text-footer-gold">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-footer-gold" />
          {link.label}
        </Link>
      </li>
    ))}
  </ul>
);

export function Footer() {
  const [social, setSocial] = useState<SocialLinks>({});

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "store").maybeSingle().then(({ data }) => {
      const value = data?.value as Record<string, string> | null;
      if (!value) return;
      setSocial({
        facebook: value["socialFacebook"] || "",
        instagram: value["socialInstagram"] || "",
        linkedin: value["socialLinkedin"] || "",
        twitter: value["socialTwitter"] || "",
      });
    });
  }, []);

  const socialItems = [
    { label: "Facebook", icon: Facebook, url: social.facebook || "#" },
    { label: "Instagram", icon: Instagram, url: social.instagram || "#" },
    { label: "LinkedIn", icon: Linkedin, url: social.linkedin || "#" },
    { label: "X", icon: XIcon, url: social.twitter || "#" },
  ];

  const mobileSections = [
    { value: "categories", title: "Categories", icon: Flower2, links: categoryLinks },
    { value: "policy", title: "Policy", icon: FileText, links: policyLinks },
    { value: "support", title: "Support", icon: Headphones, links: supportLinks },
  ];

  return (
    <footer className="text-footer-foreground">
      <div className="footer-mobile-art md:hidden">
        <div className="footer-art-overlay px-5 pb-6 pt-8">
          <div className="mx-auto max-w-sm pb-5">
            <img src={FOOTER_LOGO_URL} alt="Prasadam" className="h-16 w-auto object-contain" />
            <p className="mt-5 max-w-[310px] text-[17px] leading-8 text-footer-foreground/95">
              Prasadam delivers thoughtfully crafted devotional offerings and temple prasad for your spiritual journey — premium sweets, pooja samagri, bhog and more. Trusted quality, delivered across India.
            </p>
          </div>

          <Accordion type="single" collapsible className="mx-auto max-w-md">
            {mobileSections.map(({ value, title, icon: Icon, links }) => (
              <AccordionItem key={value} value={value} className="border-footer-gold/55">
                <AccordionTrigger className="py-5 text-lg font-semibold text-footer-foreground hover:no-underline [&>svg]:text-footer-foreground">
                  <span className="flex items-center gap-4">
                    <Icon className="h-7 w-7 text-footer-gold" strokeWidth={1.7} />
                    {title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-11 pb-5">
                  <FooterLinkList links={links} />
                  {value === "categories" && (
                    <Link to="/products" className="mt-4 block w-36 overflow-hidden rounded border border-footer-gold/60">
                      <img src={SHOP_ALL_IMAGE} alt="Shop All products" className="aspect-[16/7] w-full object-cover" />
                    </Link>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
            <AccordionItem value="connect" className="border-footer-gold/55">
              <AccordionTrigger className="py-5 text-lg font-semibold text-footer-foreground hover:no-underline [&>svg]:text-footer-foreground">
                <span className="flex items-center gap-4">
                  <Share2 className="h-7 w-7 text-footer-gold" strokeWidth={1.7} />
                  Connect
                </span>
              </AccordionTrigger>
              <AccordionContent className="pl-11 pb-5">
                <ul className="space-y-3">
                  {socialItems.map(({ label, icon: Icon, url }) => (
                    <li key={label}>
                      <a href={url} target={url === "#" ? undefined : "_blank"} rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-footer-foreground/85 hover:text-footer-gold">
                        <Icon className="h-4 w-4 text-footer-gold" /> {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="mx-auto mt-6 max-w-md border-t border-footer-gold/55 pt-4 text-center text-xs text-footer-foreground/75">
            © 2026 Prasadam International Private Limited. All rights reserved.
          </p>
        </div>
      </div>

      <div className="footer-desktop-art hidden min-h-[390px] md:block">
        <div className="footer-art-overlay min-h-[390px]">
          <div className="container mx-auto px-5 pb-5 pt-16 lg:px-8">
            <div className="grid grid-cols-[1.75fr_repeat(4,1fr)] gap-0">
              <div className="min-w-0 pr-7">
                <img src={FOOTER_LOGO_URL} alt="Prasadam" className="h-16 w-auto object-contain" />
                <p className="mt-5 max-w-[390px] text-sm leading-7 text-footer-foreground/90 lg:text-[15px]">
                  Prasadam delivers thoughtfully crafted devotional offerings and temple prasad for your spiritual journey — premium sweets, pooja samagri, bhog and more. Trusted quality, delivered across India.
                </p>
              </div>

              <div className="min-w-0 border-l border-footer-gold/25 px-5">
                <h3 className="mb-5 border-b border-footer-gold/40 pb-3 text-lg font-semibold text-footer-foreground">Categories</h3>
                <FooterLinkList links={categoryLinks} />
                <Link to="/products" className="mt-4 block w-32 overflow-hidden rounded border border-footer-gold/60">
                  <img src={SHOP_ALL_IMAGE} alt="Shop All products" className="aspect-[16/7] w-full object-cover" />
                </Link>
              </div>

              <div className="min-w-0 border-l border-footer-gold/25 px-5">
                <h3 className="mb-5 border-b border-footer-gold/40 pb-3 text-lg font-semibold text-footer-foreground">Policy</h3>
                <FooterLinkList links={policyLinks} />
              </div>

              <div className="min-w-0 border-l border-footer-gold/25 px-5">
                <h3 className="mb-5 border-b border-footer-gold/40 pb-3 text-lg font-semibold text-footer-foreground">Support</h3>
                <FooterLinkList links={supportLinks} />
              </div>

              <div className="min-w-0 border-l border-footer-gold/25 px-5">
                <h3 className="mb-5 border-b border-footer-gold/40 pb-3 text-lg font-semibold text-footer-foreground">Connect</h3>
                <ul className="space-y-3">
                  {socialItems.map(({ label, icon: Icon, url }) => (
                    <li key={label}>
                      <a href={url} target={url === "#" ? undefined : "_blank"} rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-footer-foreground/85 transition-colors hover:text-footer-gold">
                        <Icon className="h-4 w-4 text-footer-gold" /> {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-10 border-t border-footer-gold/60 pt-5 text-center text-xs text-footer-foreground/80">
              © 2026 Prasadam International Private Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}