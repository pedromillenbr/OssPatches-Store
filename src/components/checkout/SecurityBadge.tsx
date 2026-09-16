/**
 * Selo de segurança no checkout — reduz o abandono de carrinho por desconfiança,
 * especialmente importante para uma loja nova. Mostra criptografia e os gateways
 * de pagamento reconhecidos (Mercado Pago / PayPal).
 */
export default function SecurityBadge() {
  return (
    <div className="border-t border-brand-gray-200 pt-4 mt-2">
      <div className="flex items-center justify-center gap-2 text-brand-gray-600">
        {/* Ícone de cadeado (SVG, não emoji) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 shrink-0"
          aria-hidden="true"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-xs font-medium">
          Pagamento criptografado — compra 100% segura
        </span>
      </div>
      <p className="mt-2 text-center text-[11px] text-brand-gray-400">
        Processado por Mercado Pago e PayPal
      </p>
    </div>
  );
}
