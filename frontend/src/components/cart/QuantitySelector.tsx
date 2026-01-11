import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (newQuantity: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxQuantity,
  onQuantityChange,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center border border-gray-200 rounded-lg">
      <button
        onClick={() => onQuantityChange(quantity - 1)}
        className={`${sizeClasses[size]} flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors`}
        aria-label="Decrease quantity"
      >
        <Minus className={iconSizes[size]} />
      </button>
      <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
      <button
        onClick={() => onQuantityChange(quantity + 1)}
        disabled={quantity >= maxQuantity}
        className={`${sizeClasses[size]} flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Increase quantity"
      >
        <Plus className={iconSizes[size]} />
      </button>
    </div>
  );
};
