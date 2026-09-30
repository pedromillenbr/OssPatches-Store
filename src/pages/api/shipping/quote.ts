import type { NextApiRequest, NextApiResponse } from 'next';
import { ShippingOption, CartItem } from '@/types';
import { CONFIG } from '@/config';
import { parcelFor } from '@/lib/productWeight';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';

interface MelhorEnvioService {
  id: number;
  name: string;
  price: string | null;
  delivery_time: number;
  error?: string;
  company: { id: number; name: string };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('shipping', req, res)) return;

  if (isBodyTooLarge(req, 10 * 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const { destination, items } = req.body;

  if (!destination || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing destination or items' });
  }

  const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;
  const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';

  if (!melhorEnvioToken) {
    return res.status(500).json({ error: 'Shipping service not configured' });
  }

  const baseUrl = isSandbox
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';

  // Loggi: 31 (Express), 34 (Loggi Ponto) | J&T Express: 33 (Standard)
  const ALLOWED_SERVICES = [31, 33, 34];

  const payload = {
    from: { postal_code: CONFIG.originCEP.replace(/\D/g, '') },
    to: { postal_code: destination.replace(/\D/g, '') },
    // Peso e medidas saem DAQUI, do servidor, pelo tamanho de cada faixa.
    // Antes vinham prontos do navegador: dava para pedir cotação de 10 g e a
    // loja pagar a diferença na hora de postar.
    products: (items as CartItem[]).map(parcelFor),
    options: { receipt: false, own_hand: false },
    services: ALLOWED_SERVICES.join(','),
  };

  try {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Melhor Envio API error:', response.status, errorText);
      return res.status(502).json({ error: 'Erro ao calcular frete' });
    }

    const data: MelhorEnvioService[] = await response.json();

    const COMPANY_DISPLAY: Record<number, string> = {
      14: 'Loggi',
      15: 'J&T Express',
    };

    const options: ShippingOption[] = data
      .filter((s) => !s.error && s.price !== null && ALLOWED_SERVICES.includes(s.id))
      .map((s) => ({
        id: String(s.id),
        name: COMPANY_DISPLAY[s.company?.id] ?? s.name,
        company: COMPANY_DISPLAY[s.company?.id] ?? s.company?.name ?? '',
        price: parseFloat(s.price as string),
        days: `Entrega em até ${s.delivery_time} dias úteis`,
      }))
      .sort((a, b) => a.price - b.price);

    if (options.length === 0) {
      return res.status(422).json({ error: 'Nenhuma opção de frete disponível para este CEP' });
    }

    return res.status(200).json(options);
  } catch (error) {
    console.error('Melhor Envio error:', error);
    return res.status(500).json({ error: 'Erro interno ao calcular frete' });
  }
}
