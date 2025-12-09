import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  fileSize?: number;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
}

interface SendMessageData {
  content: string;
  type: 'text' | 'file';
  file?: File;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
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
  fetchMessages: (chatId?: string | null) => Promise<string | null>;
  sendMessage: (data: SendMessageData) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearMessages: () => void;
  setConnected: (connected: boolean) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isLoading: false,
      isConnected: true,
      unreadCount: 0,
      currentChatId: null,
      error: null,

  // Actions
  fetchMessages: async (chatIdParam?: string | null) => {
    set({ isLoading: true, error: null });
    
    try {
      // If chatId is provided, fetch messages for that specific chat
      const url = chatIdParam ? `/chat/messages?chatId=${chatIdParam}` : '/chat/messages';
      const response = await axios.get(url);
      const { messages, chatId } = response.data;
      
      console.log(`📥 Server response - chatId: ${chatId}, messages count: ${messages?.length || 0}`);
      
      // Ensure messages are sorted by timestamp
      const sortedMessages = (messages || []).sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      console.log(`📨 Loaded ${sortedMessages.length} messages from server`);
      
      // For users, always use server messages as source of truth
      // But preserve any optimistic (temp) messages that haven't been confirmed yet
      const existingMessages = get().messages;
      const messageMap = new Map<string, Message>();
      
      // First, add server messages (source of truth)
      sortedMessages.forEach((msg: Message) => {
        messageMap.set(msg.id, msg);
      });
      
      // Then, add any optimistic messages that aren't in server response yet
      existingMessages.forEach(msg => {
        if (msg.id.startsWith('temp-')) {
          // Keep optimistic messages that haven't been confirmed
          messageMap.set(msg.id, msg);
        }
      });
      
      // Convert back to array and sort
      const mergedMessages = Array.from(messageMap.values()).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      console.log(`📊 Merged ${mergedMessages.length} messages (${sortedMessages.length} from server, ${existingMessages.filter(m => m.id.startsWith('temp-')).length} optimistic)`);
      
      // Always set chatId if provided, even if messages array is empty
      const updates: Partial<ChatState> = {
        messages: mergedMessages,
        isLoading: false,
        unreadCount: 0
      };
      
      // Set chatId if provided (important for persistence)
      if (chatId) {
        updates.currentChatId = chatId;
        console.log(`✅ Set chatId: ${chatId}`);
      }
      
      set(updates);
      
      return chatId;
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      // Don't clear messages on error - keep what we have
      set({
        error: error.response?.data?.message || 'Failed to fetch messages',
        isLoading: false,
        // Keep existing messages on error
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
    // Only clear messages when explicitly needed (e.g., logout)
    // Don't clear on navigation - messages should persist
    set({ 
      messages: [], 
      currentChatId: null,
      unreadCount: 0 
    });
    console.log('🗑️ Messages cleared from store');
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  clearError: () => {
    set({ error: null });
  }
    }),
    {
      name: 'chat-storage',
      // Only persist messages and chatId, not loading states
      partialize: (state) => ({
        messages: state.messages,
        currentChatId: state.currentChatId,
        unreadCount: state.unreadCount,
      }),
      // On rehydration, ensure messages are available immediately
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log(`📦 Restored ${state.messages.length} messages and chatId ${state.currentChatId} from localStorage`);
          // Messages are restored and will be merged with server messages on fetch
          // This ensures users see messages immediately while fresh data loads
        }
      },
    }
  )
);