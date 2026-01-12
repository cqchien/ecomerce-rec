package models

import (
	"time"

	"gorm.io/gorm"
)

// Constants
const (
	// Interaction Types
	InteractionTypeView       = "view"
	InteractionTypeAddToCart  = "add_to_cart"
	InteractionTypePurchase   = "purchase"
	InteractionTypeWishlist   = "wishlist"
	InteractionTypeRemoveCart = "remove_cart"
	InteractionTypeSearch     = "search"

	// Interaction Weights
	WeightView       = 1.0
	WeightAddToCart  = 3.0
	WeightPurchase   = 5.0
	WeightWishlist   = 2.0
	WeightRemoveCart = -1.0
	WeightSearch     = 0.5

	// Recommendation Constants
	MinInteractionsForRecommendation = 3
	MaxRecommendations               = 20
	DefaultRecommendations           = 10
	TrendingWindowDays               = 7
	SimilarityThreshold              = 0.3
	MinSimilarityScore               = 0.1
	MaxSimilarityScore               = 1.0

	// Cache Keys
	CacheKeyUserRecommendations      = "recommendation:user:%s"
	CacheKeyProductRecommendations   = "recommendation:product:%s"
	CacheKeyTrendingProducts         = "recommendation:trending"
	CacheKeyUserInteractions         = "interaction:user:%s"
	CacheKeyProductInteractions      = "interaction:product:%s"
	CacheKeyProductSimilarity        = "similarity:product:%s:%s"
	CacheKeyUserBasedRecommendations = "recommendation:user_based:%s"
	CacheKeyItemBasedRecommendations = "recommendation:item_based:%s"

	// Cache TTL (in seconds)
	CacheTTLUserRecommendations    = 3600  // 1 hour
	CacheTTLProductRecommendations = 3600  // 1 hour
	CacheTTLTrendingProducts       = 1800  // 30 minutes
	CacheTTLUserInteractions       = 7200  // 2 hours
	CacheTTLProductInteractions    = 7200  // 2 hours
	CacheTTLProductSimilarity      = 86400 // 24 hours

	// Trending Score Weights
	TrendingWeightViews     = 1.0
	TrendingWeightCarts     = 2.0
	TrendingWeightPurchases = 5.0
	TrendingWeightWishlists = 1.5
	TrendingWeightRecency   = 0.5
	TrendingDecayFactor     = 0.9
	TrendingMinInteractions = 5
	TrendingMinScore        = 0.0
	TrendingMaxProducts     = 50

	// Similarity Calculation
	SimilarityMethodCosine      = "cosine"
	SimilarityMethodJaccard     = "jaccard"
	SimilarityMethodPearson     = "pearson"
	SimilarityMinCommonUsers    = 2
	SimilarityBatchSize         = 100
	SimilarityUpdateIntervalHrs = 6

	// Recommendation Algorithms
	AlgorithmCollaborativeFiltering = "collaborative_filtering"
	AlgorithmContentBased           = "content_based"
	AlgorithmHybrid                 = "hybrid"
	AlgorithmTrending               = "trending"
	AlgorithmPersonalized           = "personalized"

	// Status
	StatusActive   = "active"
	StatusInactive = "inactive"
	StatusDeleted  = "deleted"

	// Pagination
	DefaultPage     = 1
	DefaultPageSize = 20
	MaxPageSize     = 100

	// Error Messages
	ErrUserNotFound           = "user not found"
	ErrProductNotFound        = "product not found"
	ErrInsufficientData       = "insufficient interaction data"
	ErrInvalidInteractionType = "invalid interaction type"
	ErrInvalidAlgorithm       = "invalid recommendation algorithm"
	ErrDatabaseOperation      = "database operation failed"
	ErrCacheOperation         = "cache operation failed"
	ErrInvalidParameters      = "invalid parameters"
)

// UserInteraction represents a user's interaction with a product
type UserInteraction struct {
	ID              uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID          string         `gorm:"type:varchar(255);not null;index:idx_user_product,unique" json:"user_id"`
	ProductID       string         `gorm:"type:varchar(255);not null;index:idx_user_product,unique;index:idx_product" json:"product_id"`
	InteractionType string         `gorm:"type:varchar(50);not null;index:idx_interaction_type" json:"interaction_type"`
	Weight          float64        `gorm:"type:decimal(10,2);not null;default:1.0" json:"weight"`
	Metadata        string         `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt       time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// ProductSimilarity represents similarity between two products
type ProductSimilarity struct {
	ID               uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID1       string         `gorm:"type:varchar(255);not null;index:idx_product_similarity,unique" json:"product_id_1"`
	ProductID2       string         `gorm:"type:varchar(255);not null;index:idx_product_similarity,unique" json:"product_id_2"`
	SimilarityScore  float64        `gorm:"type:decimal(10,4);not null" json:"similarity_score"`
	SimilarityMethod string         `gorm:"type:varchar(50);not null" json:"similarity_method"`
	CommonUsers      int            `gorm:"type:int;not null;default:0" json:"common_users"`
	CreatedAt        time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TrendingProduct represents a trending product with calculated score
type TrendingProduct struct {
	ID            uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID     string         `gorm:"type:varchar(255);not null;uniqueIndex:idx_trending_product" json:"product_id"`
	TrendingScore float64        `gorm:"type:decimal(10,4);not null;index:idx_trending_score" json:"trending_score"`
	ViewCount     int            `gorm:"type:int;not null;default:0" json:"view_count"`
	CartCount     int            `gorm:"type:int;not null;default:0" json:"cart_count"`
	PurchaseCount int            `gorm:"type:int;not null;default:0" json:"purchase_count"`
	WishlistCount int            `gorm:"type:int;not null;default:0" json:"wishlist_count"`
	CalculatedAt  time.Time      `gorm:"not null;index:idx_calculated_at" json:"calculated_at"`
	CreatedAt     time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// UserRecommendation represents personalized recommendations for a user
type UserRecommendation struct {
	ID          uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      string         `gorm:"type:varchar(255);not null;index:idx_user_recommendations" json:"user_id"`
	ProductID   string         `gorm:"type:varchar(255);not null" json:"product_id"`
	Score       float64        `gorm:"type:decimal(10,4);not null" json:"score"`
	Algorithm   string         `gorm:"type:varchar(50);not null" json:"algorithm"`
	Rank        int            `gorm:"type:int;not null" json:"rank"`
	GeneratedAt time.Time      `gorm:"not null;index:idx_generated_at" json:"generated_at"`
	CreatedAt   time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName overrides
func (UserInteraction) TableName() string {
	return "user_interactions"
}

func (ProductSimilarity) TableName() string {
	return "product_similarities"
}

func (TrendingProduct) TableName() string {
	return "trending_products"
}

func (UserRecommendation) TableName() string {
	return "user_recommendations"
}

// GetInteractionWeight returns the weight for a given interaction type
func GetInteractionWeight(interactionType string) float64 {
	switch interactionType {
	case InteractionTypeView:
		return WeightView
	case InteractionTypeAddToCart:
		return WeightAddToCart
	case InteractionTypePurchase:
		return WeightPurchase
	case InteractionTypeWishlist:
		return WeightWishlist
	case InteractionTypeRemoveCart:
		return WeightRemoveCart
	case InteractionTypeSearch:
		return WeightSearch
	default:
		return WeightView
	}
}

// IsValidInteractionType checks if the interaction type is valid
func IsValidInteractionType(interactionType string) bool {
	validTypes := []string{
		InteractionTypeView,
		InteractionTypeAddToCart,
		InteractionTypePurchase,
		InteractionTypeWishlist,
		InteractionTypeRemoveCart,
		InteractionTypeSearch,
	}
	for _, t := range validTypes {
		if t == interactionType {
			return true
		}
	}
	return false
}

// IsValidAlgorithm checks if the algorithm is valid
func IsValidAlgorithm(algorithm string) bool {
	validAlgorithms := []string{
		AlgorithmCollaborativeFiltering,
		AlgorithmContentBased,
		AlgorithmHybrid,
		AlgorithmTrending,
		AlgorithmPersonalized,
	}
	for _, a := range validAlgorithms {
		if a == algorithm {
			return true
		}
	}
	return false
}
