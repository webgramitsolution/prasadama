/** Forward the validated user's session, never a service key, to the protected mail action. */
export async function notifyOrder(functionUrl: string, authorization: string, orderId: string, type: string, request: typeof fetch = fetch) {
  const response = await request(`${functionUrl}/send-order-notification`, {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, type }),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.success === true;
}