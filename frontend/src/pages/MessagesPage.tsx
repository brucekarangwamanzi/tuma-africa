import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageCircle,
  Send,
  Paperclip,
  Search,
  Package,
  User,
  Clock,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Download,
  Plus,
  Reply,
  X,
  MoreVertical,
  Smile
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import EmojiPicker from '../components/chat/EmojiPicker';
import axios from 'axios';
import { toast } from 'react-toastify';
import websocketService from '../services/websocket';
import '../styles/messages.css';

interface Order {
  _id: string;
  orderId: string;
  productName: string;
  status: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping?: boolean;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { messages, isLoading, fetchMessages, sendMessage } = useChatStore();
  const { settings } = useSettingsStore();
  const [searchParams] = useSearchParams();
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string>('admin');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showSidebar, setShowSidebar] = useState(false); // Mobile sidebar toggle
  const [showUnreadOnly, setShowUnreadOnly] = useState(false); // Filter for unread messages
  const [showFilters, setShowFilters] = useState(true); // Toggle for filter tabs visibility
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get theme colors from settings
  const primaryColor = settings?.theme?.primaryColor || '#3b82f6';
  const secondaryColor = settings?.theme?.secondaryColor || '#64748b';
  const accentColor = settings?.theme?.accentColor || '#f59e0b';

  // Helper function to get conversation name based on role and user
  const getConversationName = (role: string, userName?: string) => {
    // If current user is admin or super_admin, show the client's name
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return userName || 'User';
    }
    // If current user is regular user, show support team based on admin role
    if (role === 'admin') return 'Support Team 1';
    if (role === 'super_admin') return 'Support Team 2';
    return 'Support Team';
  };

  // Helper function to get conversation ID based on role and user
  const getConversationId = (role: string, userId?: string) => {
    // If current user is admin or super_admin, use the client's user ID
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return userId || 'user';
    }
    // If current user is regular user, use admin role as ID
    if (role === 'admin') return 'admin';
    if (role === 'super_admin') return 'super_admin';
    return 'support';
  };

  // Check for pre-filled message from URL
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (prefill) {
      setNewMessage(decodeURIComponent(prefill));
      // Remove the prefill parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('prefill');
      window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeChat = async () => {
      if (!user?.id) return;
      
      // Always fetch messages on mount/refresh to ensure we have all messages
      console.log('🔄 Initializing chat - fetching messages from server...');
      
      // First, show persisted messages immediately (if any) - they're already in the store
      const persistedMessages = useChatStore.getState().messages;
      const persistedChatId = useChatStore.getState().currentChatId;
      
      if (persistedMessages.length > 0) {
        console.log(`📦 Showing ${persistedMessages.length} persisted messages immediately`);
        // Set chatId from persisted state if available
        if (persistedChatId && isMounted) {
          setChatId(persistedChatId);
          console.log(`📦 Using persisted chatId: ${persistedChatId}`);
        }
      }
      
      // Then fetch fresh messages from server - Always fetch for users to get latest
      // This ensures we have the most up-to-date messages while showing persisted ones immediately
      try {
        const id = await fetchMessages();
        if (id && isMounted) {
          setChatId(id);
          console.log(`✅ Chat initialized with ID: ${id}, ${useChatStore.getState().messages.length} messages loaded`);
        } else if (isMounted) {
          console.warn('⚠️ No chat ID returned from server');
          // For users, try to fetch again after a short delay
          if (user?.role === 'user') {
            setTimeout(async () => {
              if (isMounted) {
                const retryId = await fetchMessages();
                if (retryId) {
                  setChatId(retryId);
                  console.log(`✅ Chat initialized on retry with ID: ${retryId}`);
                }
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages on mount:', error);
        // For users, retry once - but keep persisted messages visible
        if (user?.role === 'user' && isMounted) {
          setTimeout(async () => {
            if (isMounted) {
              try {
                const retryId = await fetchMessages();
                if (retryId) {
                  setChatId(retryId);
                  console.log(`✅ Chat initialized on retry with ID: ${retryId}`);
                }
              } catch (retryError) {
                console.error('Retry fetch messages failed:', retryError);
                // Even if fetch fails, persisted messages are still visible
              }
            }
          }, 2000);
        }
      }
      
      if (isMounted) {
        fetchOrders();
      }
      
      // Connect to WebSocket for real-time updates
      if (isMounted && user && user.id) {
        const socket = websocketService.connect(user.id);
        if (socket) {
          setIsConnected(true);
          
          // Listen for new messages
          websocketService.onNewMessage((data) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Received WebSocket message:', data);
            }
            
            // Add message to local state
            const newMsg = {
              id: data.message.id,
              senderId: data.message.senderId,
              senderName: data.message.senderName || (data.message.senderId === user?.id ? user.fullName : 'Support'),
              senderRole: data.message.senderRole || (data.message.senderId === user?.id ? (user.role as 'user' | 'admin' | 'super_admin') : 'admin'),
              content: data.message.content,
              type: data.message.type,
              fileUrl: data.message.fileUrl,
              fileName: data.message.fileName,
              fileSize: data.message.fileSize,
              timestamp: data.message.timestamp,
              status: data.message.status
            };
            
            // Update messages in store (avoid duplicates and maintain order)
            useChatStore.setState((state) => {
              const messageExists = state.messages.some(msg => msg.id === newMsg.id);
              if (messageExists) {
                console.log(`⚠️ Duplicate message ${newMsg.id} - skipping`);
                return state; // Don't add duplicate
              }
              
              // Add new message and sort by timestamp
              const updatedMessages = [...state.messages, newMsg].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              
              console.log(`✅ Added new message ${newMsg.id} to store. Total: ${updatedMessages.length}`);
              
              return {
                messages: updatedMessages
              };
            });
            
            // Update chatId if provided in the message data
            if (data.chatId && data.chatId !== chatId) {
              setChatId(data.chatId);
              useChatStore.setState({ currentChatId: data.chatId });
              console.log(`✅ Updated chatId to: ${data.chatId}`);
            }

            // Update conversation list with new message
            if (newMsg.senderId !== user?.id) {
              const convId = getConversationId(newMsg.senderRole, newMsg.senderId);
              const convName = getConversationName(newMsg.senderRole, newMsg.senderName);
              
              setConversations(prev => {
                const existingConv = prev.find(c => c.id === convId);
                if (existingConv) {
                  // Update existing conversation
                  return prev.map(c => 
                    c.id === convId 
                      ? { 
                          ...c, 
                          lastMessage: newMsg.content, 
                          timestamp: newMsg.timestamp,
                          unreadCount: selectedConversation === convId ? 0 : c.unreadCount + 1
                        }
                      : c
                  );
                } else {
                  // Add new conversation
                  return [...prev, {
                    id: convId,
                    name: convName,
                    lastMessage: newMsg.content,
                    timestamp: newMsg.timestamp,
                    unreadCount: selectedConversation === convId ? 0 : 1,
                    isOnline: true
                  }];
                }
              });
              
              // Show notification
              toast.info(`New message from ${convName}`);
            }
          });
        }
      }
    };
    
    initializeChat();
    
    return () => {
      isMounted = false;
      // Don't disconnect WebSocket here - it's managed globally
      // websocketService.disconnect();
    };
  }, [user?.id]); // Only re-run if user ID changes

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversations from existing messages
  useEffect(() => {
    if (messages.length > 0) {
      const convMap = new Map<string, Conversation>();
      // For admins/super_admins: group by user (client)
      // For regular users: group by admin role
      const isAdminView = user?.role === 'admin' || user?.role === 'super_admin';
      
      messages.forEach(msg => {
        if (isAdminView) {
          // Admin view: show conversations with each user
          if (msg.senderId !== user?.id) {
            const convId = msg.senderId;
            const convName = msg.senderName;
            
            if (!convMap.has(convId)) {
              convMap.set(convId, {
                id: convId,
                name: convName,
                lastMessage: msg.content,
                timestamp: msg.timestamp,
                unreadCount: 0,
                isOnline: true
              });
            } else {
              // Update with latest message
              const existing = convMap.get(convId)!;
              if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
                convMap.set(convId, {
                  ...existing,
                  lastMessage: msg.content,
                  timestamp: msg.timestamp
                });
              }
            }
          }
        } else {
          // User view: show conversations with different support teams
          if (msg.senderId !== user?.id) {
            const convId = getConversationId(msg.senderRole, msg.senderId);
            const convName = getConversationName(msg.senderRole, msg.senderName);
            
            if (!convMap.has(convId)) {
              convMap.set(convId, {
                id: convId,
                name: convName,
                lastMessage: msg.content,
                timestamp: msg.timestamp,
                unreadCount: 0,
                isOnline: true
              });
            } else {
              // Update with latest message
              const existing = convMap.get(convId)!;
              if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
                convMap.set(convId, {
                  ...existing,
                  lastMessage: msg.content,
                  timestamp: msg.timestamp
                });
              }
            }
          }
        }
      });

      // If no conversations from messages, create default ones
      if (convMap.size === 0 && !isAdminView) {
        convMap.set('admin', {
          id: 'admin',
          name: 'Support Team 1',
          lastMessage: 'How can we help you today?',
          timestamp: new Date().toISOString(),
          unreadCount: 0,
          isOnline: true
        });
        convMap.set('super_admin', {
          id: 'super_admin',
          name: 'Support Team 2',
          lastMessage: 'Premium support available',
          timestamp: new Date().toISOString(),
          unreadCount: 0,
          isOnline: true
        });
      }

      setConversations(Array.from(convMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
      
      // Set first conversation as selected if none selected
      if (!selectedConversation && convMap.size > 0) {
        setSelectedConversation(Array.from(convMap.keys())[0]);
      }
    } else {
      // Initialize with default conversations only for regular users
      if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        setConversations([
          {
            id: 'admin',
            name: 'Support Team 1',
            lastMessage: 'How can we help you today?',
            timestamp: new Date().toISOString(),
            unreadCount: 0,
            isOnline: true
          },
          {
            id: 'super_admin',
            name: 'Support Team 2',
            lastMessage: 'Premium support available',
            timestamp: new Date().toISOString(),
            unreadCount: 0,
            isOnline: true
          }
        ]);
      }
    }
  }, [messages, user?.id, user?.role]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedFile) return;

    try {
      let messageContent = newMessage.trim();
      
      // Add order reference if selected
      if (selectedOrder) {
        messageContent = `[Order: ${selectedOrder.orderId} - ${selectedOrder.productName}]\n\n${messageContent}`;
      }

      // Send via WebSocket if connected
      if (isConnected && chatId) {
        websocketService.sendMessage(chatId, {
          content: messageContent,
          type: selectedFile ? 'file' : 'text',
          fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
          fileName: selectedFile?.name
        });
      } else {
        // Fallback to HTTP if WebSocket not connected
        await sendMessage({
          content: messageContent,
          type: selectedFile ? 'file' : 'text',
          file: selectedFile || undefined,
        });
      }

      setNewMessage('');
      setSelectedFile(null);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  // Helper function to detect and format URLs in text
  const formatMessageContent = (text: string, isOwn: boolean = false) => {
    if (!text) return null;
    
    // Enhanced URL regex pattern - matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    
    // Find all URLs in the text
    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      // Add the URL as a link
      const url = match[0];
      const displayUrl = url.length > 60 ? `${url.substring(0, 57)}...` : url;
      parts.push(
        <a
          key={`url-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${
            isOwn 
              ? 'text-blue-100 hover:text-white underline' 
              : 'text-blue-600 hover:text-blue-800 underline'
          } break-all transition-colors`}
          onClick={(e) => e.stopPropagation()}
          title={url}
        >
          {displayUrl}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last URL
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex)}</span>);
    }
    
    // If no URLs found, return the text as-is
    if (parts.length === 0) {
      return <span>{text}</span>;
    }
    
    return <>{parts}</>;
  };

  const filteredConversations = conversations
    .filter(conv => conv.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(conv => showUnreadOnly ? conv.unreadCount > 0 : true);

  // Filter messages based on selected conversation
  const filteredMessages = messages.filter(msg => {
    const isAdminView = user?.role === 'admin' || user?.role === 'super_admin';
    
    if (isAdminView) {
      // Admin view: show messages from/to selected user
      // selectedConversation is the userId of the client when viewing a specific user's chat
      // Show messages where:
      // 1. Sender is the selected user (client), OR
      // 2. Sender is the current admin and we're viewing that user's conversation
      if (selectedConversation && selectedConversation !== 'admin' && selectedConversation !== 'super_admin') {
        // Viewing a specific user's conversation
        return msg.senderId === selectedConversation || msg.senderId === user?.id;
      } else {
        // Viewing all conversations or default view - show all messages
        return true;
      }
    } else {
      // User view: show all messages in the support chat (no filtering needed)
      return true;
    }
  });

  // Get the current conversation details for header display
  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const chatHeaderName = currentConversation?.name || 'Support Team';
  const chatHeaderSubtitle = user?.role === 'admin' || user?.role === 'super_admin'
    ? `User ID: ${selectedConversation}`
    : isConnected ? 'Active now' : 'Offline';

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Top Header - Enhanced with Mobile Toggle */}
      <div className="text-white px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg" style={{ 
        backgroundColor: primaryColor,
        backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
      }}>
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="sm:hidden p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm hover:bg-opacity-30 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          
          <div className="hidden sm:flex p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Messages</h1>
            <p className="text-xs text-white text-opacity-90 hidden sm:block">Stay connected with support</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {showSidebar && (
          <div 
            className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowSidebar(false)}
          />
        )}
        {/* Left Sidebar - Conversations List - Enhanced with Mobile Toggle */}
        <div className={`
          fixed sm:relative inset-y-0 left-0 z-40
          w-full sm:w-[350px] lg:w-[380px] 
          bg-white border-r border-gray-200 flex flex-col shadow-sm
          transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
        `}>
          {/* Mobile Close Button */}
          <div className="sm:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {/* Search Bar - Enhanced */}
          <div className="p-3 sm:p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 focus:bg-white border border-transparent focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Filter Tabs - Enhanced with Toggle */}
          <div className="border-b border-gray-100 bg-white">
            {/* Filter Toggle Button - Mobile */}
            <div className="flex items-center justify-between px-4 py-2 sm:hidden">
              <span className="text-xs font-medium text-gray-600">Filters</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className={`
              flex items-center space-x-6 px-4 py-3 transition-all duration-300 overflow-hidden
              ${showFilters ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 sm:max-h-20 sm:opacity-100'}
            `}>
              <button 
                onClick={() => setShowUnreadOnly(false)}
                className={`text-sm font-semibold pb-2 border-b-2 transition-all ${
                  !showUnreadOnly 
                    ? 'border-b-2' 
                    : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
                style={!showUnreadOnly ? { color: primaryColor, borderColor: primaryColor } : {}}
              >
                All
                <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {conversations.length}
                </span>
              </button>
              <button 
                onClick={() => setShowUnreadOnly(true)}
                className={`text-sm font-semibold pb-2 border-b-2 transition-all ${
                  showUnreadOnly 
                    ? 'border-b-2' 
                    : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
                style={showUnreadOnly ? { color: primaryColor, borderColor: primaryColor } : {}}
              >
                Unread
                {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                  <span 
                    className="ml-1.5 text-xs text-white px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {conversations.filter(c => c.unreadCount > 0).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Conversations List - Enhanced */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv.id);
                  setShowSidebar(false); // Close sidebar on mobile after selection
                }}
                className={`flex items-center px-4 py-4 cursor-pointer transition-all duration-200 border-l-4 ${
                  selectedConversation === conv.id 
                    ? 'bg-gradient-to-r from-blue-50 to-transparent border-l-primary shadow-sm' 
                    : 'border-l-transparent hover:bg-gray-50 hover:border-l-gray-300'
                }`}
                style={selectedConversation === conv.id ? { borderLeftColor: primaryColor } : {}}
              >
                <div className="relative mr-3 flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600" />
                  </div>
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold truncate ${selectedConversation === conv.id ? 'text-gray-900' : 'text-gray-800'}`}>
                      {conv.name}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{formatMessageTime(conv.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate flex-1 ${conv.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {conv.isTyping ? (
                        <span className="italic flex items-center" style={{ color: primaryColor }}>
                          <span className="flex space-x-1 mr-2">
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '300ms' }}></span>
                          </span>
                          typing
                        </span>
                      ) : (
                        conv.lastMessage
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-sm" style={{ backgroundColor: primaryColor }}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Chat Area - Enhanced */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
          {/* Chat Header - Enhanced with User Info */}
          <div className="bg-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Mobile Back Button */}
              <button
                onClick={() => setShowSidebar(true)}
                className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <MessageCircle className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
                {isConnected && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white shadow-sm animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  {chatHeaderName}
                </h3>
                <p className="text-xs text-gray-500 flex items-center">
                  {user?.role === 'admin' || user?.role === 'super_admin' ? (
                    // Admin view: show user info
                    <>
                      <User className="w-3 h-3 mr-1.5" />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{chatHeaderSubtitle}</span>
                    </>
                  ) : (
                    // User view: show online status
                    isConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: primaryColor }}></span>
                        <span>Active now</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                        <span>Offline</span>
                      </>
                    )
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages Area with Modern Background Pattern */}
          <div 
            className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#f0f2f5'
            }}
          >
            {/* Date Divider */}
            <div className="flex justify-center my-4">
              <div className="bg-white bg-opacity-95 px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                <span className="text-xs font-medium text-gray-600">Today</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
                  <p className="text-sm text-gray-500">Loading messages...</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-700 mb-2">Start a Conversation</h4>
                <p className="text-sm mb-4">
                  Send a message to our support team. We're here to help!
                </p>
              </div>
            ) : (
              filteredMessages.map((message, index) => {
                const isOwn = message.senderId === user?.id;
                const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
                const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId || 
                  new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000; // 5 minutes

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                  >
                    {/* Avatar for received messages */}
                    {!isOwn && (
                      <div className={`flex-shrink-0 ${showAvatar ? 'w-8 h-8' : 'w-0'}`}>
                        {showAvatar && (
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`max-w-[75%] sm:max-w-md group relative ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                        }`}
                        style={isOwn ? {} : {}}
                      >
                        {/* Sender Name for received messages */}
                        {!isOwn && showAvatar && (
                          <p className="text-xs font-semibold mb-1.5 text-gray-700 opacity-90">
                            {message.senderName || 'Support'}
                          </p>
                        )}

                        {/* Quoted Message */}
                        {message.replyTo && (
                          <div
                            className={`mb-2 p-2.5 rounded-lg border-l-3 cursor-pointer ${
                              isOwn
                                ? 'bg-white bg-opacity-20 border-white'
                                : 'bg-gray-50 border-gray-300'
                            }`}
                          >
                            <p className={`text-xs font-semibold mb-1 ${isOwn ? 'text-white' : 'text-gray-700'}`}>
                              {message.replyTo.senderName}
                            </p>
                            <p className={`text-xs line-clamp-2 ${isOwn ? 'text-white opacity-90' : 'text-gray-600'}`}>
                              {message.replyTo.content}
                            </p>
                          </div>
                        )}

                        {message.type === 'text' ? (
                          <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                            {formatMessageContent(message.content, isOwn)}
                          </div>
                        ) : message.type === 'file' ? (
                          <div className="space-y-2">
                            {message.content && (
                              <p className={`text-sm leading-relaxed ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                {formatMessageContent(message.content, isOwn)}
                              </p>
                            )}
                            <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                              isOwn 
                                ? 'bg-white bg-opacity-20' 
                                : 'bg-gray-50'
                            }`}>
                              <div className={`p-2 rounded-lg ${isOwn ? 'bg-white bg-opacity-30' : 'bg-white'}`}>
                                {getFileIcon(message.fileName || '')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                  {message.fileName}
                                </p>
                                {message.fileSize && (
                                  <p className={`text-xs mt-0.5 ${isOwn ? 'text-white opacity-80' : 'text-gray-500'}`}>
                                    {(message.fileSize / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2 rounded-lg transition-colors ${
                                  isOwn 
                                    ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
                                    : 'bg-white hover:bg-gray-100 text-gray-600'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ) : null}

                        {/* Timestamp and Status */}
                        <div className={`flex items-center justify-end mt-2 space-x-1.5 ${isOwn ? 'text-white' : 'text-gray-500'}`}>
                          <span className="text-xs opacity-90">
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </span>
                          {isOwn && (
                            <CheckCheck className={`w-3.5 h-3.5 ${message.status === 'read' ? 'text-blue-200' : 'text-white opacity-70'}`} />
                          )}
                        </div>
                      </div>
                      
                      {/* Reply Button - Shows on hover (desktop only) */}
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="hidden sm:block absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                          p-1.5 bg-gray-700 text-white rounded-full hover:bg-gray-800 shadow-lg z-10"
                        title="Reply"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Spacer for sent messages */}
                    {isOwn && (
                      <div className="flex-shrink-0 w-8 order-3"></div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input - Enhanced */}
          <form onSubmit={handleSendMessage} className="bg-white px-4 sm:px-6 py-4 border-t border-gray-200 shadow-lg">
            {/* Reply Preview - Enhanced */}
            {replyingTo && (
              <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border-l-4 flex items-start justify-between shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Reply className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span className="text-xs font-semibold" style={{ color: primaryColor }}>
                      Replying to {replyingTo.senderName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {replyingTo.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 p-1.5 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}

            {/* Selected File Preview - Enhanced */}
            {selectedFile && (
              <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-transparent rounded-xl flex items-center justify-between shadow-sm border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 sm:space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all button-ripple relative"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="message-input w-full px-4 py-3 pr-12 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:bg-white border border-transparent transition-all resize-none overflow-hidden max-h-32"
                  style={{ 
                    '--tw-ring-color': primaryColor,
                    '--tw-ring-opacity': '0.5'
                  } as React.CSSProperties}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-all touch-manipulation"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() && !selectedFile}
                className="p-3 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:scale-105 active:scale-95 button-ripple relative"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
