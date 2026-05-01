import { useState } from 'react';
import { PaymentMethod, OrderPayment } from '@/types';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/services/products';
import Button from '@/components/ui/Button';
import DynamicMessage from '@/components/ui/DynamicMessage';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import axios from 'axios';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  brazilOnly?: boolean;
  icon: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'pix',
    label: 'Pix',
    description: 'Pagamento instantâneo — aprovação imediata',
    brazilOnly: true,
    icon: '⚡',
  },
  {
    id: 'credit_card',
    label: 'Cartão de Crédito',
    description: 'Parcelamento disponível em até 12x',
    icon: '💳',
  },
  {
    id: 'debit_card',
    label: 'Cartão de Débito',
    description: 'Débito à vista com aprovação imediata',
    icon: '💳',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Aceito mundialmente com segurança',
    icon: '🅿',
  },
];

export default function PaymentStep() {
  const { customer, address, selectedShipping, setPayment, setOrderId, setStep } =
    useCheckoutStore();
  const { items, subtotal, clearCart } = useCartStore();

  const isBrazil = customer?.countryCode === 'BR';
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);

  const subTotal = subtotal();
  const shippingCost = selectedShipping?.price || 0;
  const total = subTotal + shippingCost;

  const availableMethods = PAYMENT_OPTIONS.filter(
    (o) => !o.brazilOnly || isBrazil
  );

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const payment: OrderPayment = {
        method: selectedMethod,
        installments: selectedMethod === 'credit_card' ? installments : undefined,
      };

      const { data } = await axios.post('/api/orders', {
        items,
        customer,
        address,
        shipping: selectedShipping,
        payment,
        subtotal: subTotal,
        shippingCost,
        total,
        currency: isBrazil ? 'BRL' : 'USD',
      });

      setPayment(payment);
      setOrderId(data.orderId);
      clearCart();
      setStep('success');
    } catch (error) {
      toast.error('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order summary */}
      <div className="bg-brand-gray-50 px-4 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-brand-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subTotal)}</span>
        </div>
        <div className="flex justify-between text-brand-gray-600">
          <span>Frete</span>
          <span>
            {shippingCost === 0
              ? isBrazil
                ? formatPrice(0)
                : 'A calcular'
              : formatPrice(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between font-bold text-brand-black border-t border-brand-gray-200 pt-2">
          <span>Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Payment methods */}
      <div>
        <label className="label-field">Forma de pagamento</label>
        <div className="space-y-2">
          {availableMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={clsx(
                'w-full flex items-center gap-4 px-4 py-3 border-2 text-left transition-all',
                selectedMethod === method.id
                  ? 'border-brand-black bg-brand-gray-50'
                  : 'border-brand-gray-200 hover:border-brand-gray-400'
              )}
            >
              <div
                className={clsx(
                  'w-4 h-4 rounded-full border-2 shrink-0 transition-all',
                  selectedMethod === method.id
                    ? 'border-brand-black bg-brand-black'
                    : 'border-brand-gray-300'
                )}
              />
              <span className="text-lg">{method.icon}</span>
              <div>
                <p className="font-semibold text-sm text-brand-black">
                  {method.label}
                </p>
                <p className="text-xs text-brand-gray-500">{method.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Credit card installments */}
      {selectedMethod === 'credit_card' && (
        <div className="animate-fade-in">
          <label className="label-field">Parcelamento</label>
          <select
            className="select-field"
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n}x de {formatPrice(total / n)}
                {n === 1 ? ' (sem juros)' : ' (sem juros)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pix instructions */}
      {selectedMethod === 'pix' && (
        <div className="animate-fade-in bg-green-50 border border-green-200 px-4 py-3 text-sm">
          <p className="font-semibold text-green-800 mb-1">Pix</p>
          <p className="text-green-700">
            Pagamento instantâneo. O código será gerado após confirmar o pedido.
          </p>
        </div>
      )}

      <DynamicMessage step="checkout" />

      <div className="flex gap-3 pt-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setStep('shipping')}
          className="flex-1"
        >
          ← Voltar
        </Button>
        <Button
          size="lg"
          className="flex-1"
          loading={loading}
          onClick={handlePlaceOrder}
        >
          Confirmar pedido
        </Button>
      </div>

      <p className="text-xs text-brand-gray-400 text-center">
        Seus dados são protegidos e criptografados. Compra 100% segura.
      </p>
    </div>
  );
}
