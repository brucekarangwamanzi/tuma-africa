import React, { useState, useEffect, useRef } from 'react';
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
  Plus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from '../components/chat/EmojiPicker';
import axios from 'axios';
import { toast } from 'react-toastify';
import websocketService from '../services/websocket';

interface Order {
  _id: string;
  orderId: string;
  productName: string;
  status: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { messages, isLoading, fetchMessages, sendMessage } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      const id = await fetchMessages();
      if (id) {
        setChatId(id);
      }
      fetchOrders();
      
      // Connect to WebSocket
      if (user) {
        const socket = websocketService.connect(user.id);
        if (socket) {
          setIsConnected(true);
          
          // Listen for new messages
          websocketService.onNewMessage((data) => {
            console.log('Received WebSocket message:', data);
            
            // Add message to local state
            const newMsg = {
              id: data.message.id,
              senderId: data.message.senderId,
              senderName: data.message.senderName || (data.message.senderId === user.id ? user.fullName : 'Support'),
              senderRole: data.message.senderRole || (data.message.senderId === user.id ? user.role : 'admin'),
              content: data.message.content,
              type: data.message.type,
              fileUrl: data.message.fileUrl,
              fileName: data.message.fileName,
              timestamp: data.message.timestamp,
              status: data.message.status
            };
            
            // Update messages in store (avoid duplicates)
            useChatStore.setState((state) => {
              const messageExists = state.messages.some(msg => msg.id === newMsg.id);
              if (messageExists) {
                return state; // Don't add duplicate
              }
              return {
                messages: [...state.messages, newMsg]
              };
            });
            
            // Play notification sound or show notification
            if (data.message.senderId !== user.id) {
              toast.info(`New message from ${newMsg.senderName}`);
            }
          });
        }
      }
    };
    
    initializeChat();
    
    return () => {
      websocketService.disconnect();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Messages</h1>
              <p className="mt-2 text-lg text-gray-600">
                Chat with our support team about your orders and products
              </p>
            </div>
          </div>
        </div>

        {/* Main Chat Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Support Team</h3>
                  <p className="text-sm opacity-90 flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    <span>{isConnected ? 'Connected • Real-time chat' : 'Connecting...'}</span>
                  </p>
                </div>
              </div>
              
              {selectedOrder && (
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedOrder.orderId}</span>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-700 mb-2">Start a Conversation</h4>
                <p className="text-sm mb-4">
                  Send a message to our support team. We're here to help!
                </p>
                <div className="flex justify-center space-x-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Quick Response
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    24/7 Support
                  </span>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex items-end space-x-2 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOwn && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className={`max-w-md ${isOwn ? 'order-1' : ''}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {message.type === 'text' ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        ) : message.type === 'file' ? (
                          <div className="space-y-2">
                            {message.content && (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            )}
                            <div
                              className={`flex items-center space-x-3 p-3 rounded-lg ${
                                isOwn ? 'bg-white bg-opacity-20' : 'bg-gray-50'
                              }`}
                            >
                              {getFileIcon(message.fileName || '')}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    isOwn ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {message.fileName}
                                </p>
                              </div>
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ) : null}

                        <div
                          className={`flex items-center justify-between mt-2 text-xs ${
                            isOwn ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          <span>
                            {formatDistanceToNow(new Date(message.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                          {isOwn && message.status === 'read' && (
                            <CheckCheck className="w-3 h-3 ml-2" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwn && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200 bg-white">
            {/* Order Selector */}
            {showOrderSelector && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Select an order to discuss:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {orders.map((order) => (
                    <button
                      key={order._id}
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderSelector(false);
                      }}
                      className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderId}</p>
                          <p className="text-sm text-gray-600">{order.productName}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrderSelector(false)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-end space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />

              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowOrderSelector(!showOrderSelector)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                  title="Reference an order"
                >
                  <Package className="w-5 h-5" />
                </button>

                <EmojiPicker onEmojiSelect={(emoji) => setNewMessage((prev) => prev + emoji)} />
              </div>

              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() && !selectedFile}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
