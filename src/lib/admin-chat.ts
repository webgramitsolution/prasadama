import { supabase } from "@/integrations/supabase/client";

// buyer_id stores the auth user ID, not the profile record ID.
export async function loadAdminConversations() {
  const { data: conversations, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  if (!conversations?.length) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, company_name")
    .in("user_id", [...new Set(conversations.map(c => c.buyer_id))]);
  if (profileError) throw profileError;

  const profilesByUser = new Map((profiles ?? []).map(p => [p.user_id, p]));
  return conversations.map(c => ({ ...c, buyer_profile: profilesByUser.get(c.buyer_id) ?? null }));
}