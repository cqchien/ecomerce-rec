package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/delivery/grpc"
	httphandler "github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/delivery/http"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/redis"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/repository/postgres"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/pkg/config"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/pkg/logger"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	appLogger := logger.New(cfg.ServiceName, cfg.LogLevel)
	appLogger.Info("Starting Product Service...")

	// Initialize database
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		appLogger.Fatal("Failed to connect to database", "error", err)
	}
	defer func() {
		sqlDB, err := db.DB()
		if err != nil {
			appLogger.Error("Failed to get database instance", "error", err)
			return
		}
		sqlDB.Close()
	}()

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		appLogger.Fatal("Failed to run migrations", "error", err)
	}

	// Initialize Redis
	redisClient := redis.NewClient(cfg)
	defer redisClient.Close()

	// Initialize repositories
	productRepo := postgres.NewProductRepository(db)
	categoryRepo := postgres.NewCategoryRepository(db)

	// Initialize use cases
	productUseCase := usecase.NewProductUseCase(productRepo, categoryRepo, redisClient, appLogger)
	categoryUseCase := usecase.NewCategoryUseCase(categoryRepo, redisClient, appLogger)

	// Start gRPC server
	grpcServer := grpc.NewServer(productUseCase, categoryUseCase, appLogger)
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		appLogger.Fatal("Failed to listen gRPC", "error", err)
	}

	go func() {
		appLogger.Info(fmt.Sprintf("gRPC server listening on :%s", cfg.GRPCPort))
		if err := grpcServer.Serve(lis); err != nil {
			appLogger.Fatal("Failed to serve gRPC", "error", err)
		}
	}()

	// Start HTTP server (optional, for health checks)
	httpServer := httphandler.NewServer(cfg.Port, appLogger)
	go func() {
		appLogger.Info(fmt.Sprintf("HTTP server listening on :%s", cfg.Port))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			appLogger.Fatal("Failed to serve HTTP", "error", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	appLogger.Info("Shutting down Product Service...")

	ctx, cancel := context.WithTimeout(context.Background(), models.GracefulShutdownTimeout)
	defer cancel()

	grpcServer.GracefulStop()
	if err := httpServer.Shutdown(ctx); err != nil {
		appLogger.Error("HTTP server shutdown error", "error", err)
	}

	appLogger.Info("Product Service stopped")
}
