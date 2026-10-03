import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import dataset from "./pincodes.json" with { type: "json" };

// Dataset: India Post All-India Pincode Directory, one entry per pincode:
// pincode -> [district, state, ...postOffices]
const DATA = dataset as Record<string, string[]>;
const PINCODES = Object.keys(DATA).sort();

type Row = { pincode: string; postOffice: string; offices: string[]; district: string; state: string };

const toRow = (pincode: string): Row => {
  const [district, state, ...offices] = DATA[pincode];
  return { pincode, postOffice: offices[0] || district, offices, district, state };
};

// Binary search for first pincode >= prefix
function lowerBound(prefix: string) {
  let lo = 0, hi = PINCODES.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (PINCODES[mid] < prefix) lo = mid + 1; else hi = mid;
  }
  return lo;
}

async function liveLookup(pin: string): Promise<Row | null> {
  try {
    const res = await fetch(`https://api.pincodeapi.in/api/v1/pincode/${pin}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = await res.json();
    const offices = (json?.data?.post_offices ?? []) as Array<Record<string, string>>;
    if (!offices.length) return null;
    return {
      pincode: pin,
      postOffice: offices[0].office_name,
      offices: offices.map((o) => o.office_name).slice(0, 12),
      district: offices[0].district,
      state: offices[0].state,
    };
  } catch (error) {
    console.error("live pincode lookup failed", error);
    return null;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let q = url.searchParams.get("q") ?? "";
    if (!q && req.method === "POST") q = String((await req.json().catch(() => ({})))?.q ?? "");
    q = q.trim();
    if (!/^\d{3,6}$/.test(q)) return json({ success: false, error: "invalid_query" }, 400);
    if (q.startsWith("0")) return json({ success: true, data: [] });

    if (q.length === 6) {
      if (DATA[q]) return json({ success: true, data: [toRow(q)] });
      const live = await liveLookup(q);
      return json({ success: true, data: live ? [live] : [] });
    }

    const out: Row[] = [];
    for (let i = lowerBound(q); i < PINCODES.length && out.length < 8; i++) {
      if (!PINCODES[i].startsWith(q)) break;
      out.push(toRow(PINCODES[i]));
    }
    return json({ success: true, data: out });
  } catch (error) {
    console.error("pincode-search error", error);
    return json({ success: false, error: "server_error" }, 500);
  }
});
