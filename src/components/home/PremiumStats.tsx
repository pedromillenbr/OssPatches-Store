import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  label: string;
  suffix?: string;
  duration?: number;
}

function CountUp({ end, label, suffix = '', duration = 3000 }: CountUpProps) {
  const [count, setCount] = useState(0);
  const [startAnimation, setStartAnimation] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // 👇 OBSERVA QUANDO ENTRA NA TELA
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartAnimation(true);
          observer.disconnect(); // roda só 1x
        }
      },
      { threshold: 0.3 } // começa quando 30% aparece
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // 👇 ANIMAÇÃO
  useEffect(() => {
    if (!startAnimation) return;

    const startTime = Date.now();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = easeOut(progress);
      const current = Math.floor(eased * end);

      setCount(current);

      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [startAnimation, end, duration]);

  return (
    <div ref={ref} className="text-center sm:text-left">
      <p className="text-5xl sm:text-6xl font-black text-brand-black mb-2">
        +{count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-brand-gray-600">{label}</p>
    </div>
  );
}

export default function PremiumStats() {
  return (
    <section className="py-16 sm:py-20 bg-brand-gray-50 border-t border-b border-brand-gray-200">
      <div className="container-site">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">

          <CountUp 
            end={100000} 
            label="Patches vendidos" 
            duration={3000}
          />

          <CountUp 
            end={12000} 
            label="Atletas satisfeitos" 
            duration={3000}
          />

          <CountUp 
            end={6} 
            label="Continentes atendidos" 
            
            duration={2000}
          />

        </div>
      </div>
    </section>
  );
}