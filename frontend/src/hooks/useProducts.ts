import { useState, useEffect, useCallback } from 'react';
import { getProductService } from '@/services';
import type { Product, ProductFilters, Category } from '@/services/api/product.service';

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const productService = getProductService();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await (productService as any).getProducts(filters);
      // Handle both array (mock) and paginated response (API)
      if (Array.isArray(response)) {
        setProducts(response as Product[]);
        setPagination({
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
        });
      } else {
        setProducts(response.data as Product[]);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    pagination,
    refetch: fetchProducts,
  };
};

export const useProduct = (id?: string, slug?: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const productService = getProductService();

  useEffect(() => {
    if (!id && !slug) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let data: any = null;
        if (slug) {
          data = await productService.getProductBySlug(slug);
        } else if (id) {
          // Check which method is available
          if ('getProduct' in productService) {
            data = await (productService as any).getProduct(id);
          } else if ('getProductById' in productService) {
            data = await (productService as any).getProductById(id);
          }
        }
        setProduct(data as Product);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, slug]);

  return { product, isLoading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const productService = getProductService();

  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoaded) return;
    
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productService.getCategories();
        setCategories(data);
        setHasLoaded(true);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [hasLoaded]);

  return { categories, isLoading, error };
};

export const useFeaturedProducts = (limit = 8) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const productService = getProductService();

  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoaded) return;
    
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // API service has getFeaturedProducts with limit parameter
        const data = await (productService as any).getFeaturedProducts(limit);
        setProducts(data as Product[]);
        setHasLoaded(true);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch featured products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [limit, hasLoaded]);

  return { products, isLoading, error };
};

export const useRecommendedProducts = (limit = 10) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const productService = getProductService();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Check if method exists (API service has it, mock might not)
        if ('getRecommendedProducts' in productService) {
          const data = await (productService as any).getRecommendedProducts(limit);
          // Handle both array response and object with products property
          if (Array.isArray(data)) {
            setProducts(data as Product[]);
          } else if (data && Array.isArray(data.products)) {
            setProducts(data.products as Product[]);
          } else {
            setProducts([]);
          }
        } else {
          // Fallback to featured products for mock service
          const data = await (productService as any).getFeaturedProducts();
          setProducts(data as Product[]);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch recommended products:', err);
        setProducts([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  return { products, isLoading, error };
};

export const useRelatedProducts = (productId?: string, limit = 6) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const productService = getProductService();

  useEffect(() => {
    if (!productId) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await (productService as any).getRelatedProducts(productId, limit);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch related products:', err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [productId, limit]);

  return { products, isLoading, error };
};
