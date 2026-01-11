package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	// Default ports
	DefaultHTTPPort = "3003"
	DefaultGRPCPort = "50053"

	// Cache keys
	CacheKeyCart     = "cart:"
	CacheKeyUserCart = "user_cart:"

	// Cache TTL
	CartCacheTTL = 5 * time.Minute

	// Timeouts
	GracefulShutdownTimeout = 10 * time.Second
	QueryTimeout            = 5 * time.Second
)

// Cart database model
type Cart struct {
	ID          string         `gorm:"type:uuid;primaryKey"`
	UserID      string         `gorm:"type:varchar(255);not null;index"`
	Subtotal    int64          `gorm:"type:bigint;not null;default:0"`
	Discount    int64          `gorm:"type:bigint;not null;default:0"`
	Total       int64          `gorm:"type:bigint;not null;default:0"`
	CouponCode  *string        `gorm:"type:varchar(100)"`
	IsAbandoned bool           `gorm:"default:false"`
	CreatedAt   time.Time      `gorm:"autoCreateTime"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
	Items       []CartItem     `gorm:"foreignKey:CartID;constraint:OnDelete:CASCADE"`
}

// TableName overrides the table name
func (Cart) TableName() string {
	return "carts"
}

// CartItem database model
type CartItem struct {
	ID         string         `gorm:"type:uuid;primaryKey"`
	CartID     string         `gorm:"type:uuid;not null;index"`
	ProductID  string         `gorm:"type:varchar(255);not null"`
	VariantID  *string        `gorm:"type:varchar(255)"`
	Name       string         `gorm:"type:varchar(500);not null"`
	Image      string         `gorm:"type:text"`
	SKU        string         `gorm:"type:varchar(100);not null"`
	Quantity   int32          `gorm:"type:int;not null;default:1"`
	UnitPrice  int64          `gorm:"type:bigint;not null"`
	TotalPrice int64          `gorm:"type:bigint;not null"`
	CreatedAt  time.Time      `gorm:"autoCreateTime"`
	UpdatedAt  time.Time      `gorm:"autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `gorm:"index"`
}

// TableName overrides the table name
func (CartItem) TableName() string {
	return "cart_items"
}
