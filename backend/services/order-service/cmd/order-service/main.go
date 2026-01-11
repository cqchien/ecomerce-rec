package main

import (
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/delivery/grpc"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/delivery/http"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/infrastructure/database"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/infrastructure/redis"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/repository/postgres"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/config"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/logger"
	grpcLib "google.golang.org/grpc"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()
	logger.Info("Configuration loaded")

	// Initialize database
	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}
	logger.Info("Database connected")

	// Initialize Redis
	redisClient, err := redis.NewRedisClient(cfg.RedisURL)
	if err != nil {
		logger.Errorf("Failed to connect to Redis (continuing without cache): %v", err)
		redisClient = nil
	}

	// Initialize repository
	orderRepo := postgres.NewOrderRepository(db, redisClient)

	// Initialize use case
	orderUseCase := usecase.NewOrderUseCase(orderRepo)

	// Start HTTP server
	httpServer := http.NewServer(cfg.HTTPPort)
	go func() {
		logger.Infof("Starting HTTP server on port %s", cfg.HTTPPort)
		if err := httpServer.Start(); err != nil {
			logger.Fatalf("HTTP server failed: %v", err)
		}
	}()

	// Start gRPC server
	grpcServer := grpcLib.NewServer()
	orderHandler := grpc.NewOrderHandler(orderUseCase)
	pb.RegisterOrderServiceServer(grpcServer, orderHandler)

	grpcListener, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		logger.Fatalf("Failed to listen on gRPC port %s: %v", cfg.GRPCPort, err)
	}

	go func() {
		logger.Infof("Starting gRPC server on port %s", cfg.GRPCPort)
		if err := grpcServer.Serve(grpcListener); err != nil {
			logger.Fatalf("gRPC server failed: %v", err)
		}
	}()

	logger.Info("Order service started successfully")

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down order service...")
	grpcServer.GracefulStop()
	logger.Info("Order service stopped")
}
