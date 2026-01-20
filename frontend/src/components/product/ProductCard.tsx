import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Plus, Star, Heart, Eye } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews?: number;
  reviewCount?: number;
  image: string;
  images?: string[];
  category?: string;
  categoryName?: string;
  categoryId?: string;
  stock: number;
  description: string;
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid', onAddToCart }) => {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Require login before adding to cart
    if (!isAuthenticated) {
      navigate({ to: '/auth/login', search: { redirect: window.location.pathname } });
      return;
    }
    
    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.image,
        category: product.category || product.categoryName || product.categoryId || '',
        stock: product.stock || 0,
      });
      if (onAddToCart) {
        onAddToCart();
      }
    } catch (error) {
      // If auth error, redirect to login
      if ((error as any)?.response?.status === 401) {
        navigate({ to: '/auth/login', search: { redirect: window.location.pathname } });
      }
      console.error('Failed to add to cart:', error);
    }
  };

  const reviewCount = product.reviews || product.reviewCount || 0;
  const categoryDisplay = product.category || product.categoryName || '';

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 overflow-hidden group flex gap-4 hover:-translate-y-1">
        <div className="relative w-64 h-64 overflow-hidden bg-gray-50 m-4 rounded-2xl flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          {product.isNew && (
            <Badge className="absolute top-3 left-3 bg-[#18181B] text-white text-[10px] uppercase tracking-wider shadow-md">
              NEW
            </Badge>
          )}
          {product.isSale && (
            <Badge className="absolute top-3 right-3 bg-[#FF6B8B] text-white text-[10px] uppercase tracking-wider shadow-md">
              SALE
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="flex-1 py-4 pr-4 flex flex-col">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-bold">
            {categoryDisplay}
          </div>
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-display font-bold text-gray-900 text-xl mb-2 group-hover:text-[#FF6B8B] transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-auto flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1 mb-2">
                <div className="flex text-yellow-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn('w-3 h-3', i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200')}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-1">({reviewCount})</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price || 0)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through font-medium">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all">
                <Heart className="w-4 h-4" />
              </button>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="px-6 bg-[#FF6B8B] hover:bg-[#E64A6B]"
              >
                <Plus className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col h-full hover:-translate-y-1">
      <div className="relative aspect-[1/1] overflow-hidden bg-gray-50 m-2 rounded-2xl">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </Link>
        {product.isNew && (
          <Badge className="absolute top-3 left-3 bg-[#18181B] text-white text-[10px] uppercase tracking-wider shadow-md">
            NEW
          </Badge>
        )}
        {product.isSale && (
          <Badge className="absolute top-3 right-3 bg-[#FF6B8B] text-white text-[10px] uppercase tracking-wider shadow-md">
            SALE
          </Badge>
        )}

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="absolute bottom-3 right-3 w-12 h-12 bg-white text-gray-900 rounded-full shadow-lg flex items-center justify-center hover:bg-[#FF6B8B] hover:text-white transition-all transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-6 h-6" />
        </button>

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <span className="text-white font-bold text-sm">Out of Stock</span>
          </div>
        )}
      </div>
      <Link to={`/product/${product.slug}`} className="px-5 pb-5 pt-2 flex flex-col flex-grow">
        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-bold">
          {categoryDisplay}
        </div>
        <h3 className="font-display font-bold text-gray-900 text-lg mb-1 leading-tight group-hover:text-[#FF6B8B] transition-colors">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-xl text-[#FF6B8B]">{formatPrice(product.price || 0)}</span>
          <div className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-50 px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-gray-600 font-bold">{product.rating}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};
