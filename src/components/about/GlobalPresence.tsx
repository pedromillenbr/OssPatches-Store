import CountryFlag from 'react-country-flag';

export default function GlobalPresence() {
  const countries = [
    { name: 'Brasil', code: 'BR' },
    { name: 'Estados Unidos', code: 'US' },
    { name: 'Itália', code: 'IT' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Japão', code: 'JP' },
    { name: 'Canadá', code: 'CA' },
    { name: 'Espanha', code: 'ES' },
    { name: 'Emirados Árabes', code: 'AE' },
    { name: 'Nova Zelândia', code: 'NZ' },
    { name: 'Chile', code: 'CL' },
  ];

  return (
    <section className="py-16 sm:py-20 bg-brand-gray-50 border-t border-brand-gray-200">
      <div className="container-site">
        <div className="text-center mb-12">
          
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mb-4">
            Presença Global
          </h2>
          <p className="text-brand-gray-600 max-w-xl mx-auto">
            Países parceiros que já tem acesso a materiais de qualidade excepcional para competidores internacionais
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {countries.map((country) => (
            <div
              key={country.name}
              className="flex flex-col items-center gap-3 p-4 rounded-lg border border-brand-gray-200 hover:border-brand-black hover:bg-white transition-all duration-200"
            >
              <CountryFlag countryCode={country.code} svg style={{ fontSize: '3em' }} />
              <p className="text-sm font-semibold text-brand-black text-center">
                {country.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
