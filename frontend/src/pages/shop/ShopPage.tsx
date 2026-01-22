import React, { useState, useMemo, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  Filter, Grid, List, ChevronDown, Star, ShoppingCart, Heart, 
  X, SlidersHorizontal 
} from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { useProducts, useCategories } from '@/hooks';
import { useCartStore } from '@/stores/cartStore';
import { productService } from '@/services/api/product.service';

type ViewMode = 'grid' | 'list';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export const ShopPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPriceLimit, setMaxPriceLimit] = useState<number>(200);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { addItem } = useCartStore();
  
  const { categories = [] } = useCategories();
  
  // Fetch dynamic price range when component mounts or category changes
  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        const categoryId = selectedCategory !== 'all' ? selectedCategory : undefined;
        const range = await productService.getPriceRange(categoryId);
        
        // Round up to nearest 10 for better UX
        const maxPrice = Math.ceil(range.maxPrice / 10) * 10;
        setMaxPriceLimit(maxPrice);
        
        // Reset price range to new limits if current range exceeds them
        setPriceRange((current) => {
          const newMax = Math.min(current[1], maxPrice);
          return [0, newMax];
        });
      } catch (error) {
        console.error('Failed to fetch price range:', error);
        // Fallback to default if API fails
        setMaxPriceLimit(200);
      }
    };

    fetchPriceRange();
  }, [selectedCategory]);
  
  const { products = [], isLoading } = useProducts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    rating: selectedRating > 0 ? selectedRating : undefined,
    sort: sortBy as any,
  });

  // Products are already filtered by the API based on the filters passed to useProducts
  const filteredProducts = products;

  const handleAddToCart = (product: any) => {
    addItem(product);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Shop</h1>
          <p className="text-gray-500 font-medium">
            Discover our curated collection of premium products
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6B8B]"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
              </div>

              {/* Results Count */}
              <span className="text-sm text-gray-500 font-medium">
                {filteredProducts.length} products
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none px-4 py-2 pr-10 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6B8B]"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
              </div>

              {/* View Toggle */}
              <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#FF6B8B] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-[#FF6B8B] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside
            className={`${
              isFilterOpen ? 'fixed inset-0 z-50 bg-black/50' : 'hidden'
            } md:block md:relative md:w-64 flex-shrink-0`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsFilterOpen(false);
            }}
          >
            <div
              className={`${
                isFilterOpen
                  ? 'fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform translate-x-0'
                  : ''
              } md:bg-white md:rounded-2xl md:shadow-card md:border md:border-gray-100 md:p-6 md:sticky md:top-28 transition-transform duration-300`}
            >
              {isFilterOpen && (
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              )}

              <div className={isFilterOpen ? 'p-6' : ''}>
                <div className="space-y-8">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Price Range</h3>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max={maxPriceLimit}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                        className="w-full accent-[#FF6B8B]"
                      />
                      <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Rating</h3>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                            selectedRating === rating
                              ? 'bg-[#FFF0F3] border-2 border-[#FF6B8B]'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating ? 'fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">& Up</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setPriceRange([0, maxPriceLimit]);
                      setSelectedRating(0);
                      setIsFilterOpen(false);
                    }}
                    className="w-full py-2 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#FF6B8B] hover:text-[#FF6B8B] transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid/List */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'flex flex-col gap-6'
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or browse all products
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setPriceRange([0, maxPriceLimit]);
                    setSelectedRating(0);
                  }}
                  className="px-6 py-3 bg-[#FF6B8B] text-white rounded-xl font-bold hover:bg-[#E64A6B] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
