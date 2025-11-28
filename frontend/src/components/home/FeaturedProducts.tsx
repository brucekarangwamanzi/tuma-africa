import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import { useSettingsStore } from '../../store/settingsStore';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

const FeaturedProducts: React.FC = () => {
  const { settings } = useSettingsStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const productSection = settings?.productSection;
  const displayMode = productSection?.displayMode || 'auto';
  const featuredProductIds = productSection?.featuredProducts || [];
  const displayCount = productSection?.displayCount || 8;
  const showPrices = productSection?.showPrices !== false;
  const showRatings = productSection?.showRatings !== false;
  const title = productSection?.title || 'Shop Popular Products';
  const subtitle = productSection?.subtitle || 'Discover trending products from top Asian suppliers';

  useEffect(() => {
    // Only fetch if settings are loaded
    if (settings) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, displayCount]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let response;
      
      if (displayMode === 'manual' && featuredProductIds.length > 0) {
        // Fetch specific products by IDs
        response = await axios.post('/products/by-ids', {
          productIds: featuredProductIds.slice(0, displayCount)
        });
      } else {
        // Fetch popular products automatically
        response = await axios.get(`/products?sortBy=popular&limit=${displayCount}`);
      }
      
      setProducts(response.data.products || response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      
      // Handle rate limit error gracefully
      if (error.response?.status === 429) {
        console.log('Rate limit reached, will retry later');
        // Don't show error to user, just use empty array
      }
      
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-24">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-4 text-lg text-slate-600">{subtitle}</p>
        </div>
        <div className="mt-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <div className="mt-24">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-4 text-lg text-slate-600">{subtitle}</p>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div
            key={product._id}
            className="card-anim bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-16 h-16 text-slate-400" />
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {product.description}
              </p>
              {showPrices && (
                <p className="text-lg font-semibold text-primary mt-2">
                  {product.price.toLocaleString()} RWF
                </p>
              )}
              <div className="mt-auto pt-4 space-y-2">
                <Link
                  to={`/products/${product._id}`}
                  className="block w-full text-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  View Details
                </Link>
                <Link
                  to={`/orders/new?product=${encodeURIComponent(product.name)}&price=${product.price}&quantity=1&fromWebsite=true&productId=${product._id}`}
                  className="btn-shine block w-full text-center btn-primary font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  Quick Order
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Products Link */}
      <div className="mt-12 text-center">
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-700 transition-colors"
        >
          View All Products
        </Link>
      </div>
    </div>
  );
};

export default FeaturedProducts;
