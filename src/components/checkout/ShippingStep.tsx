import { useEffect, useState } from 'react';
import { ShippingOption } from '@/types';
import { useCheckoutStore } from '@/store/checkoutStore';
import {
  quoteBrazilianShipping,
  getInternationalShippingOptions,
} from '@/services/shipping';
import { useCartStore } from '@/store/cartStore';
import { CONFIG } from '@/config';
import { formatPrice } from '@/services/products';
import Button from '@/components/ui/Button';
import clsx from 'clsx';

export default function ShippingStep() {
  const { customer, address, setShipping, selectedShipping, setStep } =
    useCheckoutStore();
  const { items } = useCartStore();
  const isBrazil = customer?.countryCode === 'BR';

  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInternational = !isBrazil;

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      setError(null);

      if (isBrazil && address?.zipCode) {
        const shippingItems = items.map((item) => ({
          ...CONFIG.beltDimensions,
          quantity: item.quantity,
        }));
        try {
          const opts = await quoteBrazilianShipping(address.zipCode, shippingItems);
          setOptions(opts);
        } catch (err) {
          setError('Não foi possível calcular o frete para este CEP. Verifique o endereço ou tente novamente.');
          console.error(err);
        }
      } else {
        setOptions(getInternationalShippingOptions());
      }

      setLoading(false);
    }
    loadOptions();
  }, [isBrazil, address, items]);

  const handleContinue = () => {
    if (isBrazil && !selectedShipping) return;
    setStep('payment');
  };

  return (
    <div className="space-y-6">
      {isInternational && (
        <div className="bg-brand-gray-50 border border-brand-gray-200 px-4 py-4 text-sm">
          <p className="font-semibold text-brand-black mb-1">
            Frete internacional
          </p>
          <p className="text-brand-gray-600 leading-relaxed">
            O frete internacional será calculado após a compra e enviado para
            o seu e-mail com as opções disponíveis e valores exatos.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded" />
          ))}
          <p className="text-xs text-brand-gray-400 text-center">
            Calculando frete para seu CEP…
          </p>
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 rounded px-4 py-4">
          <p className="text-sm text-red-600 font-semibold mb-1">Erro ao calcular frete</p>
          <p className="text-sm text-red-500">{error}</p>
          <button
            className="mt-3 text-xs text-red-600 underline"
            onClick={() => setStep('address')}
          >
            ← Voltar e corrigir endereço
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => !isInternational && setShipping(option)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-4 border-2 text-left transition-all',
                !isInternational && 'cursor-pointer',
                isInternational && 'cursor-default',
                selectedShipping?.id === option.id
                  ? 'border-brand-black bg-brand-gray-50'
                  : 'border-brand-gray-200 hover:border-brand-gray-400'
              )}
              disabled={isInternational}
            >
              <div className="flex items-center gap-3">
                {!isInternational && (
                  <div
                    className={clsx(
                      'w-4 h-4 rounded-full border-2 shrink-0 transition-all',
                      selectedShipping?.id === option.id
                        ? 'border-brand-black bg-brand-black'
                        : 'border-brand-gray-300'
                    )}
                  />
                )}
                <div>
                  <p className="font-semibold text-sm text-brand-black">
                    {option.name}
                  </p>
                  <p className="text-xs text-brand-gray-500">{option.days}</p>
                </div>
              </div>
              <div className="text-right">
                {isInternational || option.price === 0 ? (
                  <span className="text-sm font-medium text-brand-gray-500 italic">
                    A calcular
                  </span>
                ) : (
                  <span className="font-bold text-brand-black">
                    {formatPrice(option.price)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setStep('address')}
          className="flex-1"
        >
          ← Voltar
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={isBrazil ? (!selectedShipping || !!error) : false}
          onClick={handleContinue}
        >
          Continuar → Pagamento
        </Button>
      </div>
    </div>
  );
}
