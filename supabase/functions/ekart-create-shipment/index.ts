import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const BodySchema = z.object({ order_id: z.string().uuid() })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  let orderId: string | null = null
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ success: false, error: 'A valid order is required' }, 400)
    orderId = parsed.data.order_id
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data: authData } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    if (!authData.user) return json({ success: false, error: 'Unauthorized' }, 401)
    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle()
    if (!order) return json({ success: false, error: 'Order not found' }, 404)
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', authData.user.id).eq('role', 'admin').maybeSingle()
    if (order.user_id !== authData.user.id && !role) return json({ success: false, error: 'Forbidden' }, 403)
    if (order.tracking_number && order.ekart_sync_status === 'synced') return json({ success: true, already: true, tracking_id: order.tracking_number })

    const endpoint = Deno.env.get('EKART_SHIPMENT_API_URL')
    if (!endpoint) {
      const message = 'Ekart shipment API URL is not configured'
      await admin.from('orders').update({ ekart_sync_status: 'failed', ekart_last_attempt_at: new Date().toISOString(), ekart_last_error: message }).eq('id', order.id)
      await admin.from('ekart_integration_logs').insert({ order_id: order.id, event_type: 'create_shipment', status: 'failed', payload: { order_number: order.order_number }, response: { error: message } })
      return json({ success: false, error: message }, 503)
    }
    const clientId = Deno.env.get('EKART_CLIENT_ID')
    const username = Deno.env.get('EKART_USERNAME')
    const password = Deno.env.get('EKART_PASSWORD')
    if (!clientId || !username || !password) return json({ success: false, error: 'Ekart credentials are not configured' }, 503)
    const { data: items } = await admin.from('order_items').select('product_name, quantity, unit_price, variation_details').eq('order_id', order.id)
    const payload = { order_number: order.order_number, amount: order.total, shipping_address: order.shipping_address, items: items ?? [] }
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': clientId, Authorization: `Basic ${btoa(`${username}:${password}`)}` }, body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => ({}))
    const trackingId = String(result.tracking_id || result.awb || result.tracking_number || '')
    if (!response.ok || !trackingId) throw new Error(result.message || result.error || `Ekart returned HTTP ${response.status}`)
    await admin.from('orders').update({ tracking_number: trackingId, ekart_sync_status: 'synced', ekart_last_attempt_at: new Date().toISOString(), ekart_last_error: null }).eq('id', order.id)
    await admin.from('ekart_integration_logs').insert({ order_id: order.id, event_type: 'create_shipment', status: 'success', payload, response: result })
    return json({ success: true, tracking_id: trackingId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ekart sync failed'
    if (orderId) {
      await admin.from('orders').update({ ekart_sync_status: 'failed', ekart_last_attempt_at: new Date().toISOString(), ekart_last_error: message }).eq('id', orderId)
      await admin.from('ekart_integration_logs').insert({ order_id: orderId, event_type: 'create_shipment', status: 'failed', response: { error: message } })
    }
    return json({ success: false, error: message }, 502)
  }
})