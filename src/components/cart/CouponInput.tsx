import { useState } from 'react';
import { useCouponStore } from '@/store/couponStore';
import { trackCouponApplied } from '@/lib/analytics';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/**
 * `email` só existe no checkout, depois que o cliente preencheu os dados. Com
 * ele o servidor também confere quantas compras o cliente já fez com o cupom;
 * no carrinho, sem e-mail, só dá para saber se o cupom existe e está ligado.
 */
export default function CouponInput({ email }: { email?: string }) {
  const { appliedCoupon, applyCoupon, removeCoupon, remaining } = useCouponStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Insira um cupom');
      return;
    }

    setLoading(true);
    const result = await applyCoupon(code, email);

    if (result.success) {
      const { discountPercent } = useCouponStore.getState();
      trackCouponApplied(code.toUpperCase(), discountPercent);
      toast.success(`Cupom ${code.toUpperCase()} aplicado!`);
      setCode('');
    } else {
      toast.error(result.error || 'Cupom inválido');
    }
    setLoading(false);
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 px-3 py-2 rounded">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-green-800">✓ {appliedCoupon}</span>
          <button
            onClick={removeCoupon}
            className="text-xs text-green-600 hover:text-green-800 font-medium"
          >
            Remover
          </button>
        </div>
        {typeof remaining === 'number' && (
          <p className="mt-1 text-xs text-green-700">
            {remaining === 1
              ? 'Esta é a sua última compra com este cupom.'
              : `Você ainda pode usar este cupom em ${remaining} compras.`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Cupom (ex: OSS10)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleApply()}
        className={clsx(
          'flex-1 text-sm px-3 py-2 border rounded',
          'focus:border-brand-black transition-colors outline-none',
          'border-brand-gray-300'
        )}
      />
      <Button size="sm" loading={loading} onClick={handleApply}>
        Aplicar
      </Button>
    </div>
  );
}
