import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  CheckoutProgress,
  ShippingForm,
  PaymentForm,
  OrderReview,
  CheckoutSummary,
} from '@/components/checkout';
import { useCheckout } from '@/hooks/useCheckout';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    currentStep,
    setCurrentStep,
    shippingInfo,
    setShippingInfo,
    paymentInfo,
    setPaymentInfo,
    subtotal,
    shipping,
    tax,
    total,
    isProcessing,
    handlePlaceOrder,
  } = useCheckout();

  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      navigate({ to: '/cart' });
    }
  }, [items.length, isProcessing, navigate]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-500 font-medium">Complete your purchase securely</p>
        </header>

        <CheckoutProgress currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {currentStep === 'shipping' && (
              <ShippingForm
                shippingInfo={shippingInfo}
                setShippingInfo={setShippingInfo}
                onSubmit={() => setCurrentStep('payment')}
              />
            )}

            {currentStep === 'payment' && (
              <PaymentForm
                paymentInfo={paymentInfo}
                setPaymentInfo={setPaymentInfo}
                onSubmit={() => setCurrentStep('review')}
                onBack={() => setCurrentStep('shipping')}
              />
            )}

            {currentStep === 'review' && (
              <OrderReview
                shippingInfo={shippingInfo}
                paymentInfo={paymentInfo}
                isProcessing={isProcessing}
                onBack={() => setCurrentStep('payment')}
                onEditShipping={() => setCurrentStep('shipping')}
                onEditPayment={() => setCurrentStep('payment')}
                onPlaceOrder={handlePlaceOrder}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSummary
              items={items}
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
