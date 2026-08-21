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

    const { message, history, siteContext } = await req.json();
    const query = String(message || "").toLowerCase().trim();

    const hindiChars = String(message || "").match(/[\u0900-\u097F]/g) || [];
    const userLangIsHindi = hindiChars.length > 0;

    console.log(`[Assistant] Query: "${message}" | Lang: ${userLangIsHindi ? "Hindi" : "English"}`);

    let products = siteContext?.products;
    let categories = siteContext?.categories;

    if (!products || !categories) {
      const [pRes, cRes] = await Promise.all([
        supabaseClient
          .from("products")
          .select("id, name, slug, guest_price, shop_price, short_description")
          .eq("is_active", true)
          .limit(100),
        supabaseClient.from("categories").select("id, name, slug").eq("is_active", true),
      ]);
      products = pRes.data || [];
      categories = cRes.data || [];
    }

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

    const systemPrompt = `You are Houskase's shopping assistant on houskase.com (premium towels & home essentials, India).
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

    const chatHistory = Array.isArray(history)
      ? history.slice(-6).map((h: any) => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: String(h.text || ""),
        }))
      : [];

    let responseText = "";

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (apiKey) {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "user", content: String(message || "") },
          ],
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        responseText = data?.choices?.[0]?.message?.content?.trim() || "";
      } else {
        const errText = await aiRes.text();
        console.error(`[Assistant] AI gateway ${aiRes.status}: ${errText}`);
        if (aiRes.status === 429) {
          responseText = t(
            "I'm getting a lot of requests right now. Please try again in a few seconds.",
            "अभी बहुत सारे अनुरोध आ रहे हैं। कृपया कुछ सेकंड बाद फिर कोशिश करें।"
          );
        } else if (aiRes.status === 402) {
          responseText = t(
            "The assistant is temporarily unavailable. Please try again later.",
            "सहायक अभी अस्थायी रूप से अनुपलब्ध है। कृपया बाद में प्रयास करें।"
          );
        }
      }
    }

    if (!responseText) {
      // Data-grounded fallback when AI is unavailable
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
          aiUsed: !!apiKey,
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
