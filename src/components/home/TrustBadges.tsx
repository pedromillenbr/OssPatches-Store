export default function TrustBadges() {
  const badges = [
    {
      icon: '🏭',
      title: 'Produção própria',
      desc: 'Fabricamos localmente todo o material vendido',
    },
    {
      icon: '🥋',
      title: 'Padrão IBJJF',
      desc: 'Faixas homologadas e aprovadas para competição',
    },
    {
      icon: '✍️',
      title: 'Personalização',
      desc: 'Nome bordado, graus, arte e designs customizados',
    },
    {
      icon: '🚚',
      title: 'Envio rápido',
      desc: 'Postagem em até 3 dias úteis (Brasil)',
    },
    {
      icon: '🌍',
      title: 'Envio mundial',
      desc: 'Enviamos para qualquer lugar do globo',
    },
    {
      icon: '💎',
      title: 'Qualidade premium',
      desc: 'Materiais de alta qualidade que não desmancham nem desfiam',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-t border-brand-gray-200">
      <div className="container-site">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-4">
            Por que escolher OssPatches
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mb-3">
            Confiança e qualidade desde 2015
          </h2>
          <p className="text-brand-gray-600 max-w-xl mx-auto">
            Mais de 12.000 atletas em 6 continentes confiam na OssPatches para suas faixas e patches
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex items-start gap-4 p-5 border border-brand-gray-200 rounded-lg hover:border-brand-black transition-colors"
            >
              <div className="text-3xl shrink-0">{badge.icon}</div>
              <div>
                <h3 className="font-bold text-brand-black mb-1">{badge.title}</h3>
                <p className="text-sm text-brand-gray-600">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
