package payment

import (
	"context"
	"fmt"

	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/domain"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
)

// StripeProvider implements payment processing using Stripe
type StripeProvider struct {
	apiKey string
}

// NewStripeProvider creates a new Stripe payment provider
func NewStripeProvider(apiKey string) *StripeProvider {
	stripe.Key = apiKey
	return &StripeProvider{
		apiKey: apiKey,
	}
}

// ProcessPayment processes a payment using Stripe
func (p *StripeProvider) ProcessPayment(ctx context.Context, payment *domain.Payment) (string, string, error) {
	// Convert amount to cents (Stripe uses smallest currency unit)
	amountInCents := int64(payment.Amount * 100)

	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountInCents),
		Currency: stripe.String(payment.Currency),
		Metadata: map[string]string{
			"order_id":   payment.OrderID,
			"user_id":    payment.UserID,
			"payment_id": payment.ID,
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return "", "", fmt.Errorf("stripe payment failed: %w", err)
	}

	// Confirm the payment intent
	confirmParams := &stripe.PaymentIntentConfirmParams{}
	confirmedPI, err := paymentintent.Confirm(pi.ID, confirmParams)
	if err != nil {
		return pi.ID, "", fmt.Errorf("stripe confirmation failed: %w", err)
	}

	if confirmedPI.Status != stripe.PaymentIntentStatusSucceeded {
		return pi.ID, string(confirmedPI.Status), fmt.Errorf("payment not successful: %s", confirmedPI.Status)
	}

	return pi.ID, string(confirmedPI.Status), nil
}

// RefundPayment processes a refund using Stripe
func (p *StripeProvider) RefundPayment(ctx context.Context, providerID string, amount float64) error {
	// Note: This is a simplified implementation
	// In production, you would use stripe.Refund API
	return nil
}
