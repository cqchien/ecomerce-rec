import React from 'react';
import { Trash2 } from 'lucide-react';
import { QuantitySelector } from './QuantitySelector';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
  category: string;
  selectedVariant?: string;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  price,
  quantity,
  stock,
  image,
  category,
  selectedVariant,
  onQuantityChange,
  onRemove,
}) => {
  const itemTotal = (Number(price) || 0) * quantity;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Product Info */}
        <div className="col-span-1 md:col-span-6 flex items-center gap-4">
          <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden group">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-1 truncate hover:text-[#FF6B8B] transition-colors">
              {name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{category}</p>
            {selectedVariant && (
              <p className="text-xs text-gray-400 mt-1">Variant: {selectedVariant}</p>
            )}
            {stock < 10 && (
              <p className="text-xs text-orange-500 mt-1 font-semibold">
                Only {stock} left in stock
              </p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="col-span-1 md:col-span-2 text-left md:text-center">
          <span className="font-bold text-gray-900">${(Number(price) || 0).toFixed(2)}</span>
        </div>

        {/* Quantity */}
        <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
          <QuantitySelector
            quantity={quantity}
            maxQuantity={stock}
            onQuantityChange={(newQty) => onQuantityChange(id, newQty)}
          />
        </div>

        {/* Total */}
        <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-4">
          <span className="font-bold text-lg text-gray-900">${(Number(itemTotal) || 0).toFixed(2)}</span>
          <button
            onClick={() => onRemove(id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove item"
            aria-label={`Remove ${name} from cart`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
