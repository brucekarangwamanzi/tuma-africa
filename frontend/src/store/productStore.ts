import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

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
      const response = await axios.post('/products', productData);
      const newProduct = response.data.product;
      
      // Add to products list
      const { products } = get();
      set({
        products: [newProduct, ...products],
        isSubmitting: false
      });
      
      toast.success('Product created successfully!');
      return newProduct;
    } catch (error: any) {
      console.error('Failed to create product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create product';
      set({
        error: errorMessage,
        isSubmitting: false
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