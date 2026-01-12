package main

import (
	"fmt"
	"net"

	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/delivery/grpc"
	httpDelivery "github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/delivery/http"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/infrastructure/database"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/infrastructure/models"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/infrastructure/payment"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/infrastructure/redis"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/repository/postgres"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/pkg/config"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/pkg/logger"
	grpcServer "google.golang.org/grpc"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	log := logger.New("payment-service", cfg.LogLevel)
	log.Info("Starting payment service...")

	// Connect to PostgreSQL
	db, err := database.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	log.Info("Connected to PostgreSQL")

	// Auto-migrate models
	if err := db.AutoMigrate(&models.Payment{}); err != nil {
		log.Fatal("Failed to migrate database", "error", err)
	}
	log.Info("Database migration completed")

	// Connect to Redis
	redisClient := redis.NewRedisClient(cfg.RedisURL)
	log.Info("Connected to Redis", "client", redisClient != nil)

	// Initialize Stripe provider
	stripeProvider := payment.NewStripeProvider(cfg.StripeSecretKey)
	log.Info("Stripe provider initialized")

	// Initialize repository
	paymentRepo := postgres.NewPaymentRepository(db)

	// Initialize use case
	paymentUseCase := usecase.NewPaymentUseCase(paymentRepo, stripeProvider)

	// Initialize gRPC handler
	paymentHandler := grpc.NewPaymentHandler(paymentUseCase)
	log.Info("Payment handler initialized", "handler", paymentHandler != nil)

	// Start HTTP server for health checks
	go func() {
		httpServer := httpDelivery.NewServer(cfg.Port)
		log.Info("HTTP server listening", "port", cfg.Port)
		if err := httpServer.Start(); err != nil {
			log.Fatal("Failed to start HTTP server", "error", err)
		}
	}()

	// Start gRPC server
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		log.Fatal("Failed to listen", "error", err)
	}

	grpcSrv := grpcServer.NewServer()
	// Note: Register with proto-generated service when available
	// pb.RegisterPaymentServiceServer(grpcSrv, paymentHandler)

	log.Info("gRPC server listening", "port", cfg.GRPCPort)
	if err := grpcSrv.Serve(lis); err != nil {
		log.Fatal("Failed to serve", "error", err)
	}
}
