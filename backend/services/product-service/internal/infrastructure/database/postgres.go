package database

import (
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/pkg/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewPostgresDB creates a new PostgreSQL database connection using GORM
func NewPostgresDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := cfg.GetDSN()

	// Configure GORM
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB for connection pool settings
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxOpenConns(models.MaxOpenConnections)
	sqlDB.SetMaxIdleConns(models.MaxIdleConnections)
	sqlDB.SetConnMaxLifetime(models.ConnectionMaxLifetime)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

// RunMigrations runs database migrations using GORM AutoMigrate
func RunMigrations(db *gorm.DB) error {
	// Auto migrate all models
	err := db.AutoMigrate(
		&models.Category{},
		&models.Product{},
		&models.ProductVariant{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Create GIN index for tags (GORM doesn't support this automatically)
	err = db.Exec("CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags)").Error
	if err != nil {
		return fmt.Errorf("failed to create GIN index: %w", err)
	}

	return nil
}
