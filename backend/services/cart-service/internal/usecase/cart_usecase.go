package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/pkg/logger"
	"github.com/google/uuid"
)

// RedisClient defines redis operations needed
type RedisClient interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Del(ctx context.Context, keys ...string) error
}

type cartUseCase struct {
	cartRepo domain.CartRepository
	redis    RedisClient
	logger   logger.Logger
	cacheTTL time.Duration
}

// NewCartUseCase creates a new cart use case
func NewCartUseCase(
	cartRepo domain.CartRepository,
	redis RedisClient,
	logger logger.Logger,
) *cartUseCase {
	return &cartUseCase{
		cartRepo: cartRepo,
		redis:    redis,
		logger:   logger,
		cacheTTL: models.CartCacheTTL,
	}
}

func (uc *cartUseCase) GetCart(ctx context.Context, userID string) (*domain.Cart, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, userID)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var cart domain.Cart
		if err := json.Unmarshal([]byte(cached), &cart); err == nil {
			uc.logger.Debug("Cart retrieved from cache", "userID", userID)
			return &cart, nil
		}
	}

	// Get from database
	cart, err := uc.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		uc.logger.Error("Failed to get cart", "userID", userID, "error", err)
		return nil, fmt.Errorf("get cart: %w", err)
	}

	// Create new cart if doesn't exist
	if cart == nil {
		cart = &domain.Cart{
			ID:     uuid.New().String(),
			UserID: userID,
			Items:  []domain.CartItem{},
		}
		if err := uc.cartRepo.Create(ctx, cart); err != nil {
			return nil, fmt.Errorf("create cart: %w", err)
		}
	}

	// Cache the result
	cartJSON, _ := json.Marshal(cart)
	uc.redis.Set(ctx, cacheKey, cartJSON, uc.cacheTTL)

	return cart, nil
}

func (uc *cartUseCase) AddToCart(ctx context.Context, userID, productID string, variantID *string, name, image, sku string, quantity int32, unitPrice int64) (*domain.Cart, error) {
	cart, err := uc.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	item := domain.CartItem{
		ID:        uuid.New().String(),
		CartID:    cart.ID,
		ProductID: productID,
		VariantID: variantID,
		Name:      name,
		Image:     image,
		SKU:       sku,
		Quantity:  quantity,
		UnitPrice: unitPrice,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	cart.AddOrUpdateItem(item)

	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		uc.logger.Error("Failed to add to cart", "userID", userID, "error", err)
		return nil, fmt.Errorf("update cart: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, userID)
	uc.redis.Del(ctx, cacheKey)

	return cart, nil
}

func (uc *cartUseCase) UpdateItemQuantity(ctx context.Context, userID, itemID string, quantity int32) (*domain.Cart, error) {
	cart, err := uc.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	if !cart.UpdateItemQuantity(itemID, quantity) {
		return nil, fmt.Errorf("item not found in cart")
	}

	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		uc.logger.Error("Failed to update item quantity", "userID", userID, "error", err)
		return nil, fmt.Errorf("update cart: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, userID)
	uc.redis.Del(ctx, cacheKey)

	return cart, nil
}

func (uc *cartUseCase) RemoveItem(ctx context.Context, userID, itemID string) (*domain.Cart, error) {
	cart, err := uc.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	cart.RemoveItem(itemID)

	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		uc.logger.Error("Failed to remove item", "userID", userID, "error", err)
		return nil, fmt.Errorf("update cart: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, userID)
	uc.redis.Del(ctx, cacheKey)

	return cart, nil
}

func (uc *cartUseCase) ClearCart(ctx context.Context, userID string) error {
	cart, err := uc.GetCart(ctx, userID)
	if err != nil {
		return err
	}

	cart.Reset()

	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		uc.logger.Error("Failed to clear cart", "userID", userID, "error", err)
		return fmt.Errorf("update cart: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, userID)
	uc.redis.Del(ctx, cacheKey)

	return nil
}

func (uc *cartUseCase) ApplyCoupon(ctx context.Context, userID, couponCode string, discountAmount int64) (*domain.Cart, error) {
	cart, err := uc.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	cart.CouponCode = &couponCode
	cart.ApplyDiscount(discountAmount)

	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		uc.logger.Error("Failed to apply coupon", "userID", userID, "error", err)
		return nil, fmt.Errorf("update cart: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, userID)
	uc.redis.Del(ctx, cacheKey)

	return cart, nil
}

func (uc *cartUseCase) RemoveCoupon(ctx context.Context, userID string) (*domain.Cart, error) {
	cart, err := uc.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	cart.RemoveCoupon()

	if err := uc.cartRepo.Update(ctx, cart); err != nil {
		uc.logger.Error("Failed to remove coupon", "userID", userID, "error", err)
		return nil, fmt.Errorf("update cart: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, userID)
	uc.redis.Del(ctx, cacheKey)

	return cart, nil
}

func (uc *cartUseCase) MarkAbandonedCarts(ctx context.Context, days int) error {
	carts, err := uc.cartRepo.FindAbandonedCarts(ctx, days)
	if err != nil {
		uc.logger.Error("Failed to find abandoned carts", "error", err)
		return fmt.Errorf("find abandoned carts: %w", err)
	}

	for _, cart := range carts {
		cart.MarkAsAbandoned()
		if err := uc.cartRepo.Update(ctx, &cart); err != nil {
			uc.logger.Error("Failed to mark cart as abandoned", "cartID", cart.ID, "error", err)
			continue
		}
		// Invalidate cache
		cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, cart.UserID)
		uc.redis.Del(ctx, cacheKey)
	}

	uc.logger.Info("Marked abandoned carts", "count", len(carts))
	return nil
}

func (uc *cartUseCase) CleanExpiredCarts(ctx context.Context, days int) error {
	carts, err := uc.cartRepo.FindExpiredCarts(ctx, days)
	if err != nil {
		uc.logger.Error("Failed to find expired carts", "error", err)
		return fmt.Errorf("find expired carts: %w", err)
	}

	ids := make([]string, len(carts))
	for i, cart := range carts {
		ids[i] = cart.ID
	}

	if len(ids) > 0 {
		if err := uc.cartRepo.DeleteMany(ctx, ids); err != nil {
			uc.logger.Error("Failed to delete expired carts", "error", err)
			return fmt.Errorf("delete expired carts: %w", err)
		}

		// Invalidate cache for all deleted carts
		for _, cart := range carts {
			cacheKey := fmt.Sprintf("%s%s", models.CacheKeyUserCart, cart.UserID)
			uc.redis.Del(ctx, cacheKey)
		}
	}

	uc.logger.Info("Cleaned expired carts", "count", len(ids))
	return nil
}
