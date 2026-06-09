import { useEffect, useState } from 'react';

export default function WhatsAppButton() {
  const [showMessage, setShowMessage] = useState(false);

  const phoneNumber = '5521982479922'; // Substitua com seu número real
  const message = encodeURIComponent(
    'Olá! Vim pelo site OssPatches e gostaria de mais informações sobre os produtos.'
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let hideTimeoutId: ReturnType<typeof setTimeout>;

    const scheduleMessage = () => {
      const delay = 7000 + Math.random() * 8000;
      timeoutId = setTimeout(() => {
        setShowMessage(true);
        hideTimeoutId = setTimeout(() => {
          setShowMessage(false);
          scheduleMessage();
        }, 3600);
      }, delay);
    };

    scheduleMessage();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(hideTimeoutId);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {showMessage && (
        <div
          className="max-w-[220px] rounded-full bg-white/95 border border-green-200 px-4 py-2 text-xs font-semibold text-brand-black shadow-lg animate-fade-in"
          aria-live="polite"
        >
          Está com dúvida? Fale conosco!
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
        title="Chat no WhatsApp"
        aria-label="Abrir WhatsApp"
      >
        <svg
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-16"
        >
          {/* Outer white circle with shadow */}
          <circle cx="32" cy="32" r="31" fill="white" />
          {/* Inner green circle */}
          <circle cx="32" cy="32" r="24" fill="#25D366" />
          {/* WhatsApp icon */}
          <path
            fill="white"
            d="M32 19.5c-6.9 0-12.5 5.6-12.5 12.5 0 2.2.6 4.3 1.6 6.1L19 44.5l6.7-2.1c1.7.9 3.6 1.4 5.6 1.4h.1c6.9 0 12.5-5.6 12.5-12.5S38.9 19.5 32 19.5zm7.3 17.3c-.3.8-1.7 1.6-2.4 1.7-.6.1-1.4.1-2.3-.1-.5-.1-1.2-.4-2-.7-3.5-1.5-5.8-5-6-5.3-.2-.2-1.4-1.9-1.4-3.6 0-1.7.9-2.5 1.2-2.8.3-.3.7-.4 1-.4.2 0 .5 0 .7.01.2 0 .5-.1.8.6.3.7 1 2.4 1.1 2.6.1.2.2.4.03.7-.1.3-.2.5-.4.7-.2.2-.4.5-.5.6-.2.2-.4.4-.2.8.3.4 1.2 1.9 2.5 3.1 1.7 1.5 3.1 2 3.6 2.2.4.2.7.1.9-.1.3-.3 1.1-1.3 1.4-1.7.3-.4.6-.3 1-.2.4.1 2.5 1.2 2.9 1.4.4.2.7.3.8.5.1.2.1 1-.2 1.8z"
          />
        </svg>
      </a>
    </div>
  );
}
