import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logEmailDelivery, maskValue, smtpPort } from "../_shared/email-log.ts";
import { resolveTestRecipient } from "./test-recipient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

class SimpleSmtp {
  private conn: Deno.TlsConn | Deno.Conn | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async connect(hostname: string, port: number, useTls: boolean) {
    this.conn = useTls
      ? await Deno.connectTls({ hostname, port })
      : await Deno.connect({ hostname, port });
    this.reader = this.conn.readable.getReader();
    this.writer = this.conn.writable.getWriter();
    return await this.read();
  }

  async read() {
    const { value } = await this.reader!.read();
    return this.decoder.decode(value ?? new Uint8Array()).trim();
  }

  async cmd(command: string) {
    await this.writer!.write(this.encoder.encode(command + "\r\n"));
    return await this.read();
  }

  close() {
    try { this.writer?.releaseLock(); } catch { /* noop */ }
    try { this.reader?.releaseLock(); } catch { /* noop */ }
    try { this.conn?.close(); } catch { /* noop */ }
  }
}

const ok = (response: string) => /^[23]\d\d/.test(response);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ---- Auth: admins only -------------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    // ---- Input -------------------------------------------------------------
    let body: { action?: string; sendTestEmail?: boolean; testRecipient?: string } = {};
    if (req.method === "POST") {
      try {
        const input = await req.json();
        if (!input || typeof input !== "object" || Array.isArray(input) ||
            (input.action !== undefined && !["status", "test"].includes(input.action)) ||
            (input.sendTestEmail !== undefined && typeof input.sendTestEmail !== "boolean") ||
            (input.testRecipient !== undefined && typeof input.testRecipient !== "string")) {
          return json({ error: "Invalid test request." }, 400);
        }
        body = input;
      } catch { return json({ error: "Invalid test request." }, 400); }
    }
    const action = body.action === "test" ? "test" : "status";
    let recipient = "";
    if (action === "test") {
      try {
        recipient = resolveTestRecipient(body, userData.user.email, userData.user.email_confirmed_at);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Invalid recipient." }, 403);
      }
    }

    const host = Deno.env.get("SMTP_HOST") || "";
    const user = Deno.env.get("SMTP_USER") || "";
    const pass = Deno.env.get("SMTP_PASS") || "";
    const port = smtpPort();

    const settings = {
      host: host || null,
      port,
      secure: port === 465,
      user: maskValue(user),
      passSet: Boolean(pass),
      passMasked: pass ? "•".repeat(12) : null,
      hostSet: Boolean(host),
      userSet: Boolean(user),
      bridgeConfigured: Boolean(Deno.env.get("MAIL_BRIDGE_URL")),
      testEmailAvailable: Boolean(userData.user.email && userData.user.email_confirmed_at),
    };

    if (action === "status") return json({ settings });

    // ---- Validation (server-side) -----------------------------------------
    const missing = [
      !host && "SMTP_HOST",
      !user && "SMTP_USER",
      !pass && "SMTP_PASS",
    ].filter(Boolean);
    if (missing.length) {
      return json({ settings, success: false, error: `Missing secrets: ${missing.join(", ")}` }, 200);
    }
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(host)) {
      return json({ settings, success: false, error: "SMTP_HOST does not look like a valid hostname." }, 200);
    }

    // ---- Live SMTP test ----------------------------------------------------
    const steps: { step: string; ok: boolean; detail: string }[] = [];
    const started = Date.now();
    const client = new SimpleSmtp();
    let success = false;
    let errorMessage: string | null = null;

    try {
      const greeting = await client.connect(host, port, port === 465);
      steps.push({ step: `Connect ${host}:${port}`, ok: ok(greeting), detail: greeting });

      const ehlo = await client.cmd("EHLO localhost");
      steps.push({ step: "EHLO", ok: ok(ehlo), detail: ehlo.split("\n")[0] });

      const authStart = await client.cmd("AUTH LOGIN");
      steps.push({ step: "AUTH LOGIN", ok: ok(authStart), detail: authStart });
      await client.cmd(btoa(user));
      const authResult = await client.cmd(btoa(pass));
      steps.push({ step: "Authenticate", ok: ok(authResult), detail: authResult });
      if (!ok(authResult)) throw new Error(`Authentication failed: ${authResult}`);

      if (recipient) {
        const from = await client.cmd(`MAIL FROM:<${user}>`);
        steps.push({ step: "MAIL FROM", ok: ok(from), detail: from });
        const rcpt = await client.cmd(`RCPT TO:<${recipient}>`);
        steps.push({ step: "RCPT TO", ok: ok(rcpt), detail: rcpt });
        if (!ok(rcpt)) throw new Error(`Recipient rejected: ${rcpt}`);
        const dataCmd = await client.cmd("DATA");
        steps.push({ step: "DATA", ok: ok(dataCmd), detail: dataCmd });
        const message = [
          `From: ${user}`,
          `To: ${recipient}`,
          `Subject: Prasadam SMTP test`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          "",
          `<p>Your Prasadam mail server (<strong>${host}:${port}</strong>) is working. Sent at ${new Date().toISOString()}.</p>`,
          ".",
        ].join("\r\n");
        const sent = await client.cmd(message);
        steps.push({ step: "Send test email", ok: ok(sent), detail: sent });
        if (!ok(sent)) throw new Error(`Send failed: ${sent}`);
      }

      await client.cmd("QUIT");
      success = true;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      steps.push({ step: "Error", ok: false, detail: errorMessage });
    } finally {
      client.close();
    }

    if (recipient) {
      await logEmailDelivery({
        email_type: "smtp_test",
        recipient,
        subject: "Prasadam SMTP test",
        status: success ? "sent" : "failed",
        smtp_host: host,
        smtp_port: port,
        error_message: errorMessage,
        metadata: { durationMs: Date.now() - started },
      });
    }

    return json({
      settings,
      success,
      error: errorMessage,
      durationMs: Date.now() - started,
      steps,
      testEmailSent: Boolean(recipient) && success,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
