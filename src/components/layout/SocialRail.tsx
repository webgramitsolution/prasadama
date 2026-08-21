import { useEffect, useState } from "react";
import { Facebook, MessageCircle, Instagram } from "lucide-react";

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
}

import { supabase } from "@/integrations/supabase/client";

export function SocialRail() {
  const [social, setSocial] = useState<SocialLinks>({
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    whatsapp: "https://wa.me",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "store").maybeSingle();
      const v = data?.value as any;
      if (v) {
        setSocial({
          facebook: v.socialFacebook || "https://facebook.com",
          instagram: v.socialInstagram || "https://instagram.com",
          whatsapp: v.socialWhatsapp || "https://wa.me",
        });
      }
    })();
  }, []);

  const items = [
    { key: "Facebook", icon: Facebook, url: social.facebook, style: { background: "#1877F2", color: "#fff" } },
    { key: "Instagram", icon: Instagram, url: social.instagram, style: { background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)", color: "#fff" } },
    { key: "WhatsApp", icon: MessageCircle, url: social.whatsapp, style: { background: "#25D366", color: "#fff" } },
  ].filter((i) => i.url && i.url !== "#");

  if (items.length === 0) return null;

  return (
    <div className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col gap-px rounded-l-lg overflow-hidden shadow-lg">
      {items.map(({ key, icon: Icon, url, style }) => (
        <a
          key={key}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={key}
          style={style}
          className="p-2.5 transition-transform hover:scale-105"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

