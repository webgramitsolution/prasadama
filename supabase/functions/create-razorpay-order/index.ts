import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) return json({ success: false, error: 'Payment gateway is not configured' }, 400)

    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return json({ success: false, error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const orderId = typeof body?.order_id === 'string' ? body.order_id : null
    if (!orderId) return json({ success: false, error: 'order_id is required' }, 400)

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total, total_amount, user_id')
      .eq('id', orderId)
      .maybeSingle()

    if (error || !order) return json({ success: false, error: 'Order not found' }, 404)
    if (order.user_id !== userData.user.id) return json({ success: false, error: 'Forbidden' }, 403)

    const amountRupees = Number(order.total ?? order.total_amount ?? 0)
    if (!amountRupees || amountRupees <= 0) return json({ success: false, error: 'Invalid order amount' }, 400)
    const amount = Math.round(amountRupees * 100)

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: order.order_number ?? order.id,
        notes: { order_id: order.id },
      }),
    })

    const rzpJson = await rzpRes.json()
    if (!rzpRes.ok) {
      return json({ success: false, error: rzpJson?.error?.description || 'Razorpay order creation failed' }, 400)
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await admin.from('orders').update({ razorpay_order_id: rzpJson.id, payment_status: 'pending' }).eq('id', order.id)

    return json({
      success: true,
      key_id: keyId,
      amount,
      currency: 'INR',
      razorpay_order_id: rzpJson.id,
      order_number: order.order_number ?? order.id,
    })
  } catch (e) {
    return json({ success: false, error: (e as Error).message }, 500)
  }
})
