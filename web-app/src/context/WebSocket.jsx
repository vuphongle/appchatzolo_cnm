import React, { createContext, useContext, useEffect, useRef } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, userId }) => {
  const socketRef = useRef(null);
  const listenersRef = useRef([]); // Để lưu danh sách các listener

  useEffect(() => {
    // Kết nối WebSocket
    socketRef.current = new WebSocket(
      `ws://localhost:8080/socket.io?userId=${userId}`
    );

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

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
    }
  };

  // Đăng ký lắng nghe tin nhắn
  const onMessage = (listener) => {
    listenersRef.current.push(listener);

    // Trả về hàm hủy đăng ký listener
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, onMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
