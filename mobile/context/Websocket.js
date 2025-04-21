import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { UserContext } from './UserContext';
import { SOCKET } from '@env';

const SOCKET_URL = SOCKET + '/socket.io?userId=';

// Create context
export const WebSocketContext = createContext(null);


export const WebSocketProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const userId = user?.id;
  const socketRef = useRef(null);
    const listenersRef = useRef([]); // Để lưu danh sách các listener
  
  
  useEffect(() => {
    // Kết nối WebSocket
    socketRef.current = new WebSocket(
        `${SOCKET_URL}${userId}`
    );

    socketRef.current.onopen = () => {
        console.log("WebSocket is connected");
    };

    socketRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        // Gọi tất cả các listener đã đăng ký
        listenersRef.current.forEach((listener) => listener(message));
    };

    socketRef.current.onclose = () => {
        console.log("WebSocket disconnected");
    };

    return () => {
        socketRef.current.close();
    };
}, [userId]);

// Gửi tin nhắn qua WebSocket
const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(message));
        console.log("Message sent:", message);
    }
};

const returnMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(message));
    }
};


const onMessage = (listener) => {
    listenersRef.current.push(listener);

    // Trả về hàm hủy đăng ký listener
    return () => {
        listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
};
  
  const contextValue = {
    sendMessage,
    onMessage,
    returnMessage,
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};