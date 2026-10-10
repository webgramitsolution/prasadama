import { describe, expect, it } from "vitest";
import { resolveTestRecipient } from "../../supabase/functions/smtp-diagnostics/test-recipient";

describe("SMTP test recipient restrictions", () => {
  const email = "admin@example.com";
  const confirmed = "2026-10-10T00:00:00Z";
  it("does not send mail during connection-only tests", () => {
    expect(resolveTestRecipient({ sendTestEmail: false })).toBe("");
  });
  it("uses the verified identity for test delivery", () => {
    expect(resolveTestRecipient({ sendTestEmail: true }, email, confirmed)).toBe(email);
  });
  it("rejects arbitrary legacy request recipients", () => {
    expect(() => resolveTestRecipient({ testRecipient: "victim@example.com" }, email, confirmed)).toThrow("only be sent");
  });
  it("allows legacy requests only when they match the verified identity", () => {
    expect(resolveTestRecipient({ testRecipient: "ADMIN@example.com" }, email, confirmed)).toBe(email);
  });
  it("rejects missing or unverified identity emails", () => {
    expect(() => resolveTestRecipient({ sendTestEmail: true }, email)).toThrow("verified account");
    expect(() => resolveTestRecipient({ sendTestEmail: true }, undefined, confirmed)).toThrow("verified account");
  });
  it("rejects SMTP command injection in identity emails", () => {
    expect(() => resolveTestRecipient({ sendTestEmail: true }, "admin@example.com\r\nRCPT TO:<victim@example.com>", confirmed)).toThrow("verified account");
  });
});