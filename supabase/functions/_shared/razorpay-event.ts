export async function validHmac(body: string, signature: string, secret: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(signature.match(/../g) ?? [], value => parseInt(value, 16));
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(body));
}

export async function signHmac(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const result = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, '0')).join('');
}

export interface CapturedPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
}

export function paymentMatchesOrder(payment: CapturedPayment, order: { razorpay_order_id: string | null; total: number | null; total_amount: number; payment_status: string | null; status: string | null }) {
  return payment.status === 'captured' && payment.captured === true
    && payment.currency === 'INR'
    && payment.order_id === order.razorpay_order_id
    && Number.isSafeInteger(payment.amount)
    && payment.amount === Math.round(Number(order.total ?? order.total_amount) * 100)
    && order.payment_status === 'pending'
    && order.status !== 'cancelled';
}