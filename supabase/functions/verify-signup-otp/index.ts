import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
};

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashOtp(email: string, otp: string) {
  return await sha256Hex(`otp:${String(email).trim().toLowerCase()}:${otp}`);
}

const toHex = (arr: Uint8Array) => Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");

/** Verifies a password against a `pbkdf2$iters$salt$hash` record. */
async function verifyPassword(password: string, stored: string) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  const salt = Uint8Array.from(parts[2].match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  const candidate = toHex(new Uint8Array(bits));
  // constant-time-ish comparison
  if (candidate.length !== parts[3].length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ parts[3].charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, password, correlationId } = await req.json();

    if (!email || !code || !password) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify OTP from database
    const { data: event, error: fetchError } = await supabase
      .from("signup_otp_events")
      .select("*")
      .eq("email", email)
      .eq("otp_code", await hashOtp(email, code))
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !event) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The stored value is a one-way hash; confirm the supplied password matches the signup password.
    if (!event.password_hash || !(await verifyPassword(password, event.password_hash))) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: event.full_name }
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "User already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    // Update profile if profiles table exists
    try {
      await supabase
        .from("profiles")
        .insert([
          { 
            user_id: authUser.user.id,
            email: email,
            full_name: event.full_name,
            is_active: true
          }
        ]);
    } catch (profileError) {
      console.error("Profile creation error (non-fatal):", profileError);
    }

    // Clean up OTP
    await supabase.from("signup_otp_events").delete().eq("id", event.id);

    return new Response(
      JSON.stringify({ message: "Verification successful", user: authUser.user }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
