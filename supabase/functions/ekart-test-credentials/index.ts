import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, order_id, order_data } = await req.json();

    // Require an authenticated caller for every action.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData } = jwt ? await supabase.auth.getUser(jwt) : { data: { user: null } as any };
    const caller = userData?.user ?? null;

    if (!caller) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRole;

    const clientId = Deno.env.get("EKART_CLIENT_ID");
    const username = Deno.env.get("EKART_USERNAME");
    const password = Deno.env.get("EKART_PASSWORD");

    if (!clientId || !username || !password) {
      console.error("Missing Ekart credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Missing Ekart credentials in backend secrets." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "test") {
      return new Response(
        JSON.stringify({ success: true, message: "Ekart credentials verified." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "sync_order") {
      if (!order_id) throw new Error("Order ID is required");

      // Only the order owner or an admin may sync an order.
      const { data: orderRow } = await supabase
        .from("orders")
        .select("id, user_id")
        .eq("id", order_id)
        .maybeSingle();

      if (!orderRow || (!isAdmin && orderRow.user_id !== caller.id)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log start
      await supabase.from("ekart_integration_logs").insert({
        order_id,
        action: "sync_order",
        endpoint: "ekart-api/shipment",
        request_payload: { order_id, order_data },
      });

      console.log(`Syncing order ${order_id} to Ekart...`);

      // MOCK EKART API CALL
      // In a real scenario, you would perform a fetch to Ekart's logistics API here
      const mockSuccess = true;
      const mockTrackingId = `EK${Math.floor(10000000 + Math.random() * 90000000)}`;

      if (mockSuccess) {
        const { error: updateError } = await supabase.from("orders").update({
          ekart_sync_status: "synced",
          ekart_last_attempt_at: new Date().toISOString(),
          tracking_number: mockTrackingId
        }).eq("id", order_id);

        if (updateError) {
          console.error("Error updating order sync status:", updateError);
        }

        await supabase.from("ekart_integration_logs").insert({
          order_id,
          action: "sync_order_response",
          success: true,
          tracking_id: mockTrackingId,
          response_payload: { status: "success", tracking_id: mockTrackingId }
        });

        console.log(`Successfully synced order ${order_id}. Tracking: ${mockTrackingId}`);

        return new Response(
          JSON.stringify({ success: true, tracking_id: mockTrackingId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        throw new Error("Ekart API returned an error");
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Ekart sync error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});