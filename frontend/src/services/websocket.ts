import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private userId: string | null = null;

  connect(userId: string) {
    // Don't reconnect if already connected with same user
    if (this.socket?.connected && this.userId === userId) {
      return this.socket;
    }

    this.userId = userId;

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Get token from Zustand persist storage
    let token: string | null = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        token = authData.state?.accessToken || null;
      }
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
    }

    if (!token) {
      console.error('No auth token found for WebSocket connection');
      return null;
    }

    // Determine WebSocket URL based on environment
    // Use the same hostname as the frontend, but port 5001 for backend
    const getBackendUrl = () => {
      if (process.env.REACT_APP_WS_URL) {
        return process.env.REACT_APP_WS_URL;
      }
      
      const hostname = window.location.hostname;
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      
      // If localhost, use localhost:5001
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5001';
      }
      
      // In production, use the API URL or current hostname
      if (process.env.NODE_ENV === 'production') {
        const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || hostname;
        return `${protocol}//${apiUrl}`;
      }
      
      // In development, use same hostname but port 5001
      return `http://${hostname}:5001`;
    };
    
    const wsUrl = getBackendUrl();

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Connecting to WebSocket:', wsUrl);
    }

    this.socket = io(wsUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000, // Increased from 1s to 2s
      reconnectionDelayMax: 10000, // Increased from 5s to 10s
      reconnectionAttempts: 3, // Reduced from 5 to 3
      autoConnect: true,
      timeout: 15000 // Increased from 10s to 15s
    });

    this.socket.on('connect', () => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ WebSocket connected');
      }
      this.reconnectAttempts = 0;
      this.socket?.emit('user:online', { userId });
    });

    this.socket.on('disconnect', (reason) => {
      // Only log important disconnects
      if (reason === 'io server disconnect') {
        console.error('❌ Server disconnected - possible auth issue');
      }
      // Don't log normal disconnects to reduce noise
    });

    this.socket.on('connect_error', (error: Error) => {
      // Only log authentication errors, not every connection attempt
      if (error.message.includes('Authentication') || error.message.includes('401') || error.message.includes('403')) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ WebSocket auth error - token may be expired');
        }
        // Don't disconnect immediately, let it retry with a new token
        setTimeout(() => {
          if (!this.socket?.connected) {
            this.disconnect();
          }
        }, 5000);
        return;
      }
      // Silently handle other connection errors (they will retry)
    });

    this.socket.on('reconnect', (attemptNumber) => {
      // Only log successful reconnections
      if (process.env.NODE_ENV === 'development' && attemptNumber > 1) {
        console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
      }
    });

    // Don't log every reconnection attempt - too noisy
    this.socket.on('reconnect_attempt', () => {
      // Silently retry
    });

    this.socket.on('reconnect_error', () => {
      // Silently handle reconnection errors
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after maximum attempts');
    });

    this.socket.on('error', (error: any) => {
      // Only log critical errors
      if (error.message && !error.message.includes('websocket')) {
        console.error('❌ WebSocket error:', error);
      }
    });

    // Listen for user status updates - Remove excessive logging
    this.socket.on('user:status', () => {
      // Don't log every status update - too noisy
      // Status updates are handled by components that need them
    });

    return this.socket;
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Message events
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('message:new', callback);
  }

  onMessageRead(callback: (data: any) => void) {
    this.socket?.on('message:read', callback);
  }

  onTyping(callback: (data: any) => void) {
    this.socket?.on('user:typing', callback);
  }

  // Emit events
  sendMessage(chatId: string, message: any) {
    this.socket?.emit('message:send', { chatId, message });
  }

  markAsRead(chatId: string, messageId: string) {
    this.socket?.emit('message:read', { chatId, messageId });
  }

  startTyping(chatId: string) {
    this.socket?.emit('user:typing:start', { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit('user:typing:stop', { chatId });
  }

  // Notification events
  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  offNotification(callback?: (notification: any) => void) {
    if (callback) {
      this.socket?.off('notification:new', callback);
    } else {
      this.socket?.off('notification:new');
    }
  }

  // Video call events
  onCallIncoming(callback: (data: any) => void) {
    this.socket?.on('call:incoming', callback);
  }

  initiateCall(chatId: string, type: 'video' | 'audio') {
    this.socket?.emit('call:initiate', { chatId, type });
  }

  answerCall(callId: string) {
    this.socket?.emit('call:answer', { callId });
  }

  endCall(callId: string) {
    this.socket?.emit('call:end', { callId });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
