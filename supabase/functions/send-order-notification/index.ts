import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const BodySchema = z.object({
  order_id: z.string().uuid().optional(),
  order_number: z.string().optional(),
  type: z.enum(['new_order', 'order_confirmed', 'order_processing', 'order_shipped', 'order_delivered', 'order_cancelled']),
  preview_only: z.boolean().optional(),
  to_override: z.string().email().optional(),
})

class SmtpClient {
  private conn: Deno.TlsConn | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private encoder = new TextEncoder()

  async connect(hostname: string) {
    this.conn = await Deno.connectTls({ hostname, port: 465 })
    this.reader = this.conn.readable.getReader()
    this.writer = this.conn.writable.getWriter()
    await this.expect([220])
  }
  private async read() {
    const result = await this.reader?.read()
    return result?.value ? new TextDecoder().decode(result.value) : ''
  }
  private async expect(codes: number[]) {
    const response = await this.read()
    const code = Number(response.slice(0, 3))
    if (!codes.includes(code)) throw new Error('Email server rejected the request')
  }
  private async command(value: string, expected: number[]) {
    await this.writer?.write(this.encoder.encode(`${value}\r\n`))
    await this.expect(expected)
  }
  async login(user: string, pass: string) {
    await this.command('EHLO houskase.com', [250])
    await this.command('AUTH LOGIN', [334])
    await this.command(btoa(user), [334])
    await this.command(btoa(pass), [235])
  }
  async send(from: string, to: string, subject: string, html: string) {
    await this.command(`MAIL FROM:<${from}>`, [250])
    await this.command(`RCPT TO:<${to}>`, [250, 251])
    await this.command('DATA', [354])
    await this.command([
      `From: Prasadam <${from}>`, `To: ${to}`, `Subject: ${subject}`,
      'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', '', html, '.',
    ].join('\r\n'), [250])
    await this.command('QUIT', [221])
  }
  close() {
    try { this.writer?.releaseLock() } catch { /* no-op */ }
    try { this.reader?.releaseLock() } catch { /* no-op */ }
    try { this.conn?.close() } catch { /* no-op */ }
  }
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ success: false, error: 'Invalid notification request' }, 400)

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: authData } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    if (!authData.user) return json({ success: false, error: 'Unauthorized' }, 401)

    let order: any = null;
    let items: any[] = [];
    
    if (parsed.data.preview_only || parsed.data.order_id === "00000000-0000-0000-0000-000000000000") {
      order = {
        order_number: "ORD-TEST-12345",
        created_at: new Date().toISOString(),
        subtotal: 1500,
        discount_amount: 200,
        total: 1300,
        billing_address: { full_name: "Test Customer", email: "test@example.com" }
      };
      items = [{ product_name: "Premium Dry Fruit Prasad", quantity: 2, total_price: 1500, variation_details: "Pack: 500g" }];
    } else {
      const { data: orderData } = await admin.from('orders').select('*').eq('id', parsed.data.order_id!).maybeSingle()
      order = orderData;
      if (!order) return json({ success: false, error: 'Order not found' }, 404)
      const { data: role } = await admin.from('user_roles').select('role').eq('user_id', authData.user.id).eq('role', 'admin').maybeSingle()
      if (order.user_id !== authData.user.id && !role) return json({ success: false, error: 'Forbidden' }, 403)
      const { data: itemsData } = await admin.from('order_items').select('product_name, variation_details, quantity, unit_price, total_price').eq('order_id', order.id)
      items = itemsData || [];
    }

    const billing = (order.billing_address ?? {}) as Record<string, unknown>
    const shipping = (order.shipping_address ?? {}) as Record<string, unknown>
    
    let recipient = parsed.data.to_override || String(billing.email || '');
    if (!recipient && !parsed.data.preview_only) {
      const { data: owner } = await admin.auth.admin.getUserById(order.user_id)
      recipient = owner.user?.email || '';
    }
    
    if (!recipient && !parsed.data.preview_only) return json({ success: false, error: 'Buyer email is unavailable' }, 400)


    const label: Record<string, string> = {
      new_order: 'Order confirmation', order_confirmed: 'Order confirmed', order_processing: 'Order processing',
      order_shipped: 'Order shipped', order_delivered: 'Order delivered', order_cancelled: 'Order cancelled',
    }

    const typeLabels: Record<string, string> = {
      new_order: 'New Order Received',
      order_confirmed: 'Order Confirmed',
      order_processing: 'Order Processing',
      order_shipped: 'Order Dispatched',
      order_delivered: 'Order Delivered',
      order_cancelled: 'Order Cancelled',
    }

    const typeDescriptions: Record<string, string> = {
      new_order: 'Thank you for your purchase. Your Order has been placed successfully.',
      order_confirmed: 'Good news! Your order has been confirmed and is being prepared.',
      order_processing: 'Your order is currently being processed by our warehouse team.',
      order_shipped: 'Great news! Your package has been dispatched and is on its way to you.',
      order_delivered: 'Your package has been delivered successfully. We hope you love your new Prasadam devotional offerings!',
      order_cancelled: 'Your order has been cancelled as per request or due to unforeseen circumstances. If you have any questions, please contact support.',
    }

    const itemRows = (items ?? []).map((item) => `<tr><td style="padding:12px;border-bottom:1px solid #eee;font-size:14px;color:#444;">${escapeHtml(item.product_name)}${item.variation_details ? `<br><small style="color:#666">${escapeHtml(item.variation_details)}</small>` : ''}</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#444;">${item.quantity}</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;color:#444;font-weight:600;">₹${Number(item.total_price ?? 0).toFixed(2)}</td></tr>`).join('')
    
    const logoUrl = "/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png";
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
        .header { background-color: ${headerBg}; padding: 25px; display: table; width: 100%; box-sizing: border-box; }
        .header-left { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; color: #ffffff; }
        .logo { height: 45px; width: auto; display: block; }
        .order-meta { font-size: 13px; opacity: 0.9; margin: 0; }
        .body { padding: 40px 35px; text-align: center; }
        .icon-circle { width: 70px; height: 70px; background: #f0f4f8; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 25px; }
        .status-title { font-size: 24px; font-weight: 700; margin: 0 0 10px 0; color: #1a1a1a; }
        .greeting { font-size: 16px; color: #666; margin-bottom: 30px; line-height: 1.5; }
        .description { font-size: 14px; color: #777; margin-bottom: 30px; line-height: 1.6; }
        .btn { display: inline-block; padding: 14px 30px; background-color: ${accentColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 25px 0; }

        .summary-table { width: 100%; border-collapse: collapse; margin: 30px 0; text-align: left; }
        .summary-header { font-size: 12px; text-transform: uppercase; color: #999; letter-spacing: 1px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .totals { margin-top: 25px; padding-top: 20px; border-top: 2px solid #eee; }
        .total-row { display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 14px; }
        .total-label { color: #666; margin-right: 15px; }
        .total-value { color: #1a1a1a; width: 100px; text-align: right; }
        .grand-total { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-top: 10px; }
        .footer { background-color: ${footerBg}; color: #ffffff; padding: 35px; text-align: center; font-size: 13px; }
        .scam-advisory { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 12px; line-height: 1.5; }
        .social-links { margin-bottom: 25px; }
        .social-icon { display: inline-block; margin: 0 10px; width: 32px; height: 32px; }
        .footer-links { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        .footer-links a { color: #ffffff; text-decoration: none; margin: 0 10px; opacity: 0.8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <img src="${logoUrl}" alt="Prasadam" class="logo">
          </div>
          <div class="header-right">
            <p class="order-meta">Order Number: ${escapeHtml(order.order_number)}</p>
            <p class="order-meta">Order Placed On: ${new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
        
        <div class="body">
          <div class="icon-circle">
            <img src="https://cdn-icons-png.flaticon.com/512/1170/1170678.png" width="35" style="opacity:0.6">
          </div>
          <h1 class="status-title">${typeLabels[parsed.data.type]}</h1>
          <p class="greeting">Hi <strong>${escapeHtml(billing.full_name || shipping.full_name || 'Customer')}</strong>,</p>
          <p class="description">${typeDescriptions[parsed.data.type]}</p>
          <p style="font-size: 14px; color: #666;">${parsed.data.type === 'order_delivered' ? 'Thank you for choosing Prasadam.' : 'You will receive the next update when your order status changes.'}</p>

          
          <a href="https://houskase.com/dashboard" class="btn">VIEW YOUR ORDER</a>
          
          <table class="summary-table">
            <thead>
              <tr>
                <th class="summary-header">Product</th>
                <th class="summary-header" style="text-align:center">Qty</th>
                <th class="summary-header" style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">₹${Number(order.subtotal ?? 0).toFixed(2)}</span>
            </div>
            ${Number(order.discount_amount ?? 0) > 0 ? `
            <div class="total-row">
              <span class="total-label">Discount</span>
              <span class="total-value">-₹${Number(order.discount_amount).toFixed(2)}</span>
            </div>` : ''}
            <div class="total-row grand-total">
              <span class="total-label" style="color:#1a1a1a">Grand Total</span>
              <span class="total-value">₹${Number(order.total ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="scam-advisory">
            <strong>Important Scam Advisory:</strong> Beware of any fake offers and fraudulent site. <strong>Prasadam</strong> representatives do not demand money or ask for any personal details like your password/PIN/CVV by contacting you. Your bank account details may be requested only in case a refund is due for your order.
          </div>
          
          <div class="social-links">
            <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" class="social-icon" alt="FB"></a>
            <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/124/124021.png" class="social-icon" alt="Twitter"></a>
            <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" class="social-icon" alt="Insta"></a>
          </div>
          
          <p>This email was sent by: <a href="mailto:sales@houskase.com" style="color:#fff; font-weight:bold;">sales@houskase.com</a></p>
          <p>For any questions please send an email to <a href="mailto:sales@houskase.com" style="color:#fff; font-weight:bold;">sales@houskase.com</a></p>
          
          <div class="footer-links">
            <a href="https://houskase.com/privacy-policy">Privacy Policy</a> | 
            <a href="https://houskase.com/help">Help Center</a>
          </div>
        </div>
      </div>
    </body>
    </html>`

    if (parsed.data.preview_only) {
      return json({ success: true, html });
    }

    const host = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com'

    const user = Deno.env.get('SMTP_USER')
    const pass = Deno.env.get('SMTP_PASS')
    if (!user || !pass) return json({ success: false, error: 'Email is not configured' }, 500)
    
    // For new orders, notify admin as well with a special subject
    const recipients = parsed.data.type === 'new_order' ? [recipient, user] : [recipient]
    for (const to of [...new Set(recipients)]) {
      const isToAdmin = to === user;
      const subject = isToAdmin 
        ? `[ADMIN] New Order Received - ${order.order_number}` 
        : `${typeLabels[parsed.data.type]} - ${order.order_number}`;
        
      const client = new SmtpClient()
      try { 
        await client.connect(host); 
        await client.login(user, pass); 
        await client.send(user, to, subject, html);
        
        // Log delivery
        try {
          await admin.from('email_logs').insert({
            recipient_email: to,
            notification_type: parsed.data.type,
            status: 'sent',
            sent_at: new Date().toISOString()
          });
        } catch (logErr) {
          console.error('Failed to log email success:', logErr);
        }
      } catch (err) {
        console.error('SMTP error:', err);
        try {
          await admin.from('email_logs').insert({
            recipient_email: to,
            notification_type: parsed.data.type,
            status: 'failed',
            error_reason: err instanceof Error ? err.message : 'Unknown SMTP error',
            sent_at: new Date().toISOString()
          });
        } catch (logErr) {
          console.error('Failed to log email failure:', logErr);
        }
      } finally { 
        client.close() 
      }

    }

    
    // SMS Notification step
    if (parsed.data.type === 'new_order') {
      try {
        const billing = (order.billing_address ?? {}) as Record<string, unknown>;
        const shipping = (order.shipping_address ?? {}) as Record<string, unknown>;
        const phone = String(billing.phone || shipping.phone || '');
        if (phone) {
          console.log(`Triggering SMS for order ${order.order_number} to ${phone}`);
          fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
              type: 'order_confirmation', 
              phone, 
              orderNumber: order.order_number,
              fullName: billing.full_name || shipping.full_name || 'Customer'
            }),
          }).catch(err => console.error('SMS trigger failed:', err));
        }
      } catch (smsErr) {
        console.error('SMS notification prep failed:', smsErr);
      }
    }

    return json({ success: true })
  } catch (error) {
    console.error('order_notification_failed')
    return json({ success: false, error: error instanceof Error ? error.message : 'Notification failed' }, 500)
  }
})