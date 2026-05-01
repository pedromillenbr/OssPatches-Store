import type { NextApiRequest, NextApiResponse } from 'next';
import { ShippingOption } from '@/types';
import { CONFIG } from '@/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { destination, items } = req.body;

  if (!destination || !items) {
    return res.status(400).json({ error: 'Missing destination or items' });
  }

  // If Melhor Envio token is configured, use it
  const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;
  const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';

  if (melhorEnvioToken) {
    try {
      const baseUrl = isSandbox
        ? 'https://sandbox.melhorenvio.com.br'
        : 'https://melhorenvio.com.br';

      const payload = {
        from: { postal_code: CONFIG.originCEP.replace(/\D/g, '') },
        to: { postal_code: destination.replace(/\D/g, '') },
        products: items,
        options: { receipt: false, own_hand: false },
        services: '1,2,17', // PAC, SEDEX, Mini Envios
      };

      const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'OssPatches/1.0 (contato@osspatches.com)',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Melhor Envio API error');

      const data = await response.json();
      const options: ShippingOption[] = data
        .filter((s: Record<string, unknown>) => !s.error)
        .map((s: Record<string, unknown>) => ({
          id: String(s.id),
          name: String(s.name),
          company: String((s.company as Record<string, unknown>)?.name || ''),
          price: Number(s.price),
          days: `${s.delivery_time} dias úteis`,
        }));

      return res.status(200).json(options);
    } catch (error) {
      console.error('Melhor Envio error:', error);
      // Fall through to mock
    }
  }

  // Mock fallback (development)
  const mock: ShippingOption[] = [
    { id: 'pac', name: 'PAC', company: 'Correios', price: 18.9, days: '5–8 dias úteis' },
    { id: 'sedex', name: 'SEDEX', company: 'Correios', price: 29.9, days: '1–3 dias úteis' },
    { id: 'sedex10', name: 'SEDEX 10', company: 'Correios', price: 44.9, days: 'Até 10h do dia seguinte' },
  ];

  return res.status(200).json(mock);
}
