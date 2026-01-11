package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL          string
	RedisURL             string
	HTTPPort             string
	GRPCPort             string
	ProductServiceAddr   string
	InventoryServiceAddr string
	PaymentServiceAddr   string
}

func LoadConfig() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		DatabaseURL:          getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable"),
		RedisURL:             getEnv("REDIS_URL", "localhost:6379"),
		HTTPPort:             getEnv("PORT", "3005"),
		GRPCPort:             getEnv("GRPC_PORT", "50054"),
		ProductServiceAddr:   getEnv("PRODUCT_SERVICE_ADDR", "localhost:50051"),
		InventoryServiceAddr: getEnv("INVENTORY_SERVICE_ADDR", "localhost:50052"),
		PaymentServiceAddr:   getEnv("PAYMENT_SERVICE_ADDR", "localhost:50053"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
