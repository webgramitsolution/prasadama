import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keySecret) return json({ success: false, error: 'Payment gateway is not configured' }, 400)

    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return json({ success: false, error: 'Unauthorized' }, 401)

    const b = await req.json().catch(() => ({}))
    const order_id = typeof b?.order_id === 'string' ? b.order_id : null
    const razorpay_order_id = typeof b?.razorpay_order_id === 'string' ? b.razorpay_order_id : null
    const razorpay_payment_id = typeof b?.razorpay_payment_id === 'string' ? b.razorpay_payment_id : null
    const razorpay_signature = typeof b?.razorpay_signature === 'string' ? b.razorpay_signature : null
    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ success: false, error: 'Missing payment verification fields' }, 400)
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${razorpay_order_id}|${razorpay_payment_id}`)))
    if (sig !== razorpay_signature) {
      return json({ success: false, error: 'Invalid payment signature' }, 400)
    }

    const { data: order } = await supabase.from('orders').select('id, user_id').eq('id', order_id).maybeSingle()
    if (!order) return json({ success: false, error: 'Order not found' }, 404)
    if (order.user_id !== userData.user.id) return json({ success: false, error: 'Forbidden' }, 403)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_order_id,
        status: 'confirmed',
      })
      .eq('id', order_id)

    return json({ success: true })
  } catch (e) {
    return json({ success: false, error: (e as Error).message }, 500)
  }
})
