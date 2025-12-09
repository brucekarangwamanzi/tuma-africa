import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import websocketService from '../services/websocket';

export const useWebSocket = () => {
  const { user } = useAuthStore();
  const connectedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only connect if user exists and hasn't been connected yet, or user changed
    if (user && user.id) {
      // If user changed, disconnect old connection
      if (userIdRef.current && userIdRef.current !== user.id) {
        if (connectedRef.current) {
          websocketService.disconnect();
          connectedRef.current = false;
        }
      }

      // Connect if not already connected
      if (!connectedRef.current || userIdRef.current !== user.id) {
        try {
          websocketService.connect(user.id);
          connectedRef.current = true;
          userIdRef.current = user.id;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to connect WebSocket:', error);
          }
          connectedRef.current = false;
        }
      }
    } else {
      // Disconnect if user is logged out
      if (connectedRef.current) {
        websocketService.disconnect();
        connectedRef.current = false;
        userIdRef.current = null;
      }
    }

    return () => {
      // Only disconnect on unmount if this is the component that initiated the connection
      // Don't disconnect if other components are using the same WebSocket
      // The WebSocket service manages its own lifecycle
    };
  }, [user?.id]); // Only depend on user.id to avoid unnecessary reconnections

  return websocketService;
};

