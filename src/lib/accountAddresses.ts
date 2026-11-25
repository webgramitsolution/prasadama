import type { User } from "@supabase/supabase-js";

export type AccountAddress = {
  id: string; type: "Home" | "Office" | "Other"; name: string; phone: string; postalCode: string;
  state: string; city: string; street: string; landmark: string; isDefault: boolean;
};
export function getSavedAddresses(user: User | null | undefined): AccountAddress[] {
  const addresses: unknown = user?.user_metadata["saved_addresses"];
  if (!Array.isArray(addresses)) return [];
  return addresses.filter((address): address is AccountAddress =>
    address && ["Home", "Office", "Other"].includes(address.type) &&
    ["id", "name", "phone", "postalCode", "state", "city", "street", "landmark"].every(key => typeof address[key] === "string") &&
    typeof address.isDefault === "boolean");
}

