import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
};

async function logSmsAttempt(
  supabase: any,
  { phone, type, message, success, response, error, provider = "My Dreams Technology" }: any
) {
  try {
    await supabase.from("sms_logs").insert({
      phone_number: phone,
      notification_type: type,
      message_content: message,
      status: success ? "sent" : "failed",
      provider_response: response,
      error_details: error,
      provider_name: provider
    });
  } catch (e) {
    console.error("Failed to log SMS to DB:", e);
  }
}

async function sendSms(number: string, message: string) {
  const apiKey = Deno.env.get("MDT_SMS_API_KEY") || Deno.env.get("SMS_API_KEY");
  const senderId = Deno.env.get("MDT_SMS_SENDER_ID") || Deno.env.get("SMS_SENDER_ID");

  if (!apiKey || !senderId) {
    throw new Error("SMS provider is not configured");
  }


  // Always use HTTPS so the OTP code, phone number and API key are encrypted in transit.
  const endpoint = Deno.env.get("MDT_SMS_ENDPOINT") || "https://app.mydreamstechnology.in/vb/apikey.php";
  const url = new URL(endpoint);
  if (url.protocol !== "https:") {
    throw new Error("SMS endpoint must use HTTPS");
  }
  const params = new URLSearchParams({
    apikey: apiKey,
    senderid: senderId,
    number,
    message,
  });

  console.log(`Sending SMS to ${number}...`);

  try {
    // Sensitive values go in the encrypted request body instead of the URL.
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const result = await response.text();
    console.log("SMS API Response:", result);
    return result;
  } catch (e: any) {
    console.error("SMS Fetch Exception:", e.message);
    throw new Error(`SMS Provider Unreachable: ${e.message}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey
  );

  // Authorization: this endpoint is server-to-server only (trusted callers using
  // the service role key) or an authenticated admin. It must never be callable
  // anonymously, otherwise anyone could blast SMS at the store's expense.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (token !== serviceRoleKey) {
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    let isAdmin = false;
    if (userId) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = !!roleRow;
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }


  let payload: any = {};
  try {
    const rawBody = await req.text();
    if (!rawBody) throw new Error("Empty request body");
    payload = JSON.parse(rawBody);
    
    const { type, phone, otp, appName, orderNumber, fullName } = payload;

    let message = "";
    
    if (type === "otp") {
      if (!phone || !otp) throw new Error("Missing OTP data");
      message = `Your OTP for Login is ${otp}. Please verify within 10 minutes - Prasadam — A Divine Taste. More Details: https://houskase.com/`;
    } else if (type === "order_confirmation") {
      if (!phone || !orderNumber) throw new Error("Missing Order data");
      message = `Dear ${fullName || 'Customer'}, your order #${orderNumber} has been confirmed successfully. More Details: https://houskase.com/ Thank you for choosing Prasadam — A Divine Taste.`;
    } else {
      throw new Error("Invalid notification type");
    }

    const result = await sendSms(phone, message);
    const isSuccess = result.toLowerCase().includes("success") || result.includes("sent");

    await logSmsAttempt(supabase, {
      phone,
      type,
      message,
      success: isSuccess,
      response: result
    });

    return new Response(
      JSON.stringify({ success: isSuccess, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("SMS error:", error.message);
    
    if (payload && payload.phone) {
      await logSmsAttempt(supabase, {
        phone: payload.phone,
        type: payload.type || "unknown",
        message: "Failed before sending",
        success: false,
        error: error.message
      });
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
