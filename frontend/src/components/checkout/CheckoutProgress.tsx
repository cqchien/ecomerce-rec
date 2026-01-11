import React from 'react';
import { MapPin, CreditCard, Check } from 'lucide-react';
import type { CheckoutStep } from '@/hooks/useCheckout';

interface StepData {
  id: CheckoutStep;
  label: string;
  icon: React.ElementType;
}

interface CheckoutProgressProps {
  currentStep: CheckoutStep;
}

const steps: StepData[] = [
  { id: 'shipping', label: 'Shipping', icon: MapPin },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'review', label: 'Review', icon: Check },
];

export const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted =
            (currentStep === 'payment' && step.id === 'shipping') ||
            (currentStep === 'review' && (step.id === 'shipping' || step.id === 'payment'));

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-[#FF6B8B] text-white ring-4 ring-[#FF6B8B]/20'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span
                  className={`mt-2 text-sm font-bold ${
                    isActive ? 'text-[#FF6B8B]' : isCompleted ? 'text-green-500' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-1 mx-4 rounded-full transition-all ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
