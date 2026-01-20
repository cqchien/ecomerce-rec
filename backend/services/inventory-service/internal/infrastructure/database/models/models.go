package models

import (
	"time"

	"gorm.io/gorm"
)

// Reservation Status Constants
const (
	ReservationStatusPending   = "PENDING"
	ReservationStatusCommitted = "COMMITTED"
	ReservationStatusReleased  = "RELEASED"
	ReservationStatusExpired   = "EXPIRED"
)

// Stock Operation Constants
const (
	StockOperationAdd      = "ADD"
	StockOperationSubtract = "SUBTRACT"
	StockOperationSet      = "SET"
)

// Cache TTL Constants
const (
	StockCacheTTL       = 5 * time.Minute
	ReservationCacheTTL = 30 * time.Minute
)

// Cache Key Prefixes
const (
	CacheKeyStock       = "stock:"
	CacheKeyReservation = "reservation:"
	CacheKeyOrderStock  = "order_stock:"
)

// Pagination Constants
const (
	DefaultPage     = 1
	DefaultPageSize = 20
	MaxPageSize     = 100
	MinPageSize     = 1
)

// Database Connection Pool Constants
const (
	MaxOpenConnections    = 25
	MaxIdleConnections    = 5
	ConnectionMaxLifetime = 5 * time.Minute
)

// Server Port Constants
const (
	DefaultGRPCPort = "4004"
	DefaultHTTPPort = "4002"
)

// Graceful Shutdown Timeout
const (
	GracefulShutdownTimeout = 30 * time.Second
)

// Reservation TTL Constants
const (
	DefaultReservationTTL = 15 * time.Minute
	MinReservationTTL     = 1 * time.Minute
	MaxReservationTTL     = 60 * time.Minute
)

// Low Stock Threshold
const (
	LowStockThreshold = 10
)

// Stock represents inventory stock levels
type Stock struct {
	ID          string `gorm:"type:uuid;primaryKey;default:uuid_generate_v7()"`
	ProductID   string `gorm:"type:uuid;not null;index:idx_product_variant"`
	VariantID   string `gorm:"type:uuid;index:idx_product_variant"`
	Available   int    `gorm:"not null;default:0"`
	Reserved    int    `gorm:"not null;default:0"`
	Total       int    `gorm:"not null;default:0"`
	WarehouseID string `gorm:"type:varchar(36);index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for Stock model
func (Stock) TableName() string {
	return "stocks"
}

// Reservation represents a stock reservation
type Reservation struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v7()"`
	OrderID   string    `gorm:"type:uuid;not null;index"`
	ProductID string    `gorm:"type:uuid;not null;index"`
	VariantID string    `gorm:"type:uuid;index"`
	Quantity  int       `gorm:"not null"`
	Status    string    `gorm:"type:varchar(20);not null;index"`
	ExpiresAt time.Time `gorm:"not null;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for Reservation model
func (Reservation) TableName() string {
	return "reservations"
}

// StockMovement tracks all stock changes for audit purposes
type StockMovement struct {
	ID          string `gorm:"type:uuid;primaryKey;default:uuid_generate_v7()"`
	ProductID   string `gorm:"type:uuid;not null;index"`
	VariantID   string `gorm:"type:uuid;index"`
	WarehouseID string `gorm:"type:uuid;index"`
	Quantity    int    `gorm:"not null"`
	Operation   string `gorm:"type:varchar(20);not null"`
	Reason      string `gorm:"type:text"`
	PreviousQty int    `gorm:"not null"`
	NewQty      int    `gorm:"not null"`
	CreatedBy   string `gorm:"type:varchar(36)"`
	CreatedAt   time.Time
}

// TableName specifies the table name for StockMovement model
func (StockMovement) TableName() string {
	return "stock_movements"
}
