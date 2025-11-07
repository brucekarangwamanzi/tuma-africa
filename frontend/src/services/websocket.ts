import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private userId: string | null = null;

  connect(userId: string) {
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

    console.log('Connecting to WebSocket with token...');

    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5001', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // We'll handle reconnection manually
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.socket?.emit('user:online', { userId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, likely auth issue
        console.error('Server disconnected the socket - possible auth issue');
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error.message);
      
      // If authentication error, don't retry
      if (error.message.includes('Authentication')) {
        console.error('❌ Authentication failed. Token may be expired.');
        this.disconnect();
        // Don't auto-redirect, let the app handle it
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
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
    this.socket?.on('notification', callback);
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
