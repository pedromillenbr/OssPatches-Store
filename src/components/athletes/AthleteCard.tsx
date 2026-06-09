import { memo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface AthleteCardProps {
  name: string;
  title: string;
  category: string;
  image: string;
  bio: string;
  achievements: string[];
}

const AthleteCard = memo(function AthleteCard({
  name,
  title,
  category,
  image,
  bio,
  achievements,
}: AthleteCardProps) {
  const [imgError, setImgError] = useState(false);
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
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -12;
    const rotateY = ((x - cx) / cx) * 12;
    setTilt({ x: rotateX, y: rotateY });
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }, []);

  const handleMouseEnter = useCallback(() => setHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlowPos({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="bg-white rounded-xl overflow-hidden shadow-md relative"
        style={{
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
            : 'rotateX(0deg) rotateY(0deg) scale(1)',
          transition: hovered
            ? 'transform 0.1s ease-out, box-shadow 0.3s ease'
            : 'transform 0.5s ease, box-shadow 0.5s ease',
          boxShadow: hovered
            ? '0 25px 60px -10px rgba(0,0,0,0.22), 0 10px 30px -5px rgba(0,0,0,0.12)'
            : '0 4px 20px -4px rgba(0,0,0,0.1)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl z-10"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.18) 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Image */}
        <div
          className="relative w-full h-72 bg-brand-gray-100 overflow-hidden flex items-center justify-center"
          style={{ transform: 'translateZ(8px)' }}
        >
          {!imgError ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-brand-gray-400 gap-2">
              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium">Foto do Atleta</span>
            </div>
          )}

          {/* Category badge floating on image */}
          <div
            className="absolute bottom-3 left-3 bg-brand-black/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ transform: 'translateZ(16px)' }}
          >
            {category}
          </div>
        </div>

        {/* Content */}
        <div className="p-6" style={{ transform: 'translateZ(4px)' }}>
          <h3 className="text-xl font-black text-brand-black mb-1">{name}</h3>
          <p className="text-sm font-semibold text-brand-gray-600 mb-4">{title}</p>

          <p className="text-sm text-brand-gray-600 leading-relaxed mb-4">{bio}</p>

          {/* Achievements */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-gray-400 uppercase tracking-widest mb-3">
              Conquistas
            </p>
            <ul className="space-y-1.5">
              {achievements.map((achievement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-brand-gray-600">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-brand-black shrink-0" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AthleteCard;
