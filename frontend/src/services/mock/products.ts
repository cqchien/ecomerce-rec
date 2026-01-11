import productsData from '@/data/products.json';
import categoriesData from '@/data/categories.json';
import reviewsData from '@/data/reviews.json';
import { sleep } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  description: string;
  longDescription?: string;
  specs?: Record<string, string>;
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  tags?: string[];
  search?: string;
}

export const mockProductService = {
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    await sleep(300); // Simulate network delay

    let products = [...productsData] as Product[];

    if (filters) {
      if (filters.category) {
        products = products.filter((p) => p.category === filters.category);
      }
      if (filters.minPrice !== undefined) {
        products = products.filter((p) => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        products = products.filter((p) => p.price <= filters.maxPrice!);
      }
      if (filters.rating !== undefined) {
        products = products.filter((p) => p.rating >= filters.rating!);
      }
      if (filters.inStock) {
        products = products.filter((p) => p.stock > 0);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        products = products.filter((p) =>
          p.tags?.some((tag) => filters.tags!.includes(tag))
        );
      }
    }

    return products;
  },

  async getProductById(id: string): Promise<Product | null> {
    await sleep(200);
    const product = productsData.find((p) => p.id === id);
    return product ? (product as Product) : null;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    await sleep(200);
    const product = productsData.find((p) => p.slug === slug);
    return product ? (product as Product) : null;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    await sleep(200);
    return productsData.filter((p) => p.isFeatured) as Product[];
  },

  async getCategories() {
    await sleep(200);
    return categoriesData;
  },

  async getProductReviews(productId: string) {
    await sleep(200);
    return reviewsData.filter((r) => r.productId === productId);
  },

  async searchProducts(query: string): Promise<Product[]> {
    await sleep(300);
    const searchLower = query.toLowerCase();
    return productsData.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    ) as Product[];
  },
};
