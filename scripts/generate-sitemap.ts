// Generates public/sitemap.xml. Product lastmod values come only from each
// product's authoritative updated_at timestamp.
// Runs on predev/prebuild.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://houskase.com";

interface Entry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/rfq", changefreq: "weekly", priority: "0.7" },
  { path: "/about-us", changefreq: "monthly", priority: "0.6" },
  { path: "/help", changefreq: "monthly", priority: "0.6" },
  { path: "/track-order", changefreq: "monthly", priority: "0.5" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/guides/bamboo-vs-cotton-towels", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
  { path: "/payment-terms", changefreq: "yearly", priority: "0.3" },
  { path: "/shipping-delivery", changefreq: "yearly", priority: "0.3" },
];

const productSlugs = [
  "magic-microfiber-cleaning-cloth-streak-free-lint-free-ultra-absorbent-pack-of-5",
  "ultra-non-woven-cleaning-cloth-roll-soft-super-absorbent-reusable-pack-of-2",
  "ultra-non-woven-white-cleaning-cloth-roll-white-kitchen-towel-roll-buy-1-get-1-free",
  "lemon-fresh-liquid-dishwash-gel-powerful-grease-remover-for-sparkling-clean-utensils-500ml-pack-of-2",
  "compressed-pearl-tablets-portable-hygienic-compressed-tissue-towels-for-travel-daily-use",
  "ultra-non-woven-cleaning-cloth-roll-soft-super-absorbent-reusable-buy-1-get-1-free",
];

async function fetchProducts(): Promise<Entry[]> {
  try {
    const backendUrl = process.env.VITE_SUPABASE_URL;
    const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!backendUrl || !publishableKey) throw new Error("Backend build variables unavailable");
    const url = `${backendUrl}/rest/v1/products?select=slug,updated_at&status=eq.active`;
    const res = await fetch(url, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    });
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as Array<{ slug: string; updated_at: string }>;
    return rows.map((r) => ({
      path: `/product/${r.slug}`,
      changefreq: "weekly",
      priority: "0.8",
      ...(r.updated_at ? { lastmod: r.updated_at.slice(0, 10) } : {}),
    }));
  } catch {
    return productSlugs.map((s) => ({
      path: `/product/${s}`,
      changefreq: "weekly",
      priority: "0.8",
    }));
  }
}

function render(entries: Entry[]): string {
  const urls = entries
    .map((e) => {
      return [
        `  <url>`,
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        `    <changefreq>${e.changefreq || "monthly"}</changefreq>`,
        `    <priority>${e.priority || "0.5"}</priority>`,
        `  </url>`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

(async () => {
  const products = await fetchProducts();
  const all = [...staticEntries, ...products];
  writeFileSync(resolve("public/sitemap.xml"), render(all));
  console.log(`sitemap.xml written (${all.length} entries) — base=${BASE_URL}`);
})();
