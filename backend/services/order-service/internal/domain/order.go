package domain

import (
	"errors"
	"time"
)

// OrderStatus represents the state of an order
type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "PENDING"
	OrderStatusConfirmed  OrderStatus = "CONFIRMED"
	OrderStatusProcessing OrderStatus = "PROCESSING"
	OrderStatusShipped    OrderStatus = "SHIPPED"
	OrderStatusDelivered  OrderStatus = "DELIVERED"
	OrderStatusCancelled  OrderStatus = "CANCELLED"
	OrderStatusRefunded   OrderStatus = "REFUNDED"
)

// OrderItem represents a single item in an order
type OrderItem struct {
	ID        string
	OrderID   string
	ProductID string
	Quantity  int32
	Price     float64
	Subtotal  float64
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Order represents an order entity
type Order struct {
	ID              string
	UserID          string
	Status          OrderStatus
	Items           []OrderItem
	TotalAmount     float64
	ShippingAddress string
	BillingAddress  string
	PaymentMethod   string
	PaymentStatus   string
	TrackingNumber  string
	Notes           string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// NewOrder creates a new order
func NewOrder(userID, shippingAddress, billingAddress, paymentMethod string, items []OrderItem) (*Order, error) {
	if userID == "" {
		return nil, errors.New("user ID is required")
	}
	if len(items) == 0 {
		return nil, errors.New("order must have at least one item")
	}
	if shippingAddress == "" {
		return nil, errors.New("shipping address is required")
	}

	now := time.Now()

	var totalAmount float64
	for i := range items {
		items[i].Subtotal = float64(items[i].Quantity) * items[i].Price
		items[i].CreatedAt = now
		items[i].UpdatedAt = now
		totalAmount += items[i].Subtotal
	}

	return &Order{
		ID:              "",
		UserID:          userID,
		Status:          OrderStatusPending,
		Items:           items,
		TotalAmount:     totalAmount,
		ShippingAddress: shippingAddress,
		BillingAddress:  billingAddress,
		PaymentMethod:   paymentMethod,
		PaymentStatus:   "PENDING",
		CreatedAt:       now,
		UpdatedAt:       now,
	}, nil
}

// CanTransitionTo checks if the order can transition to the given status
func (o *Order) CanTransitionTo(newStatus OrderStatus) error {
	validTransitions := map[OrderStatus][]OrderStatus{
		OrderStatusPending:    {OrderStatusConfirmed, OrderStatusCancelled},
		OrderStatusConfirmed:  {OrderStatusProcessing, OrderStatusCancelled},
		OrderStatusProcessing: {OrderStatusShipped, OrderStatusCancelled},
		OrderStatusShipped:    {OrderStatusDelivered, OrderStatusCancelled},
		OrderStatusDelivered:  {OrderStatusRefunded},
		OrderStatusCancelled:  {OrderStatusRefunded},
		OrderStatusRefunded:   {},
	}

	allowedTransitions, exists := validTransitions[o.Status]
	if !exists {
		return errors.New("invalid current order status")
	}

	for _, allowed := range allowedTransitions {
		if allowed == newStatus {
			return nil
		}
	}

	return errors.New("invalid status transition from " + string(o.Status) + " to " + string(newStatus))
}

// UpdateStatus updates the order status with validation
func (o *Order) UpdateStatus(newStatus OrderStatus) error {
	if err := o.CanTransitionTo(newStatus); err != nil {
		return err
	}

	o.Status = newStatus
	o.UpdatedAt = time.Now()
	return nil
}

// Cancel cancels the order
func (o *Order) Cancel() error {
	return o.UpdateStatus(OrderStatusCancelled)
}

// SetTrackingNumber sets the tracking number for shipped orders
func (o *Order) SetTrackingNumber(trackingNumber string) error {
	if o.Status != OrderStatusShipped && o.Status != OrderStatusDelivered {
		return errors.New("can only set tracking number for shipped or delivered orders")
	}

	o.TrackingNumber = trackingNumber
	o.UpdatedAt = time.Now()
	return nil
}
