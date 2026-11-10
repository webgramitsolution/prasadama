import { describe, it, expect } from 'vitest';
import { paymentMatchesOrder, signHmac, validHmac } from '../../supabase/functions/_shared/razorpay-event';

const payment = { id: 'pay_1', order_id: 'order_1', amount: 151000, currency: 'INR', status: 'captured', captured: true };
const order = { razorpay_order_id: 'order_1', total: 1510, total_amount: 1510, payment_status: 'pending', status: 'pending' };
describe('Captured Razorpay webhook validation', () => {
  it('accepts only a valid raw-body signature', async () => {
    const signature = await signHmac('event-body', 'test-only-secret');
    expect(await validHmac('event-body', signature, 'test-only-secret')).toBe(true);
    expect(await validHmac('tampered-body', signature, 'test-only-secret')).toBe(false);
    expect(await validHmac('event-body', signature, 'wrong-secret')).toBe(false);
  });
  it('accepts a captured INR payment for the exact persisted amount', () => expect(paymentMatchesOrder(payment, order)).toBe(true));
  it('rejects authorized but uncaptured payments', () => expect(paymentMatchesOrder({ ...payment, status: 'authorized', captured: false }, order)).toBe(false));
  it('rejects payments belonging to another order', () => expect(paymentMatchesOrder({ ...payment, order_id: 'order_2' }, order)).toBe(false));
  it('rejects underpayments', () => expect(paymentMatchesOrder({ ...payment, amount: 150999 }, order)).toBe(false));
  it('rejects another currency', () => expect(paymentMatchesOrder({ ...payment, currency: 'USD' }, order)).toBe(false));
  it('rejects already paid orders', () => expect(paymentMatchesOrder(payment, { ...order, payment_status: 'paid' })).toBe(false));
  it('rejects cancelled orders', () => expect(paymentMatchesOrder(payment, { ...order, status: 'cancelled' })).toBe(false));
  it('rejects COD transitions', () => expect(paymentMatchesOrder(payment, { ...order, payment_status: 'cod' })).toBe(false));
});