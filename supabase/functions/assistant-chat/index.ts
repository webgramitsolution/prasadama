import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_PAGES = [
  { name: "Home", url: "/" },
  { name: "Products", url: "/products" },
  { name: "Help", url: "/help" },
  { name: "Track Order", url: "/track-order" },
  { name: "About Us", url: "/about-us" },
  { name: "Blog", url: "/blog" },
  { name: "Request Quote (RFQ)", url: "/rfq" },
  { name: "Cart / Checkout", url: "/checkout" },
  { name: "Dashboard", url: "/dashboard" },
  { name: "Shipping & Delivery", url: "/shipping-delivery" },
  { name: "Payment Terms", url: "/payment-terms" },
  { name: "Privacy Policy", url: "/privacy-policy" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Rate limit per caller IP to prevent abuse of the paid AI service.
    const ip =
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const { data: withinLimit } = await supabaseClient.rpc("check_sms_rate_limit", {
      _key: `assistant:${ip}`,
      _max_hits: 20,
      _window_seconds: 60,
    });
    if (withinLimit === false) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again in a minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, history } = await req.json();
    const query = String(message || "").toLowerCase().trim();

    const hindiChars = String(message || "").match(/[\u0900-\u097F]/g) || [];
    const userLangIsHindi = hindiChars.length > 0;

    console.log(`[Assistant] Query: "${message}" | Lang: ${userLangIsHindi ? "Hindi" : "English"}`);

    // Product/category data is always loaded server-side; caller-supplied
    // siteContext is never trusted for the system prompt.
    const [pRes, cRes] = await Promise.all([
      supabaseClient
        .from("products")
        .select("id, name, slug, guest_price, shop_price, short_description")
        .eq("is_active", true)
        .limit(100),
      supabaseClient.from("categories").select("id, name, slug").eq("is_active", true),
    ]);
    const products = pRes.data || [];
    const categories = cRes.data || [];

    const t = (en: string, hi: string) => (userLangIsHindi ? hi : en);

    // Relevant products for grounding (also returned as cards when confident)
    const queryTokens = query.split(/\s+/).filter((x: string) => x.length > 2);
    const matchedProducts =
      (products || [])
        .filter((p: any) => {
          const pName = (p.name || "").toLowerCase();
          const pDesc = (p.short_description || "").toLowerCase();
          if (!queryTokens.length) return false;
          return pName.includes(query) || queryTokens.some((tok: string) => pName.includes(tok) || pDesc.includes(tok));
        })
        .slice(0, 4) || [];

    const catList = (categories || []).map((c: any) => c.name).join(", ");
    const prodList = (products || [])
      .slice(0, 40)
      .map((p: any) => `${p.name} (₹${p.shop_price || p.guest_price || "-"})`)
      .join("; ");
    const pageList = SITE_PAGES.map((p) => `${p.name}: houskase.com${p.url}`).join(" | ");

    const systemPrompt = `You are Prasadam's shopping assistant on houskase.com (temple prasad & devotional offerings, India).
Answer the user's ACTUAL question conversationally and helpfully. Never reply with a canned page link unless the user genuinely asked where to find that page.

Rules:
- Reply ONLY in ${userLangIsHindi ? "Hindi (Devanagari script)" : "English"}, matching the user's language.
- Keep answers short (1-3 sentences), natural, spoken-friendly (this may be read aloud).
- Use ONLY the site data below for products, prices and categories. Never invent products or prices.
- If you don't know something, say so briefly and ask one helpful follow-up question.
- Mention a page link only when it directly helps.

SITE PAGES: ${pageList}
CATEGORIES: ${catList || "(none)"}
PRODUCTS (sample): ${prodList || "(none)"}
${matchedProducts.length ? `PRODUCTS MATCHING THIS QUERY: ${matchedProducts.map((p: any) => `${p.name} (₹${p.shop_price || p.guest_price || "-"})`).join("; ")}` : ""}`;

    let responseText = "";

    if (!responseText) {
      // Always-free, deterministic response grounded in current catalog data.
      if (matchedProducts.length) {
        const pDetails = matchedProducts
          .map((p: any) => `${p.name} (₹${p.shop_price || p.guest_price})`)
          .join(", ");
        responseText = t(
          `I found these: ${pDetails}. Want me to open any of them?`,
          `मुझे ये मिले: ${pDetails}। क्या मैं इनमें से कोई खोलूँ?`
        );
      } else {
        const suggested = (categories || []).slice(0, 3).map((c: any) => `'${c.name}'`).join(userLangIsHindi ? " या " : " or ");
        responseText = t(
          `I didn't quite get that. Could you tell me a bit more? You can ask about ${suggested || "our products"}, your order, or delivery.`,
          `मैं ठीक से समझ नहीं पाई। थोड़ा और बताइए। आप ${suggested || "हमारे उत्पादों"}, अपने ऑर्डर या डिलीवरी के बारे में पूछ सकते हैं।`
        );
      }
    }

    return new Response(
      JSON.stringify({
        text: responseText,
        products: matchedProducts,
        debug: {
          lang: userLangIsHindi ? "Hindi" : "English",
          detectedCategories: categories?.length || 0,
          detectedProducts: products?.length || 0,
          aiUsed: false,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
