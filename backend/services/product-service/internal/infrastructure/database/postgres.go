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
	// Just use the DSN directly without pgx configuration
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	// Connect to database using standard postgres driver
	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), gormConfig)
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
	// Skip AutoMigrate since we use init scripts for schema creation
	// Verify tables exist
	if !db.Migrator().HasTable(&models.Category{}) {
		return fmt.Errorf("categories table not found - ensure init scripts have run")
	}
	if !db.Migrator().HasTable(&models.Product{}) {
		return fmt.Errorf("products table not found - ensure init scripts have run")
	}
	if !db.Migrator().HasTable(&models.ProductVariant{}) {
		return fmt.Errorf("product_variants table not found - ensure init scripts have run")
	}

	// Create GIN index for tags (GORM doesn't support this automatically)
	err := db.Exec("CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags)").Error
	if err != nil {
		return fmt.Errorf("failed to create GIN index: %w", err)
	}

	return nil
}
