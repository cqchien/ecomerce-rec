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

// RedisClient defines redis operations needed
type RedisClient interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Del(ctx context.Context, keys ...string) error
}

type productUseCase struct {
	productRepo  domain.ProductRepository
	categoryRepo domain.CategoryRepository
	redis        RedisClient
	logger       logger.Logger
	cacheTTL     time.Duration
}

// NewProductUseCase creates a new product use case
func NewProductUseCase(
	productRepo domain.ProductRepository,
	categoryRepo domain.CategoryRepository,
	redis RedisClient,
	logger logger.Logger,
) *productUseCase {
	return &productUseCase{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
		redis:        redis,
		logger:       logger,
		cacheTTL:     models.ProductCacheTTL,
	}
}

func (uc *productUseCase) GetProduct(ctx context.Context, id string) (*domain.Product, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyProduct, id)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var product domain.Product
		if err := json.Unmarshal([]byte(cached), &product); err == nil {
			uc.logger.Debug("Product retrieved from cache", "id", id)
			return &product, nil
		}
	}

	// Get from database
	product, err := uc.productRepo.GetByID(ctx, id)
	if err != nil {
		uc.logger.Error("Failed to get product", "id", id, "error", err)
		return nil, fmt.Errorf("get product: %w", err)
	}

	// Cache the result
	productJSON, _ := json.Marshal(product)
	uc.redis.Set(ctx, cacheKey, productJSON, uc.cacheTTL)

	return product, nil
}

func (uc *productUseCase) GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyProductSlug, slug)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var product domain.Product
		if err := json.Unmarshal([]byte(cached), &product); err == nil {
			uc.logger.Debug("Product retrieved from cache", "slug", slug)
			return &product, nil
		}
	}

	// Get from database
	product, err := uc.productRepo.GetBySlug(ctx, slug)
	if err != nil {
		uc.logger.Error("Failed to get product by slug", "slug", slug, "error", err)
		return nil, fmt.Errorf("get product by slug: %w", err)
	}

	// Cache the result
	productJSON, _ := json.Marshal(product)
	uc.redis.Set(ctx, cacheKey, productJSON, uc.cacheTTL)

	return product, nil
}

func (uc *productUseCase) ListProducts(ctx context.Context, filter *domain.ProductFilter, pagination *domain.Pagination) (*domain.PaginatedProducts, error) {
	products, err := uc.productRepo.List(ctx, filter, pagination)
	if err != nil {
		uc.logger.Error("Failed to list products", "error", err)
		return nil, fmt.Errorf("list products: %w", err)
	}

	return products, nil
}

func (uc *productUseCase) SearchProducts(ctx context.Context, query string, filter *domain.ProductFilter, pagination *domain.Pagination) (*domain.PaginatedProducts, error) {
	products, err := uc.productRepo.Search(ctx, query, filter, pagination)
	if err != nil {
		uc.logger.Error("Failed to search products", "query", query, "error", err)
		return nil, fmt.Errorf("search products: %w", err)
	}

	return products, nil
}

func (uc *productUseCase) GetProductsByIDs(ctx context.Context, ids []string) ([]domain.Product, error) {
	products, err := uc.productRepo.GetByIDs(ctx, ids)
	if err != nil {
		uc.logger.Error("Failed to get products by IDs", "error", err)
		return nil, fmt.Errorf("get products by IDs: %w", err)
	}

	return products, nil
}

func (uc *productUseCase) CreateProduct(ctx context.Context, product *domain.Product) error {
	// Generate ID and timestamps
	product.ID = uuid.New().String()
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	// Validate category exists
	_, err := uc.categoryRepo.GetByID(ctx, product.CategoryID)
	if err != nil {
		return fmt.Errorf("invalid category: %w", err)
	}

	// Create product
	if err := uc.productRepo.Create(ctx, product); err != nil {
		uc.logger.Error("Failed to create product", "error", err)
		return fmt.Errorf("create product: %w", err)
	}

	uc.logger.Info("Product created", "id", product.ID, "name", product.Name)
	return nil
}

func (uc *productUseCase) UpdateProduct(ctx context.Context, product *domain.Product) error {
	// Validate product exists
	existing, err := uc.productRepo.GetByID(ctx, product.ID)
	if err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	// Validate category if changed
	if product.CategoryID != existing.CategoryID {
		_, err := uc.categoryRepo.GetByID(ctx, product.CategoryID)
		if err != nil {
			return fmt.Errorf("invalid category: %w", err)
		}
	}

	product.UpdatedAt = time.Now()

	// Update product
	if err := uc.productRepo.Update(ctx, product); err != nil {
		uc.logger.Error("Failed to update product", "id", product.ID, "error", err)
		return fmt.Errorf("update product: %w", err)
	}

	// Invalidate cache
	cacheKeys := []string{
		fmt.Sprintf("%s%s", models.CacheKeyProduct, product.ID),
		fmt.Sprintf("%s%s", models.CacheKeyProductSlug, product.Slug),
	}
	uc.redis.Del(ctx, cacheKeys...)

	uc.logger.Info("Product updated", "id", product.ID, "name", product.Name)
	return nil
}

func (uc *productUseCase) DeleteProduct(ctx context.Context, id string) error {
	// Validate product exists
	product, err := uc.productRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	// Delete product
	if err := uc.productRepo.Delete(ctx, id); err != nil {
		uc.logger.Error("Failed to delete product", "id", id, "error", err)
		return fmt.Errorf("delete product: %w", err)
	}

	// Invalidate cache
	cacheKeys := []string{
		fmt.Sprintf("%s%s", models.CacheKeyProduct, id),
		fmt.Sprintf("%s%s", models.CacheKeyProductSlug, product.Slug),
	}
	uc.redis.Del(ctx, cacheKeys...)

	uc.logger.Info("Product deleted", "id", id)
	return nil
}

func (uc *productUseCase) GetRelatedProducts(ctx context.Context, productID string, limit int32) ([]domain.Product, error) {
	// Get the product to find its category
	product, err := uc.productRepo.GetByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	// Get products in the same category
	filter := &domain.ProductFilter{
		CategoryID: &product.CategoryID,
		Status:     ptrProductStatus(domain.ProductStatusActive),
	}

	pagination := &domain.Pagination{
		Page:  1,
		Limit: limit,
	}

	result, err := uc.productRepo.List(ctx, filter, pagination)
	if err != nil {
		return nil, fmt.Errorf("list related products: %w", err)
	}

	// Filter out the current product
	related := []domain.Product{}
	for _, p := range result.Products {
		if p.ID != productID {
			related = append(related, p)
		}
	}

	return related, nil
}

func (uc *productUseCase) UpdateRating(ctx context.Context, productID string, rating float64, reviewCount int32) error {
	if err := uc.productRepo.UpdateRating(ctx, productID, rating, reviewCount); err != nil {
		uc.logger.Error("Failed to update rating", "id", productID, "error", err)
		return fmt.Errorf("update rating: %w", err)
	}

	// Invalidate cache
	uc.redis.Del(ctx, fmt.Sprintf("%s%s", models.CacheKeyProduct, productID))

	uc.logger.Info("Product rating updated", "id", productID, "rating", rating)
	return nil
}

func ptrProductStatus(s domain.ProductStatus) *domain.ProductStatus {
	return &s
}
