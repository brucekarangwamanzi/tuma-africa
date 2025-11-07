import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, Star, Eye, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  subcategory?: string;
  popularity: {
    views: number;
    orders: number;
    rating: number;
    reviewCount: number;
  };
  discountPercentage?: number;
}

interface ProductsResponse {
  products: Product[];
  categories: string[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<ProductsResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'featured');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (sortBy) params.set('sortBy', sortBy);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('page', searchParams.get('page') || '1');
      params.set('limit', '12');

      const response = await axios.get(`/products?${params.toString()}`);
      const data: ProductsResponse = response.data;
      
      setProducts(data.products);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchQuery, page: '1' });
  };

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('featured');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className={`bg-white rounded-lg shadow-soft hover:shadow-medium transition-shadow duration-200 overflow-hidden group ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`object-cover group-hover:scale-105 transition-transform duration-200 ${
            viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'
          }`}
        />
        {product.discountPercentage && product.discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-error-500 text-white px-2 py-1 rounded text-sm font-medium">
            -{product.discountPercentage}%
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          <Eye className="h-3 w-3" />
          <span>{product.popularity.views}</span>
        </div>
      </div>
      
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {product.name}
          </h3>
          {product.popularity.rating > 0 && (
            <div className="flex items-center space-x-1 ml-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {product.popularity.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.category}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {product.popularity.orders} orders
          </span>
          
          <div className="flex space-x-2">
            <Link
              to={`/products/${product._id}`}
              className="btn-outline btn-sm"
            >
              View Details
            </Link>
            <Link
              to={`/orders/new?product=${encodeURIComponent(product.name)}&link=${encodeURIComponent(product.imageUrl)}&price=${product.price}`}
              className="btn-primary btn-sm"
            >
              <ShoppingBag className="h-4 w-4 mr-1" />
              Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>

          {/* Filters and View Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              {(selectedCategory || minPrice || maxPrice) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateFilters({ sortBy: e.target.value, page: '1' });
                }}
                className="input w-auto"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow-soft">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      updateFilters({ category: e.target.value, page: '1' });
                    }}
                    className="input"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Min Price ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    onBlur={() => updateFilters({ minPrice, page: '1' })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Max Price ($)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    onBlur={() => updateFilters({ maxPrice, page: '1' })}
                    className="input"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      updateFilters({ 
                        category: selectedCategory,
                        minPrice,
                        maxPrice,
                        page: '1'
                      });
                    }}
                    className="btn-primary w-full"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
            }`}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  {pagination.hasPrev && (
                    <button
                      onClick={() => updateFilters({ page: (pagination.current - 1).toString() })}
                      className="btn-outline"
                    >
                      Previous
                    </button>
                  )}
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.current} of {pagination.pages}
                  </span>
                  
                  {pagination.hasNext && (
                    <button
                      onClick={() => updateFilters({ page: (pagination.current + 1).toString() })}
                      className="btn-outline"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
            {(searchQuery || selectedCategory || minPrice || maxPrice) && (
              <button
                onClick={clearFilters}
                className="btn-primary mt-4"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;