import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/services/products';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore();
  const customization = item.customization as unknown as Record<string, unknown>;

  const lines: string[] = [];
  if ('items' in customization && Array.isArray(customization.items)) {
    customization.items.forEach((item, index) => {
      const label = `Patch ${index + 1}`;
      const size = item.size ? `Tamanho: ${item.size}` : '';
      const format = item.format ? `Formato: ${item.format}` : '';
      const dimensions = item.dimensions ? `Dimensões: ${item.dimensions}` : '';
      lines.push([label, size, format, dimensions].filter(Boolean).join(' • '));
    });
  } else {
    if ('size' in customization) lines.push(`Tamanho: ${customization.size}`);
    if ('degree' in customization && customization.degree !== undefined)
      lines.push(`Graus: ${customization.degree}`);
    if ('embroideredName' in customization && customization.embroideredName)
      lines.push(`Nome: ${customization.embroideredName}`);
    if ('format' in customization) lines.push(`Formato: ${customization.format}`);
    if ('type' in customization)
      lines.push(`Tipo: ${customization.type === 'standard' ? 'Padrão' : customization.type === 'custom' ? 'Personalizado' : 'Equipe'}`);
  }

  return (
    <div className="flex gap-4 py-4 border-b border-brand-gray-100 last:border-0">
      {/* Color swatch / image */}
      <div className="w-16 h-16 shrink-0 bg-brand-gray-100 border border-brand-gray-200 flex items-center justify-center overflow-hidden">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-brand-gray-400 font-medium text-center leading-tight px-1">
            {item.name.split(' ').slice(1).join(' ')}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-brand-black leading-tight truncate">
          {item.name}
        </p>
        <div className="mt-1 space-y-0.5">
          {lines.map((line, i) => (
            <p key={i} className="text-xs text-brand-gray-500">
              {line}
            </p>
          ))}
        </div>

        {/* Quantity + remove */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-brand-gray-200">
            <button
              onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-sm hover:bg-brand-gray-100 transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-sm hover:bg-brand-gray-100 transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeItem(item.cartId)}
            className="text-xs text-brand-gray-400 hover:text-red-500 transition-colors"
          >
            Remover
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        <p className="font-bold text-sm text-brand-black">
          {formatPrice(item.price * item.quantity)}
        </p>
        {item.quantity > 1 && (
          <p className="text-xs text-brand-gray-400">
            {formatPrice(item.price)} un.
          </p>
        )}
      </div>
    </div>
  );
}
