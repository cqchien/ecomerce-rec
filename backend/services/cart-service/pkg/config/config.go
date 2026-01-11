package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/internal/infrastructure/database/models"
)

// Config holds all configuration for the service
type Config struct {
	ServiceName string
	Port        string
	GRPCPort    string
	LogLevel    string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// Cart settings
	CartAbandonedDays int
	CartExpiryDays    int
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		ServiceName: getEnv("SERVICE_NAME", "cart-service"),
		Port:        getEnv("PORT", models.DefaultHTTPPort),
		GRPCPort:    getEnv("GRPC_PORT", models.DefaultGRPCPort),
		LogLevel:    getEnv("LOG_LEVEL", "info"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "cart_db"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", "redis123"),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		CartAbandonedDays: getEnvAsInt("CART_ABANDONED_DAYS", 7),
		CartExpiryDays:    getEnvAsInt("CART_EXPIRY_DAYS", 30),
	}

	return cfg, nil
}

// GetDSN returns the database connection string
func (c *Config) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

// GetRedisAddr returns the Redis address
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%s", c.RedisHost, c.RedisPort)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
