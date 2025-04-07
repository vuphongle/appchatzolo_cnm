// import { useEffect, useRef, useState } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { IPV4, SOCKET } from '@env';
// const SOCKET_URL = SOCKET + '/socket.io?userId=';

// export const useWebSocket = (userId, receiverID) => {
//   const socketRef = useRef(null);
//   const listenersRef = useRef([]);
//   const [messages, setMessages] = useState([]);
//   const [isHistoryFetched, setIsHistoryFetched] = useState(false);
//   // Kiểm tra xem tin nhắn có liên quan đến cuộc trò chuyện hiện tại không
//   const isRelevantMessage = (message) => {
//     return (
//       (message.senderID === userId && message.receiverID === receiverID) ||
//       (message.senderID === receiverID && message.receiverID === userId)
//     );
//   };
//   useEffect(() => {
//     if (!userId) return;

//     socketRef.current = new WebSocket(`${SOCKET_URL}${userId}`);

//     socketRef.current.onopen = () => {
//       console.log('✅ WebSocket connected');
//     };

//     socketRef.current.onmessage = (event) => {
//       const message = JSON.parse(event.data);
//       if (isRelevantMessage(message)) {
//         setMessages((prev) =>
//           [...prev, message].sort(
//             (a, b) => new Date(a.sendDate) - new Date(b.sendDate),
//           ),
//         );
//         saveMessageToLocal(message);
//       }
//       listenersRef.current.forEach((listener) => listener(message));
//     };

//     socketRef.current.onclose = () => console.log('🔴 WebSocket disconnected');
//     socketRef.current.onerror = (error) =>
//       console.error('❌ WebSocket error', error);

//     return () => socketRef.current?.close();
//   }, [userId]);

//   useEffect(() => {
//     if (!isHistoryFetched && userId && receiverID) {
//       fetchChatHistory();
//       setIsHistoryFetched(true);
//     }
//   }, [isHistoryFetched, userId, receiverID]);

//   const sendMessage = (text, receiverID) => {
//     if (socketRef.current?.readyState === WebSocket.OPEN) {
//       const newMessage = {
//         id: Math.random().toString(36).substr(2, 9),
//         senderID: userId,
//         receiverID,
//         content: text,
//         sendDate: new Date().toISOString(),
//         isRead: false,
//       };
//       socketRef.current.send(JSON.stringify(newMessage));

//       if (receiverID === receiverID) {
//         setMessages((prev) =>
//           [...prev, newMessage].sort(
//             (a, b) => new Date(a.sendDate) - new Date(b.sendDate),
//           ),
//         );
//       }
//       saveMessageToLocal(newMessage);
//     }
//   };

//   const fetchChatHistory = async () => {
//     try {
//       const response = await fetch(
//         `${IPV4}/messages/messages?senderID=${userId}&receiverID=${receiverID}`,
//       );
//       const data = await response.json();
//       const filteredMessages = data.filter(isRelevantMessage);
//       setMessages(
//         filteredMessages.sort(
//           (a, b) => new Date(a.sendDate) - new Date(b.sendDate),
//         ),
//       );
//     } catch (error) {
//       console.error('❌ Lỗi tải lịch sử tin nhắn:', error);
//     }
//   };

//   const saveMessageToLocal = async (message) => {
//     try {
//       const storedMessages =
//         JSON.parse(await AsyncStorage.getItem('chatHistory')) || [];
//       const updatedMessages = [...storedMessages, message].sort(
//         (a, b) => new Date(a.sendDate) - new Date(b.sendDate),
//       );
//       await AsyncStorage.setItem(
//         'chatHistory',
//         JSON.stringify(updatedMessages),
//       );
//     } catch (error) {
//       console.error('Error saving message:', error);
//     }
//   };

//   // Load tin nhắn từ AsyncStorage
//   const loadChatHistory = async () => {
//     try {
//       const storedMessages =
//         JSON.parse(await AsyncStorage.getItem('chatHistory')) || [];

//       // Lọc các tin nhắn liên quan đến cuộc trò chuyện hiện tại
//       const relevantMessages = storedMessages.filter(isRelevantMessage);

//       setMessages(
//         relevantMessages.sort(
//           (a, b) => new Date(a.sendDate) - new Date(b.sendDate),
//         ),
//       );
//     } catch (error) {
//       console.error('Error loading chat history:', error);
//     }
//   };

//   return { messages, sendMessage };
// };
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IPV4, SOCKET } from '@env';
const SOCKET_URL = SOCKET+"/socket.io?userId=";

export const useWebSocket = (userId, receiverID) => {
  const socketRef = useRef(null);
  const listenersRef = useRef([]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHistoryFetched, setIsHistoryFetched] = useState(false);

  // Kiểm tra xem tin nhắn có liên quan đến cuộc trò chuyện hiện tại không
  const isRelevantMessage = (message) => {
    return (
      (message.senderID === userId && message.receiverID === receiverID) ||
      (message.senderID === receiverID && message.receiverID === userId)
    );
  };

  // Establish WebSocket connection once when userId is available
  useEffect(() => {
    if (!userId) return;

    // Only create a new connection if one doesn't already exist
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
          saveMessageToLocal(message);
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

    // Implement reconnection logic
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) {
        console.log("🔄 Attempting to reconnect WebSocket");
        socketRef.current = new WebSocket(`${SOCKET_URL}${userId}`);
      }
    }, 5000); // Check every 5 seconds

    // Cleanup function that only runs when component unmounts completely
    return () => {
      clearInterval(pingInterval);
      // Don't close the socket on receiverID change, only on full unmount
    };
  }, [userId]); // Only depend on userId, not receiverID

  // Fetch chat history when receiverID changes
  useEffect(() => {
    if (userId && receiverID) {
      fetchChatHistory();
      setIsHistoryFetched(true);
    }
    
    return () => {
      // Reset messages when changing conversations
      setMessages([]);
      setIsHistoryFetched(false);
    };
  }, [userId, receiverID]);

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

      if (receiverID === receiverID) {
        setMessages((prev) => 
          [...prev, newMessage].sort((a, b) => 
            new Date(a.sendDate) - new Date(b.sendDate)
          )
        );
      }
      saveMessageToLocal(newMessage);
    } else {
      console.log("⚠️ Socket not connected, attempting to reconnect");
      // Attempt to reconnect
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
      // Fallback to local storage if server request fails
      loadChatHistory();
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

  // Load tin nhắn từ AsyncStorage
  const loadChatHistory = async () => {
    try {
      const storedMessages = JSON.parse(await AsyncStorage.getItem("chatHistory")) || [];
      
      // Lọc các tin nhắn liên quan đến cuộc trò chuyện hiện tại
      const relevantMessages = storedMessages.filter(isRelevantMessage);
      
      setMessages(relevantMessages.sort((a, b) => 
        new Date(a.sendDate) - new Date(b.sendDate)
      ));
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  return { messages, sendMessage, isConnected };
};