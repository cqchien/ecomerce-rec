package grpc

import (
	"context"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/logger"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// OrderUseCase defines the interface for order business logic
type OrderUseCase interface {
	CreateOrder(ctx context.Context, userID, shippingAddress, billingAddress, paymentMethod string, items []domain.OrderItem) (*domain.Order, error)
	GetOrder(ctx context.Context, orderID string) (*domain.Order, error)
	UpdateOrderStatus(ctx context.Context, orderID string, newStatus domain.OrderStatus) error
	CancelOrder(ctx context.Context, orderID string) error
	GetUserOrders(ctx context.Context, userID string, limit, offset int) ([]*domain.Order, error)
	UpdateTrackingNumber(ctx context.Context, orderID, trackingNumber string) error
	GetOrdersByStatus(ctx context.Context, status domain.OrderStatus, limit, offset int) ([]*domain.Order, error)
}

// OrderHandler implements the gRPC OrderService
type OrderHandler struct {
	pb.UnimplementedOrderServiceServer
	orderUseCase OrderUseCase
}

// NewOrderHandler creates a new order handler
func NewOrderHandler(orderUseCase OrderUseCase) *OrderHandler {
	return &OrderHandler{
		orderUseCase: orderUseCase,
	}
}

// CreateOrder creates a new order
func (h *OrderHandler) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.CreateOrderResponse, error) {
	logger.Infof("CreateOrder request for user: %s", req.UserId)

	// Convert proto items to domain items
	items := make([]domain.OrderItem, len(req.Items))
	for i, item := range req.Items {
		items[i] = domain.OrderItem{
			ProductID: item.ProductId,
			Quantity:  item.Quantity,
		}
	}

	// Create order
	createdOrder, err := h.orderUseCase.CreateOrder(
		ctx,
		req.UserId,
		"", // shipping address - will be retrieved from address IDs
		"", // billing address
		req.PaymentMethod,
		items,
	)
	if err != nil {
		logger.Errorf("Failed to create order: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to create order: %v", err)
	}

	return &pb.CreateOrderResponse{
		Order:           domainOrderToProto(createdOrder),
		PaymentIntentId: "",
	}, nil
}

// GetOrder retrieves an order by ID
func (h *OrderHandler) GetOrder(ctx context.Context, req *pb.GetOrderRequest) (*pb.GetOrderResponse, error) {
	logger.Infof("GetOrder request for ID: %s", req.Id)

	orderData, err := h.orderUseCase.GetOrder(ctx, req.Id)
	if err != nil {
		logger.Errorf("Failed to get order: %v", err)
		return nil, status.Errorf(codes.NotFound, "order not found: %v", err)
	}

	return &pb.GetOrderResponse{
		Order: domainOrderToProto(orderData),
	}, nil
}

// UpdateOrderStatus updates the order status
func (h *OrderHandler) UpdateOrderStatus(ctx context.Context, req *pb.UpdateOrderStatusRequest) (*pb.UpdateOrderStatusResponse, error) {
	logger.Infof("UpdateOrderStatus request for order: %s to status: %s", req.Id, req.Status)

	// Map proto status to domain status
	var domainStatus domain.OrderStatus
	switch req.Status {
	case pb.OrderStatus_PENDING:
		domainStatus = domain.OrderStatusPending
	case pb.OrderStatus_CONFIRMED:
		domainStatus = domain.OrderStatusConfirmed
	case pb.OrderStatus_PREPARING:
		domainStatus = domain.OrderStatusProcessing
	case pb.OrderStatus_SHIPPED:
		domainStatus = domain.OrderStatusShipped
	case pb.OrderStatus_DELIVERED:
		domainStatus = domain.OrderStatusDelivered
	case pb.OrderStatus_CANCELLED:
		domainStatus = domain.OrderStatusCancelled
	case pb.OrderStatus_REFUNDED:
		domainStatus = domain.OrderStatusRefunded
	default:
		return nil, status.Errorf(codes.InvalidArgument, "invalid order status")
	}

	err := h.orderUseCase.UpdateOrderStatus(ctx, req.Id, domainStatus)
	if err != nil {
		logger.Errorf("Failed to update order status: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to update order status: %v", err)
	}

	// Get updated order
	updatedOrder, err := h.orderUseCase.GetOrder(ctx, req.Id)
	if err != nil {
		return &pb.UpdateOrderStatusResponse{
			Order: nil,
		}, nil
	}

	return &pb.UpdateOrderStatusResponse{
		Order: domainOrderToProto(updatedOrder),
	}, nil
}

// CancelOrder cancels an order
func (h *OrderHandler) CancelOrder(ctx context.Context, req *pb.CancelOrderRequest) (*pb.CancelOrderResponse, error) {
	logger.Infof("CancelOrder request for ID: %s", req.Id)

	err := h.orderUseCase.CancelOrder(ctx, req.Id)
	if err != nil {
		logger.Errorf("Failed to cancel order: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to cancel order: %v", err)
	}

	// Get cancelled order
	cancelledOrder, err := h.orderUseCase.GetOrder(ctx, req.Id)
	if err != nil {
		return &pb.CancelOrderResponse{
			Success: true,
			Order:   nil,
		}, nil
	}

	return &pb.CancelOrderResponse{
		Success: true,
		Order:   domainOrderToProto(cancelledOrder),
	}, nil
}

// ListOrders retrieves all orders for a user
func (h *OrderHandler) ListOrders(ctx context.Context, req *pb.ListOrdersRequest) (*pb.ListOrdersResponse, error) {
	logger.Infof("ListOrders request for user: %s", req.UserId)

	limit := 10
	offset := 0
	if req.Pagination != nil {
		if req.Pagination.PageSize > 0 {
			limit = int(req.Pagination.PageSize)
		}
		if req.Pagination.PageNumber > 0 {
			offset = int((req.Pagination.PageNumber - 1) * req.Pagination.PageSize)
		}
	}

	orders, err := h.orderUseCase.GetUserOrders(ctx, req.UserId, limit, offset)
	if err != nil {
		logger.Errorf("Failed to get user orders: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to get user orders: %v", err)
	}

	protoOrders := make([]*pb.Order, len(orders))
	for i, o := range orders {
		protoOrders[i] = domainOrderToProto(o)
	}

	return &pb.ListOrdersResponse{
		Orders:     protoOrders,
		Pagination: nil,
	}, nil
}

// GetOrderStatusHistory retrieves order status history (stub implementation)
func (h *OrderHandler) GetOrderStatusHistory(ctx context.Context, req *pb.GetOrderStatusHistoryRequest) (*pb.GetOrderStatusHistoryResponse, error) {
	// Stub implementation - would need to track status history in database
	return &pb.GetOrderStatusHistoryResponse{
		History: []*pb.OrderStatusHistory{},
	}, nil
}

// domainOrderToProto converts domain Order to proto Order
func domainOrderToProto(o *domain.Order) *pb.Order {
	items := make([]*pb.OrderItem, len(o.Items))
	for i, item := range o.Items {
		items[i] = &pb.OrderItem{
			Id:        item.ID,
			ProductId: item.ProductID,
			Quantity:  item.Quantity,
		}
	}

	// Map domain status to proto status
	var protoStatus pb.OrderStatus
	switch o.Status {
	case domain.OrderStatusPending:
		protoStatus = pb.OrderStatus_PENDING
	case domain.OrderStatusConfirmed:
		protoStatus = pb.OrderStatus_CONFIRMED
	case domain.OrderStatusProcessing:
		protoStatus = pb.OrderStatus_PREPARING
	case domain.OrderStatusShipped:
		protoStatus = pb.OrderStatus_SHIPPED
	case domain.OrderStatusDelivered:
		protoStatus = pb.OrderStatus_DELIVERED
	case domain.OrderStatusCancelled:
		protoStatus = pb.OrderStatus_CANCELLED
	case domain.OrderStatusRefunded:
		protoStatus = pb.OrderStatus_REFUNDED
	}

	return &pb.Order{
		Id:            o.ID,
		UserId:        o.UserID,
		Items:         items,
		Status:        protoStatus,
		PaymentMethod: o.PaymentMethod,
		CreatedAt:     timestamppb.New(o.CreatedAt),
		UpdatedAt:     timestamppb.New(o.UpdatedAt),
	}
}
