import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type EmailLogEntry = {
  email_type: string;
  recipient: string;
  subject?: string | null;
  status: "sent" | "failed" | "test";
  provider?: string;
  smtp_host?: string | null;
  smtp_port?: number | null;
  error_message?: string | null;
  correlation_id?: string | null;
  order_id?: string | null;
  metadata?: Record<string, unknown>;
};

/** Best-effort write to public.email_delivery_logs. Never throws. */
export async function logEmailDelivery(entry: EmailLogEntry) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const supabase = createClient(url, key);
    await supabase.from("email_delivery_logs").insert([
      {
        email_type: entry.email_type,
        recipient: entry.recipient,
        subject: entry.subject ?? null,
        status: entry.status,
        provider: entry.provider ?? "smtp",
        smtp_host: entry.smtp_host ?? null,
        smtp_port: entry.smtp_port ?? null,
        error_message: entry.error_message ? String(entry.error_message).slice(0, 1000) : null,
        correlation_id: entry.correlation_id ?? null,
        order_id: entry.order_id ?? null,
        metadata: entry.metadata ?? {},
      },
    ]);
  } catch (err) {
    console.error("email log failed:", err);
  }
}

export function smtpPort() {
  const raw = Deno.env.get("SMTP_PORT");
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 && parsed < 65536 ? parsed : 465;
}

/** Masks a secret/identifier for safe display in the admin UI. */
export function maskValue(value?: string | null) {
  if (!value) return null;
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    const head = local.slice(0, 2);
    return `${head}${"•".repeat(Math.max(local.length - 2, 2))}@${domain}`;
  }
  if (value.length <= 4) return "•".repeat(value.length);
  return `${value.slice(0, 2)}${"•".repeat(Math.max(value.length - 4, 4))}${value.slice(-2)}`;
}
