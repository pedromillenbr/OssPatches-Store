import { NextSeo } from 'next-seo';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import CartItem from '@/components/cart/CartItem';
import CouponInput from '@/components/cart/CouponInput';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';
import { useCouponStore } from '@/store/couponStore';
import { formatPrice } from '@/services/products';

export default function CartPage() {
  const { items, subtotal } = useCartStore();
  const { appliedCoupon, discountPercent } = useCouponStore();

  const subTotal = subtotal();
  const discount = (subTotal * discountPercent) / 100;
  const total = subTotal - discount;

  return (
    <>
      <NextSeo title="Carrinho" noindex />
      <Layout>
        <div className="container-site py-12">
          <h1 className="text-3xl font-black text-brand-black mb-8">
            Carrinho
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl font-semibold text-brand-black mb-3">
                Seu carrinho está vazio
              </p>
              <p className="text-brand-gray-500 mb-8">
                Explore nossos produtos e encontre a faixa ou patch ideal
              </p>
              <Link href="/">
                <Button size="lg">Ver produtos</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Items */}
              <div className="lg:col-span-2">
                <div className="divide-y divide-brand-gray-100">
                  {items.map((item) => (
                    <CartItem key={item.cartId} item={item} />
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <div className="border border-brand-gray-200 p-6 sticky top-24">
                  <h2 className="font-bold text-lg text-brand-black mb-4">
                    Resumo do pedido
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-brand-gray-600">
                      <span>
                        Subtotal ({items.length}{' '}
                        {items.length === 1 ? 'item' : 'itens'})
                      </span>
                      <span>{formatPrice(subTotal)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-green-700 font-medium">
                        <span>Desconto ({discountPercent}%)</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-brand-gray-600">
                      <span>Frete</span>
                      <span className="text-brand-gray-400 italic">
                        Calculado no checkout
                      </span>
                    </div>
                    <div className="border-t border-brand-gray-200 pt-3 flex justify-between font-bold text-brand-black text-base">
                      <span>Total estimado</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="mt-6 mb-6">
                    <p className="text-xs font-medium text-brand-gray-500 mb-2">
                      Tem um cupom?
                    </p>
                    <CouponInput />
                  </div>

                  <Link href="/checkout">
                    <Button size="lg" fullWidth className="mt-6">
                      Finalizar compra
                    </Button>
                  </Link>

                  <Link href="/">
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      className="mt-3"
                    >
                      ← Continuar comprando
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
