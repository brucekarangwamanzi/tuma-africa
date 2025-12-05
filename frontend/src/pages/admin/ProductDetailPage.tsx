import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Edit,
  Trash2,
  Star,
  StarOff,
  Eye,
  ShoppingCart,
  Calendar,
  User,
  Tag,
  Truck,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useProductStore, getProductId } from '../../store/productStore';
import { formatDistanceToNow } from 'date-fns';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { 
    currentProduct: product, 
    isLoading, 
    fetchProduct, 
    deleteProduct, 
    toggleFeatured,
    clearCurrentProduct 
  } = useProductStore();

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }

    return () => {
      clearCurrentProduct();
    };
  }, [productId, clearCurrentProduct, fetchProduct]);

  const handleDelete = async () => {
    if (!product) return;
    
    const productId = getProductId(product);
    if (!productId) {
      console.error('Product ID not found');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      await deleteProduct(productId);
      navigate('/admin/products');
    }
  };

  const handleToggleFeatured = async () => {
    if (!product) return;
    const productId = getProductId(product);
    if (!productId) {
      console.error('Product ID not found');
      return;
    }
    await toggleFeatured(productId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/admin/products"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Product Details & Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleFeatured}
                className={`flex items-center px-4 py-2 rounded-xl transition-colors ${
                  product.featured
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {product.featured ? <Star className="w-4 h-4 mr-2" /> : <StarOff className="w-4 h-4 mr-2" />}
                {product.featured ? 'Featured' : 'Not Featured'}
              </button>
              
              <Link
                to={`/admin/products/${getProductId(product)}/edit`}
                className="flex items-center px-4 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded-xl transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
              
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Images */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Main Image</h3>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
                
                {product.images && product.images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {product.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-900 leading-relaxed">{product.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
                    <p className="text-gray-900">{product.category}</p>
                    {product.subcategory && (
                      <>
                        <h3 className="text-sm font-medium text-gray-700 mb-2 mt-4">Subcategory</h3>
                        <p className="text-gray-900">{product.subcategory}</p>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Pricing</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-green-600">${product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                          {product.discountPercentage && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                              -{product.discountPercentage}% OFF
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications */}
            {product.specifications && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Specifications</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.specifications.brand && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Brand</h3>
                      <p className="text-gray-900">{product.specifications.brand}</p>
                    </div>
                  )}
                  
                  {product.specifications.model && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Model</h3>
                      <p className="text-gray-900">{product.specifications.model}</p>
                    </div>
                  )}
                  
                  {product.specifications.material && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Material</h3>
                      <p className="text-gray-900">{product.specifications.material}</p>
                    </div>
                  )}
                  
                  {product.specifications.weight && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Weight</h3>
                      <p className="text-gray-900">{product.specifications.weight}</p>
                    </div>
                  )}
                  
                  {product.specifications.color && product.specifications.color.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Available Colors</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.specifications.color.map((color, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {product.specifications.size && product.specifications.size.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Available Sizes</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.specifications.size.map((size, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Featured</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.featured 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.featured ? (
                      <>
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </>
                    ) : (
                      'Not Featured'
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.stock.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock.available ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                  <span className="font-semibold text-gray-900">{product.popularity.views.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Orders</span>
                  </div>
                  <span className="font-semibold text-gray-900">{product.popularity.orders.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Rating</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {product.popularity.rating > 0 ? `${product.popularity.rating}/5` : 'No ratings'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <span className="font-semibold text-gray-900">{product.stock.quantity}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Min Order</span>
                  <span className="font-semibold text-gray-900">{product.stock.minOrderQuantity}</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Created</span>
                  <p className="font-medium text-gray-900">
                    {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-600">Last Updated</span>
                  <p className="font-medium text-gray-900">
                    {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                
                {product.createdBy && (
                  <div>
                    <span className="text-gray-600">Created By</span>
                    <p className="font-medium text-gray-900">{product.createdBy.fullName}</p>
                  </div>
                )}
                
                {product.lastUpdatedBy && (
                  <div>
                    <span className="text-gray-600">Last Updated By</span>
                    <p className="font-medium text-gray-900">{product.lastUpdatedBy.fullName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;