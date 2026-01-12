package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/recommendation-service/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes the database connection
func InitDB() error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Shanghai",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto migrate the schema
	if err := autoMigrate(); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

// autoMigrate runs database migrations
func autoMigrate() error {
	return DB.AutoMigrate(
		&models.UserInteraction{},
		&models.ProductSimilarity{},
		&models.TrendingProduct{},
		&models.UserRecommendation{},
	)
}

// CloseDB closes the database connection
func CloseDB() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
