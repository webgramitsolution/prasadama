import { supabase } from "@/integrations/supabase/client";

/**
 * Validates and updates a user's role to 'admin'.
 * Should be called after successful sign-up for the designated admin email.
 */
export async function ensureAdminRole(userId: string, email: string) {
  const ADMIN_EMAIL = "sheepikagupta@gmail.com";
  
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;

  try {
    // Check if role already exists
    const { data: existingRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (existingRoles && existingRoles.length > 0) return;

    // Assign admin role
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (error) {
      console.error("Failed to assign admin role:", error);
    } else {
      console.log(`Admin role assigned to ${email}`);
    }
  } catch (err) {
    console.error("Error in ensureAdminRole:", err);
  }
}
