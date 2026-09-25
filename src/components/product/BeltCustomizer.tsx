import { useState } from 'react';
import { Product } from '@/types';
import { formatPrice } from '@/services/products';
import { useCartStore } from '@/store/cartStore';
import { trackAddToCart } from '@/lib/analytics';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DynamicMessage from '@/components/ui/DynamicMessage';
import BeltPreview from '@/components/product/BeltPreview';
import {
  EMBROIDERY_COLORS,
  EMBROIDERY_FONTS,
  EmbroideryColor,
  EmbroideryFont,
  serifFont,
  scriptFont,
} from '@/lib/embroideryFonts';
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
  const [nameFont, setNameFont] = useState<EmbroideryFont>('serifada');
  const [nameColor, setNameColor] = useState<EmbroideryColor>('dourado');
  const [stripe, setStripe] = useState<StripeOption>('none');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const isKidsBelt = product.category === 'belt-kids';
  const isWhiteKidsBelt = isKidsBelt && product.id === 'faixa-branca-infantil';
  const showStripeOption = isKidsBelt && !isWhiteKidsBelt;
  const price = productType === 'custom' ? product.customPrice : product.basePrice;

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
      quantity,
      image: product.images[0] || '',
      customization: {
        type: productType,
        size: size as never,
        degree: degree as never,
        embroideredName: productType === 'custom' ? embroideredName.trim() : undefined,
        // A produção precisa saber em qual fonte e cor bordar.
        ...(productType === 'custom' && { nameFont, nameColor }),
        ...(showStripeOption && { stripe }),
      },
    });

    trackAddToCart({ id: product.id, name: product.name, category: product.category, price, quantity });
    toast.success('Adicionado ao carrinho!');
    setAdding(false);
  };

  return (
    <div className={clsx('space-y-6', serifFont.variable, scriptFont.variable)}>
      {/* Price */}
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-black text-brand-black">
            {formatPrice(price)}
          </span>
        </div>
        <p className="text-xs text-brand-gray-500 mt-1">
          {productType === 'custom'
            ? 'Com nome bordado e personalização'
            : 'Faixa padrão sem personalização'}
        </p>
      </div>

      {/* Live belt preview */}
      <div className="bg-brand-gray-50 border border-brand-gray-200 px-4 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gray-400 mb-1">
          Pré-visualização
        </p>
        <BeltPreview
          colorHex={product.colorHex}
          colorHexSecondary={product.colorHexSecondary}
          color={product.color}
          degree={degree}
          stripe={stripe}
          embroideredName={productType === 'custom' ? embroideredName : undefined}
          nameFont={nameFont}
          nameColor={nameColor}
          size={String(size)}
        />
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
                'px-4 py-2 min-h-[44px] min-w-[52px] text-sm font-medium border transition-all duration-200 ease-out transform',
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
          {isKidsBelt ? 'M0 → M7' : 'A0 a A7 — escolha pelo seu peso e altura'}
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
                  'w-12 h-12 text-sm font-medium border transition-all duration-200 ease-out',
                  degree === d
                    ? 'bg-brand-black text-white border-brand-black shadow-sm'
                    : 'bg-white text-brand-black border-brand-gray-300 hover:border-brand-black hover:bg-brand-gray-50'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stripe option — only for non-white kids belts */}
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
                  'w-full flex items-center gap-3 px-4 py-3 border-2 text-left transition-all duration-200 ease-out',
                  stripe === opt.id
                    ? 'border-brand-black bg-brand-gray-50 shadow-sm'
                    : 'border-brand-gray-200 hover:border-brand-black hover:bg-brand-gray-50'
                )}
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full border-2 shrink-0 transition-all',
                    stripe === opt.id
                      ? 'border-brand-black bg-brand-black'
                      : 'border-brand-gray-300'
                  )}
                />
                <div>
                  <p className="font-semibold text-sm text-brand-black">{opt.label}</p>
                  <p className="text-xs text-brand-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name embroidery — only for custom */}
      {productType === 'custom' && (
        <div className="animate-fade-in space-y-5">
          <Input
            label="Nome a bordar"
            placeholder="PEDRO ALVAREZ"
            value={embroideredName}
            // O bordado é sempre em maiúsculas, então o campo já converte.
            onChange={(e) => setEmbroideredName(e.target.value.toUpperCase())}
            maxLength={30}
            required
            hint="Até 30 caracteres — o bordado é sempre em letras maiúsculas"
          />

          <div>
            <label className="label-field">Fonte do bordado</label>
            <div className="grid grid-cols-2 gap-3">
              {EMBROIDERY_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setNameFont(font.id)}
                  aria-pressed={nameFont === font.id}
                  className={clsx(
                    'border-2 px-3 py-4 text-center transition-all',
                    nameFont === font.id
                      ? 'border-brand-black bg-brand-gray-50'
                      : 'border-brand-gray-200 hover:border-brand-gray-400'
                  )}
                >
                  <span
                    className="block truncate text-2xl leading-snug text-brand-black"
                    style={{ fontFamily: font.cssVar }}
                  >
                    {embroideredName.trim() || 'SEU NOME'}
                  </span>
                  <span className="mt-2 block text-xs font-medium text-brand-gray-500">
                    {font.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Cor do bordado</label>
            <div className="grid grid-cols-2 gap-3">
              {EMBROIDERY_COLORS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setNameColor(option.id)}
                  aria-pressed={nameColor === option.id}
                  className={clsx(
                    'flex items-center gap-3 border-2 px-4 py-3 transition-all',
                    nameColor === option.id
                      ? 'border-brand-black bg-brand-gray-50'
                      : 'border-brand-gray-200 hover:border-brand-gray-400'
                  )}
                >
                  <span
                    aria-hidden
                    className="h-6 w-6 shrink-0 rounded-full border border-brand-gray-300"
                    style={{
                      background:
                        option.id === 'dourado'
                          ? 'linear-gradient(135deg, #F9E79B 0%, #D9A93B 45%, #B8860B 70%, #EBD489 100%)'
                          : 'linear-gradient(135deg, #FFFFFF 0%, #ECECEA 100%)',
                    }}
                  />
                  <span className="text-sm font-medium text-brand-black">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="label-field">Quantidade</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Diminuir quantidade"
            className="w-12 h-12 flex items-center justify-center border border-brand-gray-300 hover:border-brand-black transition-colors"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 h-12 text-center border border-brand-gray-300 px-2 text-base"
            min="1"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            aria-label="Aumentar quantidade"
            className="w-12 h-12 flex items-center justify-center border border-brand-gray-300 hover:border-brand-black transition-colors"
          >
            +
          </button>
          <span className="text-sm text-brand-gray-500 ml-4">
            {quantity === 1 ? 'unidade' : `${quantity} unidades`}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-brand-gray-50 border border-brand-gray-200 px-4 py-3 text-sm">
        {/* Compact preview inside summary */}
        <div className="mb-3">
          <BeltPreview
            colorHex={product.colorHex}
            colorHexSecondary={product.colorHexSecondary}
            color={product.color}
            degree={degree}
            stripe={stripe}
            embroideredName={productType === 'custom' ? embroideredName : undefined}
            nameFont={nameFont}
            nameColor={nameColor}
            compact
          />
        </div>
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
                {stripe === 'none' ? 'Sem listra' : `Com listra ${stripe}`}
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
            <span className="font-semibold text-brand-black">
              Subtotal ({quantity}x):
            </span>
            <span className="font-bold text-brand-black">
              {formatPrice(price * quantity)}
            </span>
          </div>
        </div>
      </div>

      <DynamicMessage step="customizing" />

      <Button size="lg" fullWidth loading={adding} onClick={handleAdd}>
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
