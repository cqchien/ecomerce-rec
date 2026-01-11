package postgres

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database/models"
)

type stockRepository struct {
	db *gorm.DB
}

// NewStockRepository creates a new stock repository
func NewStockRepository(db *gorm.DB) domain.StockRepository {
	return &stockRepository{db: db}
}

// Create creates a new stock record
func (r *stockRepository) Create(stock *domain.Stock) error {
	dbStock := domainToStockModel(stock)
	if dbStock.ID == "" {
		dbStock.ID = uuid.New().String()
	}
	dbStock.CreatedAt = time.Now()
	dbStock.UpdatedAt = time.Now()

	if err := r.db.Create(dbStock).Error; err != nil {
		return fmt.Errorf("failed to create stock: %w", err)
	}

	stock.ID = dbStock.ID
	return nil
}

// GetByID retrieves stock by ID
func (r *stockRepository) GetByID(id string) (*domain.Stock, error) {
	var dbStock models.Stock
	if err := r.db.First(&dbStock, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("stock not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get stock: %w", err)
	}

	return stockModelToDomain(&dbStock), nil
}

// GetByProductAndVariant retrieves stock by product and variant
func (r *stockRepository) GetByProductAndVariant(productID, variantID string) (*domain.Stock, error) {
	var dbStock models.Stock

	query := r.db.Where("product_id = ?", productID)
	if variantID != "" {
		query = query.Where("variant_id = ?", variantID)
	} else {
		query = query.Where("variant_id IS NULL OR variant_id = ''")
	}

	if err := query.First(&dbStock).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("stock not found for product: %s, variant: %s", productID, variantID)
		}
		return nil, fmt.Errorf("failed to get stock: %w", err)
	}

	return stockModelToDomain(&dbStock), nil
}

// Update updates stock information
func (r *stockRepository) Update(stock *domain.Stock) error {
	dbStock := domainToStockModel(stock)
	dbStock.UpdatedAt = time.Now()

	result := r.db.Model(&models.Stock{}).
		Where("id = ?", stock.ID).
		Updates(map[string]interface{}{
			"available":    dbStock.Available,
			"reserved":     dbStock.Reserved,
			"total":        dbStock.Total,
			"warehouse_id": dbStock.WarehouseID,
			"updated_at":   dbStock.UpdatedAt,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to update stock: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("stock not found: %s", stock.ID)
	}

	return nil
}

// Delete soft deletes stock
func (r *stockRepository) Delete(id string) error {
	result := r.db.Delete(&models.Stock{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete stock: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("stock not found: %s", id)
	}

	return nil
}

// UpdateQuantity updates stock quantity with operation
func (r *stockRepository) UpdateQuantity(productID, variantID string, quantity int, operation string) (*domain.Stock, error) {
	// Start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Lock the row for update
	var dbStock models.Stock
	query := tx.Clauses().Where("product_id = ?", productID)
	if variantID != "" {
		query = query.Where("variant_id = ?", variantID)
	} else {
		query = query.Where("variant_id IS NULL OR variant_id = ''")
	}

	if err := query.First(&dbStock).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("stock not found for product: %s, variant: %s", productID, variantID)
		}
		return nil, fmt.Errorf("failed to get stock: %w", err)
	}

	previousQty := dbStock.Total

	// Apply operation
	switch operation {
	case models.StockOperationAdd:
		dbStock.Total += quantity
		dbStock.Available += quantity
	case models.StockOperationSubtract:
		if dbStock.Available < quantity {
			tx.Rollback()
			return nil, fmt.Errorf("insufficient stock: available=%d, requested=%d", dbStock.Available, quantity)
		}
		dbStock.Total -= quantity
		dbStock.Available -= quantity
	case models.StockOperationSet:
		dbStock.Total = quantity
		dbStock.Available = quantity - dbStock.Reserved
	default:
		tx.Rollback()
		return nil, fmt.Errorf("invalid operation: %s", operation)
	}

	// Ensure non-negative values
	if dbStock.Total < 0 {
		dbStock.Total = 0
	}
	if dbStock.Available < 0 {
		dbStock.Available = 0
	}

	dbStock.UpdatedAt = time.Now()

	// Update stock
	if err := tx.Save(&dbStock).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update stock: %w", err)
	}

	// Create movement record
	movement := &models.StockMovement{
		ID:          uuid.New().String(),
		ProductID:   productID,
		VariantID:   variantID,
		WarehouseID: dbStock.WarehouseID,
		Quantity:    quantity,
		Operation:   operation,
		PreviousQty: previousQty,
		NewQty:      dbStock.Total,
		CreatedAt:   time.Now(),
	}

	if err := tx.Create(movement).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create movement: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return stockModelToDomain(&dbStock), nil
}

// CheckAvailability checks if stock is available
func (r *stockRepository) CheckAvailability(productID, variantID string, quantity int) (bool, int, error) {
	var dbStock models.Stock

	query := r.db.Where("product_id = ?", productID)
	if variantID != "" {
		query = query.Where("variant_id = ?", variantID)
	} else {
		query = query.Where("variant_id IS NULL OR variant_id = ''")
	}

	if err := query.First(&dbStock).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, 0, nil
		}
		return false, 0, fmt.Errorf("failed to check availability: %w", err)
	}

	available := dbStock.Available >= quantity
	return available, dbStock.Available, nil
}

// BulkCheckAvailability checks availability for multiple items
func (r *stockRepository) BulkCheckAvailability(items []domain.ReservationItem) (map[string]bool, error) {
	results := make(map[string]bool)

	for _, item := range items {
		key := fmt.Sprintf("%s:%s", item.ProductID, item.VariantID)
		available, _, err := r.CheckAvailability(item.ProductID, item.VariantID, item.Quantity)
		if err != nil {
			return nil, fmt.Errorf("failed to check availability for %s: %w", key, err)
		}
		results[key] = available
	}

	return results, nil
}

// CreateMovement creates a stock movement audit record
func (r *stockRepository) CreateMovement(movement *domain.StockMovement) error {
	dbMovement := &models.StockMovement{
		ID:          uuid.New().String(),
		ProductID:   movement.ProductID,
		VariantID:   movement.VariantID,
		WarehouseID: movement.WarehouseID,
		Quantity:    movement.Quantity,
		Operation:   movement.Operation,
		Reason:      movement.Reason,
		PreviousQty: movement.PreviousQty,
		NewQty:      movement.NewQty,
		CreatedBy:   movement.CreatedBy,
		CreatedAt:   time.Now(),
	}

	if err := r.db.Create(dbMovement).Error; err != nil {
		return fmt.Errorf("failed to create movement: %w", err)
	}

	movement.ID = dbMovement.ID
	return nil
}

// GetMovements retrieves stock movement history
func (r *stockRepository) GetMovements(productID, variantID string, limit int) ([]domain.StockMovement, error) {
	var dbMovements []models.StockMovement

	query := r.db.Where("product_id = ?", productID)
	if variantID != "" {
		query = query.Where("variant_id = ?", variantID)
	}

	if err := query.Order("created_at DESC").Limit(limit).Find(&dbMovements).Error; err != nil {
		return nil, fmt.Errorf("failed to get movements: %w", err)
	}

	movements := make([]domain.StockMovement, len(dbMovements))
	for i, dbMovement := range dbMovements {
		movements[i] = domain.StockMovement{
			ID:          dbMovement.ID,
			ProductID:   dbMovement.ProductID,
			VariantID:   dbMovement.VariantID,
			WarehouseID: dbMovement.WarehouseID,
			Quantity:    dbMovement.Quantity,
			Operation:   dbMovement.Operation,
			Reason:      dbMovement.Reason,
			PreviousQty: dbMovement.PreviousQty,
			NewQty:      dbMovement.NewQty,
			CreatedBy:   dbMovement.CreatedBy,
			CreatedAt:   dbMovement.CreatedAt,
		}
	}

	return movements, nil
}

// Helper functions to convert between domain and model

func domainToStockModel(stock *domain.Stock) *models.Stock {
	return &models.Stock{
		ID:          stock.ID,
		ProductID:   stock.ProductID,
		VariantID:   stock.VariantID,
		Available:   stock.Available,
		Reserved:    stock.Reserved,
		Total:       stock.Total,
		WarehouseID: stock.WarehouseID,
		UpdatedAt:   stock.UpdatedAt,
	}
}

func stockModelToDomain(stock *models.Stock) *domain.Stock {
	return &domain.Stock{
		ID:          stock.ID,
		ProductID:   stock.ProductID,
		VariantID:   stock.VariantID,
		Available:   stock.Available,
		Reserved:    stock.Reserved,
		Total:       stock.Total,
		WarehouseID: stock.WarehouseID,
		UpdatedAt:   stock.UpdatedAt,
	}
}
