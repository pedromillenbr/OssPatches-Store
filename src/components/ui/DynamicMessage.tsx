import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface DynamicMessageProps {
  step: 'browsing' | 'customizing' | 'checkout' | 'success';
  className?: string;
}

const messages: Record<DynamicMessageProps['step'], string[]> = {
  browsing: [
    'Faixas premium direto da produção',
    'Envio para todo o mundo',
    'Qualidade padrão competição',
    'Personalize do seu jeito',
    'Feitas para durar',
  ],
  customizing: [
    'Seu pedido está quase pronto',
    'Só falta personalizar',
    'Deixa do jeito que você quer',
  ],
  checkout: [
    'Último passo: finalizar compra',
    'Quase lá...',
    'Seu pedido está em boas mãos',
  ],
  success: [
    'Pedido concluído com sucesso!',
    'Obrigado pela confiança',
    'Vamos começar a produção',
  ],
};

export default function DynamicMessage({
  step,
  className,
}: DynamicMessageProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const msgs = messages[step];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % msgs.length);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, [msgs.length]);

  return (
    <p
      className={clsx(
        'transition-opacity duration-300 text-sm font-medium text-brand-gray-600',
        visible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {msgs[index]}
    </p>
  );
}
