package repository

import (
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/models"
	"gorm.io/gorm"
)

type SimilarityRepository struct {
	db *gorm.DB
}

func NewSimilarityRepository(db *gorm.DB) *SimilarityRepository {
	return &SimilarityRepository{db: db}
}

// CreateSimilarity creates a new product similarity record
func (r *SimilarityRepository) CreateSimilarity(similarity *models.ProductSimilarity) error {
	// Ensure ProductID1 < ProductID2 for consistency
	if similarity.ProductID1 > similarity.ProductID2 {
		similarity.ProductID1, similarity.ProductID2 = similarity.ProductID2, similarity.ProductID1
	}

	return r.db.Create(similarity).Error
}

// GetSimilarity retrieves similarity between two products
func (r *SimilarityRepository) GetSimilarity(productID1, productID2 string) (*models.ProductSimilarity, error) {
	// Ensure ProductID1 < ProductID2 for consistency
	if productID1 > productID2 {
		productID1, productID2 = productID2, productID1
	}

	var similarity models.ProductSimilarity
	err := r.db.Where("product_id_1 = ? AND product_id_2 = ?", productID1, productID2).
		First(&similarity).Error

	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &similarity, err
}

// GetSimilarProducts retrieves products similar to a given product
func (r *SimilarityRepository) GetSimilarProducts(productID string, limit int, minScore float64) ([]models.ProductSimilarity, error) {
	var similarities []models.ProductSimilarity

	query := r.db.Where("(product_id_1 = ? OR product_id_2 = ?) AND similarity_score >= ?",
		productID, productID, minScore).
		Order("similarity_score DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&similarities).Error
	return similarities, err
}

// UpdateSimilarity updates an existing similarity record
func (r *SimilarityRepository) UpdateSimilarity(similarity *models.ProductSimilarity) error {
	// Ensure ProductID1 < ProductID2 for consistency
	if similarity.ProductID1 > similarity.ProductID2 {
		similarity.ProductID1, similarity.ProductID2 = similarity.ProductID2, similarity.ProductID1
	}

	return r.db.Save(similarity).Error
}

// UpsertSimilarity creates or updates a similarity record
func (r *SimilarityRepository) UpsertSimilarity(similarity *models.ProductSimilarity) error {
	// Ensure ProductID1 < ProductID2 for consistency
	if similarity.ProductID1 > similarity.ProductID2 {
		similarity.ProductID1, similarity.ProductID2 = similarity.ProductID2, similarity.ProductID1
	}

	existing, err := r.GetSimilarity(similarity.ProductID1, similarity.ProductID2)
	if err != nil {
		return err
	}

	if existing != nil {
		similarity.ID = existing.ID
		return r.UpdateSimilarity(similarity)
	}

	return r.CreateSimilarity(similarity)
}

// BatchUpsertSimilarities creates or updates multiple similarity records
func (r *SimilarityRepository) BatchUpsertSimilarities(similarities []models.ProductSimilarity) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for i := range similarities {
			// Ensure ProductID1 < ProductID2 for consistency
			if similarities[i].ProductID1 > similarities[i].ProductID2 {
				similarities[i].ProductID1, similarities[i].ProductID2 = similarities[i].ProductID2, similarities[i].ProductID1
			}

			var existing models.ProductSimilarity
			err := tx.Where("product_id_1 = ? AND product_id_2 = ?",
				similarities[i].ProductID1, similarities[i].ProductID2).
				First(&existing).Error

			if err == nil {
				// Update existing record
				similarities[i].ID = existing.ID
				if err := tx.Save(&similarities[i]).Error; err != nil {
					return err
				}
			} else if err == gorm.ErrRecordNotFound {
				// Create new record
				if err := tx.Create(&similarities[i]).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
		return nil
	})
}

// DeleteSimilarity soft deletes a similarity record
func (r *SimilarityRepository) DeleteSimilarity(id uint) error {
	return r.db.Delete(&models.ProductSimilarity{}, id).Error
}

// DeleteProductSimilarities deletes all similarity records for a product
func (r *SimilarityRepository) DeleteProductSimilarities(productID string) error {
	return r.db.Where("product_id_1 = ? OR product_id_2 = ?", productID, productID).
		Delete(&models.ProductSimilarity{}).Error
}

// GetAllSimilarities retrieves all similarity records with pagination
func (r *SimilarityRepository) GetAllSimilarities(page, pageSize int, minScore float64) ([]models.ProductSimilarity, error) {
	var similarities []models.ProductSimilarity
	offset := (page - 1) * pageSize

	err := r.db.Where("similarity_score >= ?", minScore).
		Order("similarity_score DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&similarities).Error

	return similarities, err
}

// GetSimilarityCount returns the total count of similarity records
func (r *SimilarityRepository) GetSimilarityCount(minScore float64) (int64, error) {
	var count int64
	err := r.db.Model(&models.ProductSimilarity{}).
		Where("similarity_score >= ?", minScore).
		Count(&count).Error
	return count, err
}

// GetProductsNeedingSimilarityUpdate retrieves products that need similarity calculation update
func (r *SimilarityRepository) GetProductsNeedingSimilarityUpdate(updateThreshold time.Time) ([]string, error) {
	var productIDs []string

	// Get products with outdated similarity records
	err := r.db.Raw(`
		SELECT DISTINCT product_id_1 as product_id FROM product_similarities 
		WHERE updated_at < ?
		UNION
		SELECT DISTINCT product_id_2 as product_id FROM product_similarities 
		WHERE updated_at < ?
	`, updateThreshold, updateThreshold).Scan(&productIDs).Error

	return productIDs, err
}

// GetTopSimilarProducts retrieves top N similar products with their scores
func (r *SimilarityRepository) GetTopSimilarProducts(productID string, limit int, minScore float64) (map[string]float64, error) {
	var results []struct {
		ProductID string
		Score     float64
	}

	err := r.db.Raw(`
		SELECT 
			CASE 
				WHEN product_id_1 = ? THEN product_id_2 
				ELSE product_id_1 
			END as product_id,
			similarity_score as score
		FROM product_similarities
		WHERE (product_id_1 = ? OR product_id_2 = ?)
			AND similarity_score >= ?
			AND deleted_at IS NULL
		ORDER BY similarity_score DESC
		LIMIT ?
	`, productID, productID, productID, minScore, limit).Scan(&results).Error

	if err != nil {
		return nil, err
	}

	scores := make(map[string]float64)
	for _, result := range results {
		scores[result.ProductID] = result.Score
	}

	return scores, nil
}

// DeleteOldSimilarities removes similarity records older than a specified date
func (r *SimilarityRepository) DeleteOldSimilarities(before time.Time) (int64, error) {
	result := r.db.Where("updated_at < ?", before).Delete(&models.ProductSimilarity{})
	return result.RowsAffected, result.Error
}

// GetAverageSimilarityScore returns the average similarity score for a product
func (r *SimilarityRepository) GetAverageSimilarityScore(productID string) (float64, error) {
	var avgScore float64
	err := r.db.Model(&models.ProductSimilarity{}).
		Select("AVG(similarity_score)").
		Where("product_id_1 = ? OR product_id_2 = ?", productID, productID).
		Scan(&avgScore).Error
	return avgScore, err
}
