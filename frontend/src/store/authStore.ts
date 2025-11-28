import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useChatStore } from './chatStore';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'super_admin';
  verified: boolean;
  approved: boolean;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  createdAt: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await axios.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data;

          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('Login successful!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        
        try {
          const response = await axios.post('/auth/register', userData);
          const { user, accessToken, refreshToken } = response.data;

          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('Registration successful! Please check your email to verify your account.');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        const { accessToken } = get();
        
        try {
          if (accessToken) {
            await axios.post('/auth/logout');
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear auth state
          delete axios.defaults.headers.common['Authorization'];
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          
          // Clear chat messages on logout
          try {
            useChatStore.getState().clearMessages();
          } catch (error) {
            // Ignore if chatStore is not available
            console.error('Failed to clear chat messages on logout:', error);
          }
          
          toast.success('Logged out successfully');
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().clearAuth();
          return false;
        }

        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

          // Update axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });

        return true;
      } catch (error: any) {
        // Don't log 403 errors (invalid token) as they're expected when token is expired
        if (error.response?.status !== 403) {
          console.error('Token refresh failed:', error);
        }
        get().clearAuth();
        return false;
      }
      },

      checkAuth: async () => {
        const { accessToken, refreshToken } = get();
        
        if (!accessToken || !refreshToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        // Set authorization header immediately from persisted state
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        set({ isLoading: true });

        try {
          // Verify token by fetching user data
          const response = await axios.get('/auth/me');
          const { user } = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.log('✅ Authentication verified - user logged in');
        } catch (error: any) {
          // Try to refresh token if access token is expired
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('🔄 Access token expired, attempting refresh...');
            const refreshed = await get().refreshAccessToken();
            
            if (refreshed) {
              // Retry fetching user data
              try {
                const response = await axios.get('/auth/me');
                const { user } = response.data;

                set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                });
                console.log('✅ Token refreshed - user logged in');
                return;
              } catch (retryError) {
                console.error('Retry auth check failed:', retryError);
              }
            } else {
              console.log('❌ Token refresh failed - clearing auth');
            }
          }
          
          // Clear auth if all attempts failed
          get().clearAuth();
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      updateUser: (userData) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      clearAuth: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Restore auth state and set axios headers on rehydration
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
          console.log('✅ Auth state restored from localStorage');
        }
      },
    }
  )
);

// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await useAuthStore.getState().refreshAccessToken();
      
      if (refreshed) {
        const { accessToken } = useAuthStore.getState();
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axios(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);