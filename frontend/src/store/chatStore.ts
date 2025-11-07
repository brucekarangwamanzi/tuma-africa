import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin' | 'super_admin';
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface SendMessageData {
  content: string;
  type: 'text' | 'file';
  file?: File;
}

interface ChatState {
  // State
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  unreadCount: number;
  currentChatId: string | null;
  error: string | null;

  // Actions
  fetchMessages: () => Promise<string | null>;
  sendMessage: (data: SendMessageData) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearMessages: () => void;
  setConnected: (connected: boolean) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  isConnected: true, // Assume connected initially (we'll add WebSocket later)
  unreadCount: 0,
  currentChatId: null,
  error: null,

  // Actions
  fetchMessages: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get('/chat/messages');
      const { messages, chatId } = response.data;
      
      set({
        messages: messages || [],
        currentChatId: chatId,
        isLoading: false,
        unreadCount: 0
      });
      
      return chatId;
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch messages',
        isLoading: false
      });
      return null;
    }
  },

  sendMessage: async (data: SendMessageData) => {
    const { messages } = get();
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: 'current-user', // Will be replaced by actual user ID
      senderName: 'You',
      senderRole: 'user',
      content: data.content,
      type: data.type,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    // Add optimistic message immediately
    set({ messages: [...messages, optimisticMessage] });

    try {
      let response;
      
      if (data.file) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', data.file);
        if (data.content) {
          formData.append('content', data.content);
        }
        formData.append('type', data.type);
        
        response = await axios.post('/chat/messages', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Handle text message
        response = await axios.post('/chat/messages', {
          content: data.content,
          type: data.type
        });
      }

      const { message } = response.data;
      
      // Replace optimistic message with real message
      const updatedMessages = get().messages.map(msg =>
        msg.id === optimisticMessage.id ? message : msg
      );
      
      set({ messages: updatedMessages });
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Remove optimistic message on error
      const filteredMessages = get().messages.filter(
        msg => msg.id !== optimisticMessage.id
      );
      
      set({ 
        messages: filteredMessages,
        error: error.response?.data?.message || 'Failed to send message'
      });
      
      toast.error('Failed to send message. Please try again.');
    }
  },

  markAsRead: async (messageId: string) => {
    try {
      await axios.put(`/chat/messages/${messageId}/read`);
      
      // Update message status locally
      const updatedMessages = get().messages.map(msg =>
        msg.id === messageId ? { ...msg, status: 'read' as const } : msg
      );
      
      set({ messages: updatedMessages });
    } catch (error: any) {
      console.error('Failed to mark message as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await axios.put('/chat/messages/read-all');
      
      // Update all messages status locally
      const updatedMessages = get().messages.map(msg => ({
        ...msg,
        status: 'read' as const
      }));
      
      set({ 
        messages: updatedMessages,
        unreadCount: 0
      });
    } catch (error: any) {
      console.error('Failed to mark all messages as read:', error);
    }
  },

  clearMessages: () => {
    set({ 
      messages: [], 
      currentChatId: null,
      unreadCount: 0 
    });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  clearError: () => {
    set({ error: null });
  }
}));