import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Socket.io cần URL base (không có /api)
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Loại bỏ /api hoặc /api/ ở cuối URL
  return apiUrl.replace(/\/api\/?$/, '');
};

const SOCKET_URL = getSocketUrl();

export const useWebSocket = (onAlert) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('[WebSocket] Initializing connection to:', SOCKET_URL);
    
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Event listeners
    socketRef.current.on('connect', () => {
      console.log('[WebSocket] ✓ Connected to server, socket ID:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[WebSocket] ✗ Disconnected from server, reason:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[WebSocket] ✗ Connection error:', error.message);
      console.error('[WebSocket] Attempting to connect to:', SOCKET_URL);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] ✓ Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log('[WebSocket] Attempting to reconnect...', attemptNumber);
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('[WebSocket] ✗ Reconnection failed');
    });

    socketRef.current.on('sensor_update', (data) => {
      console.log('[WebSocket] Received sensor_update:', data);
      setLastMessage(data);
    });

    socketRef.current.on('alert_created', (data) => {
      console.log('[WebSocket] Received alert_created:', data);
      if (onAlert && typeof onAlert === 'function') {
        onAlert(data);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('[WebSocket] Cleaning up connection');
        socketRef.current.disconnect();
      }
    };
  }, []);

  return { isConnected, lastMessage, socket: socketRef.current };
};
