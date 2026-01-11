package redis

import (
	"context"

	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/logger"
	"github.com/redis/go-redis/v9"
)

// NewRedisClient creates a new Redis client
func NewRedisClient(redisURL string) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		logger.Errorf("Failed to connect to Redis: %v", err)
		return nil, err
	}

	logger.Info("Redis connection established")
	return client, nil
}
