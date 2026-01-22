import React, { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Shield,
  Truck,
  Check,
  AlertCircle,
  Plus,
  Minus,
  X,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { useProduct, useRelatedProducts } from '@/hooks';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type TabType = 'description' | 'specifications' | 'reviews';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams({ from: '/product/$slug' });
  const { product, isLoading } = useProduct(undefined, slug);
  const { products: relatedProducts } = useRelatedProducts(product?.id, 6);
  const { addItem } = useCartStore();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/shop" className="text-[#FF6B8B] hover:text-[#E64A6B] font-medium">
          Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.images || [product.image];
  const galleryImages = images.length < 4 ? [...images, ...Array(4 - images.length).fill(images[0])] : images;

  const colors = ['#000000', '#FFFFFF', '#FF6B8B'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      category: product.categoryName || product.categoryId,
      stock: product.stock,
    }, quantity);
  };

  const handleAddBundle = () => {
    if (!relatedProducts || relatedProducts.length === 0) {
      handleAddToCart();
      return;
    }
    
    const bundleProduct = relatedProducts[0];
    // Add current product
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      category: product.categoryName || product.categoryId,
      stock: product.stock,
    }, quantity);
    
    // Add bundle product
    addItem({
      id: bundleProduct.id,
      name: bundleProduct.name,
      price: bundleProduct.price,
      image: bundleProduct.images?.[0] || '',
      category: bundleProduct.categoryName || bundleProduct.categoryId,
      stock: bundleProduct.stock,
    }, 1);
  };

  return (
    <div className="min-h-screen bg-white pb-24 pt-24">
      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setIsZoomOpen(false)}
        >
          <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img
            src={galleryImages[activeImage]}
            alt="Zoomed Product"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#FF6B8B]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-[#FF6B8B]">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div
              className="relative aspect-square bg-gray-50 rounded-3xl overflow-hidden group cursor-zoom-in"
              onClick={() => setIsZoomOpen(true)}
            >
              <img
                src={galleryImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <Badge className="bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white font-bold">
                    New Arrival
                  </Badge>
                )}
                {product.stock < 5 && product.stock > 0 && (
                  <Badge className="bg-red-100 text-red-700 font-bold">Low Stock</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === idx
                      ? 'border-[#FF6B8B] ring-2 ring-[#FF6B8B]/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            <div>
              <div className="text-sm font-bold text-[#4ECDC4] uppercase tracking-wider mb-2">
                {product.category}
              </div>
              <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900 ml-1">{product.rating}</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500 hover:text-[#FF6B8B] cursor-pointer underline">
                  {product.reviews} Reviews
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="py-6 border-y border-gray-100">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-gray-900">${(product.price || 0).toFixed(2)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <Badge className="bg-rose-100 text-rose-700 font-bold">
                      Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </Badge>
                  </>
                )}
              </div>
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  product.stock > 0 ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {product.stock > 0 ? (
                  <>
                    <Check className="w-4 h-4" /> In Stock & Ready to Ship
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" /> Out of Stock
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            {/* Variants */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Color</label>
                <div className="flex gap-3">
                  {colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(idx)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === idx
                          ? 'border-[#FF6B8B] ring-2 ring-[#FF6B8B]/20'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-gray-900">Size</label>
                  <button className="text-xs text-[#FF6B8B] font-bold hover:underline">
                    Size Guide
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        selectedSize === size
                          ? 'bg-[#FF6B8B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Quantity</label>
                <div className="flex items-center border border-gray-200 rounded-lg w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stock != null && quantity >= product.stock}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full h-14 bg-[#FF6B8B] hover:bg-[#E64A6B] text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:-translate-y-1"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#FF6B8B] hover:bg-[#FFF0F3] hover:text-[#FF6B8B]"
                >
                  <Heart className="w-5 h-5 mr-2" /> Wishlist
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#4ECDC4] hover:bg-[#E6FFFA] hover:text-[#4ECDC4]"
                >
                  <Share2 className="w-5 h-5 mr-2" /> Share
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-[#E6FFFA] rounded-lg">
                  <Truck className="w-5 h-5 text-[#4ECDC4]" />
                </div>
                <span className="text-gray-600 font-medium">Free Shipping over $50</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-[#E6FFFA] rounded-lg">
                  <Shield className="w-5 h-5 text-[#4ECDC4]" />
                </div>
                <span className="text-gray-600 font-medium">2 Year Warranty</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-[#E6FFFA] rounded-lg">
                  <RotateCcw className="w-5 h-5 text-[#4ECDC4]" />
                </div>
                <span className="text-gray-600 font-medium">30 Day Returns</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-[#E6FFFA] rounded-lg">
                  <CreditCard className="w-5 h-5 text-[#4ECDC4]" />
                </div>
                <span className="text-gray-600 font-medium">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bundle Section - Frequently Bought Together */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 mb-16 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 font-display">
              Frequently Bought Together
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                    <Check className="w-3 h-3 text-[#4ECDC4]" />
                  </div>
                </div>
                <Plus className="w-6 h-6 text-gray-400" />
                <div className="relative">
                  <img
                    src={relatedProducts[0].images?.[0] || relatedProducts[0].image || ''}
                    alt={relatedProducts[0].name}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                    <Check className="w-3 h-3 text-[#4ECDC4]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end text-center md:text-right min-w-[200px]">
                <div className="text-gray-500 text-sm mb-1">Total Price:</div>
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  ${(((product.price || 0) + (relatedProducts[0].price || 0)) * quantity).toFixed(2)}
                </div>
                <Button
                  onClick={handleAddBundle}
                  className="px-6 py-3 bg-[#FF6B8B] hover:bg-[#E64A6B] text-white rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-all"
                >
                  Add Both to Cart
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <div className="mb-16">
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            {(['description', 'specifications', 'reviews'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'text-[#FF6B8B] border-b-2 border-[#FF6B8B]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white min-h-[300px]">
            {activeTab === 'description' && (
              <div className="prose max-w-4xl text-gray-600 animate-fadeIn">
                <p className="text-lg mb-6 leading-relaxed">
                  {product.longDescription || product.description}
                </p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
                <ul className="space-y-2">
                  {[
                    'Premium materials for durability',
                    'Ergonomic design for comfort',
                    'Industry-leading performance',
                    'Sustainable packaging',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B8B]"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === 'specifications' && (
              <div className="max-w-2xl animate-fadeIn">
                <table className="w-full border-collapse">
                  <tbody>
                    {product.specs ? (
                      Object.entries(product.specs).map(([key, value], i) => (
                        <tr key={key} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-4 font-semibold text-gray-900 w-1/3">{key}</td>
                          <td className="p-4 text-gray-600">{value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-4 text-gray-500 italic">No specifications available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="bg-gray-50 p-8 rounded-2xl text-center">
                    <div className="text-5xl font-extrabold text-gray-900 mb-2">{product.rating}</div>
                    <div className="flex justify-center text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-500">Based on {product.reviews} reviews</p>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-4">
                        <span className="text-sm font-bold w-3">{star}</span>
                        <Star className="w-4 h-4 text-gray-300" />
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{
                              width: star === 5 ? '70%' : star === 4 ? '20%' : '5%',
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 w-8 text-right">
                          {star === 5 ? '70%' : star === 4 ? '20%' : '5%'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="border-b border-gray-100 pb-8">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B8B] to-[#FF8E53] text-white flex items-center justify-center font-bold">
                            {i === 1 ? 'JD' : 'AS'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {i === 1 ? 'John Doe' : 'Alice Smith'}
                            </div>
                            <div className="flex text-yellow-400 text-xs">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">2 days ago</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        Absolutely love this product! The quality is outstanding and it arrived much
                        faster than expected. Would definitely recommend to anyone looking for a
                        premium experience.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 font-display">Similar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-square bg-gray-200 overflow-hidden relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {p.isNew && (
                    <Badge className="absolute top-2 left-2 bg-gray-900 text-white text-[10px]">
                      New
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#FF6B8B] truncate">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-[#FF6B8B]">${(p.price || 0).toFixed(2)}</span>
                    <div className="flex items-center text-xs text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="ml-1 text-gray-500">{p.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
