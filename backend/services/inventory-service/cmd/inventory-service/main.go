package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/delivery/grpc"
	httphandler "github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/delivery/http"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/redis"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/repository/postgres"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/pkg/config"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/pkg/logger"
)

func main() {
	// Initialize logger
	log := logger.NewLogger()
	log.Info("Starting Inventory Service...")

	// Load configuration
	cfg := config.Load()
	log.Info("Configuration loaded", "environment", cfg.Environment)

	// Connect to PostgreSQL
	db, err := database.NewPostgresDB(
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		log,
	)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	log.Info("Connected to PostgreSQL")

	// Run database migrations
	if err := database.RunMigrations(db, log); err != nil {
		log.Fatal("Failed to run migrations", "error", err)
	}

	// Connect to Redis
	redisClient, err := redis.NewRedisClient(
		cfg.RedisHost,
		cfg.RedisPort,
		cfg.RedisPassword,
		cfg.RedisDB,
		log,
	)
	if err != nil {
		log.Fatal("Failed to connect to Redis", "error", err)
	}

	// Initialize repositories
	stockRepo := postgres.NewStockRepository(db)
	reservationRepo := postgres.NewReservationRepository(db)
	log.Info("Repositories initialized")

	// Initialize use cases
	inventoryUC := usecase.NewInventoryUseCase(stockRepo, reservationRepo, redisClient, log)
	log.Info("Use cases initialized")

	// Start background job for expiring reservations
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	inventoryUC.StartReservationExpiryJob(ctx)

	// Create gRPC server
	grpcServer := grpc.NewServer(inventoryUC, log)

	// Create HTTP server for health checks
	httpServer := httphandler.NewServer(cfg.HTTPPort, log)

	// Start gRPC server in goroutine
	grpcAddr := fmt.Sprintf(":%s", cfg.GRPCPort)
	grpcListener, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatal("Failed to create gRPC listener", "error", err)
	}

	go func() {
		log.Info("gRPC server starting", "port", cfg.GRPCPort)
		if err := grpcServer.Serve(grpcListener); err != nil {
			log.Fatal("gRPC server failed", "error", err)
		}
	}()

	// Start HTTP server in goroutine
	go func() {
		log.Info("HTTP server starting", "port", cfg.HTTPPort)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("HTTP server failed", "error", err)
		}
	}()

	log.Info("Inventory Service started successfully",
		"grpc_port", cfg.GRPCPort,
		"http_port", cfg.HTTPPort,
	)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down servers...")

	// Graceful shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), models.GracefulShutdownTimeout)
	defer shutdownCancel()

	// Stop gRPC server
	grpcServer.GracefulStop()

	// Stop HTTP server
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Error("HTTP server shutdown error", "error", err)
	}

	// Close Redis connection
	if err := redisClient.Close(); err != nil {
		log.Error("Redis close error", "error", err)
	}

	// Close database connection
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	log.Info("Inventory Service stopped")
}
