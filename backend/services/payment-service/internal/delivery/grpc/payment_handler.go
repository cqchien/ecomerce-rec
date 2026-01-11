package grpc

import (
	"context"

	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/usecase"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// PaymentRequest represents a payment request (simplified - use proto in production)
type PaymentRequest struct {
	OrderID  string
	UserID   string
	Amount   float64
	Currency string
	Method   string
}

// PaymentResponse represents a payment response
type PaymentResponse struct {
	ID      string
	Status  string
	OrderID string
	Amount  float64
}

// PaymentHandler handles gRPC requests for payments
type PaymentHandler struct {
	useCase *usecase.PaymentUseCase
}

// NewPaymentHandler creates a new payment gRPC handler
func NewPaymentHandler(useCase *usecase.PaymentUseCase) *PaymentHandler {
	return &PaymentHandler{
		useCase: useCase,
	}
}

// CreatePayment creates a new payment
func (h *PaymentHandler) CreatePayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error) {
	orderID, err := uuid.Parse(req.OrderID)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid order ID")
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user ID")
	}

	payment, err := h.useCase.CreatePayment(ctx, orderID, userID, req.Amount, req.Currency, domain.PaymentMethod(req.Method))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &PaymentResponse{
		ID:      payment.ID.String(),
		Status:  string(payment.Status),
		OrderID: payment.OrderID.String(),
		Amount:  payment.Amount,
	}, nil
}

// ProcessPayment processes a payment
func (h *PaymentHandler) ProcessPayment(ctx context.Context, paymentID string) (*PaymentResponse, error) {
	id, err := uuid.Parse(paymentID)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid payment ID")
	}

	payment, err := h.useCase.ProcessPayment(ctx, id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &PaymentResponse{
		ID:      payment.ID.String(),
		Status:  string(payment.Status),
		OrderID: payment.OrderID.String(),
		Amount:  payment.Amount,
	}, nil
}
