package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/infrastructure/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

const (
	orderCacheKeyPrefix = "order:"
	orderCacheTTL       = 5 * time.Minute
)

// OrderRepository handles order data persistence
type OrderRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

// NewOrderRepository creates a new order repository
func NewOrderRepository(db *gorm.DB, redisClient *redis.Client) *OrderRepository {
	return &OrderRepository{
		db:    db,
		redis: redisClient,
	}
}

// Create creates a new order
func (r *OrderRepository) Create(ctx context.Context, order *domain.Order) error {
	dbOrder := models.FromDomain(order)
	if err := r.db.WithContext(ctx).Create(dbOrder).Error; err != nil {
		return fmt.Errorf("failed to create order: %w", err)
	}

	// Reload to get database-generated IDs
	if err := r.db.WithContext(ctx).Preload("Items").First(dbOrder, "id = ?", dbOrder.ID).Error; err != nil {
		return fmt.Errorf("failed to reload order: %w", err)
	}

	// Update the domain object with generated IDs
	*order = *dbOrder.ToDomain()

	// Cache the order
	r.cacheOrder(ctx, order)
	return nil
}

// GetByID retrieves an order by ID
func (r *OrderRepository) GetByID(ctx context.Context, orderID string) (*domain.Order, error) {
	// Try cache first
	if order, err := r.getOrderFromCache(ctx, orderID); err == nil && order != nil {
		return order, nil
	}

	var dbOrder models.Order
	if err := r.db.WithContext(ctx).Preload("Items").First(&dbOrder, "id = ?", orderID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	order := dbOrder.ToDomain()

	// Cache the order
	r.cacheOrder(ctx, order)

	return order, nil
}

// Update updates an existing order
func (r *OrderRepository) Update(ctx context.Context, order *domain.Order) error {
	dbOrder := models.FromDomain(order)
	if err := r.db.WithContext(ctx).Save(dbOrder).Error; err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	// Invalidate cache
	r.invalidateOrderCache(ctx, order.ID)
	return nil
}

// GetUserOrders retrieves all orders for a user
func (r *OrderRepository) GetUserOrders(ctx context.Context, userID string, limit, offset int) ([]*domain.Order, error) {
	var dbOrders []models.Order
	query := r.db.WithContext(ctx).Preload("Items").Where("user_id = ?", userID)

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.Order("created_at DESC").Find(&dbOrders).Error; err != nil {
		return nil, fmt.Errorf("failed to get user orders: %w", err)
	}

	orders := make([]*domain.Order, len(dbOrders))
	for i, dbOrder := range dbOrders {
		orders[i] = dbOrder.ToDomain()
	}

	return orders, nil
}

// GetOrdersByStatus retrieves orders by status
func (r *OrderRepository) GetOrdersByStatus(ctx context.Context, status domain.OrderStatus, limit, offset int) ([]*domain.Order, error) {
	var dbOrders []models.Order
	query := r.db.WithContext(ctx).Preload("Items").Where("status = ?", string(status))

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.Order("created_at DESC").Find(&dbOrders).Error; err != nil {
		return nil, fmt.Errorf("failed to get orders by status: %w", err)
	}

	orders := make([]*domain.Order, len(dbOrders))
	for i, dbOrder := range dbOrders {
		orders[i] = dbOrder.ToDomain()
	}

	return orders, nil
}

// cacheOrder caches an order in Redis
func (r *OrderRepository) cacheOrder(ctx context.Context, order *domain.Order) {
	if r.redis == nil {
		return
	}

	data, err := json.Marshal(order)
	if err != nil {
		return
	}

	key := orderCacheKeyPrefix + order.ID
	r.redis.Set(ctx, key, data, orderCacheTTL)
}

// getOrderFromCache retrieves an order from Redis cache
func (r *OrderRepository) getOrderFromCache(ctx context.Context, orderID string) (*domain.Order, error) {
	if r.redis == nil {
		return nil, fmt.Errorf("redis not available")
	}

	key := orderCacheKeyPrefix + orderID
	data, err := r.redis.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}

	var order domain.Order
	if err := json.Unmarshal(data, &order); err != nil {
		return nil, err
	}

	return &order, nil
}

// invalidateOrderCache removes an order from cache
func (r *OrderRepository) invalidateOrderCache(ctx context.Context, orderID string) {
	if r.redis == nil {
		return
	}

	key := orderCacheKeyPrefix + orderID
	r.redis.Del(ctx, key)
}
