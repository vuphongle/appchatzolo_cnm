import { useEffect } from "react";
import { SOCKET } from "@env";

const SOCKET_URL = SOCKET + "/socket.io?userId=";

export const useFriendRequestNotifications = (userId, setFriendRequestsCount) => {
  useEffect(() => {
    if (!userId) return;

    let ws;
    let reconnectTimeout;
    const reconnectInterval = 5000;

    const connect = () => {
      ws = new WebSocket(`${SOCKET_URL}${userId}`);

      ws.onopen = () => {
        console.log("✅ WebSocket connected for friend requests");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "FRIEND_REQUEST") {
            console.log("Received friend request notification:", data);
            setFriendRequestsCount(data.count);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("🔴 WebSocket disconnected. Attempting to reconnect in", reconnectInterval, "ms");
        reconnectTimeout = setTimeout(() => {
          connect();
        }, reconnectInterval);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId, setFriendRequestsCount]);
};
