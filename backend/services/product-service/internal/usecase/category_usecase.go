package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/pkg/logger"
	"github.com/google/uuid"
)

type categoryUseCase struct {
	categoryRepo domain.CategoryRepository
	redis        RedisClient
	logger       logger.Logger
	cacheTTL     time.Duration
}

// NewCategoryUseCase creates a new category use case
func NewCategoryUseCase(
	categoryRepo domain.CategoryRepository,
	redis RedisClient,
	logger logger.Logger,
) *categoryUseCase {
	return &categoryUseCase{
		categoryRepo: categoryRepo,
		redis:        redis,
		logger:       logger,
		cacheTTL:     models.CategoryCacheTTL,
	}
}

func (uc *categoryUseCase) GetCategory(ctx context.Context, id string) (*domain.Category, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyCategory, id)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var category domain.Category
		if err := json.Unmarshal([]byte(cached), &category); err == nil {
			uc.logger.Debug("Category retrieved from cache", "id", id)
			return &category, nil
		}
	}

	// Get from database
	category, err := uc.categoryRepo.GetByID(ctx, id)
	if err != nil {
		uc.logger.Error("Failed to get category", "id", id, "error", err)
		return nil, fmt.Errorf("get category: %w", err)
	}

	// Cache the result
	categoryJSON, _ := json.Marshal(category)
	uc.redis.Set(ctx, cacheKey, categoryJSON, uc.cacheTTL)

	return category, nil
}

func (uc *categoryUseCase) GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyCategorySlug, slug)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var category domain.Category
		if err := json.Unmarshal([]byte(cached), &category); err == nil {
			uc.logger.Debug("Category retrieved from cache", "slug", slug)
			return &category, nil
		}
	}

	// Get from database
	category, err := uc.categoryRepo.GetBySlug(ctx, slug)
	if err != nil {
		uc.logger.Error("Failed to get category by slug", "slug", slug, "error", err)
		return nil, fmt.Errorf("get category by slug: %w", err)
	}

	// Cache the result
	categoryJSON, _ := json.Marshal(category)
	uc.redis.Set(ctx, cacheKey, categoryJSON, uc.cacheTTL)

	return category, nil
}

func (uc *categoryUseCase) ListCategories(ctx context.Context, parentID *string) ([]domain.Category, error) {
	// Try cache first
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

	// Get from database
	categories, err := uc.categoryRepo.List(ctx, parentID)
	if err != nil {
		uc.logger.Error("Failed to list categories", "error", err)
		return nil, fmt.Errorf("list categories: %w", err)
	}

	// Cache the result
	categoriesJSON, _ := json.Marshal(categories)
	uc.redis.Set(ctx, cacheKey, categoriesJSON, uc.cacheTTL)

	return categories, nil
}

func (uc *categoryUseCase) GetCategoriesWithProductCount(ctx context.Context) ([]domain.Category, error) {
	// Try cache first
	cacheKey := models.CacheKeyCategoriesCount
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var categories []domain.Category
		if err := json.Unmarshal([]byte(cached), &categories); err == nil {
			uc.logger.Debug("Categories with count retrieved from cache")
			return categories, nil
		}
	}

	// Get from database
	categories, err := uc.categoryRepo.GetWithProductCount(ctx)
	if err != nil {
		uc.logger.Error("Failed to get categories with count", "error", err)
		return nil, fmt.Errorf("get categories with count: %w", err)
	}

	// Cache the result
	categoriesJSON, _ := json.Marshal(categories)
	uc.redis.Set(ctx, cacheKey, categoriesJSON, models.CategoryCountsCacheTTL) // Shorter TTL due to product counts

	return categories, nil
}

func (uc *categoryUseCase) CreateCategory(ctx context.Context, category *domain.Category) error {
	// Generate ID and timestamps
	category.ID = uuid.New().String()
	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	// Validate parent category if provided
	if category.ParentID != nil {
		_, err := uc.categoryRepo.GetByID(ctx, *category.ParentID)
		if err != nil {
			return fmt.Errorf("invalid parent category: %w", err)
		}
	}

	// Create category
	if err := uc.categoryRepo.Create(ctx, category); err != nil {
		uc.logger.Error("Failed to create category", "error", err)
		return fmt.Errorf("create category: %w", err)
	}

	// Invalidate category cache
	uc.invalidateCategoryCache(ctx, category.ParentID)

	uc.logger.Info("Category created", "id", category.ID, "name", category.Name)
	return nil
}

func (uc *categoryUseCase) UpdateCategory(ctx context.Context, category *domain.Category) error {
	// Validate category exists
	existing, err := uc.categoryRepo.GetByID(ctx, category.ID)
	if err != nil {
		return fmt.Errorf("category not found: %w", err)
	}

	// Validate parent category if changed
	if category.ParentID != nil {
		// Prevent self-reference
		if *category.ParentID == category.ID {
			return fmt.Errorf("category cannot be its own parent")
		}

		_, err := uc.categoryRepo.GetByID(ctx, *category.ParentID)
		if err != nil {
			return fmt.Errorf("invalid parent category: %w", err)
		}
	}

	category.UpdatedAt = time.Now()

	// Update category
	if err := uc.categoryRepo.Update(ctx, category); err != nil {
		uc.logger.Error("Failed to update category", "id", category.ID, "error", err)
		return fmt.Errorf("update category: %w", err)
	}

	// Invalidate cache
	uc.redis.Del(ctx,
		fmt.Sprintf("%s%s", models.CacheKeyCategory, category.ID),
		fmt.Sprintf("%s%s", models.CacheKeyCategorySlug, category.Slug),
	)
	uc.invalidateCategoryCache(ctx, existing.ParentID)
	uc.invalidateCategoryCache(ctx, category.ParentID)

	uc.logger.Info("Category updated", "id", category.ID, "name", category.Name)
	return nil
}

func (uc *categoryUseCase) DeleteCategory(ctx context.Context, id string) error {
	// Validate category exists
	category, err := uc.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("category not found: %w", err)
	}

	// Check if category has children
	children, err := uc.categoryRepo.List(ctx, &id)
	if err != nil {
		return fmt.Errorf("check category children: %w", err)
	}
	if len(children) > 0 {
		return fmt.Errorf("cannot delete category with subcategories")
	}

	// Delete category
	if err := uc.categoryRepo.Delete(ctx, id); err != nil {
		uc.logger.Error("Failed to delete category", "id", id, "error", err)
		return fmt.Errorf("delete category: %w", err)
	}

	// Invalidate cache
	uc.redis.Del(ctx,
		fmt.Sprintf("%s%s", models.CacheKeyCategory, id),
		fmt.Sprintf("%s%s", models.CacheKeyCategorySlug, category.Slug),
	)
	uc.invalidateCategoryCache(ctx, category.ParentID)

	uc.logger.Info("Category deleted", "id", id)
	return nil
}

func (uc *categoryUseCase) invalidateCategoryCache(ctx context.Context, parentID *string) {
	keys := []string{models.CacheKeyCategoriesAll, models.CacheKeyCategoriesCount}
	if parentID != nil {
		keys = append(keys, fmt.Sprintf("%s%s", models.CacheKeyCategoriesParent, *parentID))
	}
	uc.redis.Del(ctx, keys...)
}
