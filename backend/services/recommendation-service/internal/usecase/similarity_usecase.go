package usecase

import (
	"fmt"
	"log"
	"math"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/infrastructure/cache"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/models"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/repository"
)

type SimilarityUseCase struct {
	interactionRepo *repository.InteractionRepository
	similarityRepo  *repository.SimilarityRepository
}

func NewSimilarityUseCase(
	interactionRepo *repository.InteractionRepository,
	similarityRepo *repository.SimilarityRepository,
) *SimilarityUseCase {
	return &SimilarityUseCase{
		interactionRepo: interactionRepo,
		similarityRepo:  similarityRepo,
	}
}

// CalculateProductSimilarities calculates similarities between all products
func (uc *SimilarityUseCase) CalculateProductSimilarities() error {
	log.Println("Starting product similarity calculation...")

	// Get all unique product IDs from interactions
	var productIDs []string
	since := time.Now().AddDate(0, 0, -models.TrendingWindowDays*2) // Use 2x trending window
	interactions, err := uc.interactionRepo.GetRecentInteractions(since, 0)
	if err != nil {
		return err
	}

	productMap := make(map[string]bool)
	for _, interaction := range interactions {
		productMap[interaction.ProductID] = true
	}

	for productID := range productMap {
		productIDs = append(productIDs, productID)
	}

	if len(productIDs) < 2 {
		return fmt.Errorf("not enough products for similarity calculation")
	}

	log.Printf("Calculating similarities for %d products...\n", len(productIDs))

	// Calculate similarities in batches
	var similarities []models.ProductSimilarity
	processedPairs := 0

	for i := 0; i < len(productIDs); i++ {
		for j := i + 1; j < len(productIDs); j++ {
			product1 := productIDs[i]
			product2 := productIDs[j]

			// Calculate cosine similarity
			similarity, commonUsers, err := uc.calculateCosineSimilarity(product1, product2)
			if err != nil {
				continue
			}

			// Only store if similarity is above threshold and has enough common users
			if similarity >= models.SimilarityThreshold && commonUsers >= models.SimilarityMinCommonUsers {
				similarities = append(similarities, models.ProductSimilarity{
					ProductID1:       product1,
					ProductID2:       product2,
					SimilarityScore:  similarity,
					SimilarityMethod: models.SimilarityMethodCosine,
					CommonUsers:      commonUsers,
				})
			}

			processedPairs++

			// Batch update every 100 pairs
			if len(similarities) >= models.SimilarityBatchSize {
				if err := uc.similarityRepo.BatchUpsertSimilarities(similarities); err != nil {
					log.Printf("Error batch updating similarities: %v\n", err)
				}
				similarities = nil // Reset
			}
		}
	}

	// Update remaining similarities
	if len(similarities) > 0 {
		if err := uc.similarityRepo.BatchUpsertSimilarities(similarities); err != nil {
			return err
		}
	}

	log.Printf("Completed similarity calculation: %d pairs processed\n", processedPairs)

	// Invalidate all similarity caches
	cache.DeletePattern(fmt.Sprintf(models.CacheKeyProductSimilarity, "*", "*"))

	return nil
}

// calculateCosineSimilarity calculates cosine similarity between two products
func (uc *SimilarityUseCase) calculateCosineSimilarity(productID1, productID2 string) (float64, int, error) {
	// Get users who interacted with each product
	users1, err := uc.interactionRepo.GetUsersWhoInteractedWithProduct(productID1)
	if err != nil {
		return 0, 0, err
	}

	users2, err := uc.interactionRepo.GetUsersWhoInteractedWithProduct(productID2)
	if err != nil {
		return 0, 0, err
	}

	if len(users1) == 0 || len(users2) == 0 {
		return 0, 0, nil
	}

	// Get interaction weights for each user
	weights1 := make(map[string]float64)
	for _, userID := range users1 {
		userWeights, err := uc.interactionRepo.GetUserInteractionWeights(userID)
		if err != nil {
			continue
		}
		if weight, exists := userWeights[productID1]; exists {
			weights1[userID] = weight
		}
	}

	weights2 := make(map[string]float64)
	for _, userID := range users2 {
		userWeights, err := uc.interactionRepo.GetUserInteractionWeights(userID)
		if err != nil {
			continue
		}
		if weight, exists := userWeights[productID2]; exists {
			weights2[userID] = weight
		}
	}

	// Calculate cosine similarity
	var dotProduct, magnitude1, magnitude2 float64
	commonUsers := 0

	// Get all unique users
	allUsers := make(map[string]bool)
	for user := range weights1 {
		allUsers[user] = true
	}
	for user := range weights2 {
		allUsers[user] = true
	}

	for user := range allUsers {
		w1 := weights1[user]
		w2 := weights2[user]

		dotProduct += w1 * w2
		magnitude1 += w1 * w1
		magnitude2 += w2 * w2

		if w1 > 0 && w2 > 0 {
			commonUsers++
		}
	}

	if magnitude1 == 0 || magnitude2 == 0 {
		return 0, commonUsers, nil
	}

	similarity := dotProduct / (math.Sqrt(magnitude1) * math.Sqrt(magnitude2))

	// Normalize to 0-1 range
	if similarity < models.MinSimilarityScore {
		similarity = models.MinSimilarityScore
	}
	if similarity > models.MaxSimilarityScore {
		similarity = models.MaxSimilarityScore
	}

	return similarity, commonUsers, nil
}

// CalculateProductSimilarity calculates similarity between two specific products
func (uc *SimilarityUseCase) CalculateProductSimilarity(productID1, productID2 string) (float64, error) {
	// Check cache first
	cacheKey := fmt.Sprintf(models.CacheKeyProductSimilarity, productID1, productID2)
	if cachedScore, err := cache.Get(cacheKey); err == nil && cachedScore != "" {
		var score float64
		fmt.Sscanf(cachedScore, "%f", &score)
		return score, nil
	}

	similarity, commonUsers, err := uc.calculateCosineSimilarity(productID1, productID2)
	if err != nil {
		return 0, err
	}

	// Store in database
	if similarity >= models.SimilarityThreshold && commonUsers >= models.SimilarityMinCommonUsers {
		sim := &models.ProductSimilarity{
			ProductID1:       productID1,
			ProductID2:       productID2,
			SimilarityScore:  similarity,
			SimilarityMethod: models.SimilarityMethodCosine,
			CommonUsers:      commonUsers,
		}
		uc.similarityRepo.UpsertSimilarity(sim)
	}

	// Cache result
	cache.Set(cacheKey, fmt.Sprintf("%f", similarity), time.Duration(models.CacheTTLProductSimilarity)*time.Second)

	return similarity, nil
}

// GetSimilarProducts retrieves products similar to a given product
func (uc *SimilarityUseCase) GetSimilarProducts(productID string, limit int) (map[string]float64, error) {
	return uc.similarityRepo.GetTopSimilarProducts(productID, limit, models.SimilarityThreshold)
}

// StartPeriodicSimilarityCalculation starts a background job to calculate similarities periodically
func (uc *SimilarityUseCase) StartPeriodicSimilarityCalculation() {
	ticker := time.NewTicker(time.Duration(models.SimilarityUpdateIntervalHrs) * time.Hour)
	go func() {
		for range ticker.C {
			log.Println("Starting periodic similarity calculation...")
			if err := uc.CalculateProductSimilarities(); err != nil {
				log.Printf("Error in periodic similarity calculation: %v\n", err)
			}
		}
	}()
}
