import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Address } from '@/types';
import { useCheckoutStore } from '@/store/checkoutStore';
import { lookupCEP, formatCEP } from '@/services/shipping';
import { COUNTRIES } from '@/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface FormData {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  countryCode: string;
}

export default function AddressStep() {
  const { customer, setAddress, setStep } = useCheckoutStore();
  const isBrazil = customer?.countryCode === 'BR';
  const [loadingCEP, setLoadingCEP] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { countryCode: customer?.countryCode || 'BR' },
  });

  const zipValue = watch('zipCode', '');

  const handleCEPLookup = async () => {
    const raw = zipValue.replace(/\D/g, '');
    if (raw.length < 8) {
      toast.error('CEP incompleto');
      return;
    }
    setLoadingCEP(true);
    try {
      const data = await lookupCEP(raw);
      setValue('street', data.logradouro);
      setValue('neighborhood', data.bairro);
      setValue('city', data.localidade);
      setValue('state', data.uf);
      toast.success('Endereço encontrado!');
    } catch {
      toast.error('CEP não encontrado');
    } finally {
      setLoadingCEP(false);
    }
  };

  const onSubmit = (data: FormData) => {
    const country = COUNTRIES.find((c) => c.code === data.countryCode);
    const address: Address = {
      cep: isBrazil ? data.zipCode : undefined,
      zipCode: data.zipCode,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      country: country?.name || data.countryCode,
      countryCode: data.countryCode,
    };
    setAddress(address);
    setStep('shipping');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* CEP / ZIP */}
      <div>
        <label className="label-field">
          {isBrazil ? 'CEP' : 'ZIP / Postal Code'}{' '}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder={isBrazil ? '00000-000' : 'Postal code'}
            maxLength={isBrazil ? 9 : 12}
            {...register('zipCode', { required: 'CEP/ZIP obrigatório' })}
            onChange={(e) => {
              if (isBrazil) {
                setValue('zipCode', formatCEP(e.target.value));
              }
            }}
          />
          {isBrazil && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={loadingCEP}
              onClick={handleCEPLookup}
              className="whitespace-nowrap"
            >
              Buscar
            </Button>
          )}
        </div>
        {errors.zipCode && (
          <p className="mt-1 text-xs text-red-500">{errors.zipCode.message}</p>
        )}
      </div>

      <Input
        label="Rua / Logradouro"
        placeholder="Rua das Artes Marciais"
        required
        error={errors.street?.message}
        {...register('street', { required: 'Rua obrigatória' })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Número"
          placeholder="123"
          required
          error={errors.number?.message}
          {...register('number', { required: 'Número obrigatório' })}
        />
        <Input
          label="Complemento"
          placeholder="Apto 4B"
          {...register('complement')}
        />
      </div>

      {isBrazil && (
        <Input
          label="Bairro"
          placeholder="Centro"
          {...register('neighborhood')}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cidade"
          placeholder="São Paulo"
          required
          error={errors.city?.message}
          {...register('city', { required: 'Cidade obrigatória' })}
        />
        {isBrazil ? (
          <Input
            label="Estado (UF)"
            placeholder="SP"
            maxLength={2}
            error={errors.state?.message}
            {...register('state')}
          />
        ) : (
          <div>
            <label className="label-field">País</label>
            <select
              className="select-field"
              {...register('countryCode')}
              defaultValue={customer?.countryCode}
            >
              {COUNTRIES.filter((c) => c.code !== 'BR').map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => setStep('identification')}
          className="flex-1"
        >
          ← Voltar
        </Button>
        <Button type="submit" size="lg" className="flex-1">
          Continuar → Frete
        </Button>
      </div>
    </form>
  );
}
