package domain

import (
	"time"
)

type Product struct {
	ID              string
	Name            string
	Slug            string
	Description     string
	LongDescription string
	Price           int64
	OriginalPrice   int64
	CategoryID      string
	CategoryName    string
	Images          []string
	Variants        []ProductVariant
	Specifications  map[string]string
	Tags            []string
	Rating          float64
	ReviewCount     int32
	IsFeatured      bool
	IsNew           bool
	IsOnSale        bool
	SKU             string
	Status          ProductStatus
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type ProductVariant struct {
	ID         string
	ProductID  string
	Name       string
	SKU        string
	Price      int64
	Stock      int32
	Attributes map[string]string
}

type ProductStatus string

const (
	ProductStatusDraft        ProductStatus = "DRAFT"
	ProductStatusActive       ProductStatus = "ACTIVE"
	ProductStatusInactive     ProductStatus = "INACTIVE"
	ProductStatusOutOfStock   ProductStatus = "OUT_OF_STOCK"
	ProductStatusDiscontinued ProductStatus = "DISCONTINUED"
)

type Category struct {
	ID           string
	Name         string
	Slug         string
	Description  string
	ParentID     *string
	Image        string
	ProductCount int32
	SortOrder    int32
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type ProductFilter struct {
	CategoryID   *string
	MinPrice     *int64
	MaxPrice     *int64
	MinRating    *float64
	Tags         []string
	InStockOnly  bool
	FeaturedOnly bool
	OnSaleOnly   bool
	Status       *ProductStatus
	SearchQuery  *string
}

type Pagination struct {
	Page  int32
	Limit int32
}

type PaginatedProducts struct {
	Products   []Product
	Total      int64
	Page       int32
	Limit      int32
	TotalPages int32
}

type PriceRange struct {
	MinPrice     int64
	MaxPrice     int64
	AvgPrice     float64
	ProductCount int32
}
