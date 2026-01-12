package usecase

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/infrastructure/cache"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/models"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/repository"
)

type RecommendationUseCase struct {
	interactionRepo    *repository.InteractionRepository
	similarityRepo     *repository.SimilarityRepository
	trendingRepo       *repository.TrendingRepository
	recommendationRepo *repository.RecommendationRepository
}

func NewRecommendationUseCase(
	interactionRepo *repository.InteractionRepository,
	similarityRepo *repository.SimilarityRepository,
	trendingRepo *repository.TrendingRepository,
	recommendationRepo *repository.RecommendationRepository,
) *RecommendationUseCase {
	return &RecommendationUseCase{
		interactionRepo:    interactionRepo,
		similarityRepo:     similarityRepo,
		trendingRepo:       trendingRepo,
		recommendationRepo: recommendationRepo,
	}
}

// RecordInteraction records a user interaction with a product
func (uc *RecommendationUseCase) RecordInteraction(userID, productID, interactionType string, metadata map[string]interface{}) error {
	if !models.IsValidInteractionType(interactionType) {
		return fmt.Errorf(models.ErrInvalidInteractionType)
	}

	// Check if interaction already exists
	existing, err := uc.interactionRepo.GetInteractionByUserAndProduct(userID, productID, interactionType)
	if err != nil {
		return err
	}

	metadataJSON := ""
	if metadata != nil {
		jsonBytes, _ := json.Marshal(metadata)
		metadataJSON = string(jsonBytes)
	}

	if existing != nil {
		// Update existing interaction
		existing.UpdatedAt = time.Now()
		existing.Metadata = metadataJSON
		err = uc.interactionRepo.UpdateInteraction(existing)
	} else {
		// Create new interaction
		interaction := &models.UserInteraction{
			UserID:          userID,
			ProductID:       productID,
			InteractionType: interactionType,
			Weight:          models.GetInteractionWeight(interactionType),
			Metadata:        metadataJSON,
		}
		err = uc.interactionRepo.CreateInteraction(interaction)
	}

	if err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf(models.CacheKeyUserInteractions, userID)
	cache.Delete(cacheKey)

	productCacheKey := fmt.Sprintf(models.CacheKeyProductInteractions, productID)
	cache.Delete(productCacheKey)

	// Update trending stats asynchronously
	go uc.updateTrendingStats(productID, interactionType)

	return nil
}

// GetUserRecommendations retrieves personalized recommendations for a user
func (uc *RecommendationUseCase) GetUserRecommendations(userID string, limit int, algorithm string) ([]string, error) {
	if limit <= 0 || limit > models.MaxRecommendations {
		limit = models.DefaultRecommendations
	}

	// Check cache first
	cacheKey := fmt.Sprintf(models.CacheKeyUserRecommendations, userID)
	if cachedData, err := cache.Get(cacheKey); err == nil && cachedData != "" {
		var productIDs []string
		if err := json.Unmarshal([]byte(cachedData), &productIDs); err == nil {
			if len(productIDs) > limit {
				return productIDs[:limit], nil
			}
			return productIDs, nil
		}
	}

	// Check if user has enough interactions
	count, err := uc.interactionRepo.GetInteractionCount(userID)
	if err != nil {
		return nil, err
	}

	if count < models.MinInteractionsForRecommendation {
		// Return trending products for new users
		return uc.GetTrendingProducts(limit)
	}

	var recommendations []string

	// Select algorithm
	if algorithm == "" || algorithm == models.AlgorithmHybrid {
		// Hybrid approach: combine collaborative filtering and item-based
		recommendations, err = uc.getHybridRecommendations(userID, limit)
	} else if algorithm == models.AlgorithmCollaborativeFiltering {
		recommendations, err = uc.getCollaborativeFilteringRecommendations(userID, limit)
	} else if algorithm == models.AlgorithmContentBased {
		recommendations, err = uc.getContentBasedRecommendations(userID, limit)
	} else {
		return nil, fmt.Errorf(models.ErrInvalidAlgorithm)
	}

	if err != nil {
		return nil, err
	}

	// Cache recommendations
	if len(recommendations) > 0 {
		jsonData, _ := json.Marshal(recommendations)
		cache.Set(cacheKey, string(jsonData), time.Duration(models.CacheTTLUserRecommendations)*time.Second)
	}

	return recommendations, nil
}

// GetProductRecommendations retrieves products similar to a given product
func (uc *RecommendationUseCase) GetProductRecommendations(productID string, limit int) ([]string, error) {
	if limit <= 0 || limit > models.MaxRecommendations {
		limit = models.DefaultRecommendations
	}

	// Check cache first
	cacheKey := fmt.Sprintf(models.CacheKeyProductRecommendations, productID)
	if cachedData, err := cache.Get(cacheKey); err == nil && cachedData != "" {
		var productIDs []string
		if err := json.Unmarshal([]byte(cachedData), &productIDs); err == nil {
			if len(productIDs) > limit {
				return productIDs[:limit], nil
			}
			return productIDs, nil
		}
	}

	// Get similar products from database
	similarities, err := uc.similarityRepo.GetSimilarProducts(productID, limit, models.SimilarityThreshold)
	if err != nil {
		return nil, err
	}

	var productIDs []string
	for _, sim := range similarities {
		if sim.ProductID1 == productID {
			productIDs = append(productIDs, sim.ProductID2)
		} else {
			productIDs = append(productIDs, sim.ProductID1)
		}
	}

	// Cache results
	if len(productIDs) > 0 {
		jsonData, _ := json.Marshal(productIDs)
		cache.Set(cacheKey, string(jsonData), time.Duration(models.CacheTTLProductRecommendations)*time.Second)
	}

	return productIDs, nil
}

// GetTrendingProducts retrieves trending products
func (uc *RecommendationUseCase) GetTrendingProducts(limit int) ([]string, error) {
	if limit <= 0 || limit > models.TrendingMaxProducts {
		limit = models.DefaultRecommendations
	}

	// Check cache first
	cacheKey := models.CacheKeyTrendingProducts
	if cachedData, err := cache.Get(cacheKey); err == nil && cachedData != "" {
		var productIDs []string
		if err := json.Unmarshal([]byte(cachedData), &productIDs); err == nil {
			if len(productIDs) > limit {
				return productIDs[:limit], nil
			}
			return productIDs, nil
		}
	}

	// Get trending products from database
	products, err := uc.trendingRepo.GetTrendingProducts(limit, models.TrendingMinScore)
	if err != nil {
		return nil, err
	}

	var productIDs []string
	for _, product := range products {
		productIDs = append(productIDs, product.ProductID)
	}

	// Cache results
	if len(productIDs) > 0 {
		jsonData, _ := json.Marshal(productIDs)
		cache.Set(cacheKey, string(jsonData), time.Duration(models.CacheTTLTrendingProducts)*time.Second)
	}

	return productIDs, nil
}

// updateTrendingStats updates trending statistics for a product
func (uc *RecommendationUseCase) updateTrendingStats(productID, interactionType string) {
	switch interactionType {
	case models.InteractionTypeView:
		uc.trendingRepo.IncrementProductView(productID)
	case models.InteractionTypeAddToCart:
		uc.trendingRepo.IncrementProductCart(productID)
	case models.InteractionTypePurchase:
		uc.trendingRepo.IncrementProductPurchase(productID)
	case models.InteractionTypeWishlist:
		uc.trendingRepo.IncrementProductWishlist(productID)
	}

	// Invalidate trending cache
	cache.Delete(models.CacheKeyTrendingProducts)
}

// getHybridRecommendations combines multiple recommendation approaches
func (uc *RecommendationUseCase) getHybridRecommendations(userID string, limit int) ([]string, error) {
	// Get collaborative filtering recommendations
	cfRecs, _ := uc.getCollaborativeFilteringRecommendations(userID, limit)

	// Get content-based recommendations
	cbRecs, _ := uc.getContentBasedRecommendations(userID, limit)

	// Combine and deduplicate
	seen := make(map[string]bool)
	var combined []string

	// Interleave recommendations
	maxLen := len(cfRecs)
	if len(cbRecs) > maxLen {
		maxLen = len(cbRecs)
	}

	for i := 0; i < maxLen && len(combined) < limit; i++ {
		if i < len(cfRecs) && !seen[cfRecs[i]] {
			combined = append(combined, cfRecs[i])
			seen[cfRecs[i]] = true
		}
		if i < len(cbRecs) && !seen[cbRecs[i]] && len(combined) < limit {
			combined = append(combined, cbRecs[i])
			seen[cbRecs[i]] = true
		}
	}

	return combined, nil
}

// getCollaborativeFilteringRecommendations uses user-based collaborative filtering
func (uc *RecommendationUseCase) getCollaborativeFilteringRecommendations(userID string, limit int) ([]string, error) {
	// Get user's interactions
	userInteractions, err := uc.interactionRepo.GetUserProductIDs(userID)
	if err != nil {
		return nil, err
	}

	// Find similar users (users who interacted with the same products)
	similarUsers := make(map[string]int)
	for _, productID := range userInteractions {
		users, err := uc.interactionRepo.GetUsersWhoInteractedWithProduct(productID)
		if err != nil {
			continue
		}
		for _, user := range users {
			if user != userID {
				similarUsers[user]++
			}
		}
	}

	// Get products from similar users
	productScores := make(map[string]float64)
	for similarUser, commonProducts := range similarUsers {
		similarity := float64(commonProducts) / float64(len(userInteractions))
		products, err := uc.interactionRepo.GetUserProductIDs(similarUser)
		if err != nil {
			continue
		}
		for _, productID := range products {
			// Skip products the user already interacted with
			if !contains(userInteractions, productID) {
				productScores[productID] += similarity
			}
		}
	}

	// Sort by score
	return sortByScore(productScores, limit), nil
}

// getContentBasedRecommendations uses item-based collaborative filtering
func (uc *RecommendationUseCase) getContentBasedRecommendations(userID string, limit int) ([]string, error) {
	// Get user's recent interactions
	interactions, err := uc.interactionRepo.GetUserInteractions(userID, 50)
	if err != nil {
		return nil, err
	}

	productScores := make(map[string]float64)

	// For each product the user interacted with, find similar products
	for _, interaction := range interactions {
		similarProducts, err := uc.similarityRepo.GetTopSimilarProducts(
			interaction.ProductID,
			models.DefaultRecommendations,
			models.SimilarityThreshold,
		)
		if err != nil {
			continue
		}

		// Weight by interaction strength and similarity
		for productID, similarity := range similarProducts {
			productScores[productID] += similarity * interaction.Weight
		}
	}

	// Remove products the user already interacted with
	userProducts, _ := uc.interactionRepo.GetUserProductIDs(userID)
	for _, productID := range userProducts {
		delete(productScores, productID)
	}

	return sortByScore(productScores, limit), nil
}

// CalculateTrendingScores recalculates trending scores for all products
func (uc *RecommendationUseCase) CalculateTrendingScores() error {
	since := time.Now().AddDate(0, 0, -models.TrendingWindowDays)
	interactions, err := uc.interactionRepo.GetRecentInteractions(since, 0)
	if err != nil {
		return err
	}

	// Aggregate stats by product
	stats := make(map[string]*models.TrendingProduct)
	now := time.Now()

	for _, interaction := range interactions {
		if _, exists := stats[interaction.ProductID]; !exists {
			stats[interaction.ProductID] = &models.TrendingProduct{
				ProductID:    interaction.ProductID,
				CalculatedAt: now,
			}
		}

		// Calculate recency weight (more recent = higher weight)
		daysSince := now.Sub(interaction.CreatedAt).Hours() / 24
		recencyWeight := math.Pow(models.TrendingDecayFactor, daysSince)

		switch interaction.InteractionType {
		case models.InteractionTypeView:
			stats[interaction.ProductID].ViewCount++
		case models.InteractionTypeAddToCart:
			stats[interaction.ProductID].CartCount++
		case models.InteractionTypePurchase:
			stats[interaction.ProductID].PurchaseCount++
		case models.InteractionTypeWishlist:
			stats[interaction.ProductID].WishlistCount++
		}

		// Calculate trending score
		score := float64(stats[interaction.ProductID].ViewCount)*models.TrendingWeightViews +
			float64(stats[interaction.ProductID].CartCount)*models.TrendingWeightCarts +
			float64(stats[interaction.ProductID].PurchaseCount)*models.TrendingWeightPurchases +
			float64(stats[interaction.ProductID].WishlistCount)*models.TrendingWeightWishlists
		stats[interaction.ProductID].TrendingScore = score * recencyWeight
	}

	// Filter and convert to slice
	var trendingProducts []models.TrendingProduct
	for _, product := range stats {
		totalInteractions := product.ViewCount + product.CartCount + product.PurchaseCount + product.WishlistCount
		if totalInteractions >= models.TrendingMinInteractions {
			trendingProducts = append(trendingProducts, *product)
		}
	}

	// Batch update database
	if len(trendingProducts) > 0 {
		if err := uc.trendingRepo.BatchUpsertTrendingProducts(trendingProducts); err != nil {
			return err
		}
	}

	// Invalidate cache
	cache.Delete(models.CacheKeyTrendingProducts)

	return nil
}

// Helper functions
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func sortByScore(scores map[string]float64, limit int) []string {
	type kv struct {
		Key   string
		Value float64
	}

	var sorted []kv
	for k, v := range scores {
		sorted = append(sorted, kv{k, v})
	}

	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Value > sorted[j].Value
	})

	var result []string
	for i := 0; i < len(sorted) && i < limit; i++ {
		result = append(result, sorted[i].Key)
	}

	return result
}
