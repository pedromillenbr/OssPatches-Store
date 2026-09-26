import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CustomerIdentification } from '@/types';
import { useCheckoutStore } from '@/store/checkoutStore';
import { COUNTRIES } from '@/config';
import { formatCPF, isValidCPF } from '@/lib/cpf';
import { formatPhoneBR, isValidPhoneBR } from '@/lib/phone';
import { checkEmail, normalizeEmail } from '@/lib/email';
import { useAuth } from '@/context/AuthContext';
import { saveIdentificationToProfile } from '@/lib/saveCheckoutProfile';
import { saveCartForRecovery } from '@/lib/saveCartForRecovery';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface FormData {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  countryCode: string;
}

export default function IdentificationStep() {
  const { customer, setCustomer, setStep } = useCheckoutStore();
  const { user, profile } = useAuth();
  const [countryCode, setCountryCode] = useState('BR');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const isBrazil = countryCode === 'BR';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { countryCode: 'BR' },
  });

  // Pré-preenche: prioriza o que o cliente já digitou nesta sessão de checkout;
  // senão, usa os dados salvos na conta (perfil + e-mail do login).
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cpf: customer.cpf,
        countryCode: customer.countryCode,
      });
      setCountryCode(customer.countryCode);
    } else if (user) {
      const cc = profile?.country_code || 'BR';
      reset({
        name: profile?.full_name || '',
        email: user.email || '',
        phone: profile?.phone || '',
        cpf: profile?.cpf || '',
        countryCode: cc,
      });
      setCountryCode(cc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, customer]);

  const cpfValue = watch('cpf', '');
  const phoneValue = watch('phone', '');

  const onSubmit = (data: FormData) => {
    const country = COUNTRIES.find((c) => c.code === data.countryCode);
    const customer: CustomerIdentification = {
      name: data.name,
      email: normalizeEmail(data.email),
      cpf: isBrazil ? data.cpf : undefined,
      // WhatsApp/phone is collected for both BR and international now.
      phone: data.phone,
      country: country?.name || data.countryCode,
      countryCode: data.countryCode,
    };
    setCustomer(customer);
    // Salva no perfil (se logado) para a próxima compra vir pronta.
    saveIdentificationToProfile(customer);
    // Este é o primeiro (e muitas vezes o único) momento em que sabemos o
    // e-mail de quem está comprando. Se a pessoa sumir daqui em diante, é o
    // que permite mandar o lembrete do carrinho.
    saveCartForRecovery(customer);
    setStep('address');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Country selector first — drives form fields */}
      <div>
        <label className="label-field">
          País <span className="text-red-500">*</span>
        </label>
        <select
          className="select-field"
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            setValue('countryCode', e.target.value);
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <input type="hidden" {...register('countryCode')} />
      </div>

      <Input
        label="Nome completo"
        placeholder="Pedro Alvarez"
        required
        error={errors.name?.message}
        {...register('name', {
          required: 'Nome obrigatório',
          minLength: { value: 3, message: 'Nome muito curto' },
        })}
      />

      {/* WhatsApp — primary contact channel, in focus */}
      <div>
        <label className="label-field flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder={isBrazil ? '(11) 91234-5678' : '+1 555 000 0000'}
          value={isBrazil ? formatPhoneBR(phoneValue || '') : (phoneValue || '')}
          className="input-field"
          {...register('phone', {
            required: 'WhatsApp obrigatório',
            validate: (v) =>
              isBrazil
                ? isValidPhoneBR(v || '') || 'Número de WhatsApp inválido'
                : (v || '').replace(/\D/g, '').length >= 6 || 'Número inválido',
            onChange: (e) => {
              if (isBrazil) setValue('phone', formatPhoneBR(e.target.value));
            },
          })}
        />
        {errors.phone ? (
          <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
        ) : (
          <p className="text-xs text-brand-gray-400 mt-1">
            Usamos o WhatsApp para confirmar e acompanhar seu pedido.
          </p>
        )}
      </div>

      {/* Email — required for receipt / payment gateway, shown as secondary */}
      <div>
        <Input
          label="E-mail (para envio do comprovante)"
          type="email"
          placeholder="pedro@email.com"
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'E-mail obrigatório',
            validate: (v) => {
              const result = checkEmail(v || '');
              setEmailSuggestion(result.suggestion ?? null);
              return result.valid || result.error || 'E-mail inválido';
            },
            onChange: () => setEmailSuggestion(null),
          })}
        />
        {emailSuggestion && !errors.email && (
          <button
            type="button"
            className="text-xs text-brand-black underline mt-1"
            onClick={() => {
              setValue('email', emailSuggestion, { shouldValidate: true });
              setEmailSuggestion(null);
            }}
          >
            Você quis dizer <strong>{emailSuggestion}</strong>? Clique para corrigir.
          </button>
        )}
      </div>

      {isBrazil && (
        <Input
          label="CPF"
          placeholder="000.000.000-00"
          required
          maxLength={14}
          value={formatCPF(cpfValue || '')}
          error={errors.cpf?.message}
          {...register('cpf', {
            required: isBrazil ? 'CPF obrigatório' : false,
            validate: (v) => !isBrazil || isValidCPF(v || '') || 'CPF inválido',
            onChange: (e) => {
              setValue('cpf', formatCPF(e.target.value));
            },
          })}
        />
      )}

      <Button type="submit" size="lg" fullWidth className="mt-2">
        Continuar → Endereço
      </Button>
    </form>
  );
}
