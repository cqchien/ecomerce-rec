package config

import "os"

// Config holds all configuration for the service
type Config struct {
	// Server configuration
	GRPCPort string

	// Database configuration
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Redis configuration
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// Service configuration
	LogLevel string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		// Server
		GRPCPort: getEnv("GRPC_PORT", "4005"),

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "recommendation_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		// Redis
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       0,

		// Service
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
