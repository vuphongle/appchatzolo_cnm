import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IPV4 } from '@env';
const SOCKET_URL = "ws://192.168.100.52:8080/socket.io?userId=";

export const useWebSocket = (userId, receiverID) => {
  const socketRef = useRef(null);
  const listenersRef = useRef([]);
  const [messages, setMessages] = useState([]);
  const [isHistoryFetched, setIsHistoryFetched] = useState(false);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = new WebSocket(`${SOCKET_URL}${userId}`);

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };
  
    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
      saveMessageToLocal(message);
      listenersRef.current.forEach((listener) => listener(message));
    };

    socketRef.current.onclose = () => console.log("🔴 WebSocket disconnected");
    socketRef.current.onerror = (error) => console.error("❌ WebSocket error", error);

    return () => socketRef.current?.close();
  }, [userId]);

  useEffect(() => {
    if (!isHistoryFetched && userId && receiverID) {
      fetchChatHistory();
      setIsHistoryFetched(true);
    }
  }, [isHistoryFetched, userId, receiverID]);

  const sendMessage = (text, receiverID) => {
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
      setMessages((prev) => [...prev, newMessage].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
      saveMessageToLocal(newMessage);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${IPV4}/messages/messages?senderID=${userId}&receiverID=${receiverID}`);
      const data = await response.json();
      setMessages(data.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
    } catch (error) {
      console.error("❌ Lỗi tải lịch sử tin nhắn:", error);
    }
  };

  const saveMessageToLocal = async (message) => {
    try {
      const storedMessages = JSON.parse(await AsyncStorage.getItem("chatHistory")) || [];
      const updatedMessages = [...storedMessages, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));
      await AsyncStorage.setItem("chatHistory", JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const storedMessages = JSON.parse(await AsyncStorage.getItem("chatHistory")) || [];
      setMessages(storedMessages.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  return { messages, sendMessage };
};
