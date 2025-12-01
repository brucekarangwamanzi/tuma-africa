import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'super_admin';
  approved: boolean;
  verified: boolean;
  isActive: boolean;
  currency?: 'RWF' | 'Yuan' | 'USD';
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UserState {
  // State
  users: User[];
  currentUser: User | null;
  pagination: UsersResponse['pagination'] | null;
  stats: {
    total: number;
    approved: number;
    pending: number;
    verified: number;
    active: number;
  } | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  fetchUsers: (params?: URLSearchParams) => Promise<void>;
  fetchUser: (userId: string) => Promise<void>;
  approveUser: (userId: string, approved: boolean) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  clearError: () => void;
  clearCurrentUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  users: [],
  currentUser: null,
  pagination: null,
  stats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Actions
  fetchUsers: async (params?: URLSearchParams) => {
    set({ isLoading: true, error: null });
    
    try {
      const queryString = params ? `?${params.toString()}` : '';
      const response = await axios.get(`/admin/users${queryString}`);
      const data: UsersResponse = response.data;
      
      // Calculate stats
      const total = data.users.length;
      const approved = data.users.filter(u => u.approved).length;
      const pending = data.users.filter(u => !u.approved).length;
      const verified = data.users.filter(u => u.verified).length;
      const active = data.users.filter(u => u.isActive).length;
      
      set({
        users: data.users,
        pagination: data.pagination,
        stats: { total, approved, pending, verified, active },
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch users',
        isLoading: false
      });
      toast.error('Failed to load users');
    }
  },

  fetchUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get(`/admin/users/${userId}`);
      set({
        currentUser: response.data.user,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch user',
        isLoading: false
      });
      toast.error('Failed to load user details');
    }
  },

  approveUser: async (userId: string, approved: boolean) => {
    set({ isSubmitting: true, error: null });
    
    try {
      await axios.put(`/admin/users/${userId}/approve`, { approved });
      
      // Update user in list
      const { users, currentUser } = get();
      const updatedUsers = users.map(user =>
        user._id === userId ? { ...user, approved } : user
      );
      
      set({
        users: updatedUsers,
        currentUser: currentUser?._id === userId 
          ? { ...currentUser, approved } 
          : currentUser,
        isSubmitting: false
      });
      
      toast.success(`User ${approved ? 'approved' : 'denied'} successfully`);
    } catch (error: any) {
      console.error('Failed to update user approval:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update user approval';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  updateUserRole: async (userId: string, role: string) => {
    set({ isSubmitting: true, error: null });
    
    try {
      await axios.put(`/admin/users/${userId}/role`, { role });
      
      // Update user in list
      const { users, currentUser } = get();
      const updatedUsers = users.map(user =>
        user._id === userId ? { ...user, role: role as User['role'] } : user
      );
      
      set({
        users: updatedUsers,
        currentUser: currentUser?._id === userId 
          ? { ...currentUser, role: role as User['role'] } 
          : currentUser,
        isSubmitting: false
      });
      
      toast.success('User role updated successfully');
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update user role';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  deactivateUser: async (userId: string) => {
    set({ isSubmitting: true, error: null });
    
    try {
      await axios.delete(`/admin/users/${userId}`);
      
      // Update user in list (mark as inactive)
      const { users } = get();
      const updatedUsers = users.map(user =>
        user._id === userId ? { ...user, isActive: false } : user
      );
      
      set({
        users: updatedUsers,
        currentUser: null,
        isSubmitting: false
      });
      
      toast.success('User deactivated successfully');
    } catch (error: any) {
      console.error('Failed to deactivate user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to deactivate user';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentUser: () => {
    set({ currentUser: null });
  }
}));