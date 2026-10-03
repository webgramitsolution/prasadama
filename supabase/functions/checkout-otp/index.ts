import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_SENDS = 5;
const MAX_ATTEMPTS = 5;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashOtp(otp: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${otp}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    // --- Authentication: only signed-in users may issue/verify checkout OTPs ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);

    const action = String((body as any).action ?? "");
    const mobile = String((body as any).phone ?? "").replace(/[^\d]/g, "");
    if (!/^\d{10,15}$/.test(mobile)) return json({ error: "Invalid phone number" }, 400);

    if (action === "send") {
      const { data: existing } = await admin
        .from("checkout_otp_verifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("mobile_number", mobile)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const lastSent = new Date(existing.last_sent_at).getTime();
        if (Date.now() - lastSent < RESEND_COOLDOWN_SECONDS * 1000) {
          return json({ error: "Please wait before requesting another code." }, 429);
        }
        if ((existing.send_count ?? 0) >= MAX_SENDS) {
          return json({ error: "Too many codes requested. Try again later." }, 429);
        }
      }

      const otp = String((crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000);
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
      const otpHash = await hashOtp(otp, `${user.id}:${mobile}`);

      if (existing) {
        await admin
          .from("checkout_otp_verifications")
          .update({
            otp_hash: otpHash,
            expires_at: expiresAt,
            attempts: 0,
            verified: false,
            send_count: (existing.send_count ?? 0) + 1,
            last_sent_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.from("checkout_otp_verifications").insert({
          user_id: user.id,
          mobile_number: mobile,
          otp_hash: otpHash,
          expires_at: expiresAt,
        });
      }

      // Send the SMS server-to-server (send-sms only trusts service-role callers).
      const smsRes = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "otp", phone: mobile, otp, appName: "Prasadam" }),
      });
      if (!smsRes.ok) {
        console.error("checkout-otp: SMS send failed", smsRes.status);
        return json({ error: "Could not send the verification code. Please try again." }, 502);
      }

      return json({ success: true, expires_at: expiresAt, resend_in: RESEND_COOLDOWN_SECONDS });
    }

    if (action === "verify") {
      const code = String((body as any).otp ?? "").trim();
      if (!/^\d{6}$/.test(code)) return json({ error: "Invalid code" }, 400);

      const { data: record } = await admin
        .from("checkout_otp_verifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("mobile_number", mobile)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!record) return json({ error: "No active code. Please request a new one." }, 400);
      if (new Date(record.expires_at).getTime() < Date.now()) {
        return json({ error: "That code has expired. Please request a new one." }, 400);
      }
      if ((record.attempts ?? 0) >= MAX_ATTEMPTS) {
        return json({ error: "Too many incorrect attempts. Please request a new code." }, 429);
      }

      const candidate = await hashOtp(code, `${user.id}:${mobile}`);
      if (candidate !== record.otp_hash) {
        await admin
          .from("checkout_otp_verifications")
          .update({ attempts: (record.attempts ?? 0) + 1 })
          .eq("id", record.id);
        return json({ error: "The code you entered is incorrect." }, 400);
      }

      await admin
        .from("checkout_otp_verifications")
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq("id", record.id);

      return json({ success: true, verified: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("checkout-otp error", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
