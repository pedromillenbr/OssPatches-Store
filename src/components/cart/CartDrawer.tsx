import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/services/products';
import Button from '@/components/ui/Button';
import CartItem from './CartItem';
import clsx from 'clsx';

export default function CartDrawer() {
  const { items, isOpen, closeCart, subtotal } = useCartStore();
  const total = subtotal();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-gray-200">
          <div>
            <h2 className="font-bold text-lg text-brand-black">Carrinho</h2>
            <p className="text-xs text-brand-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center hover:bg-brand-gray-100 transition-colors"
            aria-label="Fechar carrinho"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 border-2 border-brand-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-brand-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </div>
              <p className="font-semibold text-brand-black mb-1">
                Carrinho vazio
              </p>
              <p className="text-sm text-brand-gray-500 mb-6">
                Adicione produtos para continuar
              </p>
              <button
                onClick={closeCart}
                className="text-sm font-medium underline text-brand-black"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.cartId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-gray-200 px-6 py-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-gray-600">Subtotal</span>
              <span className="font-bold text-brand-black text-lg">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-xs text-brand-gray-400">
              Frete calculado no checkout
            </p>
            <Link href="/checkout" onClick={closeCart}>
              <Button size="lg" fullWidth>
                Finalizar compra
              </Button>
            </Link>
            <Link href="/carrinho" onClick={closeCart}>
              <Button variant="ghost" size="sm" fullWidth className="mt-2">
                Ver carrinho completo
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
