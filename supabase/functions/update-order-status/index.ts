import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const BodySchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ success: false, error: 'Invalid status update' }, 400)
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: authData } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    if (!authData.user) {
      console.error('Update order status: No user found for token');
      return json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const { data: role, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', authData.user.id).eq('role', 'admin').maybeSingle()
    if (roleError) {
      console.error('Update order status: Role check error:', roleError);
    }
    
    if (!role) {
      console.error(`Update order status: User ${authData.user.id} is not an admin`);
      return json({ success: false, error: 'Administrator access required' }, 403)
    }

    const { data: order, error } = await admin.rpc('admin_update_order_status', { _order_id: parsed.data.order_id, _status: parsed.data.status })
    if (error || !order) return json({ success: false, error: error?.message || 'Order update failed' }, 400)
    const typeMap: Record<string, string> = {
      pending: 'new_order',
      confirmed: 'order_confirmed',
      processing: 'order_processing',
      shipped: 'order_shipped',
      delivered: 'order_delivered',
      cancelled: 'order_cancelled'
    }
    const type = typeMap[parsed.data.status] || 'order_processing'
    const notify = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-notification`, {
      method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id, type }),
    })
    return json({ success: true, order, email_sent: notify.ok })
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : 'Order update failed' }, 500)
  }
})