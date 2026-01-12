package usecase

import (
	"context"
	"fmt"

	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/logger"
)

// OrderRepository defines the interface for order data operations
type OrderRepository interface {
	Create(ctx context.Context, order *domain.Order) error
	GetByID(ctx context.Context, orderID string) (*domain.Order, error)
	Update(ctx context.Context, order *domain.Order) error
	GetUserOrders(ctx context.Context, userID string, limit, offset int) ([]*domain.Order, error)
	GetOrdersByStatus(ctx context.Context, status domain.OrderStatus, limit, offset int) ([]*domain.Order, error)
}

// OrderUseCase handles order business logic
type OrderUseCase struct {
	orderRepo OrderRepository
}

// NewOrderUseCase creates a new order use case
func NewOrderUseCase(orderRepo OrderRepository) *OrderUseCase {
	return &OrderUseCase{
		orderRepo: orderRepo,
	}
}

// CreateOrder creates a new order
func (uc *OrderUseCase) CreateOrder(ctx context.Context, userID, shippingAddress, billingAddress, paymentMethod string, items []domain.OrderItem) (*domain.Order, error) {
	// Validate input
	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("order must have at least one item")
	}

	// Create new order
	order, err := domain.NewOrder(userID, shippingAddress, billingAddress, paymentMethod, items)
	if err != nil {
		logger.Errorf("Failed to create order domain: %v", err)
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Save order to repository
	if err := uc.orderRepo.Create(ctx, order); err != nil {
		logger.Errorf("Failed to save order: %v", err)
		return nil, fmt.Errorf("failed to save order: %w", err)
	}

	logger.Infof("Order created successfully: %s", order.ID)
	return order, nil
}

// GetOrder retrieves an order by ID
func (uc *OrderUseCase) GetOrder(ctx context.Context, orderID string) (*domain.Order, error) {
	order, err := uc.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		logger.Errorf("Failed to get order %s: %v", orderID, err)
		return nil, fmt.Errorf("failed to get order: %w", err)
	}
	return order, nil
}

// UpdateOrderStatus updates the order status with validation
func (uc *OrderUseCase) UpdateOrderStatus(ctx context.Context, orderID string, newStatus domain.OrderStatus) error {
	// Get current order
	order, err := uc.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		logger.Errorf("Failed to get order %s: %v", orderID, err)
		return fmt.Errorf("failed to get order: %w", err)
	}

	// Validate and update status
	if err := order.UpdateStatus(newStatus); err != nil {
		logger.Errorf("Invalid status transition for order %s: %v", orderID, err)
		return fmt.Errorf("invalid status transition: %w", err)
	}

	// Save updated order
	if err := uc.orderRepo.Update(ctx, order); err != nil {
		logger.Errorf("Failed to update order %s: %v", orderID, err)
		return fmt.Errorf("failed to update order: %w", err)
	}

	logger.Infof("Order %s status updated to %s", orderID, newStatus)
	return nil
}

// CancelOrder cancels an order
func (uc *OrderUseCase) CancelOrder(ctx context.Context, orderID string) error {
	// Get current order
	order, err := uc.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		logger.Errorf("Failed to get order %s: %v", orderID, err)
		return fmt.Errorf("failed to get order: %w", err)
	}

	// Cancel the order
	if err := order.Cancel(); err != nil {
		logger.Errorf("Failed to cancel order %s: %v", orderID, err)
		return fmt.Errorf("failed to cancel order: %w", err)
	}

	// Save updated order
	if err := uc.orderRepo.Update(ctx, order); err != nil {
		logger.Errorf("Failed to update cancelled order %s: %v", orderID, err)
		return fmt.Errorf("failed to update order: %w", err)
	}

	logger.Infof("Order %s cancelled successfully", orderID)
	return nil
}

// GetUserOrders retrieves all orders for a user
func (uc *OrderUseCase) GetUserOrders(ctx context.Context, userID string, limit, offset int) ([]*domain.Order, error) {
	orders, err := uc.orderRepo.GetUserOrders(ctx, userID, limit, offset)
	if err != nil {
		logger.Errorf("Failed to get orders for user %s: %v", userID, err)
		return nil, fmt.Errorf("failed to get user orders: %w", err)
	}
	return orders, nil
}

// UpdateTrackingNumber updates the tracking number for an order
func (uc *OrderUseCase) UpdateTrackingNumber(ctx context.Context, orderID, trackingNumber string) error {
	// Get current order
	order, err := uc.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		logger.Errorf("Failed to get order %s: %v", orderID, err)
		return fmt.Errorf("failed to get order: %w", err)
	}

	// Set tracking number
	if err := order.SetTrackingNumber(trackingNumber); err != nil {
		logger.Errorf("Failed to set tracking number for order %s: %v", orderID, err)
		return fmt.Errorf("failed to set tracking number: %w", err)
	}

	// Save updated order
	if err := uc.orderRepo.Update(ctx, order); err != nil {
		logger.Errorf("Failed to update order %s with tracking number: %v", orderID, err)
		return fmt.Errorf("failed to update order: %w", err)
	}

	logger.Infof("Tracking number updated for order %s", orderID)
	return nil
}

// GetOrdersByStatus retrieves orders by status
func (uc *OrderUseCase) GetOrdersByStatus(ctx context.Context, status domain.OrderStatus, limit, offset int) ([]*domain.Order, error) {
	orders, err := uc.orderRepo.GetOrdersByStatus(ctx, status, limit, offset)
	if err != nil {
		logger.Errorf("Failed to get orders by status %s: %v", status, err)
		return nil, fmt.Errorf("failed to get orders by status: %w", err)
	}
	return orders, nil
}
