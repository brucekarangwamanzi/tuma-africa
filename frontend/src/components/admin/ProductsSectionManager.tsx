import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Eye, EyeOff, Grid, List } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Product {
  id?: string; // UUID from PostgreSQL
  _id?: string; // Legacy MongoDB ID (for backward compatibility)
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isActive: boolean;
}

// Helper function to get product ID
const getProductId = (product: Product): string => {
  return product.id || product._id || '';
};

interface ProductsSectionManagerProps {
  register: any;
  setValue: any;
  watchedValues: any;
}

const ProductsSectionManager: React.FC<ProductsSectionManagerProps> = ({
  register,
  setValue,
  watchedValues,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  const displayMode = watchedValues.productSection?.displayMode || 'auto';
  const featuredProducts = watchedValues.productSection?.featuredProducts || [];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/products?limit=100');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    const currentFeatured = featuredProducts || [];
    const isSelected = currentFeatured.includes(productId);
    
    let newFeatured;
    if (isSelected) {
      newFeatured = currentFeatured.filter((id: string) => id !== productId);
    } else {
      newFeatured = [...currentFeatured, productId];
    }
    
    setValue('productSection.featuredProducts', newFeatured);
  };

  const removeProduct = (productId: string) => {
    const newFeatured = featuredProducts.filter((id: string) => id !== productId);
    setValue('productSection.featuredProducts', newFeatured);
  };

  const clearAllProducts = () => {
    setValue('productSection.featuredProducts', []);
    toast.success('All products removed');
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProducts = products.filter(p => featuredProducts.includes(p._id));

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Products Section</h2>
      
      <div className="space-y-6">
        {/* Section Title */}
        <div>
          <label className="label">Section Title</label>
          <input
            type="text"
            {...register('productSection.title')}
            className="input"
            placeholder="Shop Popular Products"
          />
        </div>

        {/* Section Subtitle */}
        <div>
          <label className="label">Section Subtitle</label>
          <textarea
            {...register('productSection.subtitle')}
            className="input"
            rows={3}
            placeholder="Discover trending products from top Asian suppliers"
          />
        </div>

        {/* Display Mode */}
        <div>
          <label className="label">Display Mode</label>
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                {...register('productSection.displayMode')}
                value="auto"
                className="text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <span className="font-medium text-gray-900">Automatic (Popular Products)</span>
                <p className="text-sm text-gray-600">
                  Automatically display most popular products based on views and orders
                </p>
              </div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                {...register('productSection.displayMode')}
                value="manual"
                className="text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <span className="font-medium text-gray-900">Manual Selection</span>
                <p className="text-sm text-gray-600">
                  Manually select which products to display on the homepage
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Manual Product Selection */}
        {displayMode === 'manual' && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Selected Products ({selectedProducts.length})
              </h3>
              <div className="flex space-x-2">
                {selectedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllProducts}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Products</span>
                </button>
              </div>
            </div>

            {/* Selected Products Grid */}
            {selectedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {selectedProducts.map((product) => (
                  <div
                    key={getProductId(product)}
                    className="relative border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <button
                      type="button"
                      onClick={() => removeProduct(getProductId(product))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                    <p className="text-sm text-gray-600">${product.price}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {product.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
                <Grid className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-2">No products selected</p>
                <p className="text-sm text-gray-500">Click "Add Products" to select products to display</p>
              </div>
            )}

            {/* Product Selector Modal */}
            {showProductSelector && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Select Products</h3>
                      <button
                        type="button"
                        onClick={() => setShowProductSelector(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((product) => {
                          const productId = getProductId(product);
                          const isSelected = featuredProducts.includes(productId);
                          return (
                            <div
                              key={productId}
                              onClick={() => toggleProductSelection(productId)}
                              className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                                  : 'hover:border-gray-400 hover:shadow-md'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center">
                                  ✓
                                </div>
                              )}
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                              <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                              <p className="text-sm text-gray-600">${product.price}</p>
                              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {product.category}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-600">No products found</p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {selectedProducts.length} product(s) selected
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowProductSelector(false)}
                        className="btn-primary"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display Count */}
        <div>
          <label className="label">Display Count</label>
          <input
            type="number"
            {...register('productSection.displayCount')}
            className="input"
            min="4"
            max="20"
            placeholder="8"
          />
          <p className="text-sm text-gray-600 mt-1">
            Number of products to display on the homepage
          </p>
        </div>

        {/* Display Options */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('productSection.showPrices')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show product pricing</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('productSection.showRatings')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show product ratings</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductsSectionManager;
