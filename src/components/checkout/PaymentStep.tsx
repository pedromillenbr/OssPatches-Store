import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { PaymentMethod, OrderPayment, CartItem } from '@/types';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCartStore } from '@/store/cartStore';
import { useCouponStore } from '@/store/couponStore';
import { formatPrice } from '@/services/products';
import { trackCheckoutStep, trackSelectPayment, trackPurchase } from '@/lib/analytics';
import { CONFIG } from '@/config';
import Button from '@/components/ui/Button';
import CouponInput from '@/components/cart/CouponInput';
import DynamicMessage from '@/components/ui/DynamicMessage';
import Emoji from '@/components/ui/Emoji';
import CardForm from '@/components/checkout/CardForm';
import SecurityBadge from '@/components/checkout/SecurityBadge';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import axios from 'axios';

const PayPalScriptProvider = dynamic(
  () => import('@paypal/react-paypal-js').then((m) => m.PayPalScriptProvider),
  { ssr: false }
);
const PayPalButtons = dynamic(
  () => import('@paypal/react-paypal-js').then((m) => m.PayPalButtons),
  { ssr: false, loading: () => <div className="h-12 bg-brand-gray-100 animate-pulse rounded" /> }
);

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  brazilOnly?: boolean;
  internationalOnly?: boolean;
  icon?: string;
  logo?: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'pix',
    label: 'Pix',
    description: 'Pagamento instantâneo — aprovação imediata',
    brazilOnly: true,
    logo: '/images/payment/pix-logo.svg',
  },
  {
    id: 'credit_card',
    label: 'Cartão de Crédito',
    description: 'Parcele em até 12x — processado pelo Mercado Pago',
    brazilOnly: true,
    logo: '/images/payment/mercadopago-logo.svg',
  },
  {
    id: 'debit_card',
    label: 'Cartão de Débito',
    description: 'Débito à vista — processado pelo Mercado Pago',
    brazilOnly: true,
    logo: '/images/payment/mercadopago-logo.svg',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Aceito mundialmente com segurança',
    internationalOnly: true,
    icon: '🅿',
  },
];

// ─── Pix Screen ───────────────────────────────────────────────────────────────

function PixScreen() {
  const { pixQrCode, pixCode, mpPaymentId, orderId, customer, setStep, clearPixData } =
    useCheckoutStore((s) => ({
      pixQrCode: s.pixQrCode,
      pixCode: s.pixCode,
      mpPaymentId: s.mpPaymentId,
      orderId: s.orderId,
      customer: s.customer,
      setStep: s.setStep,
      clearPixData: s.clearPixData,
    }));

  const { clearCart } = useCartStore();
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mpPaymentId) return;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/orders/${orderId}/status?mpPaymentId=${mpPaymentId}`);
        if (data.status === 'approved') {
          clearInterval(pollRef.current!);
          clearTimeout(expiryRef.current!);
          trackCheckoutStep('pix_approved');
          clearCart();
          setStep('success');
        } else if (data.status === 'cancelled' || data.status === 'rejected') {
          clearInterval(pollRef.current!);
          setExpired(true);
        }
      } catch { /* ignore polling errors */ }
    }, 5000);

    expiryRef.current = setTimeout(() => {
      clearInterval(pollRef.current!);
      setExpired(true);
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(pollRef.current!);
      clearTimeout(expiryRef.current!);
    };
  }, [mpPaymentId, orderId, clearCart, setStep]);

  const handleCopy = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (expired) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-red-600 font-semibold">QR Code expirado</p>
        <p className="text-sm text-brand-gray-500">O Pix tem validade de 30 minutos. Gere um novo pedido para tentar novamente.</p>
        <Button onClick={() => clearPixData()} variant="secondary">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/images/payment/pix-logo.svg" alt="Pix" width={120} height={43} />
        </div>
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded mb-3">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700 font-medium">Aguardando pagamento…</span>
        </div>
        <p className="text-sm text-brand-gray-500">
          Escaneie o QR Code com o app do seu banco ou copie o código Pix
        </p>
      </div>

      {pixQrCode && (
        <div className="flex justify-center">
          <div className="border-4 border-brand-black p-3 inline-block">
            <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code Pix" className="w-48 h-48" />
          </div>
        </div>
      )}

      {pixCode && (
        <div>
          <p className="text-xs text-brand-gray-500 mb-2 text-center uppercase tracking-wider">Pix Copia e Cola</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-brand-gray-50 border border-brand-gray-200 px-3 py-2 text-xs font-mono text-brand-gray-600 truncate rounded">
              {pixCode}
            </div>
            <button
              onClick={handleCopy}
              className={clsx(
                'px-4 py-2 text-xs font-semibold border-2 transition-all shrink-0',
                copied
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-white'
              )}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-brand-gray-50 border border-brand-gray-200 px-4 py-3 text-sm space-y-1">
        <p className="text-brand-gray-700"><strong>Pedido:</strong> #{orderId}</p>
        <p className="text-brand-gray-700"><strong>E-mail:</strong> {customer?.email}</p>
        <p className="text-xs text-brand-gray-400 pt-1">
          Assim que o pagamento for confirmado, a tela avança automaticamente. O QR Code expira em 30 minutos.
        </p>
      </div>
    </div>
  );
}

// ─── PayPal Section ───────────────────────────────────────────────────────────

interface PayPalSectionProps {
  items: CartItem[];
  shippingCost: number;
  couponCode: string | null;
  discountPercent: number;
  totalBRL: number;
  subTotalBRL: number;
  onSuccess: (orderId: string) => void;
}

function PayPalSection({ items, shippingCost, couponCode, discountPercent, totalBRL, subTotalBRL, onSuccess }: PayPalSectionProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const { customer, address, selectedShipping } = useCheckoutStore();
  const totalUSD = Math.round(totalBRL * CONFIG.brlToUsd * 100) / 100;

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded text-sm">
        <p className="text-blue-800 font-medium">Pagamento em dólares (USD)</p>
        <p className="text-blue-700 text-xs mt-0.5">
          O valor cobrado será <strong>US$ {totalUSD.toFixed(2)}</strong> (equivalente a R$ {totalBRL.toFixed(2)} na taxa atual).
        </p>
      </div>

      <p className="text-xs text-brand-gray-500 text-center">
        Clique no botão abaixo e conclua o pagamento direto pelo PayPal, sem sair do site.
      </p>

      <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
        <PayPalButtons
          style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
          createOrder={async () => {
            const { data } = await axios.post('/api/paypal/create-order', {
              items,
              shippingCost,
              couponCode,
              countryCode: customer?.countryCode,
            });
            useCheckoutStore.getState().setOrderId(data.ossOrderId);
            return data.paypalOrderId;
          }}
          onApprove={async (paypalData) => {
            const ossOrderId = useCheckoutStore.getState().orderId;
            try {
              await axios.post('/api/paypal/capture-order', {
                paypalOrderId: paypalData.orderID,
                ossOrderId,
                items,
                customer,
                address,
                shipping: selectedShipping,
                total: totalBRL,
                shippingCost,
                currency: 'USD',
                couponCode,
                discountPercent,
                discountAmount: Math.round(subTotalBRL * discountPercent) / 100,
              });
              trackPurchase({
                id: ossOrderId!,
                total: totalUSD,
                subtotal: Math.round(subTotalBRL * CONFIG.brlToUsd * 100) / 100,
                shippingCost: Math.round(shippingCost * CONFIG.brlToUsd * 100) / 100,
                currency: 'USD',
                couponCode: couponCode || undefined,
                items: items.map((i) => ({ productId: i.productId, name: i.name, category: i.category, price: Math.round(i.price * CONFIG.brlToUsd * 100) / 100, quantity: i.quantity })),
              });
              onSuccess(ossOrderId!);
            } catch {
              toast.error('Falha ao confirmar pagamento PayPal. Contate o suporte.');
            }
          }}
          onError={() => toast.error('Erro no PayPal. Tente novamente ou entre em contato conosco.')}
          onCancel={() => toast('Pagamento cancelado.', { icon: 'ℹ️' })}
        />
      </PayPalScriptProvider>

      <p className="text-xs text-brand-gray-400 text-center">
        Seus dados são protegidos pelo PayPal. Compra 100% segura.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentStep() {
  const { customer, address, selectedShipping, setPayment, setOrderId, setPixData, setStep, pixQrCode } =
    useCheckoutStore();
  const { items, subtotal, clearCart } = useCartStore();
  const { appliedCoupon, discountPercent } = useCouponStore();

  const isBrazil = customer?.countryCode === 'BR';
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(isBrazil ? 'pix' : 'paypal');
  const [cardLoading, setCardLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const subTotal = subtotal();
  const shippingCost = selectedShipping?.price || 0;
  const discountAmount = Math.round(subTotal * discountPercent) / 100;
  const total = subTotal - discountAmount + shippingCost;

  const availableMethods = PAYMENT_OPTIONS.filter((o) => {
    if (o.brazilOnly && !isBrazil) return false;
    if (o.internationalOnly && isBrazil) return false;
    return true;
  });

  useEffect(() => {
    const valid = availableMethods.some((m) => m.id === selectedMethod);
    if (!valid) setSelectedMethod(availableMethods[0]?.id ?? 'paypal');
  }, [isBrazil]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pixQrCode) return <PixScreen />;

  // ── Card payment via Mercado Pago Transparent ──
  const handleCardSubmit = async (payload: {
    cardToken: string;
    paymentMethodId: string;
    issuerId?: string;
    installments: number;
  }) => {
    setCardLoading(true);
    trackSelectPayment(selectedMethod);
    try {
      const { data } = await axios.post('/api/mp/card-payment', {
        items,
        customer,
        address,
        shipping: selectedShipping,
        shippingCost,
        couponCode: appliedCoupon || undefined,
        ...payload,
      });

      setPayment({ method: selectedMethod, installments: payload.installments });
      setOrderId(data.orderId);

      trackPurchase({
        id: data.orderId,
        total,
        subtotal: subTotal,
        shippingCost,
        currency: 'BRL',
        couponCode: appliedCoupon || undefined,
        items: items.map((i) => ({ productId: i.productId, name: i.name, category: i.category, price: i.price, quantity: i.quantity })),
      });

      clearCart();
      setStep('success');
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Erro ao processar cartão. Tente novamente.';
      toast.error(msg);
    } finally {
      setCardLoading(false);
    }
  };

  // ── Pix / other methods via /api/orders ──
  const handlePlaceOrder = async () => {
    setLoading(true);
    trackSelectPayment(selectedMethod);
    try {
      const payment: OrderPayment = { method: selectedMethod };
      const { data } = await axios.post('/api/orders', {
        items,
        customer,
        address,
        shipping: selectedShipping,
        payment,
        subtotal: subTotal,
        shippingCost,
        couponCode: appliedCoupon || undefined,
        currency: 'BRL',
      });

      setPayment(payment);
      setOrderId(data.orderId);

      if (selectedMethod === 'pix' && data.pix) {
        setPixData(data.pix.pixQrCode, data.pix.pixCode, data.pix.mpPaymentId);
        trackCheckoutStep('pix_awaiting');
      } else {
        trackPurchase({
          id: data.orderId,
          total,
          subtotal: subTotal,
          shippingCost,
          currency: 'BRL',
          couponCode: appliedCoupon || undefined,
          items: items.map((i) => ({ productId: i.productId, name: i.name, category: i.category, price: i.price, quantity: i.quantity })),
        });
        clearCart();
        setStep('success');
      }
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Erro ao finalizar pedido. Tente novamente.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalSuccess = (orderId: string) => {
    setPayment({ method: 'paypal' });
    setOrderId(orderId);
    clearCart();
    setStep('success');
  };

  return (
    <div className="space-y-6">

      {/* Order summary */}
      <div className="bg-brand-gray-50 px-4 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-brand-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subTotal)}</span>
        </div>
        {appliedCoupon && discountAmount > 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Cupom {appliedCoupon} ({discountPercent}%)</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-brand-gray-600">
          <span>Frete</span>
          <span>
            {shippingCost === 0
              ? isBrazil ? formatPrice(0) : 'A calcular'
              : formatPrice(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between font-bold text-brand-black border-t border-brand-gray-200 pt-2">
          <span>Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>
        {!isBrazil && (
          <p className="text-xs text-brand-gray-400 text-right">
            ≈ US$ {(total * CONFIG.brlToUsd).toFixed(2)} USD
          </p>
        )}
      </div>

      {/* Coupon */}
      <div>
        <p className="text-xs font-medium text-brand-gray-500 mb-2">Tem um cupom?</p>
        <CouponInput />
      </div>

      {/* Payment method selector */}
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

              {/* Logo (Pix / Mercado Pago) or emoji */}
              {method.logo ? (
                <span className="flex items-center justify-center w-[68px] h-7 shrink-0">
                  <Image
                    src={method.logo}
                    alt={method.label}
                    width={68}
                    height={28}
                    className="object-contain max-h-7 w-auto"
                  />
                </span>
              ) : (
                <Emoji char={method.icon!} size={20} />
              )}

              <div>
                <p className="font-semibold text-sm text-brand-black">{method.label}</p>
                <p className="text-xs text-brand-gray-500">{method.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Inline form / button per method ── */}

      {selectedMethod === 'paypal' && (
        <PayPalSection
          items={items}
          shippingCost={shippingCost}
          couponCode={appliedCoupon}
          discountPercent={discountPercent}
          totalBRL={total}
          subTotalBRL={subTotal}
          onSuccess={handlePayPalSuccess}
        />
      )}

      {(selectedMethod === 'credit_card' || selectedMethod === 'debit_card') && (
        <div className="animate-fade-in">
          <CardForm
            total={total}
            isDebit={selectedMethod === 'debit_card'}
            onSubmit={handleCardSubmit}
            loading={cardLoading}
          />
        </div>
      )}

      {selectedMethod === 'pix' && (
        <>
          <DynamicMessage step="checkout" />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <Button variant="secondary" size="lg" onClick={() => setStep('shipping')} className="flex-1">
              ← Voltar
            </Button>
            <Button size="lg" className="flex-1" loading={loading} onClick={handlePlaceOrder}>
              Gerar QR Code Pix
            </Button>
          </div>
        </>
      )}

      <SecurityBadge />
    </div>
  );
}
