import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, Minus } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

interface OrderFormData {
  productName: string;
  productLink: string;
  quantity: number;
  description?: string;
  specifications: {
    color?: string;
    size?: string;
    material?: string;
    brand?: string;
    model?: string;
    other?: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImage, setProductImage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control
  } = useForm<OrderFormData>({
    defaultValues: {
      quantity: 1,
      shippingAddress: {
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        country: user?.address?.country || '',
        zipCode: user?.address?.zipCode || '',
      }
    }
  });

  const quantity = watch('quantity');

  useEffect(() => {
    // Pre-fill form from URL parameters
    const product = searchParams.get('product');
    const link = searchParams.get('link');
    const price = searchParams.get('price');
    const qty = searchParams.get('quantity');

    if (product) setValue('productName', product);
    if (link) {
      setValue('productLink', link);
      setProductImage(link);
    }
    if (qty) setValue('quantity', parseInt(qty));
  }, [searchParams, setValue]);

  const onSubmit = async (data: OrderFormData) => {
    if (!user?.approved) {
      toast.warning('Your account is pending approval. Please contact support.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/orders', data);
      toast.success('Order created successfully!');
      navigate(`/orders/${response.data.order.orderId}`);
    } catch (error: any) {
      console.error('Create order error:', error);
      const message = error.response?.data?.message || 'Failed to create order';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProductImage(response.data.imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-2">
            Fill in the details below to place your order. We'll handle the rest!
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Product Information */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="label">Product Name *</label>
                  <input
                    type="text"
                    {...register('productName', { 
                      required: 'Product name is required',
                      minLength: { value: 2, message: 'Product name must be at least 2 characters' }
                    })}
                    className={`input ${errors.productName ? 'input-error' : ''}`}
                    placeholder="Enter product name"
                  />
                  {errors.productName && (
                    <p className="text-error-600 text-sm mt-1">{errors.productName.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Product Link *</label>
                  <input
                    type="url"
                    {...register('productLink', { 
                      required: 'Product link is required',
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: 'Please enter a valid URL'
                      }
                    })}
                    className={`input ${errors.productLink ? 'input-error' : ''}`}
                    placeholder="https://www.alibaba.com/product/..."
                  />
                  {errors.productLink && (
                    <p className="text-error-600 text-sm mt-1">{errors.productLink.message}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    Paste the product URL from Alibaba, 1688, Taobao, or other platforms
                  </p>
                </div>

                <div>
                  <label className="label">Quantity *</label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setValue('quantity', Math.max(1, quantity - 1))}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      {...register('quantity', { 
                        required: 'Quantity is required',
                        min: { value: 1, message: 'Quantity must be at least 1' },
                        max: { value: 10000, message: 'Quantity cannot exceed 10,000' }
                      })}
                      className={`input w-24 text-center ${errors.quantity ? 'input-error' : ''}`}
                      min="1"
                      max="10000"
                    />
                    <button
                      type="button"
                      onClick={() => setValue('quantity', quantity + 1)}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.quantity && (
                    <p className="text-error-600 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    {...register('description', {
                      maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' }
                    })}
                    className={`input ${errors.description ? 'input-error' : ''}`}
                    rows={4}
                    placeholder="Additional details about the product or special requirements..."
                  />
                  {errors.description && (
                    <p className="text-error-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Product Image */}
              <div>
                <label className="label">Product Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {productImage ? (
                    <div className="relative">
                      <img
                        src={productImage}
                        alt="Product"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => setProductImage('')}
                        className="absolute top-2 right-2 p-1 bg-error-600 text-white rounded-full hover:bg-error-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Upload product image</p>
                      <p className="text-gray-500 text-sm">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image"
                  />
                  <label
                    htmlFor="product-image"
                    className="btn-outline cursor-pointer inline-flex items-center mt-4"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {productImage ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="label">Color</label>
                <input
                  type="text"
                  {...register('specifications.color')}
                  className="input"
                  placeholder="e.g., Red, Blue, Black"
                />
              </div>

              <div>
                <label className="label">Size</label>
                <input
                  type="text"
                  {...register('specifications.size')}
                  className="input"
                  placeholder="e.g., L, XL, 42"
                />
              </div>

              <div>
                <label className="label">Material</label>
                <input
                  type="text"
                  {...register('specifications.material')}
                  className="input"
                  placeholder="e.g., Cotton, Plastic, Metal"
                />
              </div>

              <div>
                <label className="label">Brand</label>
                <input
                  type="text"
                  {...register('specifications.brand')}
                  className="input"
                  placeholder="e.g., Nike, Samsung"
                />
              </div>

              <div>
                <label className="label">Model</label>
                <input
                  type="text"
                  {...register('specifications.model')}
                  className="input"
                  placeholder="e.g., iPhone 15, Galaxy S24"
                />
              </div>

              <div>
                <label className="label">Other</label>
                <input
                  type="text"
                  {...register('specifications.other')}
                  className="input"
                  placeholder="Any other specifications"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  {...register('shippingAddress.fullName', { 
                    required: 'Full name is required' 
                  })}
                  className={`input ${errors.shippingAddress?.fullName ? 'input-error' : ''}`}
                />
                {errors.shippingAddress?.fullName && (
                  <p className="text-error-600 text-sm mt-1">{errors.shippingAddress.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  {...register('shippingAddress.phone', { 
                    required: 'Phone number is required' 
                  })}
                  className={`input ${errors.shippingAddress?.phone ? 'input-error' : ''}`}
                />
                {errors.shippingAddress?.phone && (
                  <p className="text-error-600 text-sm mt-1">{errors.shippingAddress.phone.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="label">Street Address *</label>
                <input
                  type="text"
                  {...register('shippingAddress.street', { 
                    required: 'Street address is required' 
                  })}
                  className={`input ${errors.shippingAddress?.street ? 'input-error' : ''}`}
                />
                {errors.shippingAddress?.street && (
                  <p className="text-error-600 text-sm mt-1">{errors.shippingAddress.street.message}</p>
                )}
              </div>

              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  {...register('shippingAddress.city', { 
                    required: 'City is required' 
                  })}
                  className={`input ${errors.shippingAddress?.city ? 'input-error' : ''}`}
                />
                {errors.shippingAddress?.city && (
                  <p className="text-error-600 text-sm mt-1">{errors.shippingAddress.city.message}</p>
                )}
              </div>

              <div>
                <label className="label">State/Province</label>
                <input
                  type="text"
                  {...register('shippingAddress.state')}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Country *</label>
                <input
                  type="text"
                  {...register('shippingAddress.country', { 
                    required: 'Country is required' 
                  })}
                  className={`input ${errors.shippingAddress?.country ? 'input-error' : ''}`}
                />
                {errors.shippingAddress?.country && (
                  <p className="text-error-600 text-sm mt-1">{errors.shippingAddress.country.message}</p>
                )}
              </div>

              <div>
                <label className="label">ZIP/Postal Code</label>
                <input
                  type="text"
                  {...register('shippingAddress.zipCode')}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !user?.approved}
              className="btn-primary"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>

          {!user?.approved && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <p className="text-warning-800 text-sm">
                <strong>Account Pending Approval:</strong> Your account is currently pending approval. 
                You can create orders, but they will be held until your account is approved by an administrator.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateOrderPage;