import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
};

class RobustSmtp {
  private conn: Deno.TlsConn | Deno.Conn | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async connect(hostname: string, port: number, useTls = true) {
    if (useTls) {
      this.conn = await Deno.connectTls({ hostname, port });
    } else {
      this.conn = await Deno.connect({ hostname, port });
    }
    this.reader = this.conn.readable.getReader();
    this.writer = this.conn.writable.getWriter();
    await this.readResponse();
  }

  async sendCommand(cmd: string) {
    await this.writer!.write(this.encoder.encode(cmd + "\r\n"));
    return await this.readResponse();
  }

  async readResponse() {
    const { value } = await this.reader!.read();
    const response = this.decoder.decode(value);
    console.log("SMTP:", response.trim());
    return response;
  }

  async login(user: string, pass: string) {
    await this.sendCommand("EHLO localhost");
    await this.sendCommand("AUTH LOGIN");
    await this.sendCommand(btoa(user));
    await this.sendCommand(btoa(pass));
  }

  async sendMail(from: string, to: string, subject: string, body: string) {
    await this.sendCommand(`MAIL FROM:<${from}>`);
    await this.sendCommand(`RCPT TO:<${to}>`);
    await this.sendCommand("DATA");
    const msg = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      "",
      body,
      "."
    ].join("\r\n");
    await this.sendCommand(msg);
    await this.sendCommand("QUIT");
  }

  close() {
    try { this.writer?.releaseLock(); } catch {}
    try { this.reader?.releaseLock(); } catch {}
    try { this.conn?.close(); } catch {}
  }
}

async function hashResetOtp(email: string, otp: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`otp:${String(email).trim().toLowerCase()}:${otp}`),
  );
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, otp, password, resetToken } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "send-otp") {
      // 1. Check if user exists
      const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        // Do not reveal whether an account exists for this email.
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 2. Generate and store OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const { error: dbError } = await supabase
        .from("password_reset_otps")
        .insert([{ email, otp_code: await hashResetOtp(email, code) }]);

      if (dbError) throw new Error("Failed to generate code.");

      // 3. Send Email
      const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
      const smtpUser = Deno.env.get("SMTP_USER");
      const smtpPass = Deno.env.get("SMTP_PASS");

      const client = new RobustSmtp();
      try {
        await client.connect(smtpHost, 465, true);
        await client.login(smtpUser, smtpPass!);
        
        const logoUrl = "/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png";
        const headerBg = "#001B3D";
        const footerBg = "#ad1e2a";
        const accentColor = "#E94E63";

        const html = `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; color: #333; }
              .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
              .header { background-color: ${headerBg}; padding: 25px; text-align: left; }
              .logo { height: 45px; width: auto; display: block; }
              .body { padding: 40px 35px; text-align: center; }
              .icon-circle { width: 70px; height: 70px; background: #f0f4f8; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 25px; }
              .status-title { font-size: 24px; font-weight: 700; margin: 0 0 10px 0; color: #1a1a1a; }
              .greeting { font-size: 16px; color: #666; margin-bottom: 30px; line-height: 1.5; }
              .otp-code { display: inline-block; padding: 15px 30px; background-color: #f0f4f8; color: #AD1E2A; font-size: 32px; font-weight: 700; border-radius: 8px; margin: 25px 0; letter-spacing: 5px; }
              .footer { background-color: ${footerBg}; color: #ffffff; padding: 35px; text-align: center; font-size: 13px; }
              .scam-advisory { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 12px; line-height: 1.5; }
              .social-links { margin-bottom: 25px; }
              .social-icon { display: inline-block; margin: 0 10px; width: 32px; height: 32px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Prasadam" class="logo">
              </div>
              <div class="body">
                <div class="icon-circle">
                  <img src="https://cdn-icons-png.flaticon.com/512/1170/1170678.png" width="35" style="opacity:0.6">
                </div>
                <h1 class="status-title">Password Reset</h1>
                <p class="greeting">We received a request to reset your password. Use the verification code below to proceed:</p>
                <div class="otp-code">${code}</div>
                <p style="color: #999; font-size: 14px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
              </div>
              <div class="footer">
                <div class="scam-advisory">
                  <strong>Important Scam Advisory:</strong> Beware of any fake offers and fraudulent site. <strong>Prasadam</strong> representatives do not demand money or ask for any personal details like your password/PIN/CVV by contacting you.
                </div>
                <div class="social-links">
                  <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" class="social-icon" alt="FB"></a>
                  <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/124/124021.png" class="social-icon" alt="Twitter"></a>
                  <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" class="social-icon" alt="Insta"></a>
                </div>
                <p>This email was sent by: <a href="mailto:sales@houskase.com" style="color:#fff; font-weight:bold;">sales@houskase.com</a></p>
                <p>&copy; ${new Date().getFullYear()} Prasadam — A Divine Taste. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>`;

        await client.sendMail(smtpUser, email, "Your Password Reset Code", html);

      } finally {
        client.close();
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify-otp") {
      const { data, error } = await supabase
        .from("password_reset_otps")
        .select("*")
        .eq("email", email)
        .eq("otp_code", await hashResetOtp(email, otp))
        .gt("expires_at", new Date().toISOString())
        .eq("verified", false)
        .maybeSingle();

      if (error || !data) throw new Error("Invalid or expired code.");

      await supabase
        .from("password_reset_otps")
        .update({ verified: true })
        .eq("id", data.id);

      return new Response(JSON.stringify({ success: true, resetToken: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reset-password") {
      // Final security check: must have a verified OTP in last 15 mins
      const { data, error } = await supabase
        .from("password_reset_otps")
        .select("*")
        .eq("id", resetToken)
        .eq("email", email)
        .eq("verified", true)
        .gt("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .maybeSingle();

      if (error || !data) throw new Error("Session expired. Please restart the process.");

      // Find user ID
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);
      if (!user) throw new Error("User not found.");

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
      if (updateError) throw new Error(updateError.message);

      // Cleanup
      await supabase.from("password_reset_otps").delete().eq("email", email);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});