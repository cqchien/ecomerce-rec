package main

import (
	"fmt"
	"net"
	"strings"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/delivery/grpc"
	httpDelivery "github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/delivery/http"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/infrastructure/database"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/infrastructure/kafka"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/infrastructure/models"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/infrastructure/redis"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/repository/postgres"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/pkg/config"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/pkg/logger"
	grpcServer "google.golang.org/grpc"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	log := logger.New(cfg.LogLevel)
	log.Info("Starting event service...")

	// Connect to PostgreSQL
	db, err := database.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	log.Info("Connected to PostgreSQL")

	// Auto-migrate models
	if err := db.AutoMigrate(&models.Event{}); err != nil {
		log.Fatal("Failed to migrate database", "error", err)
	}
	log.Info("Database migration completed")

	// Connect to Redis
	redisClient := redis.NewRedisClient(cfg.RedisURL)
	log.Info("Connected to Redis")

	// Initialize Kafka publisher
	brokers := strings.Split(cfg.KafkaBrokers, ",")
	kafkaPublisher := kafka.NewPublisher(brokers, cfg.KafkaTopic)
	log.Info("Kafka publisher initialized", "brokers", cfg.KafkaBrokers, "topic", cfg.KafkaTopic)

	// Initialize repository
	eventRepo := postgres.NewEventRepository(db)

	// Initialize use case
	eventUseCase := usecase.NewEventUseCase(eventRepo, kafkaPublisher)

	// Initialize gRPC handler
	eventHandler := grpc.NewEventHandler(eventUseCase)

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
	pb.RegisterEventServiceServer(grpcSrv, eventHandler)

	log.Info("gRPC server listening", "port", cfg.GRPCPort)
	if err := grpcSrv.Serve(lis); err != nil {
		log.Fatal("Failed to serve", "error", err)
	}
}
