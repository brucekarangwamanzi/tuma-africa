import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Upload, X, Save, Image as ImageIcon, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  imageUrl: string;
  images?: string[];
  category: string;
  status?: 'draft' | 'published';
  isActive: boolean;
  featured: boolean;
}

const ProductManagementCMS: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Ensure only super admin can access
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      toast.error('Access denied. Super admin privileges required.');
      return;
    }
  }, [user]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0 as number | string,
    currency: 'USD',
    imageUrl: '',
    images: [] as string[],
    category: '',
    status: 'draft' as 'draft' | 'published',
    isActive: true,
    featured: false,
  });

  useEffect(() => {
    // Only fetch products if user is super admin
    if (user && user.role === 'super_admin') {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Get auth token from store or axios defaults
      const authToken = accessToken 
        ? `Bearer ${accessToken}` 
        : axios.defaults.headers.common['Authorization'] as string;
      
      if (!authToken) {
        console.warn('⚠️ No auth token available for fetching products');
        setIsLoading(false);
        return;
      }
      
      // Use admin route to get all products (including inactive ones) sorted by newest first
      const response = await axios.get('/products/admin/all?limit=1000', {
        headers: {
          'Authorization': authToken
        }
      });
      setProducts(response.data.products || []);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error('Failed to load products');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      validFiles.forEach(file => {
        formDataUpload.append('files', file);
      });

      // Get auth token
      const authToken = accessToken 
        ? `Bearer ${accessToken}` 
        : axios.defaults.headers.common['Authorization'] as string;

      const response = await axios.post('/upload/multiple', formDataUpload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': authToken
        }
      });

      // Extract URLs from response - backend returns files array with fileUrl property
      const uploadedImages = response.data.files.map((f: any) => f.fileUrl || f.url || f.imageUrl);
      const allImages = [...formData.images, ...uploadedImages];
      
      // Set first image as imageUrl if not set
      const newImageUrl = formData.imageUrl || uploadedImages[0] || '';
      
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: newImageUrl,
        images: allImages
      }));
      
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImage(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: newImages,
      // Update imageUrl if we removed the first image
      imageUrl: index === 0 && newImages.length > 0 ? newImages[0] : prev.imageUrl
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('📝 Form submitted');
    console.log('📋 Form data:', formData);
    console.log('👤 User:', user);

    // Check if user is super admin
    if (!user || user.role !== 'super_admin') {
      toast.error('Only super admins can create products');
      console.error('❌ User is not super admin:', user?.role);
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (formData.name.trim().length < 2) {
      toast.error('Product name must be at least 2 characters');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    
    if (formData.description.trim().length < 3) {
      toast.error('Product description must be at least 3 characters');
      return;
    }
    
    const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : Number(formData.price);
    if (!priceValue || isNaN(priceValue) || priceValue <= 0) {
      toast.error('Product price must be a number greater than 0');
      return;
    }
    
    // Check if we have at least one image (either uploaded or URL)
    const hasImages = formData.images.length > 0 || formData.imageUrl.trim().length > 0;
    if (!hasImages) {
      toast.error('Please upload at least one product image');
      return;
    }
    
    if (!formData.category.trim()) {
      toast.error('Product category is required');
      return;
    }
    
    if (formData.category.trim().length < 2) {
      toast.error('Product category must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Update existing product - format payload similar to create
        const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : Number(formData.price);
        
        // Validate price before creating payload
        if (!priceValue || isNaN(priceValue) || priceValue <= 0) {
          toast.error('Please enter a valid price greater than 0');
          setIsSubmitting(false);
          return;
        }
        
        // Use first image as imageUrl if images array exists, otherwise use imageUrl
        let primaryImageUrl = '';
        if (formData.images.length > 0) {
          primaryImageUrl = formData.images[0];
        } else if (formData.imageUrl && formData.imageUrl.trim()) {
          primaryImageUrl = formData.imageUrl.trim();
        }
        
        // Ensure we have at least one image
        if (!primaryImageUrl) {
          toast.error('Please upload at least one product image or provide an image URL');
          setIsSubmitting(false);
          return;
        }
        
        const updatePayload: any = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(priceValue.toString()), // Ensure it's a float number
          currency: formData.currency || 'USD',
          imageUrl: primaryImageUrl,
          category: formData.category.trim(),
          status: formData.status || 'draft',
          isActive: formData.status === 'published' || formData.isActive,
          featured: formData.featured || false
        };
        
        // Only include images array if it has items
        if (formData.images.length > 0) {
          updatePayload.images = formData.images;
        }
        
        console.log('🔄 Updating product with payload:', updatePayload);
        console.log('📦 Product ID:', editingProduct._id);
        
        // Get auth token from store or axios defaults
        const authToken = accessToken 
          ? `Bearer ${accessToken}` 
          : axios.defaults.headers.common['Authorization'] as string;
        
        if (!authToken) {
          toast.error('Authentication token missing. Please log in again.');
          setIsSubmitting(false);
          return;
        }
        
        const response = await axios.put(`/products/${editingProduct._id}`, updatePayload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          }
        });
        
        console.log('✅ Update response received:', response.data);
        
        const updatedProduct = response.data.product || response.data;
        
        if (!updatedProduct || !updatedProduct._id) {
          console.error('❌ Invalid product response:', response.data);
          toast.error('Product updated but invalid response received');
          setIsSubmitting(false);
          return;
        }
        
        // Update product in list immediately
        setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        toast.success('Product updated successfully!');
        
        // Show info about product visibility
        if (updatePayload.status === 'published') {
          toast.success(
            `✅ Product "${updatePayload.name}" is now published and visible on the /products page!`, 
            { autoClose: 4000 }
          );
        } else {
          toast.warning(
            `⚠️ Product "${updatePayload.name}" is saved as draft and hidden from the /products page`, 
            { autoClose: 4000 }
          );
        }
        
        // Update product in list immediately (optimistic update)
        setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: 0,
          currency: 'USD',
          imageUrl: '',
          images: [],
          category: '',
          status: 'draft',
          isActive: false,
          featured: false,
        });
        setEditingProduct(null);
        
        // Close modal
        handleCloseModal();
        
        // Refresh products list to ensure we have latest data from server
        setTimeout(async () => {
          try {
            await fetchProducts();
          } catch (error) {
            console.error('Error refreshing products list:', error);
          }
        }, 500);
      } else {
        // Create new product - ensure all required fields are set
        const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : Number(formData.price);
        
        // Validate price before creating payload
        if (!priceValue || isNaN(priceValue) || priceValue <= 0) {
          toast.error('Please enter a valid price greater than 0');
          setIsSubmitting(false);
          return;
        }
        
        // Use first image as imageUrl if images array exists, otherwise use imageUrl
        let primaryImageUrl = '';
        if (formData.images.length > 0) {
          primaryImageUrl = formData.images[0];
        } else if (formData.imageUrl && formData.imageUrl.trim()) {
          primaryImageUrl = formData.imageUrl.trim();
        }
        
        // Ensure we have at least one image
        if (!primaryImageUrl) {
          toast.error('Please upload at least one product image or provide an image URL');
          setIsSubmitting(false);
          return;
        }
        
        const productPayload: any = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(priceValue.toString()), // Ensure it's a float number
          currency: formData.currency || 'USD',
          imageUrl: primaryImageUrl,
          category: formData.category.trim(),
          status: formData.status || 'draft',
          isActive: formData.status === 'published' || formData.isActive,
          featured: formData.featured || false
        };
        
        // Only include images array if it has items
        if (formData.images.length > 0) {
          productPayload.images = formData.images;
        }
        
        console.log('🚀 Creating product with payload:', productPayload);
        console.log('👤 User role:', user?.role);
        console.log('🔑 Access token from store:', !!accessToken);
        console.log('🔑 Auth token from axios defaults:', !!axios.defaults.headers.common['Authorization']);
        console.log('🌐 API base URL:', axios.defaults.baseURL);
        
        // Get auth token from store or axios defaults
        const authToken = accessToken 
          ? `Bearer ${accessToken}` 
          : axios.defaults.headers.common['Authorization'] as string;
        
        if (!authToken) {
          toast.error('Authentication token missing. Please log in again.');
          console.error('❌ No auth token available');
          setIsSubmitting(false);
          return;
        }
        
        console.log('📡 Making POST request to /api/products');
        console.log('📦 Payload:', JSON.stringify(productPayload, null, 2));
        console.log('🔗 Full URL will be:', axios.defaults.baseURL + '/products');
        
        const response = await axios.post('/products', productPayload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          }
        }).catch((error) => {
          console.error('❌ Axios error:', error);
          console.error('❌ Error response:', error.response?.data);
          console.error('❌ Error status:', error.response?.status);
          throw error;
        });
        
        console.log('✅ Response received:', response.data);
        console.log('📊 Response status:', response.status);
        
        // Handle different response structures
        const newProduct = response.data.product || response.data;
        
        if (!newProduct || !newProduct._id) {
          console.error('❌ Invalid product response:', response.data);
          toast.error('Product created but invalid response received');
          setIsSubmitting(false);
          return;
        }
        
        console.log('✅ Product created successfully:', newProduct);
        
        // Show success message first
        toast.success('Product created successfully!');
        
        // Show info about product visibility
        if (productPayload.status === 'published') {
          toast.success(
            `✅ Product "${productPayload.name}" is now published and visible on the /products page!`, 
            { autoClose: 4000 }
          );
        } else {
          toast.warning(
            `⚠️ Product "${productPayload.name}" is saved as draft and hidden from the /products page`, 
            { autoClose: 4000 }
          );
        }
        
        // Reset form immediately
        setFormData({
          name: '',
          description: '',
          price: 0,
          currency: 'USD',
          imageUrl: '',
          images: [],
          category: '',
          status: 'draft',
          isActive: false,
          featured: false,
        });
        setEditingProduct(null);
        
        // Clear search query so new product is visible
        setSearchQuery('');
        
        // Close modal first
        handleCloseModal();
        
        // Add product to list immediately (optimistic update)
        setProducts(prev => {
          // Check if product already exists (avoid duplicates)
          const exists = prev.some(p => p._id === newProduct._id);
          if (exists) {
            return prev.map(p => p._id === newProduct._id ? newProduct : p);
          }
          return [newProduct, ...prev];
        });
        
        // Refresh products list to ensure we have latest data from server
        // Do this after a short delay to allow UI to update
        setTimeout(async () => {
          try {
            await fetchProducts();
          } catch (error) {
            console.error('Error refreshing products list:', error);
            // Don't show error to user, we already have the product in the list
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ Failed to save product:', error);
      console.error('📋 Error response:', error.response?.data);
      console.error('📊 Error status:', error.response?.status);
      console.error('🔗 Request URL:', error.config?.url);
      console.error('📦 Request data:', error.config?.data);
      console.error('🔍 Full error:', JSON.stringify(error, null, 2));
      
      // Better error handling
      let errorMessage = 'Failed to save product. Please check all fields and try again.';
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Access denied. Please ensure you are logged in as a super admin.';
        } else if (error.response.status === 400) {
          // Validation errors - show detailed list
          const errorData = error.response.data;
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorList = errorData.errors.map((err: any) => 
              `• ${err.field || 'Field'}: ${err.message}`
            ).join('\n');
            errorMessage = `Validation Failed:\n${errorList}`;
            console.error('📋 Validation Errors:', errorData.errors);
          } else if (errorData.message) {
            errorMessage = errorData.message;
            if (errorData.error) {
              console.error('📋 Error Details:', errorData.error);
            }
          } else if (errorData.error) {
            errorMessage = `Error: ${errorData.error}`;
          }
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.message || 'Server error. Please try again later.';
          const errorData = error.response.data;
          if (errorData?.error) {
            console.error('❌ Server Error:', errorData.error);
            errorMessage += `\n\nError: ${errorData.error}`;
          }
          if (errorData?.errorName) {
            console.error('📋 Error Type:', errorData.errorName);
          }
          if (errorData?.details && process.env.NODE_ENV === 'development') {
            console.error('📋 Error Stack:', errorData.details);
          }
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
        console.error('❌ Network Error: No response received');
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Show detailed error in console
      console.error('🚨 PRODUCT CREATION ERROR SUMMARY:');
      console.error('Message:', errorMessage);
      console.error('Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      console.error('Request Config:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      });
      
      // Show error toast with longer duration for detailed errors
      toast.error(errorMessage, { 
        autoClose: error.response?.status === 400 ? 8000 : 6000,
        style: { whiteSpace: 'pre-line' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    const product = products.find(p => p._id === productId);
    const productName = product?.name || 'this product';
    
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}"?\n\nThis action cannot be undone. The product will be removed from the database.`)) {
      return;
    }

    try {
      // Get auth token from store or axios defaults
      const authToken = accessToken 
        ? `Bearer ${accessToken}` 
        : axios.defaults.headers.common['Authorization'] as string;
      
      if (!authToken) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      await axios.delete(`/products/${productId}`, {
        headers: {
          'Authorization': authToken
        }
      });
      toast.success('Product deleted successfully');
      // Remove from list immediately
      setProducts(prev => prev.filter(p => p._id !== productId));
      // Refresh to ensure sync
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete product';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Determine status from isActive or use product.status
    const status = product.status || (product.isActive ? 'published' : 'draft');
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      currency: (product as any).currency || 'USD',
      imageUrl: product.imageUrl,
      images: product.images || [],
      category: product.category,
      status: status,
      isActive: product.isActive,
      featured: product.featured,
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      imageUrl: '',
      images: [],
      category: '',
      status: 'draft',
      isActive: false,
      featured: false,
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show access denied if not super admin
  if (user && user.role !== 'super_admin') {
    return (
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only Super Admins can manage products. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit, or remove products. Control which products appear on the product page.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
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

      {/* Products List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="relative mb-3">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  {product.featured && (
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                      Featured
                    </span>
                  )}
                  {(product.status === 'draft' || !product.isActive) && (
                    <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                      Draft
                    </span>
                  )}
                  {product.status === 'published' && product.isActive && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      Published
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
              <p className="text-lg font-semibold text-primary mb-3">
                {product.currency === 'RWF' ? 'RWF' : product.currency === 'Yuan' ? '¥' : '$'}{product.price.toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {product.category}
                </span>
                {product.status === 'published' || product.isActive ? (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Published
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    Draft
                  </span>
                )}
                {product.featured && (
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  title="Delete product permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No products found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Price, Currency and Category */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string while typing, but convert to number for state
                        setFormData({ ...formData, price: value === '' ? 0 : parseFloat(value) || 0 });
                      }}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="USD">USD</option>
                      <option value="RWF">RWF</option>
                      <option value="Yuan">Yuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home & Garden">Home & Garden</option>
                      <option value="Sports">Sports</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Toys">Toys</option>
                      <option value="Books">Books</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload - Multiple Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images * (Upload multiple images)
                  </label>
                  
                  {/* Display uploaded images */}
                  {(formData.images.length > 0 || formData.imageUrl) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {/* Show imageUrl if exists and not in images array */}
                      {formData.imageUrl && !formData.images.includes(formData.imageUrl) && (
                        <div className="relative group">
                          <img
                            src={formData.imageUrl}
                            alt="Product preview"
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      {/* Show all images from images array */}
                      {formData.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {uploadingImage ? (
                        <>
                          <LoadingSpinner size="md" />
                          <p className="mt-2 text-sm text-gray-600">Uploading images...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload images</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each. You can select multiple images.</p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Optional: Enter URL manually */}
                  <div className="mt-2">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Or enter image URL (optional)"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optionally enter an image URL. Uploaded images are preferred.
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'draft' | 'published';
                      setFormData({ 
                        ...formData, 
                        status: newStatus,
                        isActive: newStatus === 'published'
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="draft">Draft (Hidden from public)</option>
                    <option value="published">Published (Visible on Products Page)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.status === 'published' 
                      ? '✅ This product will appear on the /products page for all users'
                      : '⚠️ This product will be hidden from the /products page (Draft)'}
                  </p>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <strong>Featured</strong> - Show on homepage
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Check to display this product in the featured products section
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploadingImage || isSubmitting}
                    className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingProduct ? 'Update Product' : 'Create Product'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementCMS;
