package domain

import (
	"context"
)

type ProductRepository interface {
	Create(ctx context.Context, product *Product) error
	Update(ctx context.Context, product *Product) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*Product, error)
	GetBySlug(ctx context.Context, slug string) (*Product, error)
	List(ctx context.Context, filter *ProductFilter, pagination *Pagination) (*PaginatedProducts, error)
	GetByIDs(ctx context.Context, ids []string) ([]Product, error)
	Search(ctx context.Context, query string, filter *ProductFilter, pagination *Pagination) (*PaginatedProducts, error)
	UpdateRating(ctx context.Context, productID string, rating float64, reviewCount int32) error
	GetPriceRange(ctx context.Context, categoryID *string) (*PriceRange, error)
}

type CategoryRepository interface {
	Create(ctx context.Context, category *Category) error
	Update(ctx context.Context, category *Category) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*Category, error)
	GetBySlug(ctx context.Context, slug string) (*Category, error)
	List(ctx context.Context, parentID *string) ([]Category, error)
	GetWithProductCount(ctx context.Context) ([]Category, error)
}
