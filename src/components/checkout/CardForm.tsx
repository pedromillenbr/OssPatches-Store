import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import axios from 'axios';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

interface CardFormFields {
  cardNumber: string;
  cardName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  installments: number;
}

interface CardFormProps {
  total: number;
  isDebit?: boolean;
  onSubmit: (payload: {
    cardToken: string;
    paymentMethodId: string;
    issuerId?: string;
    installments: number;
  }) => Promise<void>;
  loading: boolean;
}

// Each installment option as returned by Mercado Pago's getInstallments —
// carries the real per-installment amount and total (with interest, if any),
// so we never invent "total / n" ourselves.
interface InstallmentOption {
  installments: number;
  installmentAmount: number; // value of each installment (R$)
  totalAmount: number;       // total charged across all installments (R$)
  hasInterest: boolean;
  label: string;             // MP's own recommended_message, e.g. "12x de R$ 27,00 (R$ 324,00)"
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').substring(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Detect card brand from first digits
function detectBrand(number: string): string {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5)/.test(n)) return 'discover';
  if (/^(?:636368|438935|504175|451416|509048)/.test(n)) return 'elo';
  if (/^(?:606282|3841)/.test(n)) return 'hipercard';
  return '';
}

const BRAND_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  elo: '#FFD700',
  hipercard: '#B90000',
};

export default function CardForm({ total, isDebit = false, onSubmit, loading }: CardFormProps) {
  const [mpReady, setMpReady] = useState(false);
  const [cardBrand, setCardBrand] = useState('');
  const [cardNumberDisplay, setCardNumberDisplay] = useState('');
  const [expiryDisplay, setExpiryDisplay] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CardFormFields>({
    defaultValues: { installments: 1 },
  });

  const installments = watch('installments');

  // Load MercadoPago.js SDK
  useEffect(() => {
    if (window.MercadoPago) { setMpReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => setMpReady(true);
    document.head.appendChild(script);
  }, []);

  // Fetch REAL installment options from Mercado Pago whenever the card BIN
  // (first 6 digits) is known. MP returns the actual per-installment amount and
  // total including any interest — which the customer pays. Credit only.
  useEffect(() => {
    if (isDebit || !mpReady || !window.MercadoPago) return;
    const bin = cardNumberDisplay.replace(/\s/g, '').substring(0, 6);
    if (bin.length < 6) { setInstallmentOptions([]); return; }

    let cancelled = false;
    setLoadingInstallments(true);
    const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY);

    mp.getInstallments({ amount: String(total), bin, paymentTypeId: 'credit_card' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        if (cancelled) return;
        const payerCosts = res?.[0]?.payer_costs ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opts: InstallmentOption[] = payerCosts.map((pc: any) => ({
          installments: pc.installments,
          installmentAmount: pc.installment_amount,
          totalAmount: pc.total_amount,
          hasInterest: pc.installment_rate > 0,
          label: pc.recommended_message,
        }));
        setInstallmentOptions(opts);
      })
      .catch(() => { if (!cancelled) setInstallmentOptions([]); })
      .finally(() => { if (!cancelled) setLoadingInstallments(false); });

    return () => { cancelled = true; };
  }, [cardNumberDisplay, mpReady, isDebit, total]);

  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumberDisplay(formatted);
    setValue('cardNumber', formatted.replace(/\s/g, ''));
    setCardBrand(detectBrand(formatted));
  };

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setExpiryDisplay(formatted);
    const parts = formatted.split('/');
    setValue('expiryMonth', parts[0] || '');
    setValue('expiryYear', parts[1] || '');
  };

  const processPayment = async (data: CardFormFields) => {
    if (!mpReady || !window.MercadoPago) {
      toast.error('SDK de pagamento não carregado. Recarregue a página.');
      return;
    }

    const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY);

    try {
      // Tokenize card data — number never leaves the browser raw
      const tokenResult = await mp.createCardToken({
        cardNumber: data.cardNumber.replace(/\s/g, ''),
        cardholderName: data.cardName,
        cardExpirationMonth: data.expiryMonth.padStart(2, '0'),
        cardExpirationYear: data.expiryYear.length === 2 ? `20${data.expiryYear}` : data.expiryYear,
        securityCode: data.cvv,
      });

      if (tokenResult.error) {
        toast.error('Dados do cartão inválidos. Verifique e tente novamente.');
        return;
      }

      // Get payment method and issuer
      const pmResult = await mp.getPaymentMethods({ bin: data.cardNumber.replace(/\s/g, '').substring(0, 6) });
      const paymentMethodId = pmResult?.results?.[0]?.id || cardBrand;
      const issuerId = pmResult?.results?.[0]?.issuer?.id;

      await onSubmit({
        cardToken: tokenResult.id,
        paymentMethodId,
        issuerId,
        installments: isDebit ? 1 : Number(data.installments),
      });
    } catch (err) {
      console.error('Card tokenization error:', err);
      // Try axios for friendly API error
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Erro ao processar cartão. Verifique os dados e tente novamente.');
      }
    }
  };

  const brandColor = BRAND_COLORS[cardBrand] || '#171717';

  return (
    <form onSubmit={handleSubmit(processPayment)} className="space-y-4">

      {/* Mini card preview */}
      <div
        className="relative w-full h-36 rounded-xl p-5 text-white overflow-hidden transition-all duration-500 cursor-pointer select-none"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}99 100%)` }}
        onClick={() => setFlipped(!flipped)}
      >
        {!flipped ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-medium opacity-70 uppercase tracking-wider">
                {isDebit ? 'Débito' : 'Crédito'}
              </span>
              {cardBrand && (
                <span className="text-xs font-bold uppercase opacity-90">{cardBrand}</span>
              )}
            </div>
            <p className="font-mono text-lg tracking-widest">
              {cardNumberDisplay
                ? cardNumberDisplay.padEnd(19, ' ').replace(/ /g, ' ')
                : '•••• •••• •••• ••••'}
            </p>
            <div className="flex justify-between mt-3">
              <div>
                <p className="text-xs opacity-60">TITULAR</p>
                <p className="text-sm font-semibold uppercase truncate max-w-[180px]">
                  {watch('cardName') || 'NOME NO CARTÃO'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60">VALIDADE</p>
                <p className="text-sm font-semibold">{expiryDisplay || 'MM/AA'}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center h-full space-y-3">
            <div className="w-full h-8 bg-black opacity-40 rounded" />
            <div className="flex justify-end items-center gap-2">
              <div className="flex-1 h-6 bg-white opacity-20 rounded" />
              <div className="bg-white text-gray-800 font-mono text-sm font-bold px-3 py-1 rounded min-w-[48px] text-center">
                {watch('cvv') || '•••'}
              </div>
            </div>
            <p className="text-xs opacity-60 text-right">CVV</p>
          </div>
        )}
      </div>
      <p className="text-xs text-brand-gray-400 text-center">Clique no cartão para ver o verso</p>

      {/* Card fields */}
      <div>
        <label className="label-field">Número do cartão</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={19}
          placeholder="0000 0000 0000 0000"
          value={cardNumberDisplay}
          onChange={handleCardNumber}
          className="input-field font-mono tracking-widest"
          autoComplete="cc-number"
        />
        <input type="hidden" {...register('cardNumber', { required: true, minLength: 15 })} />
        {errors.cardNumber && <p className="text-xs text-red-500 mt-1">Número de cartão inválido</p>}
      </div>

      <Input
        label="Nome do titular (como no cartão)"
        placeholder="PEDRO SILVA"
        autoComplete="cc-name"
        error={errors.cardName?.message}
        {...register('cardName', {
          required: 'Nome obrigatório',
          minLength: { value: 3, message: 'Nome muito curto' },
          onChange: (e) => setValue('cardName', e.target.value.toUpperCase()),
        })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Validade</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="MM/AA"
            value={expiryDisplay}
            onChange={handleExpiry}
            className="input-field"
            autoComplete="cc-exp"
          />
          <input type="hidden" {...register('expiryMonth', { required: true })} />
          <input type="hidden" {...register('expiryYear', { required: true })} />
        </div>

        <div>
          <label className="label-field">CVV</label>
          {(() => {
            const cvvReg = register('cvv', {
              required: 'CVV obrigatório',
              minLength: { value: 3, message: 'CVV inválido' },
              maxLength: { value: 4, message: 'CVV inválido' },
            });
            return (
              <input
                {...cvvReg}
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="•••"
                className="input-field font-mono tracking-widest"
                autoComplete="cc-csc"
                onFocus={() => setFlipped(true)}
                onBlur={(e) => { setFlipped(false); cvvReg.onBlur(e); }}
              />
            );
          })()}
          {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv.message}</p>}
        </div>
      </div>

      {/* Installments — credit only. Values come straight from Mercado Pago,
          so interest (paid by the customer) is reflected accurately. */}
      {!isDebit && (
        <div>
          <label className="label-field">Parcelamento</label>
          {installmentOptions.length === 0 ? (
            <>
              <select className="select-field" disabled value={1} {...register('installments')}>
                <option value={1}>
                  {loadingInstallments
                    ? 'Calculando parcelas…'
                    : `1x de R$ ${total.toFixed(2).replace('.', ',')} (à vista)`}
                </option>
              </select>
              <p className="text-xs text-brand-gray-400 mt-1">
                Digite o número do cartão para ver as opções de parcelamento.
              </p>
            </>
          ) : (
            <select className="select-field" {...register('installments')}>
              {installmentOptions.map((opt) => (
                <option key={opt.installments} value={opt.installments}>
                  {opt.label}
                  {opt.installments > 1 && !opt.hasInterest && ' sem juros'}
                </option>
              ))}
            </select>
          )}
          {(() => {
            const sel = installmentOptions.find((o) => o.installments === Number(installments));
            if (!sel || sel.installments <= 1) return null;
            return (
              <p className="text-xs text-brand-gray-400 mt-1">
                Total: R$ {sel.totalAmount.toFixed(2).replace('.', ',')}
              </p>
            );
          })()}
        </div>
      )}

      <div className={clsx('flex items-center gap-2 text-xs text-brand-gray-500 bg-brand-gray-50 border border-brand-gray-200 px-3 py-2 rounded')}>
        <svg className="w-4 h-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Os dados do cartão são criptografados e nunca armazenados em nossos servidores.
      </div>

      <Button type="submit" size="lg" fullWidth loading={loading || !mpReady}>
        {loading ? 'Processando…' : !mpReady ? 'Carregando…' : `Pagar R$ ${total.toFixed(2).replace('.', ',')}`}
      </Button>
    </form>
  );
}
