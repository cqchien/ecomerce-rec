package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/pkg/logger"
)

type CategoryUseCase struct {
	categoryRepo domain.CategoryRepository
	redis        RedisClient
	logger       logger.Logger
	cacheTTL     time.Duration
}

/**
 * Creates a new category use case
 * @param categoryRepo Category repository instance
 * @param redis Redis client instance
 * @param logger Logger instance
 * @return CategoryUseCase instance
 */
func NewCategoryUseCase(
	categoryRepo domain.CategoryRepository,
	redis RedisClient,
	logger logger.Logger,
) *CategoryUseCase {
	return &CategoryUseCase{
		categoryRepo: categoryRepo,
		redis:        redis,
		logger:       logger,
		cacheTTL:     models.CategoryCacheTTL,
	}
}

/**
 * Retrieves a category by ID with caching
 * @param id Category ID
 * @return Category entity
 */
func (uc *CategoryUseCase) GetCategory(ctx context.Context, id string) (*domain.Category, error) {
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyCategory, id)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var category domain.Category
		if err := json.Unmarshal([]byte(cached), &category); err == nil {
			uc.logger.Debug("Category retrieved from cache", "id", id)
			return &category, nil
		}
	}

	category, err := uc.categoryRepo.GetByID(ctx, id)
	if err != nil {
		uc.logger.Error("Failed to get category", "id", id, "error", err)
		return nil, fmt.Errorf("get category: %w", err)
	}

	categoryJSON, _ := json.Marshal(category)
	uc.redis.Set(ctx, cacheKey, categoryJSON, uc.cacheTTL)

	return category, nil
}

/**
 * Retrieves a category by slug with caching
 * @param slug Category slug
 * @return Category entity
 */
func (uc *CategoryUseCase) GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyCategorySlug, slug)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var category domain.Category
		if err := json.Unmarshal([]byte(cached), &category); err == nil {
			uc.logger.Debug("Category retrieved from cache", "slug", slug)
			return &category, nil
		}
	}

	category, err := uc.categoryRepo.GetBySlug(ctx, slug)
	if err != nil {
		uc.logger.Error("Failed to get category by slug", "slug", slug, "error", err)
		return nil, fmt.Errorf("get category by slug: %w", err)
	}

	categoryJSON, _ := json.Marshal(category)
	uc.redis.Set(ctx, cacheKey, categoryJSON, uc.cacheTTL)

	return category, nil
}

/**
 * Lists categories with optional parent filter and caching
 * @param parentID Optional parent category ID
 * @return List of categories
 */
func (uc *CategoryUseCase) ListCategories(ctx context.Context, parentID *string) ([]domain.Category, error) {
	cacheKey := models.CacheKeyCategoriesAll
	if parentID != nil {
		cacheKey = fmt.Sprintf("%s%s", models.CacheKeyCategoriesParent, *parentID)
	}

	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var categories []domain.Category
		if err := json.Unmarshal([]byte(cached), &categories); err == nil {
			uc.logger.Debug("Categories retrieved from cache")
			return categories, nil
		}
	}

	categories, err := uc.categoryRepo.List(ctx, parentID)
	if err != nil {
		uc.logger.Error("Failed to list categories", "error", err)
		return nil, fmt.Errorf("list categories: %w", err)
	}

	categoriesJSON, _ := json.Marshal(categories)
	uc.redis.Set(ctx, cacheKey, categoriesJSON, models.CategoryListCacheTTL)

	return categories, nil
}

/**
 * Retrieves categories with product counts
 * @return List of categories with product counts
 */
func (uc *CategoryUseCase) GetCategoriesWithProductCount(ctx context.Context) ([]domain.Category, error) {
	cacheKey := models.CacheKeyCategoriesCount
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var categories []domain.Category
		if err := json.Unmarshal([]byte(cached), &categories); err == nil {
			uc.logger.Debug("Categories with count retrieved from cache")
			return categories, nil
		}
	}

	categories, err := uc.categoryRepo.GetWithProductCount(ctx)
	if err != nil {
		uc.logger.Error("Failed to get categories with count", "error", err)
		return nil, fmt.Errorf("get categories with count: %w", err)
	}

	categoriesJSON, _ := json.Marshal(categories)
	uc.redis.Set(ctx, cacheKey, categoriesJSON, models.CategoryCountsCacheTTL)

	return categories, nil
}

/**
 * Creates a new category
 * @param category Category entity to create
 */
func (uc *CategoryUseCase) CreateCategory(ctx context.Context, category *domain.Category) error {
	if category.ParentID != nil {
		_, err := uc.categoryRepo.GetByID(ctx, *category.ParentID)
		if err != nil {
			return fmt.Errorf("invalid parent category: %w", err)
		}
	}

	if err := uc.categoryRepo.Create(ctx, category); err != nil {
		uc.logger.Error("Failed to create category", "error", err)
		return fmt.Errorf("create category: %w", err)
	}

	uc.invalidateCache(ctx)

	uc.logger.Info("Category created", "id", category.ID, "name", category.Name)
	return nil
}

/**
 * Updates an existing category
 * @param category Category entity with updated values
 */
func (uc *CategoryUseCase) UpdateCategory(ctx context.Context, category *domain.Category) error {
	_, err := uc.categoryRepo.GetByID(ctx, category.ID)
	if err != nil {
		return fmt.Errorf("category not found: %w", err)
	}

	if category.ParentID != nil {
		if *category.ParentID == category.ID {
			return fmt.Errorf("category cannot be its own parent")
		}
		_, err := uc.categoryRepo.GetByID(ctx, *category.ParentID)
		if err != nil {
			return fmt.Errorf("invalid parent category: %w", err)
		}
	}

	if err := uc.categoryRepo.Update(ctx, category); err != nil {
		uc.logger.Error("Failed to update category", "id", category.ID, "error", err)
		return fmt.Errorf("update category: %w", err)
	}

	uc.invalidateCache(ctx)

	uc.logger.Info("Category updated", "id", category.ID, "name", category.Name)
	return nil
}

/**
 * Deletes a category by ID
 * @param id Category ID
 */
func (uc *CategoryUseCase) DeleteCategory(ctx context.Context, id string) error {
	category, err := uc.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("category not found: %w", err)
	}

	children, err := uc.categoryRepo.List(ctx, &id)
	if err != nil {
		return fmt.Errorf("failed to check children: %w", err)
	}
	if len(children) > 0 {
		return fmt.Errorf("cannot delete category with children")
	}

	if err := uc.categoryRepo.Delete(ctx, id); err != nil {
		uc.logger.Error("Failed to delete category", "id", id, "error", err)
		return fmt.Errorf("delete category: %w", err)
	}

	uc.invalidateCache(ctx)

	uc.logger.Info("Category deleted", "id", id, "name", category.Name)
	return nil
}

func (uc *CategoryUseCase) invalidateCache(ctx context.Context) {
	cacheKeys := []string{
		models.CacheKeyCategoriesAll,
		models.CacheKeyCategoriesCount,
	}
	uc.redis.Del(ctx, cacheKeys...)
}
