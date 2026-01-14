package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

// Product status constants
const (
	ProductStatusDraft        = "DRAFT"
	ProductStatusActive       = "ACTIVE"
	ProductStatusInactive     = "INACTIVE"
	ProductStatusOutOfStock   = "OUT_OF_STOCK"
	ProductStatusDiscontinued = "DISCONTINUED"
)

// Default values
const (
	DefaultRating      = 0.0
	DefaultReviewCount = 0
	DefaultSortOrder   = 0
	MinRating          = 0.0
	MaxRating          = 5.0
)

// Cache TTL constants
const (
	ProductCacheTTL        = 1 * time.Hour
	CategoryCacheTTL       = 2 * time.Hour
	CategoryListCacheTTL   = 30 * time.Minute
	CategoryCountsCacheTTL = 30 * time.Minute
)

// Pagination constants
const (
	DefaultPage     = 1
	DefaultPageSize = 20
	MaxPageSize     = 100
	MinPageSize     = 1
)

// Cache key prefixes
const (
	CacheKeyProduct          = "product:"
	CacheKeyProductSlug      = "product:slug:"
	CacheKeyCategory         = "category:"
	CacheKeyCategorySlug     = "category:slug:"
	CacheKeyCategoriesAll    = "categories:all"
	CacheKeyCategoriesParent = "categories:parent:"
	CacheKeyCategoriesCount  = "categories:with_count"
)

// Database connection pool constants
const (
	MaxOpenConnections    = 25
	MaxIdleConnections    = 5
	ConnectionMaxLifetime = 5 * time.Minute
)

// gRPC and HTTP server constants
const (
	GracefulShutdownTimeout = 30 * time.Second
	DefaultGRPCPort         = "4003"
	DefaultHTTPPort         = "4001"
)

// Product represents the products table
type Product struct {
	ID              string            `gorm:"type:varchar(36);primaryKey"`
	Name            string            `gorm:"type:varchar(255);not null"`
	Slug            string            `gorm:"type:varchar(255);uniqueIndex;not null"`
	Description     string            `gorm:"type:text"`
	LongDescription string            `gorm:"type:text"`
	Price           int64             `gorm:"not null"` // in cents
	OriginalPrice   int64             // in cents
	CategoryID      string            `gorm:"type:varchar(36);not null;index"`
	Category        *Category         `gorm:"foreignKey:CategoryID"`
	Images          pq.StringArray    `gorm:"type:text[]"`
	Specifications  map[string]string `gorm:"type:jsonb;serializer:json"`
	Tags            pq.StringArray    `gorm:"type:text[]"`
	Rating          float64           `gorm:"type:decimal(3,2);default:0"`
	ReviewCount     int32             `gorm:"default:0"`
	IsFeatured      bool              `gorm:"default:false;index"`
	IsNew           bool              `gorm:"default:false"`
	IsOnSale        bool              `gorm:"default:false;index"`
	SKU             string            `gorm:"type:varchar(100);uniqueIndex"`
	Status          string            `gorm:"type:varchar(20);default:ACTIVE;index"`
	Variants        []ProductVariant  `gorm:"foreignKey:ProductID"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for Product
func (Product) TableName() string {
	return "products"
}

// ProductVariant represents the product_variants table
type ProductVariant struct {
	ID         string            `gorm:"type:varchar(36);primaryKey"`
	ProductID  string            `gorm:"type:varchar(36);not null;index"`
	Name       string            `gorm:"type:varchar(255);not null"`
	SKU        string            `gorm:"type:varchar(100);uniqueIndex;not null"`
	Price      int64             `gorm:"not null"`
	Stock      int32             `gorm:"default:0"`
	Attributes map[string]string `gorm:"type:jsonb;serializer:json"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// TableName specifies the table name for ProductVariant
func (ProductVariant) TableName() string {
	return "product_variants"
}

// Category represents the categories table
type Category struct {
	ID           string    `gorm:"type:varchar(36);primaryKey"`
	Name         string    `gorm:"type:varchar(255);not null"`
	Slug         string    `gorm:"type:varchar(255);uniqueIndex;not null"`
	Description  string    `gorm:"type:text"`
	ParentID     *string   `gorm:"type:varchar(36);index"`
	Parent       *Category `gorm:"foreignKey:ParentID"`
	Image        string    `gorm:"type:text"`
	ProductCount int32     `gorm:"-"` // Not a database column, computed
	SortOrder    int32     `gorm:"default:0"`
	IsActive     bool      `gorm:"default:true"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for Category
func (Category) TableName() string {
	return "categories"
}
