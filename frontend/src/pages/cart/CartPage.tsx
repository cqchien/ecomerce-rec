import React from 'react';
import { Link } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { CartItemsList } from '@/components/cart/CartItemsList';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/useCart';

/**
 * CartPage - Orchestrates cart components
 * This is a Container Component that:
 * 1. Manages state through custom hook
 * 2. Composes presentational components
 * 3. Handles user interactions
 */
export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    isEmpty,
    subtotal,
    shipping,
    tax,
    total,
    handleQuantityChange,
    removeItem,
    clearCart,
  } = useCart();

  // Early return for empty state
  if (isEmpty) {
    return <EmptyCart />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-500 font-medium">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <CartItemsList
              items={items}
              onQuantityChange={handleQuantityChange}
              onRemove={removeItem}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/shop" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#4ECDC4] hover:bg-[#E6FFFA] hover:text-[#4ECDC4]"
                >
                  Continue Shopping
                </Button>
              </Link>
              <Button
                onClick={clearCart}
                variant="outline"
                className="h-12 px-6 border-2 border-gray-200 rounded-xl font-bold text-red-600 hover:border-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
