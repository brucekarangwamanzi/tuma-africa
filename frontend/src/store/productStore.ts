import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from './authStore';

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
      length?: number;
      width?: number;
      height?: number;
      unit: string;
    };
  };
  supplier: {
    name?: string;
    platform: 'alibaba' | '1688' | 'taobao' | 'other';
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
      min?: number;
      max?: number;
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
  featured: boolean;
  status?: 'draft' | 'published';
  isActive: boolean;
  createdBy?: {
    fullName: string;
  };
  lastUpdatedBy?: {
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  discountPercentage?: number;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency?: string;
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
      length?: number;
      width?: number;
      height?: number;
      unit: string;
    };
  };
  supplier: {
    name?: string;
    platform: 'alibaba' | '1688' | 'taobao' | 'other';
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
      min?: number;
      max?: number;
    };
    cost?: number;
    freeShippingThreshold?: number;
  };
  featured: boolean;
  status?: 'draft' | 'published';
  isActive: boolean;
}

interface ProductsResponse {
  products: Product[];
  stats: {
    total: number;
    active: number;
    featured: number;
    totalViews: number;
    totalOrders: number;
  };
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ProductState {
  // State
  products: Product[];
  currentProduct: Product | null;
  stats: ProductsResponse['stats'] | null;
  pagination: ProductsResponse['pagination'] | null;
  categories: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  fetchProducts: (params?: URLSearchParams) => Promise<void>;
  fetchProduct: (productId: string) => Promise<void>;
  createProduct: (productData: ProductFormData) => Promise<Product>;
  updateProduct: (productId: string, productData: Partial<ProductFormData>) => Promise<void>;
  changeProductStatus: (productId: string, status: 'draft' | 'published') => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleFeatured: (productId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  clearError: () => void;
  clearCurrentProduct: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  // Initial state
  products: [],
  currentProduct: null,
  stats: null,
  pagination: null,
  categories: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Actions
  fetchProducts: async (params?: URLSearchParams) => {
    set({ isLoading: true, error: null });
    
    try {
      const queryString = params ? `?${params.toString()}` : '';
      const response = await axios.get(`/products/admin/all${queryString}`);
      const data: ProductsResponse = response.data;
      
      set({
        products: data.products,
        stats: data.stats,
        pagination: data.pagination,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch products',
        isLoading: false
      });
      toast.error('Failed to load products');
    }
  },

  fetchProduct: async (productId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get(`/products/${productId}`);
      set({
        currentProduct: response.data.product,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch product',
        isLoading: false
      });
      toast.error('Failed to load product details');
    }
  },

  createProduct: async (productData: ProductFormData) => {
    set({ isSubmitting: true, error: null });
    
    try {
      // Get token from auth store
      const { accessToken } = useAuthStore.getState();
      
      // Ensure we have authentication token
      const authToken = accessToken 
        ? `Bearer ${accessToken}` 
        : axios.defaults.headers.common['Authorization'] as string;
      
      if (!authToken) {
        const error = new Error('Authentication token missing. Please log in again.');
        set({
          error: error.message,
          isSubmitting: false
        });
        toast.error(error.message);
        throw error;
      }
      
      // Clean and validate data before sending
      const cleanedData: any = {
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price,
        imageUrl: productData.imageUrl.trim(),
        category: productData.category.trim(),
        currency: productData.currency || 'USD',
        images: productData.images || [],
        tags: productData.tags || [],
        featured: productData.featured || false,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
      };
      
      // Add optional fields only if they have values
      if (productData.originalPrice && productData.originalPrice > 0) {
        cleanedData.originalPrice = typeof productData.originalPrice === 'string' 
          ? parseFloat(productData.originalPrice) 
          : productData.originalPrice;
      }
      if (productData.subcategory?.trim()) {
        cleanedData.subcategory = productData.subcategory.trim();
      }
      if (productData.specifications) {
        cleanedData.specifications = productData.specifications;
      }
      if (productData.supplier) {
        cleanedData.supplier = productData.supplier;
      }
      if (productData.stock) {
        cleanedData.stock = productData.stock;
      }
      if (productData.shipping) {
        cleanedData.shipping = productData.shipping;
      }
      
      console.log('📦 Creating product:', cleanedData.name);
      console.log('🔑 Auth token present:', !!authToken);
      console.log('📤 Sending cleaned product data:', JSON.stringify(cleanedData, null, 2));
      
      const response = await axios.post('/products', cleanedData, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Full response:', response);
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', response.data);
      
      const newProduct = response.data?.product;
      
      if (!newProduct) {
        console.error('❌ No product in response:', response.data);
        throw new Error('Invalid response: product not returned in response.data.product');
      }
      
      if (!newProduct._id && !newProduct.id) {
        console.error('❌ Product missing ID:', newProduct);
        throw new Error('Invalid response: product missing _id or id');
      }
      
      // Add to products list
      const { products } = get();
      set({
        products: [newProduct, ...products],
        isSubmitting: false
      });
      
      // Enhanced success logging
      console.log('='.repeat(60));
      console.log('✅ PRODUCT CREATED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log('📦 Product ID:', newProduct._id || newProduct.id);
      console.log('📝 Product Name:', newProduct.name);
      console.log('💰 Price:', newProduct.price, newProduct.currency || 'USD');
      console.log('📂 Category:', newProduct.category);
      console.log('👁️  Status:', newProduct.status || (newProduct.isActive ? 'published' : 'draft'));
      console.log('✅ Visible to users:', newProduct.isActive ? 'Yes' : 'No');
      console.log('⭐ Featured:', newProduct.featured ? 'Yes' : 'No');
      console.log('📅 Created at:', new Date(newProduct.createdAt || Date.now()).toLocaleString());
      console.log('='.repeat(60));
      console.log('🔄 User will be redirected to products list in 1.5 seconds...');
      console.log('='.repeat(60));
      
      // Show alert message
      alert(`✅ Product Created Successfully!\n\n📦 Product: ${newProduct.name}\n💰 Price: ${newProduct.price} ${newProduct.currency || 'USD'}\n📂 Category: ${newProduct.category}\n✅ Status: ${newProduct.status || (newProduct.isActive ? 'Published' : 'Draft')}\n\n🔄 You will be redirected to the products list...`);
      
      // Also show toast notification
      toast.success('✅ Product created successfully! Redirecting to products list...', {
        autoClose: 2000,
        position: 'top-right'
      });
      
      return newProduct;
    } catch (error: any) {
      console.error('❌ Failed to create product:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Message:', error.message);
      console.error('   Request URL:', error.config?.url);
      console.error('   Request method:', error.config?.method);
      
      let errorMessage = 'Failed to create product';
      let errorDetails = '';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed';
        errorDetails = 'Your session may have expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied';
        errorDetails = 'Only Super Admins can create products. Please check your user role.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Validation error';
        const validationErrors = error.response?.data?.errors || [];
        if (validationErrors.length > 0) {
          errorDetails = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        } else {
          errorDetails = error.response?.data?.message || 'Please check all required fields are filled correctly.';
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error';
        errorDetails = 'The server encountered an error. Please try again later.';
      } else if (error.response?.status === 0 || !error.response) {
        errorMessage = 'Network error';
        errorDetails = 'Cannot connect to server. Please check if the backend is running.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        errorDetails = error.response.data.error || '';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const fullErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
      
      set({
        error: fullErrorMessage,
        isSubmitting: false
      });
      
      toast.error(fullErrorMessage, {
        autoClose: 6000
      });
      
      throw new Error(fullErrorMessage);
    }
  },

  changeProductStatus: async (productId: string, status: 'draft' | 'published') => {
    set({ isLoading: true, error: null });
    
    try {
      const { accessToken } = useAuthStore.getState();
      const authToken = accessToken ? `Bearer ${accessToken}` : '';
      
      const response = await axios.put(
        `/products/${productId}/status`,
        { status },
        {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const updatedProduct = response.data.product;
      
      // Update product in list
      const { products, currentProduct } = get();
      const updatedProducts = products.map(product =>
        product._id === productId ? updatedProduct : product
      );
      
      set({
        products: updatedProducts,
        currentProduct: currentProduct?._id === productId ? updatedProduct : currentProduct,
        isLoading: false
      });
      
      toast.success(`Product ${status === 'published' ? 'published' : 'hidden'} successfully`);
      
      return updatedProduct;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change product status';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateProduct: async (productId: string, productData: Partial<ProductFormData>) => {
    set({ isSubmitting: true, error: null });
    
    try {
      const response = await axios.put(`/products/${productId}`, productData);
      const updatedProduct = response.data.product;
      
      // Update product in list
      const { products, currentProduct } = get();
      const updatedProducts = products.map(product =>
        product._id === productId ? updatedProduct : product
      );
      
      set({
        products: updatedProducts,
        currentProduct: currentProduct?._id === productId 
          ? updatedProduct 
          : currentProduct,
        isSubmitting: false
      });
      
      toast.success('Product updated successfully');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update product';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  deleteProduct: async (productId: string) => {
    set({ isSubmitting: true, error: null });
    
    try {
      await axios.delete(`/products/${productId}`);
      
      // Remove from products list (soft delete - mark as inactive)
      const { products } = get();
      const updatedProducts = products.map(product =>
        product._id === productId ? { ...product, isActive: false } : product
      );
      
      set({
        products: updatedProducts,
        currentProduct: null,
        isSubmitting: false
      });
      
      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete product';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  toggleFeatured: async (productId: string) => {
    set({ isSubmitting: true, error: null });
    
    try {
      const response = await axios.post(`/products/${productId}/toggle-featured`);
      const { featured } = response.data;
      
      // Update product in list
      const { products, currentProduct } = get();
      const updatedProducts = products.map(product =>
        product._id === productId ? { ...product, featured } : product
      );
      
      set({
        products: updatedProducts,
        currentProduct: currentProduct?._id === productId 
          ? { ...currentProduct, featured } 
          : currentProduct,
        isSubmitting: false
      });
      
      toast.success(`Product ${featured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error: any) {
      console.error('Failed to toggle featured status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update product';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axios.get('/products?limit=1');
      set({ categories: response.data.categories || [] });
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentProduct: () => {
    set({ currentProduct: null });
  }
}));