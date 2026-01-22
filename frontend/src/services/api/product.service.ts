import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { API_ENDPOINTS } from '@/config/api';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  categoryName: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  specifications?: Record<string, string>;
  tags?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  sku: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon?: string;
  productCount: number;
  isActive: boolean;
  sortOrder?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export interface AddReviewData {
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface PriceRange {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  productCount: number;
}

export const productService = {
  /**
   * Get products with filters and pagination
   */
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
      API_ENDPOINTS.products.list,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get product by ID
   */
  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(
      API_ENDPOINTS.products.detail(id)
    );
    return response.data;
  },

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(
      API_ENDPOINTS.products.bySlug(slug)
    );
    return response.data;
  },

  /**
   * Search products
   */
  async searchProducts(query: string, limit = 20): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<{ products: Product[]; total: number }>>(
      API_ENDPOINTS.products.search,
      { params: { q: query, limit } }
    );
    return response.data.products;
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      API_ENDPOINTS.products.categories
    );
    return response.data;
  },

  /**
   * Get category by ID
   */
  async getCategory(id: string): Promise<Category> {
    const response = await apiClient.get<ApiResponse<Category>>(
      API_ENDPOINTS.products.category(id)
    );
    return response.data;
  },

  /**
   * Get personalized product recommendations
   */
  async getRecommendedProducts(limit = 10): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      API_ENDPOINTS.products.recommended,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get trending products
   */
  async getTrendingProducts(limit = 10): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      API_ENDPOINTS.products.trending,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string, limit = 6): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      API_ENDPOINTS.products.related(productId),
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get product reviews
   */
  async getProductReviews(
    productId: string,
    page = 1,
    limit = 10,
    sort?: string
  ): Promise<PaginatedResponse<ProductReview>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductReview>>>(
      API_ENDPOINTS.products.reviews(productId),
      { params: { page, limit, sort } }
    );
    return response.data;
  },

  /**
   * Add product review
   */
  async addReview(productId: string, data: AddReviewData): Promise<ProductReview> {
    const response = await apiClient.post<ApiResponse<ProductReview>>(
      API_ENDPOINTS.products.addReview(productId),
      data
    );
    return response.data;
  },

  /**
   * Track product view (for recommendations)
   */
  async trackProductView(productId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.products.trackView(productId));
    } catch (error) {
      // Silently fail - tracking is not critical
      console.debug('Failed to track product view:', error);
    }
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
      API_ENDPOINTS.products.list,
      { params: { isFeatured: true, limit } }
    );
    return response.data.data;
  },

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit = 8): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
      API_ENDPOINTS.products.list,
      { params: { isNew: true, limit, sort: 'newest' } }
    );
    return response.data.data;
  },

  /**
   * Get products on sale
   */
  async getSaleProducts(limit = 8): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
      API_ENDPOINTS.products.list,
      { params: { isOnSale: true, limit } }
    );
    return response.data.data;
  },

  /**
   * Get price range for products (optionally filtered by category)
   */
  async getPriceRange(category?: string): Promise<PriceRange> {
    const response = await apiClient.get<ApiResponse<PriceRange>>(
      API_ENDPOINTS.products.priceRange,
      { params: category ? { category } : {} }
    );
    return response.data;
  },
};
