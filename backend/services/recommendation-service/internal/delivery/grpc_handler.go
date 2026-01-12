package delivery

import (
	"context"
	"log"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/models"
	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/usecase"
)

type RecommendationGRPCHandler struct {
	pb.UnimplementedRecommendationServiceServer
	recommendationUC *usecase.RecommendationUseCase
	similarityUC     *usecase.SimilarityUseCase
}

func NewRecommendationGRPCHandler(
	recommendationUC *usecase.RecommendationUseCase,
	similarityUC *usecase.SimilarityUseCase,
) *RecommendationGRPCHandler {
	return &RecommendationGRPCHandler{
		recommendationUC: recommendationUC,
		similarityUC:     similarityUC,
	}
}

// RecordInteraction records a user interaction with a product
func (h *RecommendationGRPCHandler) RecordInteraction(ctx context.Context, req *pb.RecordInteractionRequest) (*pb.RecordInteractionResponse, error) {
	log.Printf("RecordInteraction: user=%s, product=%s, type=%s", req.UserId, req.ProductId, req.InteractionType)

	// Convert metadata
	metadata := make(map[string]interface{})
	for k, v := range req.Metadata {
		metadata[k] = v
	}

	err := h.recommendationUC.RecordInteraction(req.UserId, req.ProductId, req.InteractionType, metadata)
	if err != nil {
		log.Printf("Error recording interaction: %v", err)
		return &pb.RecordInteractionResponse{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	return &pb.RecordInteractionResponse{
		Success: true,
		Message: "Interaction recorded successfully",
	}, nil
}

// GetUserRecommendations retrieves personalized recommendations for a user
func (h *RecommendationGRPCHandler) GetUserRecommendations(ctx context.Context, req *pb.GetUserRecommendationsRequest) (*pb.GetUserRecommendationsResponse, error) {
	log.Printf("GetUserRecommendations: user=%s, limit=%d, algorithm=%s", req.UserId, req.Limit, req.Algorithm)

	limit := int(req.Limit)
	if limit <= 0 {
		limit = models.DefaultRecommendations
	}

	productIDs, err := h.recommendationUC.GetUserRecommendations(req.UserId, limit, req.Algorithm)
	if err != nil {
		log.Printf("Error getting user recommendations: %v", err)
		return &pb.GetUserRecommendationsResponse{
			ProductIds: []string{},
			Algorithm:  req.Algorithm,
		}, nil
	}

	return &pb.GetUserRecommendationsResponse{
		ProductIds: productIDs,
		Algorithm:  req.Algorithm,
	}, nil
}

// GetProductRecommendations retrieves products similar to a given product
func (h *RecommendationGRPCHandler) GetProductRecommendations(ctx context.Context, req *pb.GetProductRecommendationsRequest) (*pb.GetProductRecommendationsResponse, error) {
	log.Printf("GetProductRecommendations: product=%s, limit=%d", req.ProductId, req.Limit)

	limit := int(req.Limit)
	if limit <= 0 {
		limit = models.DefaultRecommendations
	}

	productIDs, err := h.recommendationUC.GetProductRecommendations(req.ProductId, limit)
	if err != nil {
		log.Printf("Error getting product recommendations: %v", err)
		return &pb.GetProductRecommendationsResponse{
			ProductIds: []string{},
		}, nil
	}

	return &pb.GetProductRecommendationsResponse{
		ProductIds: productIDs,
	}, nil
}

// GetTrendingProducts retrieves trending products
func (h *RecommendationGRPCHandler) GetTrendingProducts(ctx context.Context, req *pb.GetTrendingProductsRequest) (*pb.GetTrendingProductsResponse, error) {
	log.Printf("GetTrendingProducts: limit=%d", req.Limit)

	limit := int(req.Limit)
	if limit <= 0 {
		limit = models.DefaultRecommendations
	}

	productIDs, err := h.recommendationUC.GetTrendingProducts(limit)
	if err != nil {
		log.Printf("Error getting trending products: %v", err)
		return &pb.GetTrendingProductsResponse{
			ProductIds: []string{},
		}, nil
	}

	return &pb.GetTrendingProductsResponse{
		ProductIds: productIDs,
	}, nil
}

// CalculateSimilarities calculates product similarities
func (h *RecommendationGRPCHandler) CalculateSimilarities(ctx context.Context, req *pb.CalculateSimilaritiesRequest) (*pb.CalculateSimilaritiesResponse, error) {
	log.Println("CalculateSimilarities: starting calculation...")

	go func() {
		err := h.similarityUC.CalculateProductSimilarities()
		if err != nil {
			log.Printf("Error calculating similarities: %v", err)
		}
	}()

	return &pb.CalculateSimilaritiesResponse{
		Success: true,
		Message: "Similarity calculation started in background",
	}, nil
}

// CalculateTrendingScores calculates trending scores
func (h *RecommendationGRPCHandler) CalculateTrendingScores(ctx context.Context, req *pb.CalculateTrendingScoresRequest) (*pb.CalculateTrendingScoresResponse, error) {
	log.Println("CalculateTrendingScores: starting calculation...")

	go func() {
		err := h.recommendationUC.CalculateTrendingScores()
		if err != nil {
			log.Printf("Error calculating trending scores: %v", err)
		}
	}()

	return &pb.CalculateTrendingScoresResponse{
		Success: true,
		Message: "Trending score calculation started in background",
	}, nil
}

// HealthCheck returns the health status of the service
func (h *RecommendationGRPCHandler) HealthCheck(ctx context.Context, req *pb.HealthCheckRequest) (*pb.HealthCheckResponse, error) {
	return &pb.HealthCheckResponse{
		Status:  "OK",
		Service: "recommendation-service",
	}, nil
}
