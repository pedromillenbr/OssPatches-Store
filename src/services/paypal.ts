const BASE_URL =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error('PayPal credentials not configured');

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error('Failed to get PayPal access token');
  const data = await res.json();
  return data.access_token as string;
}

export async function createPayPalOrder(params: {
  orderId: string;
  total: number;
  currency: string;
  description: string;
}): Promise<{ id: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': params.orderId,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.orderId,
          description: params.description,
          amount: {
            currency_code: params.currency,
            value: params.total.toFixed(2),
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('PayPal create order error:', res.status, err);
    throw new Error('Falha ao criar ordem PayPal');
  }

  return res.json();
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{
  status: string;
  id: string;
  payer: { email_address?: string };
}> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('PayPal capture error:', res.status, err);
    throw new Error('Falha ao capturar pagamento PayPal');
  }

  return res.json();
}
