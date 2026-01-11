package repository

import (
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/models"
	"gorm.io/gorm"
)

type InteractionRepository struct {
	db *gorm.DB
}

func NewInteractionRepository(db *gorm.DB) *InteractionRepository {
	return &InteractionRepository{db: db}
}

// CreateInteraction creates a new user interaction
func (r *InteractionRepository) CreateInteraction(interaction *models.UserInteraction) error {
	if !models.IsValidInteractionType(interaction.InteractionType) {
		return fmt.Errorf(models.ErrInvalidInteractionType)
	}

	// Set weight based on interaction type
	interaction.Weight = models.GetInteractionWeight(interaction.InteractionType)

	return r.db.Create(interaction).Error
}

// GetUserInteractions retrieves all interactions for a user
func (r *InteractionRepository) GetUserInteractions(userID string, limit int) ([]models.UserInteraction, error) {
	var interactions []models.UserInteraction
	query := r.db.Where("user_id = ?", userID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&interactions).Error
	return interactions, err
}

// GetProductInteractions retrieves all interactions for a product
func (r *InteractionRepository) GetProductInteractions(productID string, limit int) ([]models.UserInteraction, error) {
	var interactions []models.UserInteraction
	query := r.db.Where("product_id = ?", productID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&interactions).Error
	return interactions, err
}

// GetUserInteractionsByType retrieves interactions for a user filtered by type
func (r *InteractionRepository) GetUserInteractionsByType(userID string, interactionType string, limit int) ([]models.UserInteraction, error) {
	var interactions []models.UserInteraction
	query := r.db.Where("user_id = ? AND interaction_type = ?", userID, interactionType).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&interactions).Error
	return interactions, err
}

// GetInteractionByUserAndProduct retrieves a specific interaction
func (r *InteractionRepository) GetInteractionByUserAndProduct(userID string, productID string, interactionType string) (*models.UserInteraction, error) {
	var interaction models.UserInteraction
	err := r.db.Where("user_id = ? AND product_id = ? AND interaction_type = ?", userID, productID, interactionType).
		First(&interaction).Error

	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &interaction, err
}

// UpdateInteraction updates an existing interaction
func (r *InteractionRepository) UpdateInteraction(interaction *models.UserInteraction) error {
	return r.db.Save(interaction).Error
}

// DeleteInteraction soft deletes an interaction
func (r *InteractionRepository) DeleteInteraction(id uint) error {
	return r.db.Delete(&models.UserInteraction{}, id).Error
}

// GetUserProductIDs retrieves all product IDs a user has interacted with
func (r *InteractionRepository) GetUserProductIDs(userID string) ([]string, error) {
	var productIDs []string
	err := r.db.Model(&models.UserInteraction{}).
		Where("user_id = ?", userID).
		Distinct("product_id").
		Pluck("product_id", &productIDs).Error
	return productIDs, err
}

// GetUsersWhoInteractedWithProduct retrieves all user IDs who interacted with a product
func (r *InteractionRepository) GetUsersWhoInteractedWithProduct(productID string) ([]string, error) {
	var userIDs []string
	err := r.db.Model(&models.UserInteraction{}).
		Where("product_id = ?", productID).
		Distinct("user_id").
		Pluck("user_id", &userIDs).Error
	return userIDs, err
}

// GetInteractionCount returns the total number of interactions for a user
func (r *InteractionRepository) GetInteractionCount(userID string) (int64, error) {
	var count int64
	err := r.db.Model(&models.UserInteraction{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// GetRecentInteractions retrieves recent interactions within a time window
func (r *InteractionRepository) GetRecentInteractions(since time.Time, limit int) ([]models.UserInteraction, error) {
	var interactions []models.UserInteraction
	query := r.db.Where("created_at >= ?", since).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&interactions).Error
	return interactions, err
}

// GetCommonUsers retrieves users who interacted with both products
func (r *InteractionRepository) GetCommonUsers(productID1, productID2 string) ([]string, error) {
	var userIDs []string
	err := r.db.Raw(`
		SELECT DISTINCT i1.user_id 
		FROM user_interactions i1
		INNER JOIN user_interactions i2 ON i1.user_id = i2.user_id
		WHERE i1.product_id = ? AND i2.product_id = ?
		AND i1.deleted_at IS NULL AND i2.deleted_at IS NULL
	`, productID1, productID2).Scan(&userIDs).Error
	return userIDs, err
}

// GetUserInteractionWeights retrieves user's weighted interactions
func (r *InteractionRepository) GetUserInteractionWeights(userID string) (map[string]float64, error) {
	var results []struct {
		ProductID   string
		TotalWeight float64
	}

	err := r.db.Model(&models.UserInteraction{}).
		Select("product_id, SUM(weight) as total_weight").
		Where("user_id = ?", userID).
		Group("product_id").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	weights := make(map[string]float64)
	for _, result := range results {
		weights[result.ProductID] = result.TotalWeight
	}

	return weights, nil
}

// GetProductInteractionStats retrieves interaction statistics for a product
func (r *InteractionRepository) GetProductInteractionStats(productID string, since time.Time) (map[string]int64, error) {
	var results []struct {
		InteractionType string
		Count           int64
	}

	query := r.db.Model(&models.UserInteraction{}).
		Select("interaction_type, COUNT(*) as count").
		Where("product_id = ?", productID)

	if !since.IsZero() {
		query = query.Where("created_at >= ?", since)
	}

	err := query.Group("interaction_type").Scan(&results).Error
	if err != nil {
		return nil, err
	}

	stats := make(map[string]int64)
	for _, result := range results {
		stats[result.InteractionType] = result.Count
	}

	return stats, nil
}

// BatchCreateInteractions creates multiple interactions in a transaction
func (r *InteractionRepository) BatchCreateInteractions(interactions []models.UserInteraction) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for i := range interactions {
			if !models.IsValidInteractionType(interactions[i].InteractionType) {
				return fmt.Errorf(models.ErrInvalidInteractionType)
			}
			interactions[i].Weight = models.GetInteractionWeight(interactions[i].InteractionType)
		}
		return tx.Create(&interactions).Error
	})
}

// DeleteOldInteractions removes interactions older than a specified date
func (r *InteractionRepository) DeleteOldInteractions(before time.Time) (int64, error) {
	result := r.db.Where("created_at < ?", before).Delete(&models.UserInteraction{})
	return result.RowsAffected, result.Error
}
