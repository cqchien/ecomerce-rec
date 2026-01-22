import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ProductGrpcClient } from '../grpc-clients/product-grpc.client';
import { RecommendationGrpcClient } from '../grpc-clients/recommendation.grpc-client';
import { Public } from '../common/decorators/public.decorator';
import {
  ProductListResponseDto,
  SingleProductResponseDto,
  CategoryListResponseDto,
} from '../dtos/product-response.dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productGrpcClient: ProductGrpcClient,
    private readonly recommendationGrpcClient: RecommendationGrpcClient,
  ) {}

  /**
   * List products with filters
   */
  @Get()
  @Public() // Products can be viewed without auth
  async listProducts(@Query() query: any) {
    // Convert price filters from dollars to cents for the backend
    const minPriceCents = query.minPrice
      ? Math.round(parseFloat(query.minPrice) * 100)
      : undefined;
    const maxPriceCents = query.maxPrice
      ? Math.round(parseFloat(query.maxPrice) * 100)
      : undefined;

    const result = await this.productGrpcClient.listProducts({
      page: parseInt(query.page) || 1,
      page_size: parseInt(query.limit || query.pageSize) || 20,
      category_id: query.category || query.categoryId,
      min_price: minPriceCents,
      max_price: maxPriceCents,
      min_rating: query.rating ? parseFloat(query.rating) : undefined,
      is_featured: query.isFeatured === 'true',
      is_new: query.isNew === 'true',
      is_on_sale: query.isOnSale === 'true',
      sort_by: query.sort || query.sortBy,
    });

    return new ProductListResponseDto(result.products || [], result);
  }

  /**
   * Search products
   */
  @Get('search')
  @Public()
  async searchProducts(@Query() query: any) {
    const result = await this.productGrpcClient.searchProducts({
      query: query.q || query.query,
      page: parseInt(query.page) || 1,
      page_size: parseInt(query.limit || query.pageSize) || 20,
      category_id: query.category || query.categoryId,
    });

    return new ProductListResponseDto(result.products || [], result);
  }

  /**
   * Get product categories
   */
  @Get('categories')
  @Public()
  async getCategories() {
    const result = await this.productGrpcClient.listCategories();
    return new CategoryListResponseDto(result.categories || []);
  }

  /**
   * Get price range for products
   */
  @Get('price-range')
  @Public()
  async getPriceRange(@Query('category') category?: string) {
    const result = await this.productGrpcClient.getPriceRange(category);
    
    // Convert from cents to dollars and wrap in standard response format
    return {
      success: true,
      data: {
        minPrice: result.min_price_cents / 100,
        maxPrice: result.max_price_cents / 100,
        avgPrice: result.avg_price_cents / 100,
        productCount: result.product_count,
      },
    };
  }

  /**
   * Get recommended products (placeholder - would call recommendation service)
   */
  @Get('recommended')
  @Public()
  async getRecommendedProducts(@Query('limit') limit?: string) {
    const result = await this.productGrpcClient.listProducts({
      page: 1,
      page_size: limit ? parseInt(limit) : 10,
      is_featured: true,
    });

    return new ProductListResponseDto(result.products || [], result);
  }

  /**
   * Get trending products from recommendation service
   */
  @Get('trending')
  @Public()
  async getTrendingProducts(@Query('limit') limit?: string) {
    const productLimit = limit ? parseInt(limit) : 10;
    
    try {
      // Get trending product IDs from recommendation service
      console.log('[Trending] Calling recommendation service with limit:', productLimit);
      const { product_ids } = await this.recommendationGrpcClient.getTrendingProducts(productLimit);
      console.log('[Trending] Got product IDs from recommendation:', product_ids);
      
      if (!product_ids || product_ids.length === 0) {
        console.log('[Trending] No product IDs, using fallback');
        // Fallback to products on sale if no trending data
        const result = await this.productGrpcClient.listProducts({
          page: 1,
          page_size: productLimit,
          is_on_sale: true,
        });
        return new ProductListResponseDto(result.products || [], result);
      }
      
      // Fetch full product details for trending product IDs
      const products = await Promise.all(
        product_ids.map(async (id) => {
          try {
            const result = await this.productGrpcClient.getProduct(id);
            return result.product;
          } catch (error) {
            console.error(`Error fetching product ${id}:`, error.message);
            return null;
          }
        })
      );
      
      // Filter out null values (failed requests)
      const validProducts = products.filter(p => p !== null);
      
      return new ProductListResponseDto(validProducts, {
        total: validProducts.length,
        page: 1,
        page_size: productLimit,
        total_pages: 1,
      });
    } catch (error) {
      console.error('[Trending] Error getting trending products:', error);
      // Fallback to products on sale
      const result = await this.productGrpcClient.listProducts({
        page: 1,
        page_size: productLimit,
        is_on_sale: true,
      });
      return new ProductListResponseDto(result.products || [], result);
    }
  }

  /**
   * Get product by slug
   */
  @Get('slug/:slug')
  @Public()
  async getProductBySlug(@Param('slug') slug: string) {
    const result = await this.productGrpcClient.getProductBySlug(slug);
    if (!result.product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return new SingleProductResponseDto(result.product);
  }

  /**
   * Get product by ID
   */
  @Get(':id')
  @Public()
  async getProduct(@Param('id') productId: string) {
    const result = await this.productGrpcClient.getProduct(productId);
    return new SingleProductResponseDto(result.product);
  }

  /**
   * Get related/similar products from recommendation service
   */
  @Get(':id/related')
  @Public()
  async getRelatedProducts(
    @Param('id') productId: string,
    @Query('limit') limit?: string,
  ) {
    const productLimit = limit ? parseInt(limit) : 10;
    
    try {
      // Get similar product IDs from recommendation service
      const { product_ids } = await this.recommendationGrpcClient.getProductRecommendations(
        productId,
        productLimit,
      );
      
      if (!product_ids || product_ids.length === 0) {
        // Fallback to product service's related products
        const result = await this.productGrpcClient.getRelatedProducts(productId, productLimit);
        return new ProductListResponseDto(result.products || [], result);
      }
      
      // Fetch full product details for similar product IDs
      const products = await Promise.all(
        product_ids.map(async (id) => {
          try {
            const result = await this.productGrpcClient.getProduct(id);
            return result.product;
          } catch (error) {
            console.error(`Error fetching product ${id}:`, error.message);
            return null;
          }
        })
      );
      
      // Filter out null values (failed requests)
      const validProducts = products.filter(p => p !== null);
      
      return new ProductListResponseDto(validProducts, {
        total: validProducts.length,
        page: 1,
        page_size: productLimit,
        total_pages: 1,
      });
    } catch (error) {
      console.error('Error getting related products:', error);
      // Fallback to product service
      const result = await this.productGrpcClient.getRelatedProducts(productId, productLimit);
      return new ProductListResponseDto(result.products || [], result);
    }
  }

  /**
   * Track product view (for recommendations)
   */
  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackProductView(@Param('id') productId: string, @Body() body: any) {
    return;
  }
}
