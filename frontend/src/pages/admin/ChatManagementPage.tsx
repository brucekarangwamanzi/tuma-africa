import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Paperclip,
  Video,
  Phone,
  Bot,
  Bell
} from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import websocketService from '../../services/websocket';
import { useAuthStore } from '../../store/authStore';

interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    fullName: string;
    email: string;
    role: string;
  }>;
  chatType: string;
  title: string;
  status: string;
  priority: string;
  orderId?: {
    _id: string;
    orderId: string;
    productName: string;
    status: string;
  };
  messages: Array<{
    _id: string;
    sender: string;
    type: string;
    text: string;
    createdAt: string;
    isRead: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

const ChatManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    pending: 0
  });

  useEffect(() => {
    fetchChats();
    
    // Connect to WebSocket for real-time updates
    if (user) {
      const socket = websocketService.connect(user.id);
      if (socket) {
        setIsConnected(true);
        
        // Listen for new messages
        websocketService.onNewMessage((data) => {
          console.log('Admin received message:', data);
          
          // Refresh chats when new message arrives
          fetchChats();
          
          // Show notification with user info if not viewing this chat
          if (!selectedChat || selectedChat._id !== data.chatId) {
            const senderName = data.message.senderName || 'User';
            toast.info(`💬 New message from ${senderName}`, {
              autoClose: 5000,
              onClick: () => {
                // Find and select the chat
                const chat = chats.find(c => c._id === data.chatId);
                if (chat) setSelectedChat(chat);
              }
            });
          }
        });
      }
    }
    
    return () => {
      websocketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const response = await axios.get(`/chat/admin/all?${params.toString()}`);
      setChats(response.data.chats || []);
      
      // Calculate stats
      const total = response.data.chats?.length || 0;
      const open = response.data.chats?.filter((c: Chat) => c.status === 'open').length || 0;
      const closed = response.data.chats?.filter((c: Chat) => c.status === 'closed').length || 0;
      const pending = response.data.chats?.filter((c: Chat) => c.status === 'pending').length || 0;
      
      setStats({ total, open, closed, pending });
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      // Send via WebSocket if connected
      if (isConnected) {
        websocketService.sendMessage(selectedChat._id, {
          content: newMessage.trim(),
          type: 'text'
        });
      } else {
        // Fallback to HTTP
        await axios.post(`/chat/${selectedChat._id}/messages`, {
          text: newMessage.trim(),
          type: 'text'
        });
        fetchChats();
      }

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleExportChat = async (chatId: string) => {
    try {
      const response = await axios.get(`/chat/${chatId}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chat-${chatId}-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Chat exported successfully');
    } catch (error) {
      console.error('Failed to export chat:', error);
      toast.error('Failed to export chat');
    }
  };

  const handleUpdateStatus = async (chatId: string, status: string) => {
    try {
      await axios.put(`/chat/${chatId}`, { status });
      fetchChats();
      toast.success('Status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      open: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-3 h-3" />
      },
      closed: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <AlertCircle className="w-3 h-3" />
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock className="w-3 h-3" />
      }
    };

    const config = statusConfig[status] || statusConfig.open;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => p.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Chat Management</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Manage customer support conversations and inquiries
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${
                isConnected 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></span>
                <span className="text-sm font-medium">{isConnected ? 'Real-time' : 'Connecting...'}</span>
              </div>
              <button
                onClick={fetchChats}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chats</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-green-600">{stats.open}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Features Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h3 className="text-xl font-bold mb-4">Advanced Chat Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span className="text-sm">Push Notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5" />
              <span className="text-sm">Video Calls</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span className="text-sm">Voice Messages</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span className="text-sm">AI Chatbot</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search chats by title or participant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Conversations</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No chats found</p>
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const user = chat.participants.find(p => p.role === 'user');
                    return (
                      <div
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          selectedChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {user?.fullName || 'Unknown User'}
                              </h4>
                              {getStatusBadge(chat.status)}
                            </div>
                            {chat.orderId && (
                              <div className="flex items-center space-x-1 text-xs">
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-medium">
                                  📦 {chat.orderId.orderId}
                                </span>
                                <span className="text-gray-600 truncate">
                                  {chat.orderId.productName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {user?.email}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{chat.messages.length} messages</span>
                          <span>{formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Chat Detail */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Chat Header */}
                <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold">
                              {selectedChat.participants.find(p => p.role === 'user')?.fullName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">
                                {selectedChat.participants.find(p => p.role === 'user')?.fullName || 'Unknown User'}
                              </h3>
                              <span className="px-2 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                                Customer
                              </span>
                            </div>
                            <p className="text-sm opacity-90">
                              {selectedChat.participants.find(p => p.role === 'user')?.email}
                            </p>
                            {selectedChat.orderId && (
                              <div className="mt-2 flex items-center space-x-2 text-sm">
                                <span className="px-2 py-1 bg-yellow-400 bg-opacity-90 text-gray-900 rounded font-medium">
                                  📦 Order: {selectedChat.orderId.orderId}
                                </span>
                                <span className="px-2 py-1 bg-white bg-opacity-20 rounded">
                                  {selectedChat.orderId.productName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExportChat(selectedChat._id)}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Export chat"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <select
                          value={selectedChat.status}
                          onChange={(e) => handleUpdateStatus(selectedChat._id, e.target.value)}
                          className="px-3 py-1 rounded-lg text-sm bg-white text-gray-900 border-none focus:ring-2 focus:ring-white"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order/Product Information */}
                  {selectedChat.orderId && (
                    <div className="px-4 pb-4">
                      <div className="bg-white bg-opacity-10 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-medium">Regarding:</span>
                          <span className="opacity-90">
                            Order #{selectedChat.orderId.orderId} - {selectedChat.orderId.productName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedChat.orderId.status === 'delivered' ? 'bg-green-500' :
                            selectedChat.orderId.status === 'shipped' ? 'bg-blue-500' :
                            selectedChat.orderId.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}>
                            {selectedChat.orderId.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="p-4 h-96 overflow-y-auto space-y-4">
                  {selectedChat.messages.map((message) => {
                    const isAdmin = message.sender !== selectedChat.participants.find(p => p.role === 'user')?._id;
                    const sender = selectedChat.participants.find(p => p._id === message.sender);
                    const senderName = sender?.fullName || 'Unknown';
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex flex-col">
                          {!isAdmin && (
                            <span className="text-xs text-gray-500 mb-1 ml-2">
                              {senderName}
                            </span>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              isAdmin
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                              <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                              {isAdmin && message.isRead && <CheckCircle className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex items-center justify-center p-12">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Chat Selected</h3>
                  <p className="text-gray-600">Select a conversation from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatManagementPage;
