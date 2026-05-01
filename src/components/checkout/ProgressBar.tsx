import { CheckoutStep } from '@/types';
import clsx from 'clsx';

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'identification', label: 'Dados' },
  { key: 'address', label: 'Endereço' },
  { key: 'shipping', label: 'Frete' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'success', label: 'Concluído' },
];

interface ProgressBarProps {
  currentStep: CheckoutStep;
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step dot + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                    isCompleted && 'bg-brand-black text-white',
                    isCurrent && 'bg-brand-black text-white ring-4 ring-brand-gray-200',
                    !isCompleted && !isCurrent && 'bg-brand-gray-200 text-brand-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={clsx(
                    'text-xs font-medium hidden sm:block',
                    isCurrent ? 'text-brand-black' : 'text-brand-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={clsx(
                      'h-0.5 transition-all duration-500',
                      i < currentIndex ? 'bg-brand-black' : 'bg-brand-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
