package repository

import (
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/models"
	"gorm.io/gorm"
)

type RecommendationRepository struct {
	db *gorm.DB
}

func NewRecommendationRepository(db *gorm.DB) *RecommendationRepository {
	return &RecommendationRepository{db: db}
}

// CreateRecommendation creates a new recommendation record
func (r *RecommendationRepository) CreateRecommendation(recommendation *models.UserRecommendation) error {
	return r.db.Create(recommendation).Error
}

// GetUserRecommendations retrieves recommendations for a user
func (r *RecommendationRepository) GetUserRecommendations(userID string, algorithm string, limit int) ([]models.UserRecommendation, error) {
	var recommendations []models.UserRecommendation

	query := r.db.Where("user_id = ?", userID)
	if algorithm != "" {
		query = query.Where("algorithm = ?", algorithm)
	}

	query = query.Order("rank ASC")
	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&recommendations).Error
	return recommendations, err
}

// GetRecentUserRecommendations retrieves recent recommendations for a user
func (r *RecommendationRepository) GetRecentUserRecommendations(userID string, since time.Time, limit int) ([]models.UserRecommendation, error) {
	var recommendations []models.UserRecommendation

	query := r.db.Where("user_id = ? AND generated_at >= ?", userID, since).
		Order("rank ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&recommendations).Error
	return recommendations, err
}

// BatchCreateRecommendations creates multiple recommendations in a transaction
func (r *RecommendationRepository) BatchCreateRecommendations(recommendations []models.UserRecommendation) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(&recommendations).Error
	})
}

// DeleteUserRecommendations deletes all recommendations for a user
func (r *RecommendationRepository) DeleteUserRecommendations(userID string) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.UserRecommendation{}).Error
}

// DeleteUserRecommendationsByAlgorithm deletes recommendations for a user by algorithm
func (r *RecommendationRepository) DeleteUserRecommendationsByAlgorithm(userID string, algorithm string) error {
	return r.db.Where("user_id = ? AND algorithm = ?", userID, algorithm).
		Delete(&models.UserRecommendation{}).Error
}

// UpdateUserRecommendations replaces all recommendations for a user with new ones
func (r *RecommendationRepository) UpdateUserRecommendations(userID string, algorithm string, recommendations []models.UserRecommendation) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete old recommendations
		if err := tx.Where("user_id = ? AND algorithm = ?", userID, algorithm).
			Delete(&models.UserRecommendation{}).Error; err != nil {
			return err
		}

		// Create new recommendations
		if len(recommendations) > 0 {
			if err := tx.Create(&recommendations).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// GetRecommendationCount returns the count of recommendations for a user
func (r *RecommendationRepository) GetRecommendationCount(userID string, algorithm string) (int64, error) {
	var count int64
	query := r.db.Model(&models.UserRecommendation{}).Where("user_id = ?", userID)

	if algorithm != "" {
		query = query.Where("algorithm = ?", algorithm)
	}

	err := query.Count(&count).Error
	return count, err
}

// DeleteOldRecommendations removes recommendations older than a specified date
func (r *RecommendationRepository) DeleteOldRecommendations(before time.Time) (int64, error) {
	result := r.db.Where("generated_at < ?", before).Delete(&models.UserRecommendation{})
	return result.RowsAffected, result.Error
}

// GetTopRecommendations retrieves top N recommendations for a user
func (r *RecommendationRepository) GetTopRecommendations(userID string, limit int) ([]string, error) {
	var productIDs []string

	err := r.db.Model(&models.UserRecommendation{}).
		Where("user_id = ?", userID).
		Order("score DESC, rank ASC").
		Limit(limit).
		Pluck("product_id", &productIDs).Error

	return productIDs, err
}

// GetRecommendationsByScore retrieves recommendations within a score range
func (r *RecommendationRepository) GetRecommendationsByScore(userID string, minScore, maxScore float64, limit int) ([]models.UserRecommendation, error) {
	var recommendations []models.UserRecommendation

	query := r.db.Where("user_id = ? AND score >= ? AND score <= ?", userID, minScore, maxScore).
		Order("score DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&recommendations).Error
	return recommendations, err
}

// GetAllUsersWithRecommendations retrieves all user IDs that have recommendations
func (r *RecommendationRepository) GetAllUsersWithRecommendations() ([]string, error) {
	var userIDs []string
	err := r.db.Model(&models.UserRecommendation{}).
		Distinct("user_id").
		Pluck("user_id", &userIDs).Error
	return userIDs, err
}

// DeleteProductFromRecommendations removes a product from all user recommendations
func (r *RecommendationRepository) DeleteProductFromRecommendations(productID string) error {
	return r.db.Where("product_id = ?", productID).Delete(&models.UserRecommendation{}).Error
}
