import Link from 'next/link';
import { useCheckoutStore } from '@/store/checkoutStore';
import Button from '@/components/ui/Button';
import DynamicMessage from '@/components/ui/DynamicMessage';

export default function SuccessStep() {
  const { orderId, customer, reset } = useCheckoutStore();

  return (
    <div className="text-center py-8 animate-fade-in">
      {/* Success icon */}
      <div className="w-20 h-20 bg-brand-black rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-black text-brand-black mb-3">
        Pedido confirmado!
      </h1>

      <p className="text-brand-gray-600 text-lg mb-2">
        Obrigado pela sua compra, {customer?.name?.split(' ')[0]}!
      </p>

      {orderId && (
        <div className="inline-flex items-center gap-2 bg-brand-gray-100 px-4 py-2 mb-6">
          <span className="text-xs text-brand-gray-500 uppercase tracking-wider">
            Pedido
          </span>
          <span className="font-bold text-brand-black font-mono">
            #{orderId}
          </span>
        </div>
      )}

      <div className="bg-brand-gray-50 border border-brand-gray-200 px-6 py-5 max-w-sm mx-auto mb-8">
        <p className="text-sm text-brand-gray-700 leading-relaxed">
          Sua compra foi confirmada! Você receberá um e-mail de confirmação com os detalhes do pedido em <strong>{customer?.email}</strong>.
        </p>
      </div>

      <DynamicMessage step="success" className="mb-8 text-base" />

      <div className="space-y-3">
        <Link href="/" onClick={() => reset()}>
          <Button size="lg" fullWidth className="max-w-xs mx-auto">
            Continuar comprando
          </Button>
        </Link>
      </div>

      {/* OSS */}
      <p className="mt-10 text-xs text-brand-gray-400 tracking-widest uppercase">
        OSS — OssPatches
      </p>
    </div>
  );
}
