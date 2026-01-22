import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingThreshold?: number;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  shipping,
  tax,
  total,
  freeShippingThreshold = 50,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  const handleApplyPromo = () => {
    // TODO: Implement promo code logic
    console.log('Applying promo code:', promoCode);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sticky top-28 space-y-6">
      <h2 className="text-xl font-display font-bold text-gray-900">Order Summary</h2>

      {/* Promo Code */}
      <div>
        <label htmlFor="promo-code" className="block text-sm font-bold text-gray-700 mb-2">
          Promo Code
        </label>
        <div className="flex gap-2">
          <input
            id="promo-code"
            type="text"
            placeholder="Enter code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] focus:border-transparent"
          />
          <Button
            onClick={handleApplyPromo}
            disabled={!promoCode}
            className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold disabled:opacity-50"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-semibold">${(Number(subtotal) || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="font-semibold">
            {shipping === 0 ? (
              <span className="text-green-600 font-bold">FREE</span>
            ) : (
              `$${(Number(shipping) || 0).toFixed(2)}`
            )}
          </span>
        </div>
        {remainingForFreeShipping > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#FF6B8B] bg-[#FFF0F3] p-2 rounded-lg">
            <Tag className="w-4 h-4" />
            Add ${(Number(remainingForFreeShipping) || 0).toFixed(2)} more for FREE shipping!
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Tax (8%)</span>
          <span className="font-semibold">${(Number(tax) || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-4 border-t-2 border-gray-900">
        <div className="flex justify-between items-baseline mb-6">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-3xl font-bold text-gray-900">${(Number(total) || 0).toFixed(2)}</span>
        </div>

        <Link to="/checkout">
          <Button className="w-full h-14 bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#E64A6B] hover:to-[#E67D42] text-white font-bold text-lg rounded-xl shadow-lg hover:-translate-y-1 transition-all">
            Proceed to Checkout
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Trust Badges */}
      <TrustBadges />
    </div>
  );
};

const TrustBadges: React.FC = () => {
  const badges = [
    'Secure checkout',
    'Free returns within 30 days',
    'Customer support 24/7',
  ];

  return (
    <div className="pt-6 border-t border-gray-100 space-y-2 text-sm text-gray-500">
      {badges.map((badge) => (
        <div key={badge} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span>{badge}</span>
        </div>
      ))}
    </div>
  );
};
