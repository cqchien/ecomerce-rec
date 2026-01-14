package database

import (
	"os"

	"github.com/cqchien/ecomerce-rec/backend/services/order-service/internal/infrastructure/models"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NewPostgresDB creates a new PostgreSQL database connection
func NewPostgresDB(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err == nil {
		schema := os.Getenv("DB_SCHEMA")
		if schema == "" {
			schema = "orders"
		}
		db.Exec("SET search_path TO " + schema + ", public")
	}
	if err != nil {
		logger.Errorf("Failed to connect to database: %v", err)
		return nil, err
	}

	// Auto migrate the schema
	if err := db.AutoMigrate(&models.Order{}, &models.OrderItem{}); err != nil {
		logger.Errorf("Failed to migrate database: %v", err)
		return nil, err
	}

	logger.Info("Database connection established and migrations completed")
	return db, nil
}
