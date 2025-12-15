import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Plus, 
  Minus,
  DollarSign,
  Ship,
  Plane,
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
  FileText,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';

interface OrderFormData {
  productName: string;
  productLink: string;
  quantity: number;
  unitPrice: number;
  freightType: 'sea' | 'air';
  description: string;
  productImage?: string;
}

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createOrder, isSubmitting } = useOrderStore();
  const { accessToken } = useAuthStore();
  const [formData, setFormData] = useState<OrderFormData>({
    productName: searchParams.get('product') || '',
    productLink: searchParams.get('link') || '',
    quantity: parseInt(searchParams.get('quantity') || '1') || 1,
    unitPrice: parseFloat(searchParams.get('price') || '0') || 0,
    freightType: 'sea',
    description: '',
    productImage: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [productInputType, setProductInputType] = useState<'link' | 'image'>('link');

  const isFromWebsite = searchParams.get('fromWebsite') === 'true';
  const productId = searchParams.get('productId');

  // Fetch product details if productId is provided
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (productId && isFromWebsite) {
        try {
          const response = await axios.get(`/products/${productId}`);
          const product = response.data.product;
          if (product) {
            setFormData(prev => ({
              ...prev,
              productName: product.name || prev.productName,
              unitPrice: product.price || prev.unitPrice,
              description: product.description || prev.description
            }));
          }
        } catch (error) {
          console.error('Failed to fetch product details:', error);
          // Don't show error to user - URL params will be used as fallback
        }
      }
    };

    fetchProductDetails();
  }, [productId, isFromWebsite]);

  // Update form data when URL params change
  useEffect(() => {
    const product = searchParams.get('product');
    const link = searchParams.get('link');
    const price = searchParams.get('price');
    const quantity = searchParams.get('quantity');
    const fromWebsite = searchParams.get('fromWebsite') === 'true';

    if (product) setFormData(prev => ({ ...prev, productName: product }));
    if (link && !fromWebsite) {
      setFormData(prev => ({ ...prev, productLink: link }));
      setProductInputType('link'); // Set to link mode if link is provided
    }
    if (price) setFormData(prev => ({ ...prev, unitPrice: parseFloat(price) || 0 }));
    if (quantity) setFormData(prev => ({ ...prev, quantity: parseInt(quantity) || 1 }));
    
    // Check for image from homepage
    const storedImage = sessionStorage.getItem('orderProductImage');
    if (storedImage && !link) {
      setFormData(prev => ({ ...prev, productImage: storedImage }));
      setImagePreview(storedImage);
      setProductInputType('image');
      sessionStorage.removeItem('orderProductImage'); // Clear after use
    }
  }, [searchParams]);

  // Update image preview when productImage changes
  useEffect(() => {
    if (formData.productImage) {
      setImagePreview(formData.productImage);
    }
  }, [formData.productImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleQuantityChange = (delta: number) => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta)
    }));
  };

  const calculateTotal = () => {
    return formData.quantity * formData.unitPrice;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await axios.post('/upload/image', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const imageUrl = response.data.imageUrl || response.data.url;
      setFormData(prev => ({ ...prev, productImage: imageUrl }));
      setImagePreview(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, productImage: '' }));
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare order data based on selected input type
      const orderData = { ...formData };
      
      // If ordering from website product, don't include productLink
      if (isFromWebsite) {
        orderData.productLink = '';
      } else {
        // Clear the unused field based on selected input type
        if (productInputType === 'link') {
          orderData.productImage = ''; // Clear image if using link
        } else if (productInputType === 'image') {
          orderData.productLink = ''; // Clear link if using image
        }
      }
      
      await createOrder(orderData);
      navigate('/orders');
    } catch (error) {
      // Error handling is done in the store
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Create New Order</h1>
              <p className="mt-2 text-lg text-gray-600">
                Add a new product order to your account
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <Package className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Product Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {!isFromWebsite && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Show Product Using
                      </label>
                      
                      {/* Toggle between Link and Image */}
                      <div className="flex items-center space-x-4 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setProductInputType('link');
                            // Clear image when switching to link
                            if (formData.productImage) {
                              setFormData(prev => ({ ...prev, productImage: '' }));
                              setImagePreview('');
                            }
                          }}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            productInputType === 'link'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <LinkIcon className="w-5 h-5" />
                          <span className="font-medium">Product Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProductInputType('image');
                            // Clear link when switching to image
                            if (formData.productLink) {
                              setFormData(prev => ({ ...prev, productLink: '' }));
                            }
                          }}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            productInputType === 'image'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <ImageIcon className="w-5 h-5" />
                          <span className="font-medium">Product Image</span>
                        </button>
                      </div>

                      {/* Show Link Input */}
                      {productInputType === 'link' && (
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="url"
                            name="productLink"
                            value={formData.productLink}
                            onChange={handleInputChange}
                            placeholder="https://example.com/product"
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      {/* Show Image Upload */}
                      {productInputType === 'image' && (
                        <div>
                          {imagePreview || formData.productImage ? (
                            <div className="relative">
                              <img
                                src={imagePreview || formData.productImage}
                                alt="Product preview"
                                className="w-full h-48 object-cover rounded-xl border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                              <input
                                type="file"
                                id="productImage"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                              <label
                                htmlFor="productImage"
                                className="cursor-pointer flex flex-col items-center"
                              >
                                {uploadingImage ? (
                                  <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                    <span className="text-sm text-gray-600">Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Click to upload product image
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                      PNG, JPG, WEBP up to 10MB
                                    </span>
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Additional notes or specifications..."
                        rows={4}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Quantity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Pricing & Quantity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Quantity *
                    </label>
                    <div className="flex items-center space-x-3">
                      {/* Vertical quantity controls */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(1)}
                          className="flex items-center justify-center w-10 h-10 rounded-t-lg border-2 border-b-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-primary-600 hover:text-primary-600 transition-all duration-200 touch-manipulation active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(-1)}
                          className="flex items-center justify-center w-10 h-10 rounded-b-lg border-2 border-t-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-primary-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation active:scale-95"
                          disabled={formData.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        className="flex-1 px-4 py-3 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {formData.quantity} {formData.quantity === 1 ? 'item' : 'items'} selected
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Unit Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-medium text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        name="unitPrice"
                        value={formData.unitPrice || ''}
                        onChange={handleInputChange}
                        placeholder="0"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Freight Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, freightType: 'sea' }))}
                        className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                          formData.freightType === 'sea'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <Ship className="w-5 h-5" />
                        <span className="font-medium">Sea Freight</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, freightType: 'air' }))}
                        className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                          formData.freightType === 'air'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <Plane className="w-5 h-5" />
                        <span className="font-medium">Air Freight</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.freightType === 'sea' 
                        ? 'Sea Freight: 30-45 days (Most economical)' 
                        : 'Air Freight: 7-14 days (Faster delivery)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({formData.quantity} items)</span>
                    <span className="font-medium">${((formData.quantity || 0) * (formData.unitPrice || 0)).toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-green-600">${calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    {formData.freightType === 'sea' ? (
                      <Ship className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Plane className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-1">Freight Type</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formData.freightType === 'sea' ? 'Sea Freight' : 'Air Freight'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formData.freightType === 'sea' 
                          ? 'Estimated: 30-45 days' 
                          : 'Estimated: 7-14 days'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.productName.trim() || formData.unitPrice <= 0}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Create Order
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/orders')}
                    className="w-full px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Order Processing</p>
                      <p>Your order will be reviewed and processed within 24 hours. You'll receive updates via email and in your dashboard.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrderPage;