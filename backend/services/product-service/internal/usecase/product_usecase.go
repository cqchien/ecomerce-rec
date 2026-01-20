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

type RedisClient interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Del(ctx context.Context, keys ...string) error
}

type ProductUseCase struct {
	productRepo  domain.ProductRepository
	categoryRepo domain.CategoryRepository
	redis        RedisClient
	logger       logger.Logger
	cacheTTL     time.Duration
}

/**
 * Creates a new product use case
 * @param productRepo Product repository instance
 * @param categoryRepo Category repository instance
 * @param redis Redis client instance
 * @param logger Logger instance
 * @return ProductUseCase instance
 */
func NewProductUseCase(
	productRepo domain.ProductRepository,
	categoryRepo domain.CategoryRepository,
	redis RedisClient,
	logger logger.Logger,
) *ProductUseCase {
	return &ProductUseCase{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
		redis:        redis,
		logger:       logger,
		cacheTTL:     models.ProductCacheTTL,
	}
}

/**
 * Retrieves a product by ID with caching
 * @param id Product ID
 * @return Product entity
 */
func (uc *ProductUseCase) GetProduct(ctx context.Context, id string) (*domain.Product, error) {
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyProduct, id)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var product domain.Product
		if err := json.Unmarshal([]byte(cached), &product); err == nil {
			uc.logger.Debug("Product retrieved from cache", "id", id)
			return &product, nil
		}
	}

	product, err := uc.productRepo.GetByID(ctx, id)
	if err != nil {
		uc.logger.Error("Failed to get product", "id", id, "error", err)
		return nil, fmt.Errorf("get product: %w", err)
	}

	productJSON, _ := json.Marshal(product)
	uc.redis.Set(ctx, cacheKey, productJSON, uc.cacheTTL)

	return product, nil
}

/**
 * Retrieves a product by slug with caching
 * @param slug Product slug
 * @return Product entity
 */
func (uc *ProductUseCase) GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	cacheKey := fmt.Sprintf("%s%s", models.CacheKeyProductSlug, slug)
	cached, err := uc.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var product domain.Product
		if err := json.Unmarshal([]byte(cached), &product); err == nil {
			uc.logger.Debug("Product retrieved from cache", "slug", slug)
			return &product, nil
		}
	}

	product, err := uc.productRepo.GetBySlug(ctx, slug)
	if err != nil {
		uc.logger.Error("Failed to get product by slug", "slug", slug, "error", err)
		return nil, fmt.Errorf("get product by slug: %w", err)
	}

	productJSON, _ := json.Marshal(product)
	uc.redis.Set(ctx, cacheKey, productJSON, uc.cacheTTL)

	return product, nil
}

/**
 * Lists products with filtering and pagination
 * @param filter Product filter criteria
 * @param pagination Pagination parameters
 * @return Paginated products
 */
func (uc *ProductUseCase) ListProducts(ctx context.Context, filter *domain.ProductFilter, pagination *domain.Pagination) (*domain.PaginatedProducts, error) {
	products, err := uc.productRepo.List(ctx, filter, pagination)
	if err != nil {
		uc.logger.Error("Failed to list products", "error", err)
		return nil, fmt.Errorf("list products: %w", err)
	}

	return products, nil
}

/**
 * Searches products with query and filtering
 * @param query Search query string
 * @param filter Product filter criteria
 * @param pagination Pagination parameters
 * @return Paginated products
 */
func (uc *ProductUseCase) SearchProducts(ctx context.Context, query string, filter *domain.ProductFilter, pagination *domain.Pagination) (*domain.PaginatedProducts, error) {
	products, err := uc.productRepo.Search(ctx, query, filter, pagination)
	if err != nil {
		uc.logger.Error("Failed to search products", "query", query, "error", err)
		return nil, fmt.Errorf("search products: %w", err)
	}

	return products, nil
}

/**
 * Retrieves multiple products by IDs
 * @param ids List of product IDs
 * @return List of products
 */
func (uc *ProductUseCase) GetProductsByIDs(ctx context.Context, ids []string) ([]domain.Product, error) {
	products, err := uc.productRepo.GetByIDs(ctx, ids)
	if err != nil {
		uc.logger.Error("Failed to get products by IDs", "error", err)
		return nil, fmt.Errorf("get products by IDs: %w", err)
	}

	return products, nil
}

/**
 * Creates a new product
 * @param product Product entity to create
 */
func (uc *ProductUseCase) CreateProduct(ctx context.Context, product *domain.Product) error {
	_, err := uc.categoryRepo.GetByID(ctx, product.CategoryID)
	if err != nil {
		return fmt.Errorf("invalid category: %w", err)
	}

	if err := uc.productRepo.Create(ctx, product); err != nil {
		uc.logger.Error("Failed to create product", "error", err)
		return fmt.Errorf("create product: %w", err)
	}

	uc.logger.Info("Product created", "id", product.ID, "name", product.Name)
	return nil
}

/**
 * Updates an existing product
 * @param product Product entity with updated values
 */
func (uc *ProductUseCase) UpdateProduct(ctx context.Context, product *domain.Product) error {
	existing, err := uc.productRepo.GetByID(ctx, product.ID)
	if err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	if product.CategoryID != existing.CategoryID {
		_, err := uc.categoryRepo.GetByID(ctx, product.CategoryID)
		if err != nil {
			return fmt.Errorf("invalid category: %w", err)
		}
	}

	if err := uc.productRepo.Update(ctx, product); err != nil {
		uc.logger.Error("Failed to update product", "id", product.ID, "error", err)
		return fmt.Errorf("update product: %w", err)
	}

	cacheKeys := []string{
		fmt.Sprintf("%s%s", models.CacheKeyProduct, product.ID),
		fmt.Sprintf("%s%s", models.CacheKeyProductSlug, product.Slug),
	}
	uc.redis.Del(ctx, cacheKeys...)

	uc.logger.Info("Product updated", "id", product.ID, "name", product.Name)
	return nil
}

/**
 * Deletes a product by ID
 * @param id Product ID
 */
func (uc *ProductUseCase) DeleteProduct(ctx context.Context, id string) error {
	product, err := uc.productRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	if err := uc.productRepo.Delete(ctx, id); err != nil {
		uc.logger.Error("Failed to delete product", "id", id, "error", err)
		return fmt.Errorf("delete product: %w", err)
	}

	cacheKeys := []string{
		fmt.Sprintf("%s%s", models.CacheKeyProduct, id),
		fmt.Sprintf("%s%s", models.CacheKeyProductSlug, product.Slug),
	}
	uc.redis.Del(ctx, cacheKeys...)

	uc.logger.Info("Product deleted", "id", id)
	return nil
}

/**
 * Retrieves related products based on same category
 * @param productID Product ID to find related products for
 * @param limit Maximum number of related products
 * @return List of related products
 */
func (uc *ProductUseCase) GetRelatedProducts(ctx context.Context, productID string, limit int32) ([]domain.Product, error) {
	product, err := uc.productRepo.GetByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

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

	related := []domain.Product{}
	for _, p := range result.Products {
		if p.ID != productID {
			related = append(related, p)
		}
	}

	return related, nil
}

/**
 * Updates product rating and review count
 * @param productID Product ID
 * @param rating New rating value
 * @param reviewCount New review count
 */
func (uc *ProductUseCase) UpdateRating(ctx context.Context, productID string, rating float64, reviewCount int32) error {
	if err := uc.productRepo.UpdateRating(ctx, productID, rating, reviewCount); err != nil {
		uc.logger.Error("Failed to update rating", "id", productID, "error", err)
		return fmt.Errorf("update rating: %w", err)
	}

	uc.redis.Del(ctx, fmt.Sprintf("%s%s", models.CacheKeyProduct, productID))

	uc.logger.Info("Product rating updated", "id", productID, "rating", rating)
	return nil
}

func ptrProductStatus(s domain.ProductStatus) *domain.ProductStatus {
	return &s
}
