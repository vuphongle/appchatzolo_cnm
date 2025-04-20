import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { UserContext } from './UserContext';
import { SOCKET } from '@env';

const SOCKET_URL = SOCKET + '/socket.io?userId=';

// Create context
export const WebSocketContext = createContext(null);

// Singleton instance management outside of the component
let socketInstance = null;
let listenersInstance = [];
let isConnectedInstance = false;
let reconnectTimeoutInstance = null;

export const WebSocketProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const userId = user?.id;
  
  // Local state just for re-renders
  const [isConnected, setIsConnected] = useState(isConnectedInstance);
  
  useEffect(() => {
    if (!userId) {
      console.log('⏳ Chờ userId từ context...');
      return;
    }
    
    // Only create a new connection if one doesn't exist or if userId changed
    if (!socketInstance || socketInstance.userId !== userId) {
      connectWebSocket(userId);
    }
    
    // Cleanup function
    return () => {
      // Only clean up if no other components are using the socket
      // In a real implementation, you might want to track reference counts
    };
  }, [userId]);
  
  const connectWebSocket = (userId) => {
    console.log('🔄 Tạo kết nối WebSocket mới:', userId);
    
    // Close existing socket if open
    if (socketInstance && socketInstance.socket?.readyState !== WebSocket.CLOSED) {
      socketInstance.socket.close();
    }
    
    // Clear any pending reconnect
    if (reconnectTimeoutInstance) {
      clearTimeout(reconnectTimeoutInstance);
      reconnectTimeoutInstance = null;
    }
    
    const socket = new WebSocket(`${SOCKET_URL}${userId}`);
    
    // Store the userId with the socket for reference
    socketInstance = {
      socket,
      userId
    };
    
    socket.onopen = () => {
      console.log('✅ WebSocket đã kết nối');
      isConnectedInstance = true;
      setIsConnected(true);
    };
    
    socket.onmessage = (event) => {
      try {
        // Kiểm tra event.data có tồn tại và không rỗng
        if (!event.data) {
          console.log('⚠️ Received empty data');
          return;
        }
        
        const message = JSON.parse(event.data);
        
        // Xử lý ping riêng biệt
        if (message && message.type === 'ping') {
          console.log('📍 Ping received');
          // Phản hồi pong nếu cần
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'pong' }));
          }
          return;
        }
        
        // Kiểm tra kỹ hơn message trước khi gửi đến listeners
        if (message && typeof message === 'object' && Object.keys(message).length > 0) {
          // Đảm bảo message có keys hợp lệ
          listenersInstance.forEach((listener) => {
            try {
              listener(message);
            } catch (listenerError) {
              console.error('❌ Lỗi trong listener:', listenerError);
            }
          });
        } else {
          console.log('⚠️ Ignored invalid message format:', message);
        }
      } catch (error) {
        console.error('❌ Lỗi khi parse message:', error, 'Raw data:', event.data);
      }
    };
    
    socket.onclose = (event) => {
      console.log(`🔴 WebSocket ngắt kết nối (code: ${event.code})`);
      isConnectedInstance = false;
      setIsConnected(false);
      
      if (!event.wasClean) {
        reconnectTimeoutInstance = setTimeout(() => connectWebSocket(userId), 3000);
      }
    };
    
    socket.onerror = (error) => {
      console.error('❌ WebSocket lỗi:', error);
      isConnectedInstance = false;
      setIsConnected(false);
    };
  };
  
  // These functions now use the singleton instance
  const sendMessage = (message) => {
    if (!message || typeof message !== 'object' || Object.keys(message).length === 0) {
      console.error('⚠️ Invalid message format', message);
      return false;
    }
    
    if (socketInstance?.socket?.readyState === WebSocket.OPEN) {
      socketInstance.socket.send(JSON.stringify(message));
      return true;
    } else {
      console.log('⚠️ Socket chưa kết nối');
      return false;
    }
  };
  
  const onMessage = (listener) => {
    if (typeof listener !== 'function') {
      console.error('⚠️ Listener must be a function');
      return () => {};
    }
    
    // Don't add the same listener twice
    if (!listenersInstance.includes(listener)) {
      listenersInstance.push(listener);
    }
    
    return () => {
      listenersInstance = listenersInstance.filter((l) => l !== listener);
    };
  };
  
  const contextValue = {
    sendMessage,
    onMessage,
    isConnected: isConnectedInstance
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};