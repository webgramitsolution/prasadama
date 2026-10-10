type TestBody = { action?: string; sendTestEmail?: boolean; testRecipient?: string };

// Delivery targets come only from the verified identity, never a request address.
export function resolveTestRecipient(body: TestBody, email?: string, confirmedAt?: string): string {
  const wantsEmail = body.sendTestEmail === true || Boolean(body.testRecipient);
  if (!wantsEmail) return "";
  if (!email || !confirmedAt || !/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(email)) {
    throw new Error("A verified account email is required to receive a test email.");
  }
  if (body.testRecipient && body.testRecipient.trim().toLowerCase() !== email.toLowerCase()) {
    throw new Error("Test emails can only be sent to your verified account email.");
  }
  return email;
}