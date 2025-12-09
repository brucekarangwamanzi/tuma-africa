import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface HeroSection {
  title: string;
  subtitle: string;
  backgroundType: 'image' | 'video' | 'color';
  backgroundImage: string;
  backgroundVideo: string;
  backgroundColor: string;
  ctaButtons: Array<{
    text: string;
    link: string;
    style: 'primary' | 'secondary' | 'outline';
    isActive: boolean;
  }>;
  overlay: {
    enabled: boolean;
    opacity: number;
    color: string;
  };
}

export interface ProductSection {
  title: string;
  subtitle: string;
  displayCount: number;
  layout: 'grid' | 'carousel' | 'masonry';
  showPrices: boolean;
  showRatings: boolean;
  featuredProducts: string[]; // Array of product IDs to display
  displayMode: 'auto' | 'manual'; // auto = popular products, manual = selected products
}

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage: string;
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'montserrat';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  description: string;
  logo: string;
  favicon: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    supportHours?: string;
  };
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  position: 'banner' | 'sidebar' | 'footer' | 'popup' | 'inline';
  startDate: string;
  endDate?: string;
  targetAudience?: string;
  clickCount?: number;
  impressionCount?: number;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  telegram?: string;
}

export interface AdminSettings {
  _id?: string;
  heroSection: HeroSection;
  productSection: ProductSection;
  advertisements: Advertisement[];
  theme: Theme;
  companyInfo: CompanyInfo;
  socialLinks: SocialLinks;
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage?: string;
  };
  legalPages: {
    termsAndConditions: string;
    privacyPolicy: string;
    shippingPolicy: string;
    returnPolicy: string;
    aboutUs: string;
  };
  features: {
    enableChat: boolean;
    enableReviews: boolean;
    enableWishlist: boolean;
    enableNotifications: boolean;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  system: {
    currency: string;
    timezone: string;
    language: string;
    dateFormat: string;
  };
  version: number;
  lastUpdatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SettingsState {
  settings: AdminSettings | null;
  isLoading: boolean;
  isUpdating: boolean;
}

interface SettingsActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AdminSettings>) => Promise<void>;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

// Default settings
const defaultSettings: AdminSettings = {
  heroSection: {
    title: 'Connect Africa to Asia - Your Cargo Partner',
    subtitle: 'Seamless product ordering and cargo services from top Asian suppliers to African markets',
    backgroundType: 'image',
    backgroundImage: '',
    backgroundVideo: '',
    backgroundColor: '#1f2937',
    ctaButtons: [
      {
        text: 'Start Shopping',
        link: '/products',
        style: 'primary',
        isActive: true,
      },
      {
        text: 'Learn More',
        link: '/about',
        style: 'outline',
        isActive: true,
      },
    ],
    overlay: {
      enabled: true,
      opacity: 0.5,
      color: '#000000',
    },
  },
  productSection: {
    title: 'Shop Popular Products',
    subtitle: 'Discover trending products from top Asian suppliers',
    displayCount: 8,
    layout: 'grid',
    showPrices: true,
    showRatings: true,
    featuredProducts: [],
    displayMode: 'auto',
  },
  advertisements: [],
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    backgroundImage: '',
    fontFamily: 'inter',
    borderRadius: 'medium',
  },
  companyInfo: {
    name: 'Tuma-Africa Link Cargo',
    tagline: 'Bridging Africa and Asia through seamless cargo solutions',
    description: 'We specialize in connecting African customers with Asian suppliers, providing reliable cargo and product ordering services.',
    logo: '',
    favicon: '',
    address: {},
    contact: {
      supportHours: 'Mon-Fri 9AM-6PM EAT',
    },
  },
  socialLinks: {},
  seo: {
    metaTitle: 'Tuma-Africa Link Cargo - Connect Africa to Asia',
    metaDescription: 'Professional cargo and product ordering services connecting African customers with Asian suppliers. Fast, reliable, and secure.',
    keywords: ['cargo', 'shipping', 'africa', 'asia', 'logistics', 'e-commerce'],
  },
  legalPages: {
    termsAndConditions: '',
    privacyPolicy: '',
    shippingPolicy: '',
    returnPolicy: '',
    aboutUs: '',
  },
  features: {
    enableChat: true,
    enableReviews: true,
    enableWishlist: true,
    enableNotifications: true,
    maintenanceMode: false,
    registrationEnabled: true,
  },
  system: {
    currency: 'USD',
    timezone: 'Africa/Nairobi',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
  },
  version: 1,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Initial state
  settings: null,
  isLoading: false,
  isUpdating: false,

  // Actions
  fetchSettings: async () => {
    set({ isLoading: true });
    
    try {
      const response = await axios.get('/public/settings');
      const { settings } = response.data;
      
      set({
        settings: settings || defaultSettings,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Fetch settings error:', error);
      
      // Use default settings if fetch fails
      set({
        settings: defaultSettings,
        isLoading: false,
      });
      
      // Only show error if it's not a 401/403 (user not authorized)
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load settings');
      }
    }
  },

  updateSettings: async (updates) => {
    const { settings } = get();
    
    if (!settings) {
      toast.error('Settings not loaded');
      return;
    }

    set({ isUpdating: true });
    
    try {
      const response = await axios.post('/admin/settings', updates);
      const { settings: updatedSettings } = response.data;
      
      set({
        settings: updatedSettings,
        isUpdating: false,
      });
      
      toast.success('Settings updated successfully');
    } catch (error: any) {
      set({ isUpdating: false });
      const message = error.response?.data?.message || 'Failed to update settings';
      toast.error(message);
      throw error;
    }
  },

  resetSettings: () => {
    set({
      settings: null,
      isLoading: false,
      isUpdating: false,
    });
  },
}));