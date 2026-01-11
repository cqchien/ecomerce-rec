import React from 'react';
import { CreditCard, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PaymentInfo } from '@/hooks/useCheckout';

interface PaymentFormProps {
  paymentInfo: PaymentInfo;
  setPaymentInfo: React.Dispatch<React.SetStateAction<PaymentInfo>>;
  onSubmit: () => void;
  onBack: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentInfo,
  setPaymentInfo,
  onSubmit,
  onBack,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="p-2 bg-[#FFF0F3] rounded-lg">
          <CreditCard className="w-6 h-6 text-[#FF6B8B]" />
        </div>
        Payment Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="cardName">Cardholder Name</Label>
          <Input
            id="cardName"
            type="text"
            required
            placeholder="John Doe"
            value={paymentInfo.cardName}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, cardName: e.target.value })}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            type="text"
            required
            placeholder="1234 5678 9012 3456"
            value={paymentInfo.cardNumber}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="text"
              required
              placeholder="MM/YY"
              value={paymentInfo.expiryDate}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              type="text"
              required
              placeholder="123"
              value={paymentInfo.cvv}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
          <Lock className="w-5 h-5" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12 border-2 border-gray-200 rounded-xl font-bold"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-[#FF6B8B] hover:bg-[#E64A6B] text-white font-bold rounded-xl"
          >
            Review Order
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
};
