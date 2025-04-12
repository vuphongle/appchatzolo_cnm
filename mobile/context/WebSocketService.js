import { useEffect, useRef, useState } from "react";
import { IPV4, SOCKET } from '@env';

const SOCKET_URL = SOCKET + "/socket.io?userId=";

export const useWebSocket = (userId, receiverID) => {
  const socketRef = useRef(null);
  const listenersRef = useRef([]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const isRelevantMessage = (message) => {
    return (
      (message.senderID === userId && message.receiverID === receiverID) ||
      (message.senderID === receiverID && message.receiverID === userId)
    );
  };

  useEffect(() => {
    if (!userId) return;

    if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
      console.log("🔄 Creating new WebSocket connection");
      socketRef.current = new WebSocket(`${SOCKET_URL}${userId}`);

      socketRef.current.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
      };

      socketRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (isRelevantMessage(message)) {
          setMessages((prev) => 
            [...prev, message].sort((a, b) => 
              new Date(a.sendDate) - new Date(b.sendDate)
            )
          );
        }
        listenersRef.current.forEach((listener) => listener(message));
      };

      socketRef.current.onclose = () => {
        console.log("🔴 WebSocket disconnected");
        setIsConnected(false);
      };

      socketRef.current.onerror = (error) => {
        console.error("❌ WebSocket error", error);
        setIsConnected(false);
      };
    }

    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) {
        console.log("🔄 Attempting to reconnect WebSocket");
        socketRef.current = new WebSocket(`${SOCKET_URL}${userId}`);
      }
    }, 5000);

    return () => clearInterval(pingInterval);
  }, [userId]);

  useEffect(() => {
    if (userId && receiverID) {
      fetchChatHistory();
    }

    return () => {
      setMessages([]);
    };
  }, [userId, receiverID]);

  const sendMessage = (text) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const newMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderID: userId,
        receiverID,
        content: text,
        sendDate: new Date().toISOString(),
        isRead: false,
      };
      socketRef.current.send(JSON.stringify(newMessage));

      setMessages((prev) => 
        [...prev, newMessage].sort((a, b) => 
          new Date(a.sendDate) - new Date(b.sendDate)
        )
      );
    } else {
      console.log("⚠️ Socket not connected, attempting to reconnect");
      if (socketRef.current?.readyState === WebSocket.CLOSED) {
        socketRef.current = new WebSocket(`${SOCKET_URL}${userId}`);
      }
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${IPV4}/messages/messages?senderID=${userId}&receiverID=${receiverID}`);
      const data = await response.json();
      const filteredMessages = data.filter(isRelevantMessage);
      setMessages(filteredMessages.sort((a, b) =>
        new Date(a.sendDate) - new Date(b.sendDate)
      ));
    } catch (error) {
      console.error("❌ Lỗi tải lịch sử tin nhắn:", error);
    }
  };

  return { messages, sendMessage, isConnected };
};
