import { useState } from 'react';
import { useCouponStore } from '@/store/couponStore';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function CouponInput() {
  const { appliedCoupon, applyCoupon, removeCoupon } = useCouponStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Insira um cupom');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));

    if (applyCoupon(code)) {
      toast.success(`Cupom ${code.toUpperCase()} aplicado!`);
      setCode('');
    } else {
      toast.error('Cupom inválido');
    }
    setLoading(false);
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded">
        <span className="text-sm font-semibold text-green-800">✓ {appliedCoupon}</span>
        <button
          onClick={removeCoupon}
          className="text-xs text-green-600 hover:text-green-800 font-medium"
        >
          Remover
        </button>
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
