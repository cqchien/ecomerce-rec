package config

import (
	"os"

	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database/models"
)

// Config holds all configuration for the service
type Config struct {
	// Server configuration
	GRPCPort string
	HTTPPort string

	// Database configuration
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// Redis configuration
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// Service configuration
	Environment string
	LogLevel    string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		// Server
		GRPCPort: getEnv("GRPC_PORT", models.DefaultGRPCPort),
		HTTPPort: getEnv("HTTP_PORT", models.DefaultHTTPPort),

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "inventory_db"),

		// Redis
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       0,

		// Service
		Environment: getEnv("ENVIRONMENT", "development"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
