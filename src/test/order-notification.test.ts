import { describe, expect, it, vi } from 'vitest';
import { notifyOrder } from '../../supabase/functions/_shared/order-notification';

describe('Order notification dispatch', () => {
  it('forwards the user authorization and persisted order ID', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    expect(await notifyOrder('https://example.test/functions/v1', 'Bearer user-session', 'persisted-order', 'new_order', request)).toBe(true);
    const call = request.mock.calls[0];
    if (!call) throw new Error('Notification request was not dispatched');
    const options = call[1];
    expect(options.headers.Authorization).toBe('Bearer user-session');
    expect(JSON.parse(options.body)).toEqual({ order_id: 'persisted-order', type: 'new_order' });
  });
  it('does not report a rejected notification as sent', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 401 }));
    expect(await notifyOrder('https://example.test', 'Bearer session', 'order', 'new_order', request)).toBe(false);
  });
  it('does not report SMTP failure in a successful HTTP response as sent', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false })));
    expect(await notifyOrder('https://example.test', 'Bearer session', 'order', 'new_order', request)).toBe(false);
  });
});