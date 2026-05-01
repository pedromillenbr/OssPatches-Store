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
        className="flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ring-2 ring-green-300/30"
        title="Chat no WhatsApp"
        aria-label="Abrir WhatsApp"
      >
        <svg
          className="w-9 h-9"
          fill="currentColor"
          viewBox="0 0 448 512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M380.9 97.1C339 55.2 284.3 32 224.5 32c-66.3 0-128 25.7-174.6 72.4C3.4 150.2-7.2 215.8 7.5 275.9L0 448l122.8-34.5c23.8 13 50.9 19.8 78.8 19.8 66.2 0 127.9-25.8 174.6-72.5 46.7-46.7 72.4-108.4 72.4-174.6 0-59.5-23.3-114.2-65.2-156.1zM224.5 439.6c-25 0-49.6-6.7-71.3-19.4l-5.1-2.9-65.1 17.1 17.4-63.4-3.3-5.3c-13.1-21.2-19.9-45.6-19.9-70.8 0-86 70-156.2 156.1-156.2 41.7 0 80.9 16.3 110.5 45.8 29.5 29.5 45.8 68.8 45.8 110.5 0 86-70 156.2-156.1 156.2zm84.9-114.4c-4.7-2.4-27.6-13.6-31.9-15.1-4.3-1.4-7.4-2.4-10.5 2.4-3.1 4.7-12 15.1-14.7 18.1-2.7 2.9-5.5 3.3-10.2 1.1-4.7-2.4-19.8-7.3-37.7-23.2-13.9-12.4-23.3-27.7-26-32.4-2.7-4.7-.3-7.3 2.1-9.6 2.2-2.2 4.9-5.6 7.3-8.4 2.4-2.9 3.2-5.2 4.7-8.7 1.5-3.5.8-6.6-.4-9.2-1.1-2.6-10.5-25.3-14.4-34.6-3.8-9.2-7.7-8-10.5-8.1-2.7-.1-5.8-.1-8.9-.1-3.1 0-8.1 1.1-12.3 5.9-4.3 4.7-16.4 16-16.4 39.1s16.8 45.4 19.1 48.6c2.4 3.1 33.2 50.7 80.5 71.1 11.3 4.9 20.1 7.8 27 10 11.3 3.5 21.6 3 29.7 1.8 9.1-1.4 27.6-11.3 31.5-22.1 3.9-10.7 3.9-19.8 2.7-22.1-1.1-2.3-4.3-3.7-9-6.1z" />
        </svg>
      </a>
    </div>
  );
}
