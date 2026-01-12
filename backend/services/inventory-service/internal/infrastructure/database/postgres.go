package database

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database/models"
	pkglogger "github.com/cqchien/ecomerce-rec/backend/services/inventory-service/pkg/logger"
)

// NewPostgresDB creates a new PostgreSQL connection using GORM
func NewPostgresDB(host, port, user, password, dbname string, log pkglogger.Logger) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB for connection pool settings
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings using constants
	sqlDB.SetMaxOpenConns(models.MaxOpenConnections)
	sqlDB.SetMaxIdleConns(models.MaxIdleConnections)
	sqlDB.SetConnMaxLifetime(models.ConnectionMaxLifetime)

	log.Info("Connected to PostgreSQL database")
	return db, nil
}

// RunMigrations runs database migrations using GORM AutoMigrate
func RunMigrations(db *gorm.DB, log pkglogger.Logger) error {
	log.Info("Running database migrations...")

	// AutoMigrate will create tables, missing columns and missing indexes
	// It will NOT change existing column's type or delete unused columns
	err := db.AutoMigrate(
		&models.Stock{},
		&models.Reservation{},
		&models.StockMovement{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Create additional indexes for better query performance
	if err := createIndexes(db); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	log.Info("Database migrations completed successfully")
	return nil
}

// createIndexes creates additional composite indexes for better performance
func createIndexes(db *gorm.DB) error {
	// Composite index for stock lookup by product and variant
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_stocks_product_variant_warehouse 
		ON stocks(product_id, variant_id, warehouse_id) 
		WHERE deleted_at IS NULL
	`).Error; err != nil {
		return err
	}

	// Index for finding expired reservations
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_reservations_expires_status 
		ON reservations(expires_at, status) 
		WHERE deleted_at IS NULL
	`).Error; err != nil {
		return err
	}

	// Index for stock movements audit trail
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created 
		ON stock_movements(product_id, variant_id, created_at DESC)
	`).Error; err != nil {
		return err
	}

	return nil
}
