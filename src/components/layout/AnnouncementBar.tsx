/**
 * Barra fina no topo do site com a proposta de valor.
 * Reforça confiança e diferenciais antes do usuário rolar a página.
 */
export default function AnnouncementBar() {
  const items = [
    'Produção 100% própria',
    'Envio para todo o Brasil e mundo',
    'Padrão competição IBJJF',
  ];

  return (
    <div className="bg-brand-black text-white text-xs md:text-sm">
      <div className="container-site">
        <ul className="flex items-center justify-center gap-4 md:gap-8 py-2 text-center">
          {items.map((item, i) => (
            <li
              key={item}
              className={`flex items-center gap-2 ${i > 0 ? 'hidden sm:flex' : ''}`}
            >
              <span className="text-red-600" aria-hidden="true">•</span>
              <span className="font-medium tracking-wide">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
