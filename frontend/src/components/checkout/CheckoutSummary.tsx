import React from 'react';
import type { CartItem } from '@/types';

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  items,
  subtotal,
  shipping,
  tax,
  total,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sticky top-28 space-y-6">
      <h2 className="text-xl font-display font-bold text-gray-900">Order Summary</h2>

      {/* Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h4>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-3 pt-6 border-t border-gray-100">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="font-semibold">
            {shipping === 0 ? (
              <span className="text-green-600 font-bold">FREE</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span className="font-semibold">${tax.toFixed(2)}</span>
        </div>
      </div>

      <div className="pt-4 border-t-2 border-gray-900">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
