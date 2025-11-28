import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter, 
  X, 
  ExternalLink,
  Archive,
  ArchiveRestore,
  Clock,
  AlertCircle,
  Package,
  MessageCircle,
  UserCheck,
  UserX,
  DollarSign,
  Truck
} from 'lucide-react';
import { useNotificationStore, Notification } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow, format } from 'date-fns';
import { useWebSocket } from '../hooks/useWebSocket';

const NotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const ws = useWebSocket();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    page,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications(1, filter === 'unread');
      // Only fetch unread count once on mount, updates will come via WebSocket
      fetchUnreadCount().catch(() => {
        // Silently fail if rate limited
      });
    }
  }, [user, filter]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!ws || !user) return;

    const handleNewNotification = (notification: any) => {
      useNotificationStore.getState().addNotification(notification);
      // Update unread count from WebSocket, but don't make API call to avoid rate limiting
      // The unread count is already incremented in addNotification
    };

    ws.onNotification(handleNewNotification);

    return () => {
      ws.offNotification(handleNewNotification);
    };
  }, [ws, user]);

  // Load more notifications
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(page + 1, filter === 'unread');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

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

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  // Select all
  const selectAll = () => {
    const allIds = notifications.map(n => n._id);
    setSelectedNotifications(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  // Mark selected as read
  const markSelectedAsRead = async () => {
    const ids = Array.from(selectedNotifications);
    for (const id of ids) {
      await markAsRead(id);
    }
    clearSelection();
  };

  // Delete selected
  const deleteSelected = async () => {
    const ids = Array.from(selectedNotifications);
    for (const id of ids) {
      await deleteNotification(id);
    }
    clearSelection();
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
      case 'order_created':
      case 'order_cancelled':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'message_received':
      case 'message_sent':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'payment_received':
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case 'shipment_update':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'account_approved':
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'account_rejected':
        return <UserX className="h-5 w-5 text-red-500" />;
      case 'admin_action':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'system_announcement':
        return <Bell className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        dateKey = format(date, 'EEEE'); // Day of week
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });
    
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(
    filter === 'all' 
      ? notifications 
      : filter === 'unread' 
        ? notifications.filter(n => !n.read)
        : notifications.filter(n => n.read)
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-2.5 bg-primary-100 rounded-lg">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-2">
              {selectedNotifications.size > 0 && (
                <>
                  <button
                    onClick={markSelectedAsRead}
                    className="flex items-center px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
                  >
                    <Check className="h-4 w-4 sm:mr-1.5 mr-1" />
                    <span className="hidden sm:inline">Mark as read</span>
                    <span className="sm:hidden">Read</span>
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="flex items-center px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 active:bg-red-100 touch-manipulation transition-colors"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-1.5 mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Delete</span>
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 hover:text-gray-900 active:bg-gray-100 rounded-lg touch-manipulation transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              
              {selectedNotifications.size === 0 && (
                <>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
                  >
                    <Filter className="h-4 w-4 sm:mr-1.5 mr-1" />
                    <span className="hidden sm:inline">Filter</span>
                    <span className="sm:hidden">Filter</span>
                  </button>
                  
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-300 rounded-lg hover:bg-primary-100 active:bg-primary-200 touch-manipulation transition-colors"
                    >
                      <CheckCheck className="h-4 w-4 sm:mr-1.5 mr-1" />
                      <span className="hidden sm:inline">Mark all as read</span>
                      <span className="sm:hidden">All read</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => { setFilter('all'); setShowFilters(false); }}
                className={`px-4 sm:px-5 py-2.5 sm:py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation active:scale-95 ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilter('unread'); setShowFilters(false); }}
                className={`px-4 sm:px-5 py-2.5 sm:py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation active:scale-95 ${
                  filter === 'unread'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => { setFilter('read'); setShowFilters(false); }}
                className={`px-4 sm:px-5 py-2.5 sm:py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation active:scale-95 ${
                  filter === 'read'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                Read
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4 sm:space-y-6">
          {isLoading && notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading notifications...</p>
            </div>
          ) : Object.keys(groupedNotifications).length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-sm sm:text-base text-gray-600">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications." 
                  : filter === 'read'
                    ? "No read notifications yet."
                    : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([dateKey, dateNotifications]) => (
              <div key={dateKey} className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2 px-2 sm:px-3">
                  <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {dateKey}
                  </h2>
                  <div className="flex-1 border-t border-gray-300"></div>
                  <button
                    onClick={selectAll}
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 active:text-primary-800 font-medium touch-manipulation px-2 py-1 rounded"
                  >
                    Select all
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`bg-white rounded-lg shadow-sm border-l-4 ${
                        !notification.read ? getPriorityColor(notification.priority) : 'border-l-gray-300 bg-white'
                      } border-r border-t border-b border-gray-200 hover:shadow-md active:shadow-lg transition-all cursor-pointer touch-manipulation`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="p-3 sm:p-4 md:p-5">
                        <div className="flex items-start space-x-2 sm:space-x-3 gap-2">
                          {/* Checkbox for selection */}
                          <input
                            type="checkbox"
                            checked={selectedNotifications.has(notification._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelection(notification._id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 sm:mt-1.5 h-4 w-4 sm:h-5 sm:w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded flex-shrink-0 touch-manipulation"
                          />

                          {/* Icon */}
                          <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <h3 className={`text-sm sm:text-base font-semibold break-words ${
                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </h3>
                                  {!notification.read && (
                                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary-600 rounded-full flex-shrink-0"></span>
                                  )}
                                </div>
                                <p className="text-sm sm:text-base text-gray-600 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3 break-words">
                                  {notification.message}
                                </p>
                                <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                    <span className="whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                  </div>
                                  {notification.priority === 'urgent' && (
                                    <span className="px-2 py-0.5 sm:py-1 bg-red-100 text-red-700 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap">
                                      Urgent
                                    </span>
                                  )}
                                  {notification.link && (
                                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-start space-x-1 sm:space-x-1.5 flex-shrink-0">
                                {!notification.read && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await markAsRead(notification._id);
                                    }}
                                    className="p-2 sm:p-2.5 text-gray-400 hover:text-primary-600 active:bg-primary-50 transition-colors rounded-lg touch-manipulation"
                                    title="Mark as read"
                                    aria-label="Mark as read"
                                  >
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </button>
                                )}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await deleteNotification(notification._id);
                                  }}
                                  className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 active:bg-red-50 transition-colors rounded-lg touch-manipulation"
                                  title="Delete"
                                  aria-label="Delete notification"
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={loadMore}
              className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-primary-600 bg-primary-50 border border-primary-300 rounded-lg hover:bg-primary-100 active:bg-primary-200 touch-manipulation transition-colors w-full sm:w-auto"
            >
              Load more notifications
            </button>
          </div>
        )}

        {isLoading && notifications.length > 0 && (
          <div className="mt-4 sm:mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

