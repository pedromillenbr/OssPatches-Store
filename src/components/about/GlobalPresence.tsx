import { useState, useRef, useCallback } from 'react';
import CountryFlag from 'react-country-flag';

const COUNTRIES = [
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

function CountryCard({ name, code }: { name: string; code: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTilt({
      x: ((y - rect.height / 2) / (rect.height / 2)) * -12,
      y: ((x - rect.width / 2) / (rect.width / 2)) * 12,
    });
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlowPos({ x: 50, y: 50 });
  }, []);

  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} onMouseEnter={() => setHovered(true)} onMouseLeave={handleMouseLeave} style={{ perspective: '800px' }}>
      <div
        className="relative flex flex-col items-center gap-3 p-4 rounded-lg border border-brand-gray-200 bg-white overflow-hidden"
        style={{
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.06)`
            : 'rotateX(0deg) rotateY(0deg) scale(1)',
          transition: hovered ? 'transform 0.1s ease-out, box-shadow 0.3s ease' : 'transform 0.5s ease, box-shadow 0.5s ease',
          boxShadow: hovered ? '0 20px 50px -10px rgba(0,0,0,0.18)' : '0 2px 8px -2px rgba(0,0,0,0.06)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.5) 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
        <div style={{ transform: 'translateZ(12px)' }}>
          <CountryFlag countryCode={code} svg style={{ fontSize: '3em' }} />
        </div>
        <p className="text-sm font-semibold text-brand-black text-center" style={{ transform: 'translateZ(6px)' }}>
          {name}
        </p>
      </div>
    </div>
  );
}

export default function GlobalPresence() {
  return (
    <section className="py-16 sm:py-20 bg-brand-gray-50 border-t border-brand-gray-200">
      <div className="container-site">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mb-4">
            Presença Global
          </h2>
          <p className="text-brand-gray-600 max-w-xl mx-auto">
            Países parceiros que já têm acesso a materiais de qualidade excepcional para competidores internacionais
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {COUNTRIES.map((country) => (
            <CountryCard key={country.code} {...country} />
          ))}
        </div>
      </div>
    </section>
  );
}
