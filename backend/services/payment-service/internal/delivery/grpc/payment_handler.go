package grpc

import (
	"context"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/usecase"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// PaymentHandler handles gRPC requests for payments
type PaymentHandler struct {
	pb.UnimplementedPaymentServiceServer
	useCase *usecase.PaymentUseCase
}

// NewPaymentHandler creates a new payment gRPC handler
func NewPaymentHandler(useCase *usecase.PaymentUseCase) *PaymentHandler {
	return &PaymentHandler{
		useCase: useCase,
	}
}

// CreatePaymentIntent creates a new payment intent
func (h *PaymentHandler) CreatePaymentIntent(ctx context.Context, req *pb.CreatePaymentIntentRequest) (*pb.CreatePaymentIntentResponse, error) {
	// Convert amount from cents to float
	amount := float64(req.Amount.AmountCents) / 100.0

	// Map payment method type
	method := mapProtoMethodToDomain(req.Method)

	payment, err := h.useCase.CreatePayment(ctx, req.OrderId, req.UserId, amount, req.Amount.Currency, method)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.CreatePaymentIntentResponse{
		PaymentIntentId: payment.ID,
		ClientSecret:    "secret_" + payment.ID, // In production, this would be from Stripe
		Status:          mapDomainStatusToProto(payment.Status),
	}, nil
}

// ConfirmPayment confirms a payment intent
func (h *PaymentHandler) ConfirmPayment(ctx context.Context, req *pb.ConfirmPaymentRequest) (*pb.ConfirmPaymentResponse, error) {
	payment, err := h.useCase.ProcessPayment(ctx, req.PaymentIntentId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.ConfirmPaymentResponse{
		Payment: mapDomainPaymentToProto(payment),
	}, nil
}

// CancelPayment cancels a payment
func (h *PaymentHandler) CancelPayment(ctx context.Context, req *pb.CancelPaymentRequest) (*pb.CancelPaymentResponse, error) {
	// TODO: Implement cancel in usecase
	payment, err := h.useCase.GetPayment(ctx, req.PaymentId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &pb.CancelPaymentResponse{
		Payment: mapDomainPaymentToProto(payment),
	}, nil
}

// RefundPayment refunds a payment
func (h *PaymentHandler) RefundPayment(ctx context.Context, req *pb.RefundPaymentRequest) (*pb.RefundPaymentResponse, error) {
	err := h.useCase.RefundPayment(ctx, req.PaymentId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	payment, err := h.useCase.GetPayment(ctx, req.PaymentId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.RefundPaymentResponse{
		Payment:  mapDomainPaymentToProto(payment),
		RefundId: "refund_" + payment.ID, // In production, this would be from Stripe
	}, nil
}

// GetPaymentStatus gets payment status
func (h *PaymentHandler) GetPaymentStatus(ctx context.Context, req *pb.GetPaymentStatusRequest) (*pb.GetPaymentStatusResponse, error) {
	payment, err := h.useCase.GetPayment(ctx, req.PaymentId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &pb.GetPaymentStatusResponse{
		Payment: mapDomainPaymentToProto(payment),
	}, nil
}

// GetPaymentMethods gets payment methods for a user (stub implementation)
func (h *PaymentHandler) GetPaymentMethods(ctx context.Context, req *pb.GetPaymentMethodsRequest) (*pb.GetPaymentMethodsResponse, error) {
	// TODO: Implement payment methods repository
	return &pb.GetPaymentMethodsResponse{
		PaymentMethods: []*pb.PaymentMethod{},
	}, nil
}

// AddPaymentMethod adds a payment method for a user (stub implementation)
func (h *PaymentHandler) AddPaymentMethod(ctx context.Context, req *pb.AddPaymentMethodRequest) (*pb.AddPaymentMethodResponse, error) {
	// TODO: Implement payment methods repository
	return nil, status.Error(codes.Unimplemented, "AddPaymentMethod not yet implemented")
}

// RemovePaymentMethod removes a payment method (stub implementation)
func (h *PaymentHandler) RemovePaymentMethod(ctx context.Context, req *pb.RemovePaymentMethodRequest) (*pb.RemovePaymentMethodResponse, error) {
	// TODO: Implement payment methods repository
	return nil, status.Error(codes.Unimplemented, "RemovePaymentMethod not yet implemented")
}

// Helper functions to map between proto and domain types

func mapProtoMethodToDomain(method pb.PaymentMethodType) domain.PaymentMethod {
	switch method {
	case pb.PaymentMethodType_CREDIT_CARD:
		return domain.PaymentMethodCreditCard
	case pb.PaymentMethodType_DEBIT_CARD:
		return domain.PaymentMethodDebitCard
	case pb.PaymentMethodType_PAYPAL:
		return domain.PaymentMethodPayPal
	default:
		return domain.PaymentMethodCreditCard
	}
}

func mapDomainStatusToProto(status domain.PaymentStatus) pb.PaymentStatus {
	switch status {
	case domain.PaymentStatusPending:
		return pb.PaymentStatus_PENDING
	case domain.PaymentStatusProcessing:
		return pb.PaymentStatus_PROCESSING
	case domain.PaymentStatusCompleted:
		return pb.PaymentStatus_SUCCEEDED
	case domain.PaymentStatusFailed:
		return pb.PaymentStatus_FAILED
	case domain.PaymentStatusCancelled:
		return pb.PaymentStatus_CANCELLED
	case domain.PaymentStatusRefunded:
		return pb.PaymentStatus_REFUNDED
	default:
		return pb.PaymentStatus_PENDING
	}
}

func mapDomainPaymentToProto(payment *domain.Payment) *pb.Payment {
	return &pb.Payment{
		Id:            payment.ID,
		OrderId:       payment.OrderID,
		UserId:        payment.UserID,
		Amount:        &pb.Money{AmountCents: int64(payment.Amount * 100), Currency: payment.Currency},
		Status:        mapDomainStatusToProto(payment.Status),
		Method:        mapDomainMethodToProto(payment.Method),
		TransactionId: payment.ProviderID,
		ErrorMessage:  payment.FailureReason,
		CreatedAt:     &pb.Timestamp{Seconds: payment.CreatedAt.Unix(), Nanos: int32(payment.CreatedAt.Nanosecond())},
		UpdatedAt:     &pb.Timestamp{Seconds: payment.UpdatedAt.Unix(), Nanos: int32(payment.UpdatedAt.Nanosecond())},
	}
}

func mapDomainMethodToProto(method domain.PaymentMethod) pb.PaymentMethodType {
	switch method {
	case domain.PaymentMethodCreditCard:
		return pb.PaymentMethodType_CREDIT_CARD
	case domain.PaymentMethodDebitCard:
		return pb.PaymentMethodType_DEBIT_CARD
	case domain.PaymentMethodPayPal:
		return pb.PaymentMethodType_PAYPAL
	default:
		return pb.PaymentMethodType_CREDIT_CARD
	}
}
