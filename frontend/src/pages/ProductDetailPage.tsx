import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Eye, ShoppingBag, Heart, Share2, ExternalLink, Plus, Minus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  images: string[];
  category: string;
  subcategory?: string;
  tags: string[];
  specifications: {
    brand?: string;
    model?: string;
    color?: string[];
    size?: string[];
    material?: string;
    weight?: string;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
  };
  supplier: {
    name?: string;
    platform?: string;
    url?: string;
    rating?: number;
    location?: string;
  };
  stock: {
    available: boolean;
    quantity: number;
    minOrderQuantity: number;
  };
  shipping: {
    estimatedDays?: {
      min: number;
      max: number;
    };
    cost?: number;
    freeShippingThreshold?: number;
  };
  popularity: {
    views: number;
    orders: number;
    rating: number;
    reviewCount: number;
  };
  discountPercentage?: number;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      console.log('📦 Fetching product:', id);
      const response = await axios.get(`/products/${id}`);
      console.log('✅ Product fetched:', response.data.product);
      setProduct(response.data.product);
    } catch (error: any) {
      console.error('❌ Failed to fetch product:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message);
      console.error('   Product ID:', id);
      
      if (error.response?.status === 404) {
        const errorMessage = error.response?.data?.message || 'Product not found';
        const reason = error.response?.data?.reason;
        
        toast.error(
          reason 
            ? `${errorMessage}. ${reason}` 
            : errorMessage,
          { autoClose: 5000 }
        );
        
        // Redirect after showing error
        setTimeout(() => {
          navigate('/products');
        }, 2000);
      } else {
        toast.error('Failed to load product details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderNow = () => {
    if (!user) {
      toast.info('Please login to place an order');
      navigate('/login');
      return;
    }

    if (!user.approved) {
      toast.warning('Your account is pending approval. Please contact support.');
      return;
    }

    const orderParams = new URLSearchParams({
      product: product?.name || '',
      price: product?.price.toString() || '0',
      quantity: quantity.toString(),
      fromWebsite: 'true',
      productId: product?._id || ''
    });

    navigate(`/orders/new?${orderParams.toString()}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link to="/products" className="btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.images || [])];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/products" className="hover:text-primary-600 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg shadow-soft overflow-hidden">
              <img
                src={allImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {allImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-error-600 transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                {product.popularity.rating > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.popularity.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.popularity.rating.toFixed(1)} ({product.popularity.reviewCount} reviews)
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>{product.popularity.views} views</span>
                </div>
                
                <span className="text-sm text-gray-600">
                  {product.popularity.orders} orders
                </span>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <span className="badge badge-primary">{product.category}</span>
                {product.subcategory && (
                  <span className="badge badge-secondary">{product.subcategory}</span>
                )}
                {product.featured && (
                  <span className="badge badge-warning">Featured</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-b border-gray-200 py-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    {product.discountPercentage && (
                      <span className="badge badge-error">
                        -{product.discountPercentage}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              {product.shipping?.estimatedDays && (
                <p className="text-sm text-gray-600 mb-2">
                  Estimated delivery: {product.shipping.estimatedDays.min}-{product.shipping.estimatedDays.max} days
                </p>
              )}

              {product.shipping?.cost && (
                <p className="text-sm text-gray-600">
                  Shipping: ${product.shipping.cost.toFixed(2)}
                  {product.shipping.freeShippingThreshold && (
                    <span className="text-success-600 ml-1">
                      (Free shipping on orders over ${product.shipping.freeShippingThreshold})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Stock & Quantity */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Availability:</span>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  product.stock.available 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-red-700 bg-red-100'
                }`}>
                  {product.stock.available ? '✓ In Stock' : '✗ Out of Stock'}
                </span>
              </div>

              {product.stock.minOrderQuantity > 1 && (
                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <span className="text-sm font-medium text-blue-700">Minimum Order:</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {product.stock.minOrderQuantity} pieces
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">Select Quantity:</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(product.stock.minOrderQuantity || 1, quantity - 1))}
                    disabled={quantity <= (product.stock.minOrderQuantity || 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-primary-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation active:scale-95"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || (product.stock.minOrderQuantity || 1);
                        setQuantity(Math.max(product.stock.minOrderQuantity || 1, newValue));
                      }}
                      className="w-full px-4 py-3 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      min={product.stock.minOrderQuantity || 1}
                      max={product.stock.quantity || 9999}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {product.stock.quantity ? `Max: ${product.stock.quantity} available` : ''}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const maxQty = product.stock.quantity || 9999;
                      if (quantity < maxQty) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    disabled={product.stock.quantity ? quantity >= product.stock.quantity : false}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-primary-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation active:scale-95"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Total Price Preview */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'}):</span>
                    <span className="text-lg font-bold text-primary-600">
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                  </div>
                  {product.shipping?.cost && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Shipping:</span>
                      <span className="text-sm font-medium text-gray-700">
                        ${product.shipping.cost.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleOrderNow}
                disabled={!product.stock.available}
                className="btn-primary w-full btn-lg flex items-center justify-center"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Order Now
              </button>
              
              <Link
                to={`/orders/new?product=${encodeURIComponent(product.name)}&price=${product.price}&quantity=${quantity}&fromWebsite=true&productId=${product._id}`}
                className="btn-outline w-full btn-lg text-center"
              >
                Get Custom Quote
              </Link>
            </div>

            {/* Supplier Info */}
            {product.supplier?.name && (
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Supplier Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Supplier:</strong> {product.supplier.name}</p>
                  {product.supplier.platform && (
                    <p><strong>Platform:</strong> {product.supplier.platform}</p>
                  )}
                  {product.supplier.location && (
                    <p><strong>Location:</strong> {product.supplier.location}</p>
                  )}
                  {product.supplier.rating && (
                    <p><strong>Rating:</strong> {product.supplier.rating}/5</p>
                  )}
                  {product.supplier.url && (
                    <a
                      href={product.supplier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-600 hover:text-primary-700"
                    >
                      View on {product.supplier.platform}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            
            {product.tags && product.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="badge badge-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
            <div className="space-y-3">
              {product.specifications.brand && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{product.specifications.brand}</span>
                </div>
              )}
              {product.specifications.model && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-medium">{product.specifications.model}</span>
                </div>
              )}
              {product.specifications.material && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-medium">{product.specifications.material}</span>
                </div>
              )}
              {product.specifications.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{product.specifications.weight}</span>
                </div>
              )}
              {product.specifications.color && product.specifications.color.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Colors:</span>
                  <span className="font-medium">{product.specifications.color.join(', ')}</span>
                </div>
              )}
              {product.specifications.size && product.specifications.size.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sizes:</span>
                  <span className="font-medium">{product.specifications.size.join(', ')}</span>
                </div>
              )}
              {product.specifications.dimensions && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-medium">
                    {product.specifications.dimensions.length} × {product.specifications.dimensions.width} × {product.specifications.dimensions.height} {product.specifications.dimensions.unit}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;