import React, { useRef, useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { useFeaturedProducts, useCategories, useRecommendedProducts } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';

export const HomePage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products = [], isLoading } = useFeaturedProducts();
  const { user, isAuthenticated } = useAuthStore();
  const { products: recommendedProducts = [], isLoading: recommendedLoading } = useRecommendedProducts(8);
  const { categories: categoriesData = [] } = useCategories();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-mesh pt-20">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-[#FF6B8B]/30 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-[#4ECDC4]/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/50 backdrop-blur-md border border-white/60 text-[#FF6B8B] text-xs font-bold uppercase tracking-widest mb-8 shadow-sm">
              New Collection 2024
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 tracking-tight mb-8 font-display leading-[1.1]">
              Discover Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B8B] via-[#FF8E53] to-[#FF6B8B]">
                Perfect Style
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Explore a curated selection of premium products designed to elevate your everyday life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/shop"
                className="px-8 py-4 bg-[#FF6B8B] text-white rounded-full font-bold text-lg hover:bg-[#E64A6B] transition-all hover:-translate-y-1 shadow-xl hover:shadow-2xl"
              >
                Explore Collection
              </Link>
              <Link
                to="/shop"
                search={{ sort: 'deals' }}
                className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200 rounded-full font-bold text-lg hover:bg-white transition-all hover:-translate-y-1 shadow-lg"
              >
                Shop Deals
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-[20%] right-[5%] w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl animate-product-float hidden lg:block rotate-3">
          <img
            src="https://hoangphuconline.vn/media/catalog/product/k/0/k0ex2td95d_0111_5__3.jpg?quality=100&fit=bounds&height=700&width=700&canvas=700:700"
            alt="Float 1"
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className="absolute bottom-[20%] left-[5%] w-40 h-40 md:w-56 md:h-56 rounded-3xl overflow-hidden shadow-2xl animate-product-float hidden lg:block -rotate-3"
          style={{ animationDelay: '2s' }}
        >
          <img
            src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=600"
            alt="Float 2"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Find exactly what you're looking for from our wide range of collections.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoriesData.map((cat) => (
              <Link
                key={cat.id}
                to="/shop"
                search={{ category: cat.id }}
                className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 transition-opacity duration-300 opacity-80 group-hover:opacity-90"></div>
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                  <h3 className="text-2xl font-bold text-white mb-1 font-display">{cat.name}</h3>
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <span>Browse Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Products Section - Only show for authenticated users */}
      {isAuthenticated && (
        <section className="py-24 bg-white overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-2">
                  Recommended for You
                </h2>
                <p className="text-gray-500">Curated selections based on your style.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => scroll('left')}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {recommendedLoading ? (
              <div className="flex gap-6 overflow-x-auto pb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="min-w-[280px] md:min-w-[320px]">
                    <Skeleton className="w-full h-[400px] rounded-3xl" />
                  </div>
                ))}
              </div>
            ) : recommendedProducts.length > 0 ? (
              <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {recommendedProducts.map((product, idx) => (
                  <div key={`${product.id}-${idx}`} className="min-w-[280px] md:min-w-[320px] snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No recommendations available yet. Start shopping to get personalized suggestions!</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
