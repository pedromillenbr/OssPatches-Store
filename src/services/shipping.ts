import axios from 'axios';
import { ViaCEPResponse, ShippingOption } from '@/types';

export async function lookupCEP(cep: string): Promise<ViaCEPResponse> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) throw new Error('CEP inválido');
  const { data } = await axios.get<ViaCEPResponse>(
    `https://viacep.com.br/ws/${clean}/json/`
  );
  if (data.erro) throw new Error('CEP não encontrado');
  return data;
}

export async function quoteBrazilianShipping(
  destinationCEP: string,
  items: { weight: number; width: number; height: number; length: number; quantity: number }[]
): Promise<ShippingOption[]> {
  const response = await axios.post<ShippingOption[]>('/api/shipping/quote', {
    destination: destinationCEP,
    items,
  });
  return response.data;
}

export function getInternationalShippingOptions(): ShippingOption[] {
  return [
    {
      id: 'dhl-express',
      name: 'DHL Express',
      company: 'DHL',
      price: 0, // calculated after order
      days: '3–7 dias úteis',
      logo: '/images/carriers/dhl.png',
    },
    {
      id: 'correios-internacional',
      name: 'Correios Internacional (EMS)',
      company: 'Correios',
      price: 0,
      days: '15–30 dias úteis',
      logo: '/images/carriers/correios.png',
    },
  ];
}


export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
