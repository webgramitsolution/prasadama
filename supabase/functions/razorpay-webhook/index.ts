import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { validHmac, paymentMatchesOrder } from '../_shared/razorpay-event.ts'

const Payment = z.object({ id: z.string().regex(/^pay_[A-Za-z0-9]+$/), order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount: z.number().int().positive(), currency: z.string(), status: z.string(), captured: z.boolean() })
const Event = z.object({ event: z.string(), payload: z.object({ payment: z.object({ entity: Payment }).optional() }) })

Deno.serve(async req => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ success: false }, 405)
  try {
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!secret) return json({ success: false, error: 'Webhook not configured' }, 503)
    const raw = await req.text()
    if (raw.length > 100000) return json({ success: false }, 413)
    if (!await validHmac(raw, req.headers.get('x-razorpay-signature') ?? '', secret)) return json({ success: false }, 401)
    const event = Event.safeParse(JSON.parse(raw))
    if (!event.success) return json({ success: false }, 400)
    if (!['payment.captured', 'order.paid'].includes(event.data.event)) return json({ success: true, ignored: true })
    const payment = event.data.payload.payment?.entity
    if (!payment) return json({ success: false }, 400)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order, error } = await admin.from('orders').select('id, total, total_amount, razorpay_order_id, razorpay_payment_id, payment_status, status').eq('razorpay_order_id', payment.order_id).maybeSingle()
    if (error) return json({ success: false }, 500)
    if (!order) return json({ success: false }, 404)
    if (order.payment_status === 'paid') return json({ success: order.razorpay_payment_id === payment.id }, order.razorpay_payment_id === payment.id ? 200 : 409)
    if (!paymentMatchesOrder(payment, order)) return json({ success: false }, 409)
    const { error: updateError } = await admin.from('orders').update({ payment_status: 'paid', status: 'confirmed', razorpay_payment_id: payment.id }).eq('id', order.id).eq('payment_status', 'pending').eq('razorpay_order_id', payment.order_id).neq('status', 'cancelled').select('id').maybeSingle()
    if (updateError) return json({ success: false }, 500)
    return json({ success: true })
  } catch {
    return json({ success: false }, 500)
  }
})