import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react';
import { useNotificationStore, getNotificationId } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useWebSocket } from '../../hooks/useWebSocket';

const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ws = useWebSocket();

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications(1, false).catch(() => {
        // Silently fail - user can retry
      });
    }
  }, [user, isOpen]);

  // Fetch notifications on mount for users (not just when dropdown opens)
  useEffect(() => {
    if (user && user.role === 'user') {
      // Fetch notifications immediately for regular users
      fetchNotifications(1, false).catch(() => {
        // Silently fail - will retry on next poll
      });
    }
  }, [user?.id]); // Only fetch when user ID changes

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!ws || !user) return;

    const handleNewNotification = async (notification: any) => {
      // addNotification already increments unreadCount, no need for API call
      useNotificationStore.getState().addNotification(notification);
      
      // Show browser notification if permission granted (for users especially)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const browserNotification = new Notification(notification.title || 'New Notification', {
            body: notification.message || '',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: getNotificationId(notification), // Prevent duplicate notifications
            requireInteraction: notification.priority === 'high' || notification.priority === 'urgent'
          });
          
          // Auto-close after 5 seconds
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
          
          // Navigate to notification link when clicked
          browserNotification.onclick = () => {
            window.focus();
            if (notification.link) {
              navigate(notification.link);
            }
            browserNotification.close();
          };
        } catch (error) {
          // Silently fail if browser notification fails
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to show browser notification:', error);
          }
        }
      }
    };

    ws.onNotification(handleNewNotification);

    return () => {
      ws.offNotification(handleNewNotification);
    };
  }, [ws, user, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Poll for unread count - Reduced frequency and better error handling
  useEffect(() => {
    if (!user) return;

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Initial fetch with error handling
    const fetchWithErrorHandling = async () => {
      try {
        await fetchUnreadCount();
      } catch (error: any) {
        // Silently handle auth errors (401/403) - token might be refreshing
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          // Don't log - token refresh might be in progress
          return;
        }
        // Only log unexpected errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch unread count:', error);
        }
      }
    };

    // Initial fetch
    fetchWithErrorHandling();

    // Poll every 3 minutes (increased from 2 to reduce load)
    intervalId = setInterval(() => {
      if (isMounted) {
        fetchWithErrorHandling();
      }
    }, 180000); // 3 minutes

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(getNotificationId(notification));
    }

    setIsOpen(false);

    // Navigate based on notification type and link
    if (notification.link) {
      navigate(notification.link);
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'order_update':
        case 'order_created':
        case 'order_cancelled':
        case 'payment_received':
        case 'shipment_update':
          navigate('/orders');
          break;
        case 'message_received':
        case 'message_sent':
          navigate('/messages');
          break;
        case 'account_approved':
        case 'account_rejected':
          navigate('/profile');
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
      case 'order_created':
      case 'order_cancelled':
        return '📦';
      case 'message_received':
      case 'message_sent':
        return '💬';
      case 'payment_received':
        return '💰';
      case 'shipment_update':
        return '🚚';
      case 'account_approved':
        return '✅';
      case 'account_rejected':
        return '❌';
      case 'admin_action':
        return '⚙️';
      case 'system_announcement':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-500';
      default:
        return 'border-l-blue-500';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 text-gray-700 hover:text-primary-600 focus:outline-none transition-colors touch-manipulation active:scale-95"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - Full screen on mobile, dropdown on desktop */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Container */}
          <div className="fixed inset-0 md:absolute md:right-0 md:mt-2 md:w-80 md:sm:w-96 md:max-h-[500px] md:rounded-lg md:inset-auto bg-white shadow-xl border border-gray-200 z-50 flex flex-col md:relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({unreadCount} new)
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-2 sm:p-2.5 text-gray-600 hover:text-primary-600 active:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    title="Mark all as read"
                    aria-label="Mark all as read"
                  >
                    <CheckCheck className="h-5 w-5 sm:h-5 sm:w-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 sm:p-2.5 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg transition-colors touch-manipulation md:hidden"
                  title="Close"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                <p className="text-sm sm:text-base">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-gray-500">
                <Bell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 text-gray-300" />
                <p className="text-sm sm:text-base">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={getNotificationId(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 sm:p-5 cursor-pointer active:bg-gray-100 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'bg-blue-50' : ''
                    } touch-manipulation`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="text-2xl sm:text-3xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm sm:text-base font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'} break-words`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary-600 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3 break-words">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2 sm:mt-3 gap-2">
                            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                              {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                                ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                                : 'Just now'}
                            </span>
                            {notification.link && (
                              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-1 sm:space-x-2 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(getNotificationId(notification));
                            }}
                            className="p-2 sm:p-2.5 text-gray-400 hover:text-primary-600 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                            title="Mark as read"
                            aria-label="Mark as read"
                          >
                            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, getNotificationId(notification))}
                          className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 active:bg-red-50 rounded-lg transition-colors touch-manipulation"
                          title="Delete"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="w-full py-3 sm:py-3.5 text-sm sm:text-base text-primary-600 hover:text-primary-700 active:bg-primary-50 font-medium rounded-lg transition-colors touch-manipulation"
              >
                View all notifications
              </button>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

