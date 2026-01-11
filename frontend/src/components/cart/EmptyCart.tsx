import React from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyCartProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

export const EmptyCart: React.FC<EmptyCartProps> = ({
  title = 'Your cart is empty',
  description = "Looks like you haven't added anything to your cart yet. Start shopping to fill it up!",
  ctaText = 'Start Shopping',
  ctaLink = '/shop',
}) => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">{description}</p>
          <Link to={ctaLink}>
            <Button className="px-8 py-6 bg-[#FF6B8B] hover:bg-[#E64A6B] text-white font-bold rounded-xl shadow-lg hover:-translate-y-1 transition-all">
              {ctaText}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
