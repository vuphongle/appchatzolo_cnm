import { useState, useEffect, useContext } from 'react';
import { WebSocketContext } from '../context/Websocket';

const useFriendRequestCount = (user) => {
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const { onMessage } = useContext(WebSocketContext);

  useEffect(() => {
    if (user) {
      const unsubscribe = onMessage((message) => {
        setFriendRequestsCount(message.count);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [user, onMessage]);

  return friendRequestsCount;
};

export default useFriendRequestCount;
