import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  StarOff,
  RefreshCw,
  ShoppingCart,
  Users,
  Activity
} from 'lucide-react';
import { useProductStore, getProductId } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { EyeOff, Eye as EyeOn } from 'lucide-react';

const ProductManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    products,
    stats,
    pagination,
    categories,
    isLoading,
    fetchProducts,
    deleteProduct,
    toggleFeatured,
    changeProductStatus,
    fetchCategories
  } = useProductStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('isActive') || '');
  const [featuredFilter, setFeaturedFilter] = useState(searchParams.get('featured') || '');

  useEffect(() => {
    loadProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadProducts = async () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (categoryFilter) params.set('category', categoryFilter);
    if (statusFilter) params.set('isActive', statusFilter);
    if (featuredFilter) params.set('featured', featuredFilter);
    params.set('page', searchParams.get('page') || '1');
    params.set('limit', '12');

    await fetchProducts(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      await deleteProduct(productId);
    }
  };

  const handleToggleFeatured = async (productId: string) => {
    await toggleFeatured(productId);
  };

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? 'draft' : 'published';
    await changeProductStatus(productId, newStatus);
    // Refresh products list
    loadProducts();
  };

  const getStatusBadge = (isActive: boolean, status?: 'draft' | 'published') => {
    const displayStatus = status || (isActive ? 'published' : 'draft');
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        displayStatus === 'published'
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {displayStatus === 'published' ? 'Published' : 'Draft'}
      </span>
    );
  };

  // Check if user can edit products (Admin or Super Admin)
  const canEditProducts = user && (user.role === 'admin' || user.role === 'super_admin');
  // Check if user can change status (Admin or Super Admin)
  const canChangeStatus = user && (user.role === 'admin' || user.role === 'super_admin');

  if (isLoading && !products.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Product Management</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Manage your product catalog and inventory
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadProducts}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <Link
                to="/admin/products/new"
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Featured</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalOrders.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, description, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      handleFilterChange('category', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      handleFilterChange('isActive', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <Star className="w-4 h-4 text-gray-500" />
                  <select
                    value={featuredFilter}
                    onChange={(e) => {
                      setFeaturedFilter(e.target.value);
                      handleFilterChange('featured', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Products</option>
                    <option value="true">Featured</option>
                    <option value="false">Not Featured</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          {products.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-center py-16 px-6">
                <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No products found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery || categoryFilter || statusFilter || featuredFilter
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'Get started by adding your first product to the catalog'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {(searchQuery || categoryFilter || statusFilter || featuredFilter) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('');
                        setStatusFilter('');
                        setFeaturedFilter('');
                        setSearchParams({});
                      }}
                      className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <Link 
                    to="/admin/products/new" 
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2 inline" />
                    Add Your First Product
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const productId = getProductId(product);
                return (
                <div key={productId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3 flex space-x-2">
                      {getStatusBadge(product.isActive)}
                      {product.featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      )}
                    </div>
                    {product.discountPercentage && product.discountPercentage > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        -{product.discountPercentage}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">${product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {product.popularity.views}
                        </span>
                        <span className="flex items-center">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          {product.popularity.orders}
                        </span>
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/admin/products/${productId}`}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                      {canEditProducts && (
                        <Link
                          to={`/admin/products/${productId}/edit`}
                          className="flex-1 flex items-center justify-center px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      )}
                      {canChangeStatus && (
                        <button
                          onClick={() => {
                            const productId = getProductId(product);
                            if (productId) handleToggleStatus(productId, product.isActive);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isActive
                              ? 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                              : 'text-green-600 bg-green-50 hover:bg-green-100'
                          }`}
                          title={product.isActive ? 'Hide product (set to draft)' : 'Publish product (make visible)'}
                        >
                          {product.isActive ? <EyeOff className="w-4 h-4" /> : <EyeOn className="w-4 h-4" />}
                        </button>
                      )}
                      {canEditProducts && (
                        <button
                          onClick={() => {
                            const productId = getProductId(product);
                            if (productId) handleToggleFeatured(productId);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            product.featured
                              ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                              : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                          }`}
                          title={product.featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          {product.featured ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                        </button>
                      )}
                      {user?.role === 'super_admin' && (
                        <button
                          onClick={() => {
                            const productId = getProductId(product);
                            if (productId) handleDelete(productId, product.name);
                          }}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-1 bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              {pagination.hasPrev && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current - 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Previous
                </Link>
              )}
              
              <div className="flex items-center space-x-1 px-4">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.current;
                  
                  return (
                    <Link
                      key={pageNum}
                      to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pageNum) })}`}
                      className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                
                {pagination.pages > 5 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <Link
                      to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.pages) })}`}
                      className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {pagination.pages}
                    </Link>
                  </>
                )}
              </div>
              
              <div className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                Page {pagination.current} of {pagination.pages}
              </div>
              
              {pagination.hasNext && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current + 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Next
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagementPage;