import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface Notification {
  id?: string; // PostgreSQL UUID
  _id?: string; // MongoDB ObjectId (for backward compatibility)
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  data: Record<string, any>;
  link: string;
  icon: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get notification ID (supports both id and _id)
export const getNotificationId = (notification: Notification): string => {
  return notification.id || notification._id || '';
};

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isMarkingRead: boolean;
  page: number;
  hasMore: boolean;
}

interface NotificationActions {
  fetchNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: (readOnly?: boolean) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isMarkingRead: false,
  page: 1,
  hasMore: true,

  // Fetch notifications
  fetchNotifications: async (page = 1, unreadOnly = false) => {
    set({ isLoading: true });
    
    try {
      const response = await axios.get('/notifications', {
        params: { page, limit: 20, unreadOnly }
      });

      const { notifications, pagination, unreadCount } = response.data;

      set({
        notifications: page === 1 ? notifications : [...get().notifications, ...notifications],
        unreadCount,
        page: pagination.page,
        hasMore: pagination.page < pagination.pages,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Fetch notifications error:', error);
      set({ isLoading: false });
      if (error.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      set({ unreadCount: response.data.count });
    } catch (error: any) {
      // Don't log 429 errors (rate limiting), 401 errors (not logged in), or 403 errors (not authorized)
      if (error.response?.status !== 429 && 
          error.response?.status !== 401 && 
          error.response?.status !== 403) {
        console.error('Fetch unread count error:', error);
      }
      // Silently fail - will retry on next poll or WebSocket update
      // Reset count to 0 if unauthorized
      if (error.response?.status === 401 || error.response?.status === 403) {
        set({ unreadCount: 0 });
      }
    }
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    set({ isMarkingRead: true });
    
    try {
      await axios.put(`/notifications/${id}/read`);
      
      set({
        notifications: get().notifications.map(n => 
          getNotificationId(n) === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
        isMarkingRead: false,
      });
    } catch (error: any) {
      console.error('Mark as read error:', error);
      set({ isMarkingRead: false });
      toast.error('Failed to mark notification as read');
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    set({ isMarkingRead: true });
    
    try {
      await axios.put('/notifications/read-all');
      
      set({
        notifications: get().notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
        isMarkingRead: false,
      });
      
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      set({ isMarkingRead: false });
      toast.error('Failed to mark all notifications as read');
    }
  },

  // Delete notification
  deleteNotification: async (id: string) => {
    try {
      await axios.delete(`/notifications/${id}`);
      
      const notification = get().notifications.find(n => getNotificationId(n) === id);
      set({
        notifications: get().notifications.filter(n => getNotificationId(n) !== id),
        unreadCount: notification && !notification.read 
          ? Math.max(0, get().unreadCount - 1) 
          : get().unreadCount,
      });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      toast.error('Failed to delete notification');
    }
  },

  // Delete all notifications
  deleteAllNotifications: async (readOnly = false) => {
    try {
      await axios.delete('/notifications', {
        params: { readOnly }
      });
      
      if (readOnly) {
        set({
          notifications: get().notifications.filter(n => !n.read),
        });
      } else {
        set({
          notifications: [],
          unreadCount: 0,
        });
      }
      
      toast.success('Notifications deleted successfully');
    } catch (error: any) {
      console.error('Delete all notifications error:', error);
      toast.error('Failed to delete notifications');
    }
  },

  // Add notification (for real-time updates)
  addNotification: (notification: Notification) => {
    set({
      notifications: [notification, ...get().notifications],
      unreadCount: get().unreadCount + 1,
    });
  },

  // Clear notifications
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      page: 1,
      hasMore: true,
    });
  },
}));

