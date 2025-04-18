import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { UserContext } from './UserContext';
import { SOCKET } from '@env';

const SOCKET_URL = SOCKET + '/socket.io?userId=';

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const userId = user?.id;

  const socketRef = useRef(null);
  const listenersRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      console.log('⏳ Chờ userId từ context...');
      return;
    }

    const connectWebSocket = () => {
      console.log('🔄 Tạo kết nối WebSocket mới:', userId);

      if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
        socketRef.current.close();
      }

      socketRef.current = new WebSocket(`${SOCKET_URL}${userId}`);

      socketRef.current.onopen = () => {
        console.log('✅ WebSocket đã kết nối');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          listenersRef.current.forEach((listener) => listener(message));
        } catch (error) {
          console.error('❌ Lỗi khi parse message:', error);
        }
      };

      socketRef.current.onclose = (event) => {
        console.log(`🔴 WebSocket ngắt kết nối (code: ${event.code})`);
        setIsConnected(false);
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('❌ WebSocket lỗi:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [userId]);

  const sendMessage = (message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.log('⚠️ Socket chưa kết nối');
      return false;
    }
  };

  const onMessage = (listener) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
  };


  return (
    <WebSocketContext.Provider value={{ sendMessage, onMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
