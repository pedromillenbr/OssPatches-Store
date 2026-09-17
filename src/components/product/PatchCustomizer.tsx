import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PatchProduct } from '@/types';
import { formatPrice } from '@/services/products';
import { useCartStore } from '@/store/cartStore';
import { trackAddToCart } from '@/lib/analytics';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DynamicMessage from '@/components/ui/DynamicMessage';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const FORMAT_IMAGE_INDEX: Record<PatchFormat, number> = {
  circulo: 0,
  triangulo: 1,
  retangulo: 2,
  hexagonal: 3,
  quadrado: 4,
  // Formato livre não tem foto própria: mantém a última imagem em destaque.
  personalizado: 0,
};

interface PatchCustomizerProps {
  product: PatchProduct;
  onFormatChange?: (imageIndex: number) => void;
}

type PatchFormat =
  | 'quadrado'
  | 'retangulo'
  | 'triangulo'
  | 'circulo'
  | 'hexagonal'
  | 'personalizado';

type KitPatchItem = {
  title: string;
  size: 'P' | 'M' | 'G';
  format: PatchFormat;
  artworkFile: File | null;
  heightCm: string;
  widthCm: string;
  sideCm: string;
  circumferenceCm: string;
};

const PATCH_FORMATS: { id: PatchFormat; label: string; icon: string }[] = [
  { id: 'circulo', label: 'Círculo', icon: '●' },
  { id: 'triangulo', label: 'Triângulo', icon: '△' },
  { id: 'retangulo', label: 'Retângulo', icon: '▭' },
  { id: 'hexagonal', label: 'Hexágono', icon: '⬡' },
  { id: 'quadrado', label: 'Quadrado', icon: '◻' },
  { id: 'personalizado', label: 'Personalizado', icon: '⬚' },
];

/** Número usado no botão de WhatsApp dos pedidos de formato livre. */
const WHATSAPP_NUMBER = '5521982479922';

function whatsappLink(productName: string) {
  const text = encodeURIComponent(
    `Olá! Quero um patch em formato personalizado (${productName}). ` +
      `Posso enviar a arte e as medidas por aqui?`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function PatchCustomizer({ product, onFormatChange }: PatchCustomizerProps) {
  const { addItem } = useCartStore();
  const isKit = product.slug === 'kit-de-patches';

  const [format, setFormat] = useState<PatchFormat>('circulo');
  const [quantity, setQuantity] = useState(1);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);

  // Dimensões - mostradas seletivamente por formato
  const [heightCm, setHeightCm] = useState('10');
  const [widthCm, setWidthCm] = useState('10');
  const [sideCm, setSideCm] = useState('10'); // Para triângulo, hexágono, octógono
  const [circumferenceCm, setCircumferenceCm] = useState('31.4'); // 2πr para círculo

  const [kitItems, setKitItems] = useState<KitPatchItem[]>(() => [
    {
      title: 'Primeiro',
      size: 'P',
      format: 'circulo',
      artworkFile: null,
      heightCm: '10',
      widthCm: '10',
      sideCm: '10',
      circumferenceCm: '31.4',
    },
    {
      title: 'Segundo',
      size: 'M',
      format: 'circulo',
      artworkFile: null,
      heightCm: '10',
      widthCm: '10',
      sideCm: '10',
      circumferenceCm: '31.4',
    },
    {
      title: 'Terceiro',
      size: 'G',
      format: 'circulo',
      artworkFile: null,
      heightCm: '10',
      widthCm: '10',
      sideCm: '10',
      circumferenceCm: '31.4',
    },
  ]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setArtworkFile(file);
      toast.success('Arte carregada com sucesso!');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const totalPrice = product.basePrice * quantity;

  /*
   * Formato livre não passa pelo carrinho: arte, medidas e preço são
   * combinados um a um no WhatsApp.
   */
  const hasCustomFormat = isKit
    ? kitItems.some((item) => item.format === 'personalizado')
    : format === 'personalizado';

  const handleKitItemChange = (index: number, field: keyof KitPatchItem, value: string | File | null) => {
    setKitItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const renderDimensionFields = (itemFormat: PatchFormat, item: KitPatchItem | null = null) => {
    const valueProps = {
      heightCm: item?.heightCm ?? heightCm,
      widthCm: item?.widthCm ?? widthCm,
      sideCm: item?.sideCm ?? sideCm,
      circumferenceCm: item?.circumferenceCm ?? circumferenceCm,
    };

    const updateField = (field: keyof typeof valueProps, value: string) => {
      if (item) {
        handleKitItemChange(item.title === 'Primeiro' ? 0 : item.title === 'Segundo' ? 1 : 2, field, value);
      } else {
        switch (field) {
          case 'heightCm':
            setHeightCm(value);
            break;
          case 'widthCm':
            setWidthCm(value);
            break;
          case 'sideCm':
            setSideCm(value);
            break;
          case 'circumferenceCm':
            setCircumferenceCm(value);
            break;
        }
      }
    };

    switch (itemFormat) {
      case 'quadrado':
      case 'retangulo':
        return (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Altura"
              type="number"
              placeholder="10"
              value={valueProps.heightCm}
              onChange={(e) => updateField('heightCm', e.target.value)}
              min="1"
              step="0.5"
            />
            <Input
              label="Largura"
              type="number"
              placeholder="10"
              value={valueProps.widthCm}
              onChange={(e) => updateField('widthCm', e.target.value)}
              min="1"
              step="0.5"
            />
          </div>
        );

      case 'triangulo':
      case 'hexagonal':
        const labels: { [key: string]: string } = {
          triangulo: 'Tamanho do Lado (triângulo)',
          hexagonal: 'Tamanho do Lado (hexágono)',
        };
        return (
          <Input
            label={labels[itemFormat]}
            type="number"
            placeholder="10"
            value={valueProps.sideCm}
            onChange={(e) => updateField('sideCm', e.target.value)}
            hint="Em centímetros"
            min="1"
            step="0.5"
          />
        );

      case 'circulo':
        return (
          <Input
            label="Circunferência"
            type="number"
            placeholder="31.4"
            value={valueProps.circumferenceCm}
            onChange={(e) => updateField('circumferenceCm', e.target.value)}
            hint="Perímetro do círculo em centímetros (2 × π × raio)"
            min="1"
            step="0.5"
          />
        );

      default:
        return null;
    }
  };

  const getDimensionsSummary = (itemFormat: PatchFormat, item: KitPatchItem | null = null) => {
    const height = item?.heightCm ?? heightCm;
    const width = item?.widthCm ?? widthCm;
    const side = item?.sideCm ?? sideCm;
    const circumference = item?.circumferenceCm ?? circumferenceCm;

    switch (itemFormat) {
      case 'circulo':
        return `Circunf. ${circumference}cm`;
      case 'quadrado':
        return `${height}cm × ${width}cm`;
      case 'retangulo':
        return `${height}cm × ${width}cm`;
      case 'triangulo':
      case 'hexagonal':
        return `Lado ${side}cm`;
      case 'personalizado':
        return 'A combinar no WhatsApp';
      default:
        return 'N/A';
    }
  };

  const handleArtworkChange = (index: number, file: File | null) => {
    handleKitItemChange(index, 'artworkFile', file);
    if (file) {
      toast.success(`Arte do ${kitItems[index].title.toLowerCase()} carregada com sucesso!`);
    }
  };

  const handleAdd = async () => {
    if (hasCustomFormat) {
      toast.error('Formato personalizado é fechado pelo WhatsApp.');
      return;
    }

    if (isKit) {
      for (const item of kitItems) {
        if (!item.artworkFile) {
          toast.error(`Envie a arte do ${item.title.toLowerCase()} para prosseguir`);
          return;
        }

        if ((item.format === 'quadrado' || item.format === 'retangulo') && (!item.heightCm || !item.widthCm)) {
          toast.error(`Informe altura e largura do ${item.title.toLowerCase()}`);
          return;
        }

        if (['triangulo', 'hexagonal'].includes(item.format) && !item.sideCm) {
          toast.error(`Informe o tamanho do lado do ${item.title.toLowerCase()}`);
          return;
        }

        if (item.format === 'circulo' && !item.circumferenceCm) {
          toast.error(`Informe a circunferência do ${item.title.toLowerCase()}`);
          return;
        }
      }

      setAdding(true);
      await new Promise((r) => setTimeout(r, 400));

      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: 'patch',
        price: product.basePrice,
        quantity,
        image: product.images[0] || '',
        customization: {
          type: 'kit',
          items: kitItems.map((item) => ({
            size: item.size,
            format: item.format,
            artworkFileName: item.artworkFile?.name,
            dimensions: getDimensionsSummary(item.format, item),
          })),
        } as any,
      });

      trackAddToCart({ id: product.id, name: product.name, category: product.category, price: product.basePrice, quantity: 1 });
      toast.success('Kit de patches adicionado ao carrinho!');
      setAdding(false);
      return;
    }

    if (!artworkFile) {
      toast.error('Envie a arte (PDF ou PNG) para prosseguir');
      return;
    }

    // Validar campos obrigatórios
    if ((format === 'quadrado' || format === 'retangulo') && (!heightCm || !widthCm)) {
      toast.error('Informe altura e largura do patch');
      return;
    }

    if (['triangulo', 'hexagonal'].includes(format) && !sideCm) {
      toast.error(`Informe o tamanho do lado do ${format}`);
      return;
    }

    if (format === 'circulo' && !circumferenceCm) {
      toast.error('Informe a circunferência do círculo');
      return;
    }

    setAdding(true);
    await new Promise((r) => setTimeout(r, 400));

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: 'patch',
      price: product.basePrice,
      quantity,
      image: product.images[0] || '',
      customization: {
        type: 'custom',
        size: product.sizes[0],
        format,
        quantity,
        artworkFileName: artworkFile.name,
        heightCm: format === 'quadrado' || format === 'retangulo' ? parseFloat(heightCm) : undefined,
        widthCm: format === 'quadrado' || format === 'retangulo' ? parseFloat(widthCm) : undefined,
        sideCm: ['triangulo', 'hexagonal'].includes(format) ? parseFloat(sideCm) : undefined,
        circumferenceCm: format === 'circulo' ? parseFloat(circumferenceCm) : undefined,
      } as any,
    });

    trackAddToCart({ id: product.id, name: product.name, category: 'patch', price: product.basePrice, quantity });
    toast.success('Adicionado ao carrinho!');
    setAdding(false);
  };

  const renderKitSection = () => (
    <div className="space-y-6">
      {kitItems.map((item, index) => (
        <div key={item.title} className="rounded-3xl border border-brand-gray-200 bg-brand-gray-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-brand-gray-400">Patch {index + 1}</p>
              <h3 className="text-lg font-semibold text-brand-black">{item.title}</h3>
            </div>
            <span className="text-xs text-brand-gray-600">Tamanho do {item.title.toLowerCase()}</span>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="label-field">Tamanho do {item.title.toLowerCase()}</label>
              <select
                value={item.size}
                onChange={(e) => handleKitItemChange(index, 'size', e.target.value)}
                className="select-field rounded"
              >
                {product.sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Formato do {item.title.toLowerCase()}</label>
              <div className="grid grid-cols-3 gap-2">
                {PATCH_FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => handleKitItemChange(index, 'format', fmt.id)}
                    className={clsx(
                      'px-2 sm:px-3 py-4 min-h-[88px] border-2 text-center transition-all flex flex-col items-center justify-center gap-2',
                      item.format === fmt.id
                        ? 'border-brand-black bg-white'
                        : 'border-brand-gray-200 hover:border-brand-gray-400 bg-brand-gray-50'
                    )}
                  >
                    <span className="text-2xl sm:text-3xl leading-none">{fmt.icon}</span>
                    <span className="text-[0.7rem] sm:text-xs font-medium text-brand-black leading-tight">
                      {fmt.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-brand-gray-600 leading-relaxed">
                <strong className="text-brand-black">OBS:</strong> fazemos{' '}
                <strong className="text-brand-black">qualquer formato</strong> — pedidos
                com formato personalizado são fechados apenas pelo WhatsApp.
              </p>
            </div>

            {item.format !== 'personalizado' && (
              <>
                <div>
                  <label className="label-field">Dimensões do {item.title.toLowerCase()} (em cm)</label>
                  <div className="space-y-3 bg-white rounded p-4 border border-brand-gray-200">
                    {renderDimensionFields(item.format, item)}
                  </div>
                </div>

                <div>
                  <label className="label-field">Arte do {item.title.toLowerCase()} <span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    accept=".pdf,.png"
                    onChange={(event) => handleArtworkChange(index, event.target.files?.[0] ?? null)}
                    className="w-full border border-brand-gray-300 rounded px-3 py-3 text-base sm:text-sm"
                  />
                  {item.artworkFile && (
                    <p className="mt-2 text-xs text-brand-gray-500">
                      Selecionado: {item.artworkFile.name}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-brand-black">
            {formatPrice(product.basePrice)}
          </span>
          <span className="text-brand-gray-500 text-sm">por unidade</span>
        </div>
        {quantity > 1 && (
          <p className="text-sm font-medium text-brand-black mt-1">
            Total: {formatPrice(totalPrice)}
          </p>
        )}
      </div>

      {/* Info about patch sizes */}
      <div className="bg-brand-gray-50 px-4 py-3 text-sm border-l-4 border-brand-black">
        <p className="font-semibold text-brand-black mb-2">Tamanhos disponíveis</p>
        <p className="text-brand-gray-600 text-xs leading-relaxed">
          <strong>Pequeno:</strong> até 12cm •
          <strong> Médio:</strong> 12 - 16cm •
          <strong> Grande:</strong> 16 - 22 cm •
        </p>
      </div>

      {isKit ? (
        renderKitSection()
      ) : (
        <>
          {/* Format Selection */}
          <div>
            <label className="label-field">Formato</label>
            <div className="grid grid-cols-3 gap-2">
              {PATCH_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => {
                    setFormat(fmt.id);
                    onFormatChange?.(FORMAT_IMAGE_INDEX[fmt.id]);
                  }}
                  className={clsx(
                    'px-2 sm:px-3 py-4 min-h-[88px] border-2 text-center transition-all flex flex-col items-center justify-center gap-2',
                    format === fmt.id
                      ? 'border-brand-black bg-brand-gray-50'
                      : 'border-brand-gray-200 hover:border-brand-gray-400'
                  )}
                >
                  <span className="text-2xl sm:text-3xl leading-none">{fmt.icon}</span>
                  <span className="text-[0.7rem] sm:text-xs font-medium text-brand-black leading-tight">
                    {fmt.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-brand-gray-600 leading-relaxed">
              <strong className="text-brand-black">OBS:</strong> fazemos{' '}
              <strong className="text-brand-black">qualquer formato</strong> — pedidos
              com formato personalizado são fechados apenas pelo WhatsApp.
            </p>
          </div>

          {hasCustomFormat ? (
            <CustomFormatCallout productName={product.name} />
          ) : (
            <>
          {/* Dimensions - Dynamic based on format */}
          <div>
            <label className="label-field">Dimensões (em cm)</label>
            <div className="space-y-3 bg-brand-gray-50 p-4 rounded">
              {renderDimensionFields(format)}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="label-field">Quantidade</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 border border-brand-gray-300 flex items-center justify-center text-xl hover:border-brand-black transition-colors font-bold"
                aria-label="Diminuir quantidade"
              >
                −
              </button>
              <span className="w-12 text-center text-lg font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 border border-brand-gray-300 flex items-center justify-center text-xl hover:border-brand-black transition-colors font-bold"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>

          {/* Artwork upload - PDF/PNG only */}
          <div>
            <label className="label-field">
              Upload de Arte <span className="text-red-500">*</span>
            </label>
            <div
              {...getRootProps()}
              className={clsx(
                'border-2 border-dashed p-8 text-center cursor-pointer transition-all rounded',
                isDragActive
                  ? 'border-brand-black bg-brand-gray-50'
                  : artworkFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-brand-gray-300 hover:border-brand-gray-500'
              )}
            >
              <input {...getInputProps()} />
              {artworkFile ? (
                <div>
                  <p className="font-bold text-green-700 text-base">
                    ✓ {artworkFile.name}
                  </p>
                  <p className="text-xs text-brand-gray-400 mt-2">
                    Clique para trocar de arquivo
                  </p>
                </div>
              ) : (
                <div>
                  <svg
                    className="w-10 h-10 mx-auto text-brand-gray-300 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <p className="text-base text-brand-gray-500 font-medium">
                    {isDragActive
                      ? 'Solte o arquivo aqui'
                      : 'Arraste o arquivo ou clique para enviar'}
                  </p>
                  <p className="text-xs text-brand-gray-400 mt-2">
                    Aceite formatos: <strong>PDF</strong> ou <strong>PNG</strong> • Máximo 20MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-brand-black text-white px-4 py-4 text-sm space-y-2 rounded">
            <div className="flex justify-between">
              <span className="text-brand-gray-300">Formato:</span>
              <span className="font-semibold">
                {PATCH_FORMATS.find((f) => f.id === format)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-gray-300">Dimensões:</span>
              <span className="font-semibold">
                {getDimensionsSummary(format)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-gray-300">Quantidade:</span>
              <span className="font-semibold">{quantity}</span>
            </div>
            <div className="flex justify-between border-t border-brand-gray-700 pt-2 mt-2">
              <span className="text-brand-gray-300">Total:</span>
              <span className="font-bold text-lg text-brand-gray-50">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
            </>
          )}
        </>
      )}

      {isKit && hasCustomFormat && <CustomFormatCallout productName={product.name} />}

      <DynamicMessage step="customizing" />

      {hasCustomFormat ? (
        <a
          href={whatsappLink(product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[52px] w-full items-center justify-center gap-2 bg-[#25D366] px-8 text-base font-semibold text-white transition-all duration-200 active:scale-95"
        >
          <WhatsAppGlyph />
          Falar no WhatsApp
        </a>
      ) : (
        <Button
          size="lg"
          fullWidth
          loading={adding}
          onClick={handleAdd}
        >
          {isKit ? 'Adicionar Kit ao carrinho' : 'Adicionar ao carrinho'}
        </Button>
      )}
    </div>
  );
}

/** Aviso mostrado quando o cliente escolhe o formato livre. */
function CustomFormatCallout({ productName }: { productName: string }) {
  return (
    <div className="border-l-4 border-[#25D366] bg-green-50 px-4 py-4">
      <p className="font-semibold text-brand-black">
        Formato personalizado — fazemos qualquer formato
      </p>
      <p className="mt-1 text-sm leading-relaxed text-brand-gray-600">
        Águia, escudo, logo do time, contorno da sua arte: a gente corta no
        formato que você quiser. Como cada peça é orçada de acordo com o
        recorte, esse pedido é fechado <strong>somente pelo WhatsApp</strong>.
        Mande a arte e as medidas que respondemos com o valor.
      </p>
      <a
        href={whatsappLink(productName)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-green-800 underline underline-offset-4"
      >
        Abrir conversa no WhatsApp →
      </a>
    </div>
  );
}

function WhatsAppGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.14 1.595 5.945L0 24l6.305-1.654a11.93 11.93 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 00-3.45-8.406zM12.02 21.785h-.005a9.93 9.93 0 01-5.06-1.386l-.363-.216-3.76.986 1.004-3.667-.236-.376a9.876 9.876 0 01-1.514-5.29c.002-5.475 4.458-9.93 9.939-9.93 2.654 0 5.148 1.035 7.023 2.913a9.868 9.868 0 012.907 7.026c-.003 5.476-4.458 9.94-9.935 9.94z" />
    </svg>
  );
}
