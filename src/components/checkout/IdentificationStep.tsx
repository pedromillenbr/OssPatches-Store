import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CustomerIdentification } from '@/types';
import { useCheckoutStore } from '@/store/checkoutStore';
import { COUNTRIES } from '@/config';
import { formatCPF } from '@/services/shipping';
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
  const { setCustomer, setStep } = useCheckoutStore();
  const [countryCode, setCountryCode] = useState('BR');
  const isBrazil = countryCode === 'BR';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { countryCode: 'BR' },
  });

  const cpfValue = watch('cpf', '');

  const onSubmit = (data: FormData) => {
    const country = COUNTRIES.find((c) => c.code === data.countryCode);
    const customer: CustomerIdentification = {
      name: data.name,
      email: data.email,
      cpf: isBrazil ? data.cpf : undefined,
      phone: !isBrazil ? data.phone : undefined,
      country: country?.name || data.countryCode,
      countryCode: data.countryCode,
    };
    setCustomer(customer);
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

      <Input
        label="E-mail"
        type="email"
        placeholder="pedro@email.com"
        required
        error={errors.email?.message}
        {...register('email', {
          required: 'E-mail obrigatório',
          pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' },
        })}
      />

      {isBrazil ? (
        <Input
          label="CPF"
          placeholder="000.000.000-00"
          required
          maxLength={14}
          value={formatCPF(cpfValue || '')}
          error={errors.cpf?.message}
          {...register('cpf', {
            required: isBrazil ? 'CPF obrigatório' : false,
            minLength: { value: 14, message: 'CPF inválido' },
            onChange: (e) => {
              setValue('cpf', formatCPF(e.target.value));
            },
          })}
        />
      ) : (
        <Input
          label="Telefone / WhatsApp"
          type="tel"
          placeholder="+1 555 000 0000"
          required
          error={errors.phone?.message}
          {...register('phone', {
            required: !isBrazil ? 'Telefone obrigatório' : false,
            minLength: { value: 6, message: 'Telefone inválido' },
          })}
        />
      )}

      <Button type="submit" size="lg" fullWidth className="mt-2">
        Continuar → Endereço
      </Button>
    </form>
  );
}
