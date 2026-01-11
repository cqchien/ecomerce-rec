package domain

import "context"

// CartRepository defines the interface for cart data access
type CartRepository interface {
	Create(ctx context.Context, cart *Cart) error
	Update(ctx context.Context, cart *Cart) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*Cart, error)
	GetByUserID(ctx context.Context, userID string) (*Cart, error)
	FindAbandonedCarts(ctx context.Context, days int) ([]Cart, error)
	FindExpiredCarts(ctx context.Context, days int) ([]Cart, error)
	DeleteMany(ctx context.Context, ids []string) error
}

// CartItemRepository defines the interface for cart item data access
type CartItemRepository interface {
	Create(ctx context.Context, item *CartItem) error
	Update(ctx context.Context, item *CartItem) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*CartItem, error)
	GetByCartID(ctx context.Context, cartID string) ([]CartItem, error)
	DeleteByCartID(ctx context.Context, cartID string) error
}
