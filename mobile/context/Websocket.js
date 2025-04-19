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
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({ type: 'pong' }));
            }
            return;
          }
          
          // Kiểm tra kỹ hơn message trước khi gửi đến listeners
          if (message && typeof message === 'object' && Object.keys(message).length > 0) {
            // Đảm bảo message có keys hợp lệ
            listenersRef.current.forEach((listener) => {
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
    
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [userId]);
  
  const sendMessage = (message) => {
    if (!message || typeof message !== 'object' || Object.keys(message).length === 0) {
      console.error('⚠️ Invalid message format', message);
      return false;
    }
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
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