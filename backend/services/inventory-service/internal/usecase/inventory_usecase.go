package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/redis"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/pkg/logger"
)

// InventoryUseCase handles inventory business logic
type InventoryUseCase struct {
	stockRepo       domain.StockRepository
	reservationRepo domain.ReservationRepository
	cache           *redis.Client
	logger          logger.Logger
}

// NewInventoryUseCase creates a new inventory use case
func NewInventoryUseCase(
	stockRepo domain.StockRepository,
	reservationRepo domain.ReservationRepository,
	cache *redis.Client,
	logger logger.Logger,
) *InventoryUseCase {
	return &InventoryUseCase{
		stockRepo:       stockRepo,
		reservationRepo: reservationRepo,
		cache:           cache,
		logger:          logger,
	}
}

// CheckStock checks if stock is available for a product
func (uc *InventoryUseCase) CheckStock(ctx context.Context, productID, variantID string, quantity int) (bool, int, error) {
	uc.logger.Info("Checking stock availability", "product_id", productID, "variant_id", variantID, "quantity", quantity)

	// Try cache first
	cacheKey := fmt.Sprintf("%s%s:%s", models.CacheKeyStock, productID, variantID)
	if cached, err := uc.cache.Get(ctx, cacheKey); err == nil {
		var stock domain.Stock
		if err := json.Unmarshal([]byte(cached), &stock); err == nil {
			available := stock.Available >= quantity
			return available, stock.Available, nil
		}
	}

	// Get from database
	available, availableQty, err := uc.stockRepo.CheckAvailability(productID, variantID, quantity)
	if err != nil {
		return false, 0, fmt.Errorf("failed to check availability: %w", err)
	}

	return available, availableQty, nil
}

// ReserveStock reserves stock for an order
func (uc *InventoryUseCase) ReserveStock(ctx context.Context, orderID string, items []domain.ReservationItem, ttlSeconds int) (string, []domain.ReservationResult, error) {
	uc.logger.Info("Reserving stock for order", "order_id", orderID, "items_count", len(items))

	// Validate TTL
	if ttlSeconds <= 0 {
		ttlSeconds = int(models.DefaultReservationTTL.Seconds())
	}
	if ttlSeconds < int(models.MinReservationTTL.Seconds()) {
		ttlSeconds = int(models.MinReservationTTL.Seconds())
	}
	if ttlSeconds > int(models.MaxReservationTTL.Seconds()) {
		ttlSeconds = int(models.MaxReservationTTL.Seconds())
	}

	// Reserve stock in repository (handles transaction)
	reservationID, results, err := uc.reservationRepo.ReserveStock(orderID, items, ttlSeconds)
	if err != nil {
		uc.logger.Error("Failed to reserve stock", "order_id", orderID, "error", err)
		return "", results, fmt.Errorf("failed to reserve stock: %w", err)
	}

	// Invalidate cache for affected products
	for _, item := range items {
		cacheKey := fmt.Sprintf("%s%s:%s", models.CacheKeyStock, item.ProductID, item.VariantID)
		_ = uc.cache.Delete(ctx, cacheKey)
	}

	uc.logger.Info("Stock reserved successfully", "reservation_id", reservationID, "order_id", orderID)
	return reservationID, results, nil
}

// ReleaseReservation releases a stock reservation
func (uc *InventoryUseCase) ReleaseReservation(ctx context.Context, reservationID, orderID string) error {
	uc.logger.Info("Releasing reservation", "reservation_id", reservationID, "order_id", orderID)

	// Use orderID as identifier if reservationID is empty
	identifier := reservationID
	if identifier == "" {
		identifier = orderID
	}

	// Get reservations to invalidate cache
	reservations, err := uc.reservationRepo.GetByOrderID(identifier)
	if err != nil {
		return fmt.Errorf("failed to get reservations: %w", err)
	}

	// Release reservation
	if err := uc.reservationRepo.ReleaseReservation(identifier); err != nil {
		uc.logger.Error("Failed to release reservation", "identifier", identifier, "error", err)
		return fmt.Errorf("failed to release reservation: %w", err)
	}

	// Invalidate cache
	for _, reservation := range reservations {
		cacheKey := fmt.Sprintf("%s%s:%s", models.CacheKeyStock, reservation.ProductID, reservation.VariantID)
		_ = uc.cache.Delete(ctx, cacheKey)
	}

	uc.logger.Info("Reservation released successfully", "identifier", identifier)
	return nil
}

// CommitReservation commits a reservation (finalizes the purchase)
func (uc *InventoryUseCase) CommitReservation(ctx context.Context, reservationID, orderID string) error {
	uc.logger.Info("Committing reservation", "reservation_id", reservationID, "order_id", orderID)

	// Use orderID as identifier if reservationID is empty
	identifier := reservationID
	if identifier == "" {
		identifier = orderID
	}

	// Get reservations to invalidate cache
	reservations, err := uc.reservationRepo.GetByOrderID(identifier)
	if err != nil {
		return fmt.Errorf("failed to get reservations: %w", err)
	}

	// Commit reservation
	if err := uc.reservationRepo.CommitReservation(identifier); err != nil {
		uc.logger.Error("Failed to commit reservation", "identifier", identifier, "error", err)
		return fmt.Errorf("failed to commit reservation: %w", err)
	}

	// Invalidate cache
	for _, reservation := range reservations {
		cacheKey := fmt.Sprintf("%s%s:%s", models.CacheKeyStock, reservation.ProductID, reservation.VariantID)
		_ = uc.cache.Delete(ctx, cacheKey)
	}

	uc.logger.Info("Reservation committed successfully", "identifier", identifier)
	return nil
}

// UpdateStock updates stock levels (admin operation)
func (uc *InventoryUseCase) UpdateStock(ctx context.Context, productID, variantID string, quantity int, operation, reason string) (*domain.Stock, error) {
	uc.logger.Info("Updating stock", "product_id", productID, "variant_id", variantID, "quantity", quantity, "operation", operation)

	// Validate operation
	validOps := map[string]bool{
		models.StockOperationAdd:      true,
		models.StockOperationSubtract: true,
		models.StockOperationSet:      true,
	}
	if !validOps[operation] {
		return nil, fmt.Errorf("invalid operation: %s", operation)
	}

	// Update stock
	stock, err := uc.stockRepo.UpdateQuantity(productID, variantID, quantity, operation)
	if err != nil {
		uc.logger.Error("Failed to update stock", "product_id", productID, "error", err)
		return nil, fmt.Errorf("failed to update stock: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%s%s:%s", models.CacheKeyStock, productID, variantID)
	_ = uc.cache.Delete(ctx, cacheKey)

	// Cache updated stock
	if stockJSON, err := json.Marshal(stock); err == nil {
		_ = uc.cache.Set(ctx, cacheKey, stockJSON, models.StockCacheTTL)
	}

	uc.logger.Info("Stock updated successfully", "product_id", productID, "new_total", stock.Total)
	return stock, nil
}

// GetStock retrieves stock information
func (uc *InventoryUseCase) GetStock(ctx context.Context, productID, variantID string) (*domain.Stock, error) {
	uc.logger.Info("Getting stock", "product_id", productID, "variant_id", variantID)

	// Try cache first
	cacheKey := fmt.Sprintf("%s%s:%s", models.CacheKeyStock, productID, variantID)
	if cached, err := uc.cache.Get(ctx, cacheKey); err == nil {
		var stock domain.Stock
		if err := json.Unmarshal([]byte(cached), &stock); err == nil {
			return &stock, nil
		}
	}

	// Get from database
	stock, err := uc.stockRepo.GetByProductAndVariant(productID, variantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get stock: %w", err)
	}

	// Cache result
	if stockJSON, err := json.Marshal(stock); err == nil {
		_ = uc.cache.Set(ctx, cacheKey, stockJSON, models.StockCacheTTL)
	}

	return stock, nil
}

// BulkCheckStock checks availability for multiple items
func (uc *InventoryUseCase) BulkCheckStock(ctx context.Context, items []domain.ReservationItem) (map[string]bool, error) {
	uc.logger.Info("Bulk checking stock", "items_count", len(items))

	results, err := uc.stockRepo.BulkCheckAvailability(items)
	if err != nil {
		return nil, fmt.Errorf("failed to bulk check stock: %w", err)
	}

	return results, nil
}

// ExpireOldReservations expires reservations past their TTL
func (uc *InventoryUseCase) ExpireOldReservations(ctx context.Context) error {
	uc.logger.Info("Expiring old reservations")

	// Get expired reservations before expiring them
	expiredReservations, err := uc.reservationRepo.GetExpiredReservations()
	if err != nil {
		return fmt.Errorf("failed to get expired reservations: %w", err)
	}

	if len(expiredReservations) == 0 {
		return nil
	}

	// Expire reservations
	if err := uc.reservationRepo.ExpireReservations(); err != nil {
		uc.logger.Error("Failed to expire reservations", "error", err)
		return fmt.Errorf("failed to expire reservations: %w", err)
	}

	// Invalidate cache for affected products
	for _, reservation := range expiredReservations {
		cacheKey := fmt.Sprintf("%s%s:%s", models.CacheKeyStock, reservation.ProductID, reservation.VariantID)
		_ = uc.cache.Delete(ctx, cacheKey)
	}

	uc.logger.Info("Expired old reservations", "count", len(expiredReservations))
	return nil
}

// StartReservationExpiryJob starts a background job to expire reservations
func (uc *InventoryUseCase) StartReservationExpiryJob(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for {
			select {
			case <-ticker.C:
				if err := uc.ExpireOldReservations(ctx); err != nil {
					uc.logger.Error("Failed to expire reservations in background job", "error", err)
				}
			case <-ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()
	uc.logger.Info("Started reservation expiry background job")
}
