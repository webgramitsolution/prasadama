import { describe, expect, it } from "vitest";
import { resolveOrderRecipient } from "../../supabase/functions/_shared/order-recipient";

describe("order email recipient", () => {
  const confirmed = "2026-11-01T00:00:00Z";
  it("sends to the owner's verified account email", () => {
    expect(resolveOrderRecipient({ isAdmin: false, ownerEmail: "buyer@example.com", ownerConfirmedAt: confirmed })).toBe("buyer@example.com");
  });
  it("never uses an unverified account email", () => {
    expect(resolveOrderRecipient({ isAdmin: false, ownerEmail: "buyer@example.com", ownerConfirmedAt: null })).toBe("");
  });
  it("rejects recipient overrides from non-admins", () => {
    expect(() => resolveOrderRecipient({ isAdmin: false, override: "victim@example.com", ownerEmail: "buyer@example.com", ownerConfirmedAt: confirmed })).toThrow("Forbidden");
  });
  it("lets admins redirect to a valid address", () => {
    expect(resolveOrderRecipient({ isAdmin: true, override: "ops@example.com" })).toBe("ops@example.com");
  });
  it("rejects header injection in account emails", () => {
    expect(resolveOrderRecipient({ isAdmin: false, ownerEmail: "a@b.com\r\nRCPT TO:<x@y.com>", ownerConfirmedAt: confirmed })).toBe("");
  });
});
