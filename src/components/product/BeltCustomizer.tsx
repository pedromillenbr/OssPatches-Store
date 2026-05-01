import { useState } from 'react';
import { Product } from '@/types';
import { formatPrice } from '@/services/products';
import { useCartStore } from '@/store/cartStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DynamicMessage from '@/components/ui/DynamicMessage';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface BeltCustomizerProps {
  product: Product;
}

type ProductType = 'standard' | 'custom';
type StripeOption = 'none' | 'white' | 'black';

export default function BeltCustomizer({ product }: BeltCustomizerProps) {
  const { addItem } = useCartStore();

  const [productType, setProductType] = useState<ProductType>('standard');
  const [size, setSize] = useState(product.sizes[2] || product.sizes[0]);
  const [degree, setDegree] = useState<number>(0);
  const [embroideredName, setEmbroideredName] = useState('');
  const [stripe, setStripe] = useState<StripeOption>('none');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const isKidsBelt = product.category === 'belt-kids';
  const isWhiteKidsBelt = isKidsBelt && product.id === 'faixa-branca-infantil';
  const showStripeOption = isKidsBelt && !isWhiteKidsBelt;
  const price =
    productType === 'custom' ? product.customPrice : product.basePrice;

  const handleAdd = async () => {
    if (productType === 'custom' && !embroideredName.trim()) {
      toast.error('Informe o nome a ser bordado');
      return;
    }

    setAdding(true);
    await new Promise((r) => setTimeout(r, 400));

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      price,
      quantity: quantity,
      image: product.images[0] || '',
      customization: {
        type: productType,
        size: size as never,
        degree: degree as never,
        embroideredName: productType === 'custom' ? embroideredName.trim() : undefined,
        ...(showStripeOption && { stripe }),
      },
    });

    toast.success('Adicionado ao carrinho!');
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-brand-black">
            {formatPrice(price)}
          </span>
        </div>
        <p className="text-xs text-brand-gray-500 mt-1">
          {productType === 'custom'
            ? 'Com nome bordado e personalização'
            : 'Faixa padrão sem personalização'}
        </p>
      </div>

      {/* Type toggle */}
      <div>
        <label className="label-field">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {(['standard', 'custom'] as ProductType[]).map((t) => (
            <button
              key={t}
              onClick={() => setProductType(t)}
              className={clsx(
                'py-3 px-4 text-sm font-medium border transition-all duration-200 ease-out transform',
                productType === t
                  ? 'bg-brand-black text-white border-brand-black shadow-sm'
                  : 'bg-white text-brand-black border-brand-gray-300 hover:border-brand-black hover:bg-brand-gray-50 hover:-translate-y-0.5 hover:shadow-sm'
              )}
            >
              {t === 'standard' ? 'Padrão' : 'Personalizada'}
              <span className="block text-xs mt-0.5 opacity-70">
                {t === 'standard'
                  ? formatPrice(product.basePrice)
                  : formatPrice(product.customPrice)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="label-field">Tamanho</label>
        <div className="flex gap-2 flex-wrap">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={clsx(
                'px-4 py-2 text-sm font-medium border transition-all duration-200 ease-out transform',
                size === s
                  ? 'bg-brand-black text-white border-brand-black shadow-sm'
                  : 'bg-white text-brand-black border-brand-gray-300 hover:border-brand-black hover:bg-brand-gray-50 hover:-translate-y-0.5 hover:shadow-sm'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-brand-gray-400 mt-2">
          {isKidsBelt ? 'M0 → M7' : 'A0 → A7'}
        </p>
      </div>

      {/* Degrees */}
      {product.hasDegrees && (
        <div>
          <label className="label-field">Graus</label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((d) => (
              <button
                key={d}
                onClick={() => setDegree(d)}
                className={clsx(
                  'w-10 h-10 text-sm font-medium border transition-all duration-200 ease-out transform',
                  degree === d
                    ? 'bg-brand-black text-white border-brand-black shadow-sm'
                    : 'bg-white text-brand-black border-brand-gray-300 hover:border-brand-black hover:bg-brand-gray-50 hover:-translate-y-0.5 hover:shadow-sm'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stripe option — ONLY for non-white kids belts */}
      {showStripeOption && (
        <div className="animate-fade-in">
          <label className="label-field">Listra</label>
          <div className="space-y-2">
            {[
              { id: 'none', label: 'Sem listra', desc: 'Faixa lisa' },
              { id: 'white', label: 'Com listra branca', desc: 'Listra branca na cor' },
              { id: 'black', label: 'Com listra preta', desc: 'Listra preta para contraste' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStripe(opt.id as StripeOption)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 border-2 text-left transition-all duration-200 ease-out transform',
                  stripe === opt.id
                    ? 'border-brand-black bg-brand-gray-50 shadow-sm'
                    : 'border-brand-gray-200 hover:border-brand-black hover:bg-brand-gray-50 hover:-translate-y-0.5 hover:shadow-sm'
                )}
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full border-2 shrink-0 transition-all duration-200 ease-out transform',
                    stripe === opt.id
                      ? 'border-brand-black bg-brand-black'
                      : 'border-brand-gray-300 hover:border-brand-black'
                  )}
                />
                <div>
                  <p className="font-semibold text-sm text-brand-black">
                    {opt.label}
                  </p>
                  <p className="text-xs text-brand-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name embroidery — only for custom */}
      {productType === 'custom' && (
        <div className="animate-fade-in">
          <Input
            label="Nome a bordar"
            placeholder="Ex: Pedro Alvarez"
            value={embroideredName}
            onChange={(e) => setEmbroideredName(e.target.value)}
            maxLength={30}
            required
            hint="Máximo 30 caracteres — aparecerá bordado na faixa"
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="label-field">Quantidade</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center border border-brand-gray-300 hover:border-brand-black transition-colors"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setQuantity(Math.max(1, val));
            }}
            className="w-16 text-center border border-brand-gray-300 px-2 py-2 text-sm"
            min="1"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 flex items-center justify-center border border-brand-gray-300 hover:border-brand-black transition-colors"
          >
            +
          </button>
          <span className="text-sm text-brand-gray-500 ml-4">
            {quantity === 1 ? 'unidade' : `${quantity} unidades`}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-brand-gray-50 px-4 py-3 text-sm">
        <div className="space-y-1 text-brand-gray-600">
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span className="font-medium text-brand-black">
              {productType === 'standard' ? 'Padrão' : 'Personalizada'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tamanho:</span>
            <span className="font-medium text-brand-black">{size}</span>
          </div>
          <div className="flex justify-between">
            <span>Graus:</span>
            <span className="font-medium text-brand-black">{degree}</span>
          </div>
          {showStripeOption && (
            <div className="flex justify-between">
              <span>Listra:</span>
              <span className="font-medium text-brand-black capitalize">
                {stripe === 'none'
                  ? 'Sem listra'
                  : `Com listra ${stripe}`}
              </span>
            </div>
          )}
          {productType === 'custom' && embroideredName && (
            <div className="flex justify-between">
              <span>Nome:</span>
              <span className="font-medium text-brand-black">{embroideredName}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-brand-gray-200 pt-2 mt-2">
            <span className="font-semibold text-brand-black">Subtotal ({quantity}x):</span>
            <span className="font-bold text-brand-black">{formatPrice(price * quantity)}</span>
          </div>
        </div>
      </div>

      <DynamicMessage step="customizing" />

      <Button
        size="lg"
        fullWidth
        loading={adding}
        onClick={handleAdd}
      >
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
