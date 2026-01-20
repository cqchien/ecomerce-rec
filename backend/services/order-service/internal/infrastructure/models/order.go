package models

import (
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/domain"
	"gorm.io/gorm"
)

// Order represents the database model for orders
type Order struct {
	ID              string `gorm:"type:uuid;primaryKey;default:uuid_generate_v7()"`
	UserID          string `gorm:"type:uuid;not null;index"`
	Status          string `gorm:"type:varchar(20);not null;index"`
	TotalAmount     float64
	ShippingAddress string `gorm:"type:text"`
	BillingAddress  string `gorm:"type:text"`
	PaymentMethod   string `gorm:"type:varchar(50)"`
	PaymentStatus   string `gorm:"type:varchar(20)"`
	TrackingNumber  string `gorm:"type:varchar(100)"`
	Notes           string `gorm:"type:text"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       gorm.DeletedAt `gorm:"index"`

	Items []OrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE"`
}

// OrderItem represents the database model for order items
type OrderItem struct {
	ID        string `gorm:"type:uuid;primaryKey;default:uuid_generate_v7()"`
	OrderID   string `gorm:"type:uuid;not null;index"`
	ProductID string `gorm:"type:uuid;not null;index"`
	Quantity  int32  `gorm:"not null"`
	Price     float64
	Subtotal  float64
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for Order
func (Order) TableName() string {
	return "orders"
}

// TableName specifies the table name for OrderItem
func (OrderItem) TableName() string {
	return "order_items"
}

// ToDomain converts database Order model to domain Order
func (o *Order) ToDomain() *domain.Order {
	items := make([]domain.OrderItem, len(o.Items))
	for i, item := range o.Items {
		items[i] = domain.OrderItem{
			ID:        item.ID,
			OrderID:   item.OrderID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     item.Price,
			Subtotal:  item.Subtotal,
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		}
	}

	return &domain.Order{
		ID:              o.ID,
		UserID:          o.UserID,
		Status:          domain.OrderStatus(o.Status),
		Items:           items,
		TotalAmount:     o.TotalAmount,
		ShippingAddress: o.ShippingAddress,
		BillingAddress:  o.BillingAddress,
		PaymentMethod:   o.PaymentMethod,
		PaymentStatus:   o.PaymentStatus,
		TrackingNumber:  o.TrackingNumber,
		Notes:           o.Notes,
		CreatedAt:       o.CreatedAt,
		UpdatedAt:       o.UpdatedAt,
	}
}

// FromDomain converts domain Order to database Order model
func FromDomain(order *domain.Order) *Order {
	items := make([]OrderItem, len(order.Items))
	for i, item := range order.Items {
		items[i] = OrderItem{
			ID:        item.ID,
			OrderID:   item.OrderID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     item.Price,
			Subtotal:  item.Subtotal,
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		}
	}

	return &Order{
		ID:              order.ID,
		UserID:          order.UserID,
		Status:          string(order.Status),
		Items:           items,
		TotalAmount:     order.TotalAmount,
		ShippingAddress: order.ShippingAddress,
		BillingAddress:  order.BillingAddress,
		PaymentMethod:   order.PaymentMethod,
		PaymentStatus:   order.PaymentStatus,
		TrackingNumber:  order.TrackingNumber,
		Notes:           order.Notes,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
	}
}
