package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	// Database
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBSchema    string
	DBSSLMode   string
	DatabaseURL string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisURL      string

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

	cfg := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "ecommerce_db"),
		DBSchema:   getEnv("DB_SCHEMA", "orders"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		HTTPPort:             getEnv("HTTP_PORT", "3004"),
		GRPCPort:             getEnv("GRPC_PORT", "50053"),
		ProductServiceAddr:   getEnv("PRODUCT_SERVICE_ADDR", "localhost:50051"),
		InventoryServiceAddr: getEnv("INVENTORY_SERVICE_ADDR", "localhost:50052"),
		PaymentServiceAddr:   getEnv("PAYMENT_SERVICE_ADDR", "localhost:50055"),
	}

	// Build composite URLs
	cfg.DatabaseURL = fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s search_path=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSchema, cfg.DBSSLMode,
	)
	cfg.RedisURL = fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
