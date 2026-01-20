package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/internal/infrastructure/database/models"
	"gorm.io/gorm"
)

type cartRepository struct {
	db *gorm.DB
}

// NewCartRepository creates a new cart repository
func NewCartRepository(db *gorm.DB) domain.CartRepository {
	return &cartRepository{db: db}
}

func (r *cartRepository) Create(ctx context.Context, cart *domain.Cart) error {
	dbCart := r.domainToModel(cart)
	if err := r.db.WithContext(ctx).Create(dbCart).Error; err != nil {
		return fmt.Errorf("failed to create cart: %w", err)
	}

	// Reload to get database-generated IDs
	if err := r.db.WithContext(ctx).Preload("Items").First(dbCart, "id = ?", dbCart.ID).Error; err != nil {
		return fmt.Errorf("failed to reload cart: %w", err)
	}

	// Update the domain object with generated IDs
	*cart = *r.modelToDomain(dbCart)
	return nil
}

func (r *cartRepository) Update(ctx context.Context, cart *domain.Cart) error {
	dbCart := r.domainToModel(cart)

	// Update cart fields
	result := r.db.WithContext(ctx).
		Model(&models.Cart{}).
		Where("id = ?", cart.ID).
		Updates(map[string]interface{}{
			"subtotal":     cart.Subtotal,
			"discount":     cart.Discount,
			"total":        cart.Total,
			"coupon_code":  cart.CouponCode,
			"is_abandoned": cart.IsAbandoned,
			"updated_at":   time.Now(),
		})

	if result.Error != nil {
		return fmt.Errorf("failed to update cart: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("cart not found")
	}

	// Update items - delete old items and insert new ones
	if err := r.db.WithContext(ctx).Where("cart_id = ?", cart.ID).Delete(&models.CartItem{}).Error; err != nil {
		return fmt.Errorf("failed to delete old cart items: %w", err)
	}

	if len(dbCart.Items) > 0 {
		if err := r.db.WithContext(ctx).Create(&dbCart.Items).Error; err != nil {
			return fmt.Errorf("failed to create cart items: %w", err)
		}
	}

	return nil
}

func (r *cartRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&models.Cart{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete cart: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("cart not found")
	}
	return nil
}

func (r *cartRepository) GetByID(ctx context.Context, id string) (*domain.Cart, error) {
	var dbCart models.Cart
	err := r.db.WithContext(ctx).
		Preload("Items").
		First(&dbCart, "id = ?", id).Error

	if err == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("cart not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get cart: %w", err)
	}

	return r.modelToDomain(&dbCart), nil
}

func (r *cartRepository) GetByUserID(ctx context.Context, userID string) (*domain.Cart, error) {
	var dbCart models.Cart
	err := r.db.WithContext(ctx).
		Preload("Items").
		Where("user_id = ?", userID).
		First(&dbCart).Error

	if err == gorm.ErrRecordNotFound {
		return nil, nil // Return nil, nil when cart doesn't exist for user
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get cart by user: %w", err)
	}

	return r.modelToDomain(&dbCart), nil
}

func (r *cartRepository) FindAbandonedCarts(ctx context.Context, days int) ([]domain.Cart, error) {
	var dbCarts []models.Cart
	cutoffDate := time.Now().AddDate(0, 0, -days)

	err := r.db.WithContext(ctx).
		Preload("Items").
		Where("is_abandoned = ? AND updated_at < ?", false, cutoffDate).
		Find(&dbCarts).Error

	if err != nil {
		return nil, fmt.Errorf("failed to find abandoned carts: %w", err)
	}

	carts := make([]domain.Cart, len(dbCarts))
	for i, dbCart := range dbCarts {
		carts[i] = *r.modelToDomain(&dbCart)
	}

	return carts, nil
}

func (r *cartRepository) FindExpiredCarts(ctx context.Context, days int) ([]domain.Cart, error) {
	var dbCarts []models.Cart
	cutoffDate := time.Now().AddDate(0, 0, -days)

	err := r.db.WithContext(ctx).
		Preload("Items").
		Where("updated_at < ?", cutoffDate).
		Find(&dbCarts).Error

	if err != nil {
		return nil, fmt.Errorf("failed to find expired carts: %w", err)
	}

	carts := make([]domain.Cart, len(dbCarts))
	for i, dbCart := range dbCarts {
		carts[i] = *r.modelToDomain(&dbCart)
	}

	return carts, nil
}

func (r *cartRepository) DeleteMany(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	result := r.db.WithContext(ctx).Where("id IN ?", ids).Delete(&models.Cart{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete carts: %w", result.Error)
	}

	return nil
}

// Helper methods to convert between domain and model

func (r *cartRepository) domainToModel(cart *domain.Cart) *models.Cart {
	dbCart := &models.Cart{
		ID:          cart.ID,
		UserID:      cart.UserID,
		Subtotal:    cart.Subtotal,
		Discount:    cart.Discount,
		Total:       cart.Total,
		CouponCode:  cart.CouponCode,
		IsAbandoned: cart.IsAbandoned,
		CreatedAt:   cart.CreatedAt,
		UpdatedAt:   cart.UpdatedAt,
	}

	if cart.DeletedAt != nil {
		dbCart.DeletedAt = gorm.DeletedAt{Time: *cart.DeletedAt, Valid: true}
	}

	items := make([]models.CartItem, len(cart.Items))
	for i, item := range cart.Items {
		items[i] = models.CartItem{
			ID:         item.ID,
			CartID:     item.CartID,
			ProductID:  item.ProductID,
			VariantID:  item.VariantID,
			Name:       item.Name,
			Image:      item.Image,
			SKU:        item.SKU,
			Quantity:   item.Quantity,
			UnitPrice:  item.UnitPrice,
			TotalPrice: item.TotalPrice,
			CreatedAt:  item.CreatedAt,
			UpdatedAt:  item.UpdatedAt,
		}
	}
	dbCart.Items = items

	return dbCart
}

func (r *cartRepository) modelToDomain(dbCart *models.Cart) *domain.Cart {
	cart := &domain.Cart{
		ID:          dbCart.ID,
		UserID:      dbCart.UserID,
		Subtotal:    dbCart.Subtotal,
		Discount:    dbCart.Discount,
		Total:       dbCart.Total,
		CouponCode:  dbCart.CouponCode,
		IsAbandoned: dbCart.IsAbandoned,
		CreatedAt:   dbCart.CreatedAt,
		UpdatedAt:   dbCart.UpdatedAt,
	}

	if dbCart.DeletedAt.Valid {
		cart.DeletedAt = &dbCart.DeletedAt.Time
	}

	items := make([]domain.CartItem, len(dbCart.Items))
	for i, dbItem := range dbCart.Items {
		items[i] = domain.CartItem{
			ID:         dbItem.ID,
			CartID:     dbItem.CartID,
			ProductID:  dbItem.ProductID,
			VariantID:  dbItem.VariantID,
			Name:       dbItem.Name,
			Image:      dbItem.Image,
			SKU:        dbItem.SKU,
			Quantity:   dbItem.Quantity,
			UnitPrice:  dbItem.UnitPrice,
			TotalPrice: dbItem.TotalPrice,
			CreatedAt:  dbItem.CreatedAt,
			UpdatedAt:  dbItem.UpdatedAt,
		}
	}
	cart.Items = items

	return cart
}
