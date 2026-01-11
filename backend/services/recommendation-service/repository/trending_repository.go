package repository

import (
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/models"
	"gorm.io/gorm"
)

type TrendingRepository struct {
	db *gorm.DB
}

func NewTrendingRepository(db *gorm.DB) *TrendingRepository {
	return &TrendingRepository{db: db}
}

// CreateTrendingProduct creates a new trending product record
func (r *TrendingRepository) CreateTrendingProduct(trending *models.TrendingProduct) error {
	return r.db.Create(trending).Error
}

// GetTrendingProduct retrieves a trending product by product ID
func (r *TrendingRepository) GetTrendingProduct(productID string) (*models.TrendingProduct, error) {
	var trending models.TrendingProduct
	err := r.db.Where("product_id = ?", productID).First(&trending).Error

	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &trending, err
}

// GetTrendingProducts retrieves top trending products
func (r *TrendingRepository) GetTrendingProducts(limit int, minScore float64) ([]models.TrendingProduct, error) {
	var products []models.TrendingProduct

	query := r.db.Where("trending_score >= ?", minScore).
		Order("trending_score DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&products).Error
	return products, err
}

// UpdateTrendingProduct updates an existing trending product record
func (r *TrendingRepository) UpdateTrendingProduct(trending *models.TrendingProduct) error {
	return r.db.Save(trending).Error
}

// UpsertTrendingProduct creates or updates a trending product record
func (r *TrendingRepository) UpsertTrendingProduct(trending *models.TrendingProduct) error {
	existing, err := r.GetTrendingProduct(trending.ProductID)
	if err != nil {
		return err
	}

	if existing != nil {
		trending.ID = existing.ID
		trending.CreatedAt = existing.CreatedAt
		return r.UpdateTrendingProduct(trending)
	}

	return r.CreateTrendingProduct(trending)
}

// BatchUpsertTrendingProducts creates or updates multiple trending product records
func (r *TrendingRepository) BatchUpsertTrendingProducts(products []models.TrendingProduct) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for i := range products {
			var existing models.TrendingProduct
			err := tx.Where("product_id = ?", products[i].ProductID).
				First(&existing).Error

			if err == nil {
				// Update existing record
				products[i].ID = existing.ID
				products[i].CreatedAt = existing.CreatedAt
				if err := tx.Save(&products[i]).Error; err != nil {
					return err
				}
			} else if err == gorm.ErrRecordNotFound {
				// Create new record
				if err := tx.Create(&products[i]).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
		return nil
	})
}

// DeleteTrendingProduct soft deletes a trending product record
func (r *TrendingRepository) DeleteTrendingProduct(id uint) error {
	return r.db.Delete(&models.TrendingProduct{}, id).Error
}

// DeleteProductTrending deletes trending record for a specific product
func (r *TrendingRepository) DeleteProductTrending(productID string) error {
	return r.db.Where("product_id = ?", productID).Delete(&models.TrendingProduct{}).Error
}

// GetRecentTrendingProducts retrieves trending products calculated recently
func (r *TrendingRepository) GetRecentTrendingProducts(since time.Time, limit int) ([]models.TrendingProduct, error) {
	var products []models.TrendingProduct

	query := r.db.Where("calculated_at >= ?", since).
		Order("trending_score DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&products).Error
	return products, err
}

// GetTrendingProductsByCategory retrieves trending products (would need category field)
// This is a placeholder - actual implementation would require joining with product service
func (r *TrendingRepository) GetTrendingProductsByScore(minScore, maxScore float64, limit int) ([]models.TrendingProduct, error) {
	var products []models.TrendingProduct

	query := r.db.Where("trending_score >= ? AND trending_score <= ?", minScore, maxScore).
		Order("trending_score DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&products).Error
	return products, err
}

// GetTrendingProductCount returns the count of trending products
func (r *TrendingRepository) GetTrendingProductCount(minScore float64) (int64, error) {
	var count int64
	err := r.db.Model(&models.TrendingProduct{}).
		Where("trending_score >= ?", minScore).
		Count(&count).Error
	return count, err
}

// GetAllTrendingProducts retrieves all trending products with pagination
func (r *TrendingRepository) GetAllTrendingProducts(page, pageSize int) ([]models.TrendingProduct, error) {
	var products []models.TrendingProduct
	offset := (page - 1) * pageSize

	err := r.db.Order("trending_score DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&products).Error

	return products, err
}

// DeleteOldTrendingRecords removes trending records older than a specified date
func (r *TrendingRepository) DeleteOldTrendingRecords(before time.Time) (int64, error) {
	result := r.db.Where("calculated_at < ?", before).Delete(&models.TrendingProduct{})
	return result.RowsAffected, result.Error
}

// GetTopProductsByViews retrieves top products by view count
func (r *TrendingRepository) GetTopProductsByViews(limit int) ([]models.TrendingProduct, error) {
	var products []models.TrendingProduct

	query := r.db.Order("view_count DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&products).Error
	return products, err
}

// GetTopProductsByPurchases retrieves top products by purchase count
func (r *TrendingRepository) GetTopProductsByPurchases(limit int) ([]models.TrendingProduct, error) {
	var products []models.TrendingProduct

	query := r.db.Order("purchase_count DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&products).Error
	return products, err
}

// GetProductStats retrieves interaction stats for a product
func (r *TrendingRepository) GetProductStats(productID string) (*models.TrendingProduct, error) {
	return r.GetTrendingProduct(productID)
}

// IncrementProductView increments view count for a product
func (r *TrendingRepository) IncrementProductView(productID string) error {
	return r.db.Model(&models.TrendingProduct{}).
		Where("product_id = ?", productID).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error
}

// IncrementProductCart increments cart count for a product
func (r *TrendingRepository) IncrementProductCart(productID string) error {
	return r.db.Model(&models.TrendingProduct{}).
		Where("product_id = ?", productID).
		UpdateColumn("cart_count", gorm.Expr("cart_count + ?", 1)).Error
}

// IncrementProductPurchase increments purchase count for a product
func (r *TrendingRepository) IncrementProductPurchase(productID string) error {
	return r.db.Model(&models.TrendingProduct{}).
		Where("product_id = ?", productID).
		UpdateColumn("purchase_count", gorm.Expr("purchase_count + ?", 1)).Error
}

// IncrementProductWishlist increments wishlist count for a product
func (r *TrendingRepository) IncrementProductWishlist(productID string) error {
	return r.db.Model(&models.TrendingProduct{}).
		Where("product_id = ?", productID).
		UpdateColumn("wishlist_count", gorm.Expr("wishlist_count + ?", 1)).Error
}
