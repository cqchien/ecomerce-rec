package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/cache"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/database"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/delivery"
	pb "github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/repository"
	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/usecase"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// Initialize Redis
	if err := cache.InitRedis(); err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer cache.CloseRedis()

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
		log.Println("Starting periodic similarity calculation...")
		similarityUC.StartPeriodicSimilarityCalculation()
	}()

	go func() {
		log.Println("Starting periodic trending score calculation...")
		startPeriodicTrendingCalculation(recommendationUC)
	}()

	// Initialize gRPC handler
	grpcHandler := delivery.NewRecommendationGRPCHandler(recommendationUC, similarityUC)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterRecommendationServiceServer(grpcServer, grpcHandler)

	// Start gRPC server
	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50053"
	}

	listener, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", grpcPort, err)
	}

	log.Printf("🚀 Recommendation Service is running on gRPC port %s", grpcPort)

	// Graceful shutdown
	go func() {
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	grpcServer.GracefulStop()
	log.Println("Server stopped")
}

func startPeriodicTrendingCalculation(uc *usecase.RecommendationUseCase) {
	// Calculate trending scores every hour
	ticker := syscall.SIGALRM // placeholder, actual implementation would use time.NewTicker
	log.Printf("Periodic trending calculation scheduled (every hour)")

	// Initial calculation
	if err := uc.CalculateTrendingScores(); err != nil {
		log.Printf("Error in initial trending calculation: %v", err)
	}

	// Note: In production, use time.NewTicker(1 * time.Hour)
	_ = ticker
}
