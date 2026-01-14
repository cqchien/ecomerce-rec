import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductGrpcClient } from '../grpc-clients/product-grpc.client';
import { Public } from '../common/decorators/public.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productGrpcClient: ProductGrpcClient) {}

  /**
   * List products with filters
   */
  @Get()
  @Public() // Products can be viewed without auth
  async listProducts(@Query() query: any) {
    const result = await this.productGrpcClient.listProducts({
      page: parseInt(query.page) || 1,
      page_size: parseInt(query.limit || query.pageSize) || 20,
      category_id: query.category || query.categoryId,
      min_price: query.minPrice ? parseFloat(query.minPrice) : undefined,
      max_price: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      is_featured: query.isFeatured === 'true',
      is_new: query.isNew === 'true',
      is_on_sale: query.isOnSale === 'true',
    });

    return {
      success: true,
      data: result.products || [],
      pagination: {
        page: result.page || 1,
        pageSize: result.page_size || 20,
        total: result.total || 0,
        totalPages: result.total_pages || 0,
      },
    };
  }

  /**
   * Get product by ID
   */
  @Get(':id')
  @Public()
  async getProduct(@Param('id') productId: string) {
    const result = await this.productGrpcClient.getProduct(productId);
    return {
      success: true,
      data: result.product,
    };
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

    return {
      success: true,
      data: result.products || [],
      pagination: {
        page: result.page || 1,
        pageSize: result.page_size || 20,
        total: result.total || 0,
        totalPages: result.total_pages || 0,
      },
    };
  }

  /**
   * Get product categories
   */
  @Get('categories')
  @Public()
  async getCategories() {
    const result = await this.productGrpcClient.listCategories();
    return {
      success: true,
      data: result.categories || [],
    };
  }

  /**
   * Get related products
   */
  @Get(':id/related')
  @Public()
  async getRelatedProducts(
    @Param('id') productId: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.productGrpcClient.getRelatedProducts(
      productId,
      limit ? parseInt(limit) : 10,
    );
    return {
      success: true,
      data: result.products || [],
    };
  }

  /**
   * Track product view (for recommendations)
   */
  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackProductView(@Param('id') productId: string, @Body() body: any) {
    // This would typically publish an event to the event service
    // For now, we'll just acknowledge it
    return;
  }

  /**
   * Get recommended products (placeholder - would call recommendation service)
   */
  @Get('recommended')
  async getRecommendedProducts(@Query('limit') limit?: string) {
    // For now, return trending/featured products
    const result = await this.productGrpcClient.listProducts({
      page: 1,
      page_size: limit ? parseInt(limit) : 10,
      is_featured: true,
    });

    return {
      success: true,
      data: result.products || [],
    };
  }

  /**
   * Get trending products
   */
  @Get('trending')
  @Public()
  async getTrendingProducts(@Query('limit') limit?: string) {
    const result = await this.productGrpcClient.listProducts({
      page: 1,
      page_size: limit ? parseInt(limit) : 10,
      is_on_sale: true, // Or is_featured - whatever indicates trending
    });

    return {
      success: true,
      data: result.products || [],
    };
  }
}
