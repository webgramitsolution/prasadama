import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
};

/**
 * Robust SMTP client for Deno Edge Functions.
 * Standard libraries like 'deno.land/x/smtp' often use Deno.writeAll which is 
 * not supported in certain restricted Deno Deploy / Supabase Edge environments.
 * 
 * We use a manual socket implementation that avoids Deno.writeAll.
 */
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

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, correlationId } = await req.json();

    if (!email || !password || !fullName) {
      throw new Error("Missing required fields");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
    const smtpUser = Deno.env.get("SMTP_USER") || "sales@houskase.com";
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpPass) {
      throw new Error("SMTP password is not set.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: dbError } = await supabase
      .from("signup_otp_events")
      .insert([
        { 
          email, 
          otp_code: otp, 
          correlation_id: correlationId,
          full_name: fullName,
          password_hash: await sha256Hex(`${email.trim().toLowerCase()}:${password}`)
        }
      ]);

    if (dbError) throw new Error("Failed to store verification code");

    // Attempting our RobustSmtp client which uses raw Deno.connect/readable/writable
    // instead of high-level libraries that might use restricted APIs.
    
    const client = new RobustSmtp();
    try {
      console.log(`Connecting to ${smtpHost}:465...`);
      await client.connect(smtpHost, 465, true);
      await client.login(smtpUser, smtpPass);
      
      const logoUrl = "https://id-preview--4d51562e-e0ab-4432-8eef-9c0eeece0a1e.lovable.app/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png";
      const headerBg = "#001B3D";
      const footerBg = "#ad1e2a";
      const accentColor = "#E94E63";

      const html = `
      <!DOCTYPE html>
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
            <h1 class="status-title">Account Verification</h1>
            <p class="greeting">Hi <strong>${fullName}</strong>,</p>
            <p style="color: #666; font-size: 16px;">Thank you for choosing Prasadam. Use the verification code below to complete your registration:</p>
            <div class="otp-code">${otp}</div>
            <p style="color: #999; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
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
            <p>&copy; ${new Date().getFullYear()} Prasadam International. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>`;

      await client.sendMail(smtpUser, email, "Verify your Prasadam Account", html);
      console.log("Email sent successfully!");
    } catch (smtpErr: any) {
      console.error("Manual SMTP failed:", smtpErr.message);
      
      // Fallback to PHP Bridge if configured
      const bridgeUrl = Deno.env.get("MAIL_BRIDGE_URL");
      if (bridgeUrl) {
        console.log("Falling back to PHP bridge...");
        const res = await fetch(bridgeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: Deno.env.get("MAIL_BRIDGE_TOKEN") ?? "",
            to: email,
            subject: "Verify your Prasadam Account",
            fullName: fullName,
            from: smtpUser,
            message: `Your verification code is: ${otp}`
          })
        });
        if (!res.ok) throw new Error("PHP Bridge failed.");
      } else {
         throw new Error(`SMTP Error: ${smtpErr.message}. The environment restricts raw sockets. Please upload 'mailer.php' to your Hostinger server and set MAIL_BRIDGE_URL secret.`);
      }
    } finally {
      client.close();
    }




    return new Response(
      JSON.stringify({ message: "OTP sent", correlationId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});