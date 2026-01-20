package postgres

import (
	"context"
	"fmt"

	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database/models"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type productRepository struct {
	db *gorm.DB
}

/**
 * Creates a new product repository instance
 * @param db GORM database instance
 * @return ProductRepository interface
 */
func NewProductRepository(db *gorm.DB) domain.ProductRepository {
	return &productRepository{db: db}
}

/**
 * Creates a new product in the database
 * @param product Product entity to create
 */
func (r *productRepository) Create(ctx context.Context, product *domain.Product) error {
	dbProduct := r.domainToModel(product)

	if err := r.db.WithContext(ctx).Create(dbProduct).Error; err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}

	product.ID = dbProduct.ID

	return nil
}

/**
 * Updates an existing product in the database
 * @param product Product entity with updated values
 */
func (r *productRepository) Update(ctx context.Context, product *domain.Product) error {
	dbProduct := r.domainToModel(product)

	result := r.db.WithContext(ctx).
		Model(&models.Product{}).
		Where("id = ?", product.ID).
		Updates(dbProduct)

	if result.Error != nil {
		return fmt.Errorf("failed to update product: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

/**
 * Deletes a product by ID
 * @param id Product ID
 */
func (r *productRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&models.Product{}, "id = ?", id)

	if result.Error != nil {
		return fmt.Errorf("failed to delete product: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

/**
 * Retrieves a product by ID with related data
 * @param id Product ID
 * @return Product entity
 */
func (r *productRepository) GetByID(ctx context.Context, id string) (*domain.Product, error) {
	var dbProduct models.Product

	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Variants").
		First(&dbProduct, "id = ?", id).Error

	if err == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	return r.modelToDomain(&dbProduct), nil
}

/**
 * Retrieves a product by slug with related data
 * @param slug Product slug
 * @return Product entity
 */
func (r *productRepository) GetBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	var dbProduct models.Product

	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Variants").
		First(&dbProduct, "slug = ?", slug).Error

	if err == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	return r.modelToDomain(&dbProduct), nil
}

/**
 * Lists products with filtering and pagination
 * @param filter Product filter criteria
 * @param pagination Pagination parameters
 * @return Paginated products
 */
func (r *productRepository) List(ctx context.Context, filter *domain.ProductFilter, pagination *domain.Pagination) (*domain.PaginatedProducts, error) {
	var dbProducts []models.Product
	var total int64

	// Build query with filters
	query := r.db.WithContext(ctx).Model(&models.Product{})
	query = r.applyFilters(query, filter)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count products: %w", err)
	}

	// Apply pagination
	offset := (pagination.Page - 1) * pagination.Limit
	err := query.
		Preload("Category").
		Order("created_at DESC").
		Limit(int(pagination.Limit)).
		Offset(int(offset)).
		Find(&dbProducts).Error

	if err != nil {
		return nil, fmt.Errorf("failed to list products: %w", err)
	}

	products := make([]domain.Product, len(dbProducts))
	for i, p := range dbProducts {
		products[i] = *r.modelToDomain(&p)
	}

	totalPages := int32((total + int64(pagination.Limit) - 1) / int64(pagination.Limit))

	return &domain.PaginatedProducts{
		Products:   products,
		Total:      total,
		Page:       pagination.Page,
		Limit:      pagination.Limit,
		TotalPages: totalPages,
	}, nil
}

/**
 * Retrieves multiple products by IDs
 * @param ids List of product IDs
 * @return List of products
 */
func (r *productRepository) GetByIDs(ctx context.Context, ids []string) ([]domain.Product, error) {
	var dbProducts []models.Product

	err := r.db.WithContext(ctx).
		Preload("Category").
		Where("id IN ?", ids).
		Find(&dbProducts).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	products := make([]domain.Product, len(dbProducts))
	for i, p := range dbProducts {
		products[i] = *r.modelToDomain(&p)
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
func (r *productRepository) Search(ctx context.Context, query string, filter *domain.ProductFilter, pagination *domain.Pagination) (*domain.PaginatedProducts, error) {
	var dbProducts []models.Product
	var total int64

	// Build search query
	searchPattern := "%" + query + "%"
	dbQuery := r.db.WithContext(ctx).Model(&models.Product{}).
		Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)

	// Apply additional filters
	dbQuery = r.applyFilters(dbQuery, filter)

	// Count total
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count products: %w", err)
	}

	// Apply pagination
	offset := (pagination.Page - 1) * pagination.Limit
	err := dbQuery.
		Preload("Category").
		Order("rating DESC, created_at DESC").
		Limit(int(pagination.Limit)).
		Offset(int(offset)).
		Find(&dbProducts).Error

	if err != nil {
		return nil, fmt.Errorf("failed to search products: %w", err)
	}

	products := make([]domain.Product, len(dbProducts))
	for i, p := range dbProducts {
		products[i] = *r.modelToDomain(&p)
	}

	totalPages := int32((total + int64(pagination.Limit) - 1) / int64(pagination.Limit))

	return &domain.PaginatedProducts{
		Products:   products,
		Total:      total,
		Page:       pagination.Page,
		Limit:      pagination.Limit,
		TotalPages: totalPages,
	}, nil
}

/**
 * Updates product rating and review count
 * @param productID Product ID
 * @param rating New rating value
 * @param reviewCount New review count
 */
func (r *productRepository) UpdateRating(ctx context.Context, productID string, rating float64, reviewCount int32) error {
	result := r.db.WithContext(ctx).
		Model(&models.Product{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"rating":       rating,
			"review_count": reviewCount,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to update rating: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

// Helper methods

func (r *productRepository) applyFilters(query *gorm.DB, filter *domain.ProductFilter) *gorm.DB {
	if filter == nil {
		return query
	}

	if filter.CategoryID != nil {
		query = query.Where("category_id = ?", *filter.CategoryID)
	}

	if filter.MinPrice != nil {
		query = query.Where("price >= ?", *filter.MinPrice)
	}

	if filter.MaxPrice != nil {
		query = query.Where("price <= ?", *filter.MaxPrice)
	}

	if filter.MinRating != nil {
		query = query.Where("rating >= ?", *filter.MinRating)
	}

	if len(filter.Tags) > 0 {
		query = query.Where("tags && ?", filter.Tags)
	}

	if filter.InStockOnly {
		query = query.Where("status != ?", models.ProductStatusOutOfStock)
	}

	if filter.FeaturedOnly {
		query = query.Where("is_featured = ?", true)
	}

	if filter.OnSaleOnly {
		query = query.Where("is_on_sale = ?", true)
	}

	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}

	return query
}

func (r *productRepository) domainToModel(product *domain.Product) *models.Product {
	dbProduct := &models.Product{
		ID:              product.ID,
		Name:            product.Name,
		Slug:            product.Slug,
		Description:     product.Description,
		LongDescription: product.LongDescription,
		Price:           product.Price,
		OriginalPrice:   product.OriginalPrice,
		CategoryID:      product.CategoryID,
		Images:          pq.StringArray(product.Images),
		Specifications:  product.Specifications,
		Tags:            pq.StringArray(product.Tags),
		Rating:          product.Rating,
		ReviewCount:     product.ReviewCount,
		IsFeatured:      product.IsFeatured,
		IsNew:           product.IsNew,
		IsOnSale:        product.IsOnSale,
		SKU:             product.SKU,
		Status:          string(product.Status),
		CreatedAt:       product.CreatedAt,
		UpdatedAt:       product.UpdatedAt,
	}

	// Convert variants
	if len(product.Variants) > 0 {
		dbProduct.Variants = make([]models.ProductVariant, len(product.Variants))
		for i, v := range product.Variants {
			dbProduct.Variants[i] = models.ProductVariant{
				ID:         v.ID,
				ProductID:  product.ID,
				Name:       v.Name,
				SKU:        v.SKU,
				Price:      v.Price,
				Stock:      v.Stock,
				Attributes: v.Attributes,
			}
		}
	}

	return dbProduct
}

func (r *productRepository) modelToDomain(dbProduct *models.Product) *domain.Product {
	categoryName := ""
	if dbProduct.Category != nil {
		categoryName = dbProduct.Category.Name
	}

	product := &domain.Product{
		ID:              dbProduct.ID,
		Name:            dbProduct.Name,
		Slug:            dbProduct.Slug,
		Description:     dbProduct.Description,
		LongDescription: dbProduct.LongDescription,
		Price:           dbProduct.Price,
		OriginalPrice:   dbProduct.OriginalPrice,
		CategoryID:      dbProduct.CategoryID,
		CategoryName:    categoryName,
		Images:          []string(dbProduct.Images),
		Specifications:  dbProduct.Specifications,
		Tags:            []string(dbProduct.Tags),
		Rating:          dbProduct.Rating,
		ReviewCount:     dbProduct.ReviewCount,
		IsFeatured:      dbProduct.IsFeatured,
		IsNew:           dbProduct.IsNew,
		IsOnSale:        dbProduct.IsOnSale,
		SKU:             dbProduct.SKU,
		Status:          domain.ProductStatus(dbProduct.Status),
		CreatedAt:       dbProduct.CreatedAt,
		UpdatedAt:       dbProduct.UpdatedAt,
	}

	// Convert variants
	if len(dbProduct.Variants) > 0 {
		product.Variants = make([]domain.ProductVariant, len(dbProduct.Variants))
		for i, v := range dbProduct.Variants {
			product.Variants[i] = domain.ProductVariant{
				ID:         v.ID,
				ProductID:  v.ProductID,
				Name:       v.Name,
				SKU:        v.SKU,
				Price:      v.Price,
				Stock:      v.Stock,
				Attributes: v.Attributes,
			}
		}
	}

	return product
}
