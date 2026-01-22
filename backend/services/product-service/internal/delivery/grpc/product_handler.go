package grpc

import (
	"context"
	"time"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/product-service/pkg/logger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type productServer struct {
	pb.UnimplementedProductServiceServer
	productUC  *usecase.ProductUseCase
	categoryUC *usecase.CategoryUseCase
	logger     logger.Logger
}

/**
 * Creates a new gRPC server
 * @param productUC Product use case instance
 * @param categoryUC Category use case instance
 * @param logger Logger instance
 * @return gRPC server instance
 */
func NewServer(productUC *usecase.ProductUseCase, categoryUC *usecase.CategoryUseCase, logger logger.Logger) *grpc.Server {
	grpcServer := grpc.NewServer()

	productSvc := &productServer{
		productUC:  productUC,
		categoryUC: categoryUC,
		logger:     logger,
	}

	pb.RegisterProductServiceServer(grpcServer, productSvc)

	return grpcServer
}

/**
 * Retrieves a product by ID
 * @param ctx Context
 * @param req GetProduct request
 * @return Product response
 */
func (s *productServer) GetProduct(ctx context.Context, req *pb.GetProductRequest) (*pb.GetProductResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "product id is required")
	}

	product, err := s.productUC.GetProduct(ctx, req.Id)
	if err != nil {
		s.logger.Error("Failed to get product", "id", req.Id, "error", err)
		return nil, status.Error(codes.NotFound, "product not found")
	}

	return &pb.GetProductResponse{
		Product: s.domainToProtoProduct(product),
	}, nil
}

/**
 * Retrieves a product by slug
 * @param ctx Context
 * @param req GetProductBySlug request
 * @return Product response
 */
func (s *productServer) GetProductBySlug(ctx context.Context, req *pb.GetProductBySlugRequest) (*pb.GetProductBySlugResponse, error) {
	if req.Slug == "" {
		return nil, status.Error(codes.InvalidArgument, "product slug is required")
	}

	product, err := s.productUC.GetProductBySlug(ctx, req.Slug)
	if err != nil {
		s.logger.Error("Failed to get product by slug", "slug", req.Slug, "error", err)
		return nil, status.Error(codes.NotFound, "product not found")
	}

	return &pb.GetProductBySlugResponse{
		Product: s.domainToProtoProduct(product),
	}, nil
}

/**
 * Lists products with filters and pagination
 * @param ctx Context
 * @param req ListProducts request
 * @return Products list response
 */
func (s *productServer) ListProducts(ctx context.Context, req *pb.ListProductsRequest) (*pb.ListProductsResponse, error) {
	filter := s.protoToFilter(req.Filters)
	pagination := s.protoToPagination(req.Pagination)

	result, err := s.productUC.ListProducts(ctx, filter, pagination)
	if err != nil {
		s.logger.Error("Failed to list products", "error", err)
		return nil, status.Error(codes.Internal, "failed to list products")
	}

	products := make([]*pb.Product, len(result.Products))
	for i, p := range result.Products {
		products[i] = s.domainToProtoProduct(&p)
	}

	return &pb.ListProductsResponse{
		Products: products,
		Pagination: &pb.PaginationResponse{
			Total:      result.Total,
			TotalPages: result.TotalPages,
			Page:       result.Page,
			Limit:      result.Limit,
		},
	}, nil
}

/**
 * Searches products by query
 * @param ctx Context
 * @param req SearchProducts request
 * @return Search results response
 */
func (s *productServer) SearchProducts(ctx context.Context, req *pb.SearchProductsRequest) (*pb.SearchProductsResponse, error) {
	if req.Query == "" {
		return nil, status.Error(codes.InvalidArgument, "search query is required")
	}

	filter := s.protoToFilter(req.Filters)
	pagination := s.protoToPagination(req.Pagination)

	result, err := s.productUC.SearchProducts(ctx, req.Query, filter, pagination)
	if err != nil {
		s.logger.Error("Failed to search products", "query", req.Query, "error", err)
		return nil, status.Error(codes.Internal, "failed to search products")
	}

	products := make([]*pb.Product, len(result.Products))
	for i, p := range result.Products {
		products[i] = s.domainToProtoProduct(&p)
	}

	return &pb.SearchProductsResponse{
		Products: products,
		Pagination: &pb.PaginationResponse{
			Total:      result.Total,
			TotalPages: result.TotalPages,
			Page:       result.Page,
			Limit:      result.Limit,
		},
		Suggestions: []string{}, // TODO: Implement search suggestions
	}, nil
}

/**
 * Lists product categories
 * @param ctx Context
 * @param req ListCategories request
 * @return Categories list response
 */
func (s *productServer) ListCategories(ctx context.Context, req *pb.ListCategoriesRequest) (*pb.ListCategoriesResponse, error) {
	var parentID *string
	if req.ParentId != "" {
		parentID = &req.ParentId
	}

	var categories []domain.Category
	var err error

	if req.IncludeProductCount {
		categories, err = s.categoryUC.GetCategoriesWithProductCount(ctx)
	} else {
		categories, err = s.categoryUC.ListCategories(ctx, parentID)
	}

	if err != nil {
		s.logger.Error("Failed to list categories", "error", err)
		return nil, status.Error(codes.Internal, "failed to list categories")
	}

	pbCategories := make([]*pb.Category, len(categories))
	for i, c := range categories {
		pbCategories[i] = s.domainToProtoCategory(&c)
	}

	return &pb.ListCategoriesResponse{
		Categories: pbCategories,
	}, nil
}

/**
 * Retrieves a category by ID
 * @param ctx Context
 * @param req GetCategory request
 * @return Category response
 */
func (s *productServer) GetCategory(ctx context.Context, req *pb.GetCategoryRequest) (*pb.GetCategoryResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "category id is required")
	}

	category, err := s.categoryUC.GetCategory(ctx, req.Id)
	if err != nil {
		s.logger.Error("Failed to get category", "id", req.Id, "error", err)
		return nil, status.Error(codes.NotFound, "category not found")
	}

	return &pb.GetCategoryResponse{
		Category: s.domainToProtoCategory(category),
	}, nil
}

/**
 * Gets products related to a specific product
 * @param ctx Context
 * @param req GetRelatedProducts request
 * @return Related products response
 */
func (s *productServer) GetRelatedProducts(ctx context.Context, req *pb.GetRelatedProductsRequest) (*pb.GetRelatedProductsResponse, error) {
	if req.ProductId == "" {
		return nil, status.Error(codes.InvalidArgument, "product id is required")
	}

	limit := req.Limit
	if limit == 0 {
		limit = 10
	}

	products, err := s.productUC.GetRelatedProducts(ctx, req.ProductId, limit)
	if err != nil {
		s.logger.Error("Failed to get related products", "id", req.ProductId, "error", err)
		return nil, status.Error(codes.Internal, "failed to get related products")
	}

	pbProducts := make([]*pb.Product, len(products))
	for i, p := range products {
		pbProducts[i] = s.domainToProtoProduct(&p)
	}

	return &pb.GetRelatedProductsResponse{
		Products: pbProducts,
	}, nil
}

/**
 * Gets price range statistics for products
 * @param ctx Context
 * @param req GetPriceRange request
 * @return Price range response
 */
func (s *productServer) GetPriceRange(ctx context.Context, req *pb.GetPriceRangeRequest) (*pb.GetPriceRangeResponse, error) {
	var categoryID *string
	if req.CategoryId != "" {
		categoryID = &req.CategoryId
	}

	priceRange, err := s.productUC.GetPriceRange(ctx, categoryID)
	if err != nil {
		s.logger.Error("Failed to get price range", "error", err)
		return nil, status.Error(codes.Internal, "failed to get price range")
	}

	return &pb.GetPriceRangeResponse{
		MinPriceCents: priceRange.MinPrice,
		MaxPriceCents: priceRange.MaxPrice,
		AvgPriceCents: priceRange.AvgPrice,
		ProductCount:  priceRange.ProductCount,
	}, nil
}

/**
 * Creates a new product (Admin)
 * @param ctx Context
 * @param req CreateProduct request
 * @return Created product response
 */
func (s *productServer) CreateProduct(ctx context.Context, req *pb.CreateProductRequest) (*pb.CreateProductResponse, error) {
	if req.Name == "" || req.CategoryId == "" {
		return nil, status.Error(codes.InvalidArgument, "name and category_id are required")
	}

	product := &domain.Product{
		Name:            req.Name,
		Slug:            req.Slug,
		Description:     req.Description,
		LongDescription: req.LongDescription,
		Price:           req.Price.AmountCents,
		OriginalPrice:   req.OriginalPrice.AmountCents,
		CategoryID:      req.CategoryId,
		Images:          req.Images,
		Specifications:  req.Specifications,
		Tags:            req.Tags,
		SKU:             req.Sku,
		IsFeatured:      req.IsFeatured,
		Status:          domain.ProductStatusActive,
	}

	if err := s.productUC.CreateProduct(ctx, product); err != nil {
		s.logger.Error("Failed to create product", "error", err)
		return nil, status.Error(codes.Internal, "failed to create product")
	}

	return &pb.CreateProductResponse{
		Product: s.domainToProtoProduct(product),
	}, nil
}

/**
 * Updates an existing product (Admin)
 * @param ctx Context
 * @param req UpdateProduct request
 * @return Updated product response
 */
func (s *productServer) UpdateProduct(ctx context.Context, req *pb.UpdateProductRequest) (*pb.UpdateProductResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "product id is required")
	}

	existing, err := s.productUC.GetProduct(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.NotFound, "product not found")
	}

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Description != nil {
		existing.Description = *req.Description
	}
	if req.LongDescription != nil {
		existing.LongDescription = *req.LongDescription
	}
	if req.Price != nil {
		existing.Price = req.Price.AmountCents
	}
	if req.CategoryId != nil {
		existing.CategoryID = *req.CategoryId
	}
	if len(req.Images) > 0 {
		existing.Images = req.Images
	}
	if req.Status != nil {
		existing.Status = s.protoToProductStatus(*req.Status)
	}

	if err := s.productUC.UpdateProduct(ctx, existing); err != nil {
		s.logger.Error("Failed to update product", "id", req.Id, "error", err)
		return nil, status.Error(codes.Internal, "failed to update product")
	}

	return &pb.UpdateProductResponse{
		Product: s.domainToProtoProduct(existing),
	}, nil
}

/**
 * Deletes a product (Admin)
 * @param ctx Context
 * @param req DeleteProduct request
 * @return Delete success response
 */
func (s *productServer) DeleteProduct(ctx context.Context, req *pb.DeleteProductRequest) (*pb.DeleteProductResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "product id is required")
	}

	if err := s.productUC.DeleteProduct(ctx, req.Id); err != nil {
		s.logger.Error("Failed to delete product", "id", req.Id, "error", err)
		return nil, status.Error(codes.Internal, "failed to delete product")
	}

	return &pb.DeleteProductResponse{
		Success: true,
	}, nil
}

/**
 * Retrieves multiple products by their IDs
 * @param ctx Context
 * @param req GetProductsByIds request
 * @return Products list response
 */
func (s *productServer) GetProductsByIds(ctx context.Context, req *pb.GetProductsByIdsRequest) (*pb.GetProductsByIdsResponse, error) {
	if len(req.Ids) == 0 {
		return nil, status.Error(codes.InvalidArgument, "at least one product id is required")
	}

	products, err := s.productUC.GetProductsByIDs(ctx, req.Ids)
	if err != nil {
		s.logger.Error("Failed to get products by IDs", "error", err)
		return nil, status.Error(codes.Internal, "failed to get products")
	}

	pbProducts := make([]*pb.Product, len(products))
	for i, p := range products {
		pbProducts[i] = s.domainToProtoProduct(&p)
	}

	return &pb.GetProductsByIdsResponse{
		Products: pbProducts,
	}, nil
}

// Converter functions

func (s *productServer) domainToProtoProduct(product *domain.Product) *pb.Product {
	if product == nil {
		return nil
	}

	variants := make([]*pb.ProductVariant, len(product.Variants))
	for i, v := range product.Variants {
		variants[i] = &pb.ProductVariant{
			Id:         v.ID,
			ProductId:  v.ProductID,
			Name:       v.Name,
			Sku:        v.SKU,
			Price:      &pb.Money{AmountCents: v.Price, Currency: "USD"},
			Stock:      v.Stock,
			Attributes: v.Attributes,
		}
	}

	return &pb.Product{
		Id:              product.ID,
		Name:            product.Name,
		Slug:            product.Slug,
		Description:     product.Description,
		LongDescription: product.LongDescription,
		Price:           &pb.Money{AmountCents: product.Price, Currency: "USD"},
		OriginalPrice:   &pb.Money{AmountCents: product.OriginalPrice, Currency: "USD"},
		CategoryId:      product.CategoryID,
		CategoryName:    product.CategoryName,
		Images:          product.Images,
		Variants:        variants,
		Specifications:  product.Specifications,
		Tags:            product.Tags,
		Rating:          product.Rating,
		ReviewCount:     product.ReviewCount,
		IsFeatured:      product.IsFeatured,
		IsNew:           product.IsNew,
		IsOnSale:        product.IsOnSale,
		Sku:             product.SKU,
		Status:          s.productStatusToProto(product.Status),
		CreatedAt:       timeToTimestamp(product.CreatedAt),
		UpdatedAt:       timeToTimestamp(product.UpdatedAt),
	}
}

func (s *productServer) domainToProtoCategory(category *domain.Category) *pb.Category {
	if category == nil {
		return nil
	}

	parentID := ""
	if category.ParentID != nil {
		parentID = *category.ParentID
	}

	return &pb.Category{
		Id:           category.ID,
		Name:         category.Name,
		Slug:         category.Slug,
		Description:  category.Description,
		ParentId:     parentID,
		Image:        category.Image,
		ProductCount: category.ProductCount,
		SortOrder:    category.SortOrder,
		IsActive:     category.IsActive,
		CreatedAt:    timeToTimestamp(category.CreatedAt),
		UpdatedAt:    timeToTimestamp(category.UpdatedAt),
	}
}

func (s *productServer) protoToFilter(filters *pb.ProductFilters) *domain.ProductFilter {
	if filters == nil {
		return nil
	}

	filter := &domain.ProductFilter{
		InStockOnly:  filters.InStockOnly,
		FeaturedOnly: filters.FeaturedOnly,
		OnSaleOnly:   filters.OnSaleOnly,
		Tags:         filters.Tags,
	}

	if filters.CategoryId != "" {
		filter.CategoryID = &filters.CategoryId
	}
	if filters.MinPriceCents > 0 {
		filter.MinPrice = &filters.MinPriceCents
	}
	if filters.MaxPriceCents > 0 {
		filter.MaxPrice = &filters.MaxPriceCents
	}
	if filters.MinRating > 0 {
		filter.MinRating = &filters.MinRating
	}
	if filters.Status != pb.ProductStatus_DRAFT {
		status := s.protoToProductStatus(filters.Status)
		filter.Status = &status
	}

	return filter
}

func (s *productServer) protoToPagination(pagination *pb.PaginationRequest) *domain.Pagination {
	if pagination == nil {
		return &domain.Pagination{
			Page:  models.DefaultPage,
			Limit: models.DefaultPageSize,
		}
	}

	page := pagination.Page
	if page < models.MinPageSize {
		page = models.DefaultPage
	}

	limit := pagination.PageSize
	if limit < models.MinPageSize {
		limit = models.DefaultPageSize
	}
	if limit > models.MaxPageSize {
		limit = models.MaxPageSize
	}

	return &domain.Pagination{
		Page:  page,
		Limit: limit,
	}
}

func (s *productServer) productStatusToProto(status domain.ProductStatus) pb.ProductStatus {
	switch status {
	case domain.ProductStatusDraft:
		return pb.ProductStatus_DRAFT
	case domain.ProductStatusActive:
		return pb.ProductStatus_ACTIVE
	case domain.ProductStatusInactive:
		return pb.ProductStatus_INACTIVE
	case domain.ProductStatusOutOfStock:
		return pb.ProductStatus_OUT_OF_STOCK
	case domain.ProductStatusDiscontinued:
		return pb.ProductStatus_DISCONTINUED
	default:
		return pb.ProductStatus_ACTIVE
	}
}

func (s *productServer) protoToProductStatus(status pb.ProductStatus) domain.ProductStatus {
	switch status {
	case pb.ProductStatus_DRAFT:
		return domain.ProductStatusDraft
	case pb.ProductStatus_ACTIVE:
		return domain.ProductStatusActive
	case pb.ProductStatus_INACTIVE:
		return domain.ProductStatusInactive
	case pb.ProductStatus_OUT_OF_STOCK:
		return domain.ProductStatusOutOfStock
	case pb.ProductStatus_DISCONTINUED:
		return domain.ProductStatusDiscontinued
	default:
		return domain.ProductStatusActive
	}
}

// timeToTimestamp converts time.Time to proto Timestamp
func timeToTimestamp(t time.Time) *pb.Timestamp {
	if t.IsZero() {
		return nil
	}
	return &pb.Timestamp{
		Seconds: t.Unix(),
		Nanos:   int32(t.Nanosecond()),
	}
}
