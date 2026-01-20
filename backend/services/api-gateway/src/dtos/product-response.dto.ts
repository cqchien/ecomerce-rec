/**
 * Product response DTOs with constructor-based transformation
 * Replaces transformer pattern with clean DTO classes
 */

/**
 * Money representation in gRPC
 */
interface MoneyProto {
  amount_cents: number | string;
  currency?: string;
}

/**
 * Timestamp representation in gRPC
 */
interface TimestampProto {
  seconds: number;
  nanos?: number;
}

/**
 * Product from gRPC
 */
interface ProductProto {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  price: MoneyProto;
  original_price: MoneyProto;
  category_id: string;
  category_name: string;
  images: string[];
  variants: VariantProto[];
  specifications: Record<string, string>;
  tags: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  sku: string;
  status: string;
  stock?: number;
  created_at: TimestampProto;
  updated_at: TimestampProto;
}

/**
 * Product variant from gRPC
 */
interface VariantProto {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: MoneyProto;
  stock: number;
  attributes: Record<string, string>;
}

/**
 * Category from gRPC
 */
interface CategoryProto {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  image: string;
  product_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: TimestampProto;
  updated_at: TimestampProto;
}

/**
 * Product Variant Response DTO
 */
export class ProductVariantResponseDto {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;

  /**
   * Creates ProductVariantResponseDto from gRPC variant
   * @param variant Product variant from gRPC response
   */
  constructor(variant: VariantProto) {
    this.id = variant.id;
    this.productId = variant.product_id;
    this.name = variant.name;
    this.sku = variant.sku;
    this.price = this.convertMoney(variant.price);
    this.stock = variant.stock;
    this.attributes = variant.attributes || {};
  }

  private convertMoney(money: MoneyProto): number {
    if (!money || !money.amount_cents) return 0;
    const cents = typeof money.amount_cents === 'string' 
      ? parseInt(money.amount_cents, 10) 
      : money.amount_cents;
    return cents / 100;
  }
}

/**
 * Product Response DTO
 */
export class ProductResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  categoryName: string;
  images: string[];
  variants: ProductVariantResponseDto[];
  specifications: Record<string, string>;
  tags: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNew: boolean;
  isOnSale: boolean;
  sku: string;
  status: string;
  stock?: number;
  createdAt: string;
  updatedAt: string;

  /**
   * Creates ProductResponseDto from gRPC product
   * @param product Product from gRPC response
   */
  constructor(product: ProductProto) {
    this.id = product.id;
    this.name = product.name;
    this.slug = product.slug;
    this.description = product.description;
    this.longDescription = product.long_description;
    this.price = this.convertMoney(product.price);
    this.originalPrice = this.convertMoney(product.original_price);
    this.categoryId = product.category_id;
    this.categoryName = product.category_name;
    this.images = product.images || [];
    this.variants = (product.variants || []).map(v => new ProductVariantResponseDto(v));
    this.specifications = product.specifications || {};
    this.tags = product.tags || [];
    this.rating = product.rating || 0;
    this.reviewCount = product.review_count || 0;
    this.isFeatured = product.is_featured || false;
    this.isNew = product.is_new || false;
    this.isOnSale = product.is_on_sale || false;
    this.sku = product.sku;
    this.status = product.status;
    this.stock = product.stock;
    this.createdAt = this.convertTimestamp(product.created_at);
    this.updatedAt = this.convertTimestamp(product.updated_at);
  }

  private convertMoney(money: MoneyProto): number {
    if (!money || !money.amount_cents) return 0;
    const cents = typeof money.amount_cents === 'string' 
      ? parseInt(money.amount_cents, 10) 
      : money.amount_cents;
    return cents / 100;
  }

  private convertTimestamp(timestamp: TimestampProto): string {
    if (!timestamp || !timestamp.seconds) return new Date().toISOString();
    const milliseconds = timestamp.seconds * 1000 + (timestamp.nanos || 0) / 1000000;
    return new Date(milliseconds).toISOString();
  }
}

/**
 * Category Response DTO
 */
export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string;
  image: string;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  /**
   * Creates CategoryResponseDto from gRPC category
   * @param category Category from gRPC response
   */
  constructor(category: CategoryProto) {
    this.id = category.id;
    this.name = category.name;
    this.slug = category.slug;
    this.description = category.description;
    this.parentId = category.parent_id;
    this.image = category.image;
    this.productCount = category.product_count || 0;
    this.sortOrder = category.sort_order || 0;
    this.isActive = category.is_active !== false;
    this.createdAt = this.convertTimestamp(category.created_at);
    this.updatedAt = this.convertTimestamp(category.updated_at);
  }

  private convertTimestamp(timestamp: TimestampProto): string {
    if (!timestamp || !timestamp.seconds) return new Date().toISOString();
    const milliseconds = timestamp.seconds * 1000 + (timestamp.nanos || 0) / 1000000;
    return new Date(milliseconds).toISOString();
  }
}

/**
 * Pagination Response DTO
 */
export class PaginationResponseDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;

  /**
   * Creates PaginationResponseDto from gRPC pagination data
   * @param data Pagination data from gRPC response
   */
  constructor(data: { page?: number; page_size?: number; total?: number; total_pages?: number }) {
    this.page = data.page || 1;
    this.pageSize = data.page_size || 20;
    this.total = data.total || 0;
    this.totalPages = data.total_pages || 0;
  }
}

/**
 * Product List Response DTO
 */
export class ProductListResponseDto {
  success: boolean;
  data: ProductResponseDto[];
  pagination: PaginationResponseDto;

  /**
   * Creates ProductListResponseDto from gRPC list response
   * @param products Array of products from gRPC
   * @param paginationData Pagination data from gRPC
   */
  constructor(products: ProductProto[], paginationData: any) {
    this.success = true;
    this.data = products.map(p => new ProductResponseDto(p));
    this.pagination = new PaginationResponseDto(paginationData);
  }
}

/**
 * Single Product Response DTO
 */
export class SingleProductResponseDto {
  success: boolean;
  data: ProductResponseDto;

  /**
   * Creates SingleProductResponseDto from gRPC product
   * @param product Product from gRPC response
   */
  constructor(product: ProductProto) {
    this.success = true;
    this.data = new ProductResponseDto(product);
  }
}

/**
 * Category List Response DTO
 */
export class CategoryListResponseDto {
  success: boolean;
  data: CategoryResponseDto[];

  /**
   * Creates CategoryListResponseDto from gRPC categories
   * @param categories Array of categories from gRPC
   */
  constructor(categories: CategoryProto[]) {
    this.success = true;
    this.data = categories.map(c => new CategoryResponseDto(c));
  }
}

/**
 * Single Category Response DTO
 */
export class SingleCategoryResponseDto {
  success: boolean;
  data: CategoryResponseDto;

  /**
   * Creates SingleCategoryResponseDto from gRPC category
   * @param category Category from gRPC response
   */
  constructor(category: CategoryProto) {
    this.success = true;
    this.data = new CategoryResponseDto(category);
  }
}
