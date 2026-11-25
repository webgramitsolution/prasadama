import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { notifyOrder } from '../_shared/order-notification.ts'

const BodySchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    variation_id: z.string().uuid().nullable().optional(),
    quantity: z.number().int().min(1).max(10000),
  })).min(1).max(100),
  shipping_address: z.record(z.unknown()),
  billing_address: z.record(z.unknown()).optional(),
  notes: z.string().max(2000).nullable().optional(),
  coupon_id: z.string().uuid().nullable().optional(),
  buyer_type: z.enum(['retail', 'shop']).optional(),
  payment_method: z.enum(['razorpay', 'cod']).optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return json({ success: false, error: 'Unauthorized' }, 401)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) return json({ success: false, error: 'Unauthorized' }, 401)

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ success: false, error: 'Invalid checkout details', details: parsed.error.flatten().fieldErrors }, 400)

    const body = parsed.data
    const { data: order, error } = await admin.rpc('create_order_atomic', {
      _user_id: authData.user.id,
      _items: body.items,
      _shipping_address: body.shipping_address,
      _billing_address: body.billing_address ?? body.shipping_address,
      _notes: body.notes ?? null,
      _coupon_id: body.coupon_id ?? null,
      _buyer_type: body.buyer_type ?? 'retail',
      _shipping: 0,
      _tax: 0,
    })

    if (error || !order) {
      const message = error?.message?.split('\n')[0] || 'Order creation failed'
      return json({ success: false, error: message }, 400)
    }

    // Record cash-on-delivery so admins can tell COD orders apart from pending online payments
    if (body.payment_method === 'cod') {
      const { error: codError } = await admin.from('orders').update({ payment_status: 'cod' }).eq('id', order.id)
      if (codError) console.error('cod_mark_failed', codError.message)
      else order.payment_status = 'cod'
    }

    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`
    try {
      if (!await notifyOrder(functionUrl, authHeader, order.id, 'new_order')) console.error('notification_failed')
    } catch {
      console.error('notification_failed')
    }

    return json({ success: true, order })
  } catch (error) {
    console.error('create_order_failed')
    return json({ success: false, error: error instanceof Error ? error.message : 'Order creation failed' }, 500)
  }
})