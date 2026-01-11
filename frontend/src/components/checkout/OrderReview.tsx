import React from 'react';
import { CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ShippingInfo, PaymentInfo } from '@/hooks/useCheckout';

interface OrderReviewProps {
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  isProcessing: boolean;
  onBack: () => void;
  onEditShipping: () => void;
  onEditPayment: () => void;
  onPlaceOrder: () => void;
}

export const OrderReview: React.FC<OrderReviewProps> = ({
  shippingInfo,
  paymentInfo,
  isProcessing,
  onBack,
  onEditShipping,
  onEditPayment,
  onPlaceOrder,
}) => {
  return (
    <div className="space-y-6">
      {/* Shipping Address */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-gray-900">Shipping Address</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditShipping}
            className="text-[#FF6B8B] hover:text-[#E64A6B]"
          >
            Edit
          </Button>
        </div>
        <div className="text-gray-600 space-y-1">
          <p className="font-semibold text-gray-900">
            {shippingInfo.firstName} {shippingInfo.lastName}
          </p>
          <p>{shippingInfo.address}</p>
          <p>
            {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
          </p>
          <p>{shippingInfo.email}</p>
          <p>{shippingInfo.phone}</p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-gray-900">Payment Method</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditPayment}
            className="text-[#FF6B8B] hover:text-[#E64A6B]"
          >
            Edit
          </Button>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <CreditCard className="w-5 h-5" />
          <span className="font-semibold">•••• •••• •••• {paymentInfo.cardNumber.slice(-4)}</span>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 border-2 border-gray-200 rounded-xl font-bold"
        >
          Back
        </Button>
        <Button
          onClick={onPlaceOrder}
          disabled={isProcessing}
          className="flex-1 h-12 bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#E64A6B] hover:to-[#E67D42] text-white font-bold rounded-xl shadow-lg"
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              Place Order
              <Check className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
