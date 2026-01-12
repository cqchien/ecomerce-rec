package cache

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client
var ctx = context.Background()

// InitRedis initializes the Redis connection
func InitRedis() error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
		Password:     os.Getenv("REDIS_PASSWORD"),
		DB:           0,
		DialTimeout:  10 * time.Second,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		PoolSize:     10,
		PoolTimeout:  30 * time.Second,
	})

	// Test connection
	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Redis connected successfully")
	return nil
}

// CloseRedis closes the Redis connection
func CloseRedis() error {
	if RedisClient != nil {
		return RedisClient.Close()
	}
	return nil
}

// Get retrieves a value from Redis
func Get(key string) (string, error) {
	return RedisClient.Get(ctx, key).Result()
}

// Set stores a value in Redis with TTL
func Set(key string, value interface{}, ttl time.Duration) error {
	return RedisClient.Set(ctx, key, value, ttl).Err()
}

// Delete removes a key from Redis
func Delete(key string) error {
	return RedisClient.Del(ctx, key).Err()
}

// DeletePattern removes all keys matching a pattern
func DeletePattern(pattern string) error {
	iter := RedisClient.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := RedisClient.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}

// Exists checks if a key exists
func Exists(key string) (bool, error) {
	count, err := RedisClient.Exists(ctx, key).Result()
	return count > 0, err
}

// Expire sets a TTL on a key
func Expire(key string, ttl time.Duration) error {
	return RedisClient.Expire(ctx, key, ttl).Err()
}
