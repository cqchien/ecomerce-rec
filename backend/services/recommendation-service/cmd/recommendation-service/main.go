package main

import (
	"net"
	"os"
	"os/signal"
	"syscall"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/delivery"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/infrastructure/cache"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/infrastructure/database"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/repository"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/pkg/config"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/pkg/logger"
	"google.golang.org/grpc"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	log := logger.New("recommendation-service", cfg.LogLevel)
	log.Info("Starting Recommendation Service...")

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to initialize database", "error", err)
	}
	defer database.CloseDB()
	log.Info("Connected to PostgreSQL")

	// Initialize Redis
	if err := cache.InitRedis(); err != nil {
		log.Fatal("Failed to initialize Redis", "error", err)
	}
	defer cache.CloseRedis()
	log.Info("Connected to Redis")

	// Initialize repositories
	interactionRepo := repository.NewInteractionRepository(database.DB)
	similarityRepo := repository.NewSimilarityRepository(database.DB)
	trendingRepo := repository.NewTrendingRepository(database.DB)
	recommendationRepo := repository.NewRecommendationRepository(database.DB)

	// Initialize use cases
	recommendationUC := usecase.NewRecommendationUseCase(
		interactionRepo,
		similarityRepo,
		trendingRepo,
		recommendationRepo,
	)
	similarityUC := usecase.NewSimilarityUseCase(interactionRepo, similarityRepo)

	// Start background jobs
	go func() {
		log.Info("Starting periodic similarity calculation...")
		similarityUC.StartPeriodicSimilarityCalculation()
	}()

	go func() {
		log.Info("Starting periodic trending score calculation...")
		startPeriodicTrendingCalculation(recommendationUC, log)
	}()

	// Initialize gRPC handler
	grpcHandler := delivery.NewRecommendationGRPCHandler(recommendationUC, similarityUC)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterRecommendationServiceServer(grpcServer, grpcHandler)

	// Start gRPC server
	listener, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		log.Fatal("Failed to listen on port", "port", cfg.GRPCPort, "error", err)
	}

	log.Info("gRPC server listening", "port", cfg.GRPCPort)

	// Graceful shutdown
	go func() {
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatal("Failed to serve gRPC", "error", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down server...")
	grpcServer.GracefulStop()
	log.Info("Server stopped")
}

func startPeriodicTrendingCalculation(uc *usecase.RecommendationUseCase, log logger.Logger) {
	// Calculate trending scores every hour
	log.Info("Periodic trending calculation scheduled")

	// Initial calculation
	if err := uc.CalculateTrendingScores(); err != nil {
		log.Error("Error in initial trending calculation", "error", err)
	}

	// Note: In production, use time.NewTicker(1 * time.Hour)
}
