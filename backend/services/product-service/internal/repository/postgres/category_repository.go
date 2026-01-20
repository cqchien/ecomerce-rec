package postgres

import (
	"context"
	"fmt"

	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database/models"
	"gorm.io/gorm"
)

type categoryRepository struct {
	db *gorm.DB
}

/**
 * Creates a new category repository instance
 * @param db GORM database instance
 * @return CategoryRepository interface
 */
func NewCategoryRepository(db *gorm.DB) domain.CategoryRepository {
	return &categoryRepository{db: db}
}

/**
 * Creates a new category in the database
 * @param category Category entity to create
 */
func (r *categoryRepository) Create(ctx context.Context, category *domain.Category) error {
	dbCategory := r.domainToModel(category)

	if err := r.db.WithContext(ctx).Create(dbCategory).Error; err != nil {
		return fmt.Errorf("failed to create category: %w", err)
	}

	category.ID = dbCategory.ID

	return nil
}

/**
 * Updates an existing category in the database
 * @param category Category entity with updated values
 */
func (r *categoryRepository) Update(ctx context.Context, category *domain.Category) error {
	dbCategory := r.domainToModel(category)

	result := r.db.WithContext(ctx).
		Model(&models.Category{}).
		Where("id = ?", category.ID).
		Updates(dbCategory)

	if result.Error != nil {
		return fmt.Errorf("failed to update category: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("category not found")
	}

	return nil
}

/**
 * Deletes a category by ID
 * @param id Category ID
 */
func (r *categoryRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&models.Category{}, "id = ?", id)

	if result.Error != nil {
		return fmt.Errorf("failed to delete category: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("category not found")
	}

	return nil
}

/**
 * Retrieves a category by ID
 * @param id Category ID
 * @return Category entity
 */
func (r *categoryRepository) GetByID(ctx context.Context, id string) (*domain.Category, error) {
	var dbCategory models.Category

	err := r.db.WithContext(ctx).First(&dbCategory, "id = ?", id).Error

	if err == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("category not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	return r.modelToDomain(&dbCategory), nil
}

/**
 * Retrieves a category by slug
 * @param slug Category slug
 * @return Category entity
 */
func (r *categoryRepository) GetBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	var dbCategory models.Category

	err := r.db.WithContext(ctx).First(&dbCategory, "slug = ?", slug).Error

	if err == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("category not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	return r.modelToDomain(&dbCategory), nil
}

/**
 * Lists categories with optional parent filter
 * @param parentID Optional parent category ID
 * @return List of categories
 */
func (r *categoryRepository) List(ctx context.Context, parentID *string) ([]domain.Category, error) {
	var dbCategories []models.Category

	query := r.db.WithContext(ctx).Model(&models.Category{})

	if parentID != nil {
		query = query.Where("parent_id = ?", *parentID)
	} else {
		query = query.Where("parent_id IS NULL")
	}

	err := query.Order("sort_order, name").Find(&dbCategories).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}

	categories := make([]domain.Category, len(dbCategories))
	for i, c := range dbCategories {
		categories[i] = *r.modelToDomain(&c)
	}

	return categories, nil
}

/**
 * Retrieves categories with product count for each
 * @return List of categories with product counts
 */
func (r *categoryRepository) GetWithProductCount(ctx context.Context) ([]domain.Category, error) {
	var results []struct {
		models.Category
		ProductCount int32
	}

	err := r.db.WithContext(ctx).
		Model(&models.Category{}).
		Select("categories.*, COUNT(products.id) as product_count").
		Joins("LEFT JOIN products ON categories.id = products.category_id AND products.status = ?", models.ProductStatusActive).
		Group("categories.id").
		Order("categories.sort_order, categories.name").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get categories with count: %w", err)
	}

	categories := make([]domain.Category, len(results))
	for i, result := range results {
		category := r.modelToDomain(&result.Category)
		category.ProductCount = result.ProductCount
		categories[i] = *category
	}

	return categories, nil
}

func (r *categoryRepository) domainToModel(category *domain.Category) *models.Category {
	return &models.Category{
		ID:          category.ID,
		Name:        category.Name,
		Slug:        category.Slug,
		Description: category.Description,
		ParentID:    category.ParentID,
		Image:       category.Image,
		SortOrder:   category.SortOrder,
		IsActive:    category.IsActive,
		CreatedAt:   category.CreatedAt,
		UpdatedAt:   category.UpdatedAt,
	}
}

func (r *categoryRepository) modelToDomain(dbCategory *models.Category) *domain.Category {
	return &domain.Category{
		ID:           dbCategory.ID,
		Name:         dbCategory.Name,
		Slug:         dbCategory.Slug,
		Description:  dbCategory.Description,
		ParentID:     dbCategory.ParentID,
		Image:        dbCategory.Image,
		ProductCount: dbCategory.ProductCount,
		SortOrder:    dbCategory.SortOrder,
		IsActive:     dbCategory.IsActive,
		CreatedAt:    dbCategory.CreatedAt,
		UpdatedAt:    dbCategory.UpdatedAt,
	}
}
