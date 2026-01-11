package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// PaymentStatus represents the current state of a payment
type PaymentStatus string

const (
	PaymentStatusPending    PaymentStatus = "PENDING"
	PaymentStatusProcessing PaymentStatus = "PROCESSING"
	PaymentStatusCompleted  PaymentStatus = "COMPLETED"
	PaymentStatusFailed     PaymentStatus = "FAILED"
	PaymentStatusRefunded   PaymentStatus = "REFUNDED"
	PaymentStatusCancelled  PaymentStatus = "CANCELLED"
)

// PaymentMethod represents the method used for payment
type PaymentMethod string

const (
	PaymentMethodCreditCard PaymentMethod = "CREDIT_CARD"
	PaymentMethodDebitCard  PaymentMethod = "DEBIT_CARD"
	PaymentMethodPayPal     PaymentMethod = "PAYPAL"
	PaymentMethodStripe     PaymentMethod = "STRIPE"
)

var (
	ErrPaymentNotFound         = errors.New("payment not found")
	ErrInvalidAmount           = errors.New("invalid payment amount")
	ErrPaymentFailed           = errors.New("payment processing failed")
	ErrInvalidPaymentMethod    = errors.New("invalid payment method")
	ErrPaymentAlreadyProcessed = errors.New("payment already processed")
	ErrRefundNotAllowed        = errors.New("refund not allowed for this payment")
)

// Payment represents a payment transaction
type Payment struct {
	ID               uuid.UUID     `json:"id"`
	OrderID          uuid.UUID     `json:"order_id"`
	UserID           uuid.UUID     `json:"user_id"`
	Amount           float64       `json:"amount"`
	Currency         string        `json:"currency"`
	Status           PaymentStatus `json:"status"`
	Method           PaymentMethod `json:"method"`
	ProviderID       string        `json:"provider_id"`       // External payment provider ID (e.g., Stripe charge ID)
	ProviderResponse string        `json:"provider_response"` // Raw response from payment provider
	FailureReason    string        `json:"failure_reason,omitempty"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}

// NewPayment creates a new payment with validation
func NewPayment(orderID, userID uuid.UUID, amount float64, currency string, method PaymentMethod) (*Payment, error) {
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}

	if method == "" {
		return nil, ErrInvalidPaymentMethod
	}

	now := time.Now()
	return &Payment{
		ID:        uuid.New(),
		OrderID:   orderID,
		UserID:    userID,
		Amount:    amount,
		Currency:  currency,
		Status:    PaymentStatusPending,
		Method:    method,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// MarkAsProcessing marks the payment as processing
func (p *Payment) MarkAsProcessing() error {
	if p.Status != PaymentStatusPending {
		return ErrPaymentAlreadyProcessed
	}
	p.Status = PaymentStatusProcessing
	p.UpdatedAt = time.Now()
	return nil
}

// MarkAsCompleted marks the payment as completed
func (p *Payment) MarkAsCompleted(providerID, providerResponse string) {
	p.Status = PaymentStatusCompleted
	p.ProviderID = providerID
	p.ProviderResponse = providerResponse
	p.UpdatedAt = time.Now()
}

// MarkAsFailed marks the payment as failed
func (p *Payment) MarkAsFailed(reason string) {
	p.Status = PaymentStatusFailed
	p.FailureReason = reason
	p.UpdatedAt = time.Now()
}

// CanRefund checks if the payment can be refunded
func (p *Payment) CanRefund() bool {
	return p.Status == PaymentStatusCompleted
}

// Refund processes a refund for the payment
func (p *Payment) Refund() error {
	if !p.CanRefund() {
		return ErrRefundNotAllowed
	}
	p.Status = PaymentStatusRefunded
	p.UpdatedAt = time.Now()
	return nil
}

// Cancel cancels a pending payment
func (p *Payment) Cancel() error {
	if p.Status != PaymentStatusPending {
		return ErrPaymentAlreadyProcessed
	}
	p.Status = PaymentStatusCancelled
	p.UpdatedAt = time.Now()
	return nil
}
