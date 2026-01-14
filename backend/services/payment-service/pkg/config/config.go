package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all configuration for the payment service
type Config struct {
	ServiceName string
	Port        string
	GRPCPort    string
	LogLevel    string

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
	RedisDB       int
	RedisURL      string

	// Stripe
	StripePublishableKey string
	StripeSecretKey      string
}

// Load loads configuration from environment variables
func Load() *Config {
	cfg := &Config{
		ServiceName: getEnv("SERVICE_NAME", "payment-service"),
		Port:        getEnv("PORT", "3006"),
		GRPCPort:    getEnv("GRPC_PORT", "50055"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "ecommerce_db"),
		DBSchema:   getEnv("DB_SCHEMA", "payments"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", "redis123"),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		StripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
		StripeSecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
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

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
