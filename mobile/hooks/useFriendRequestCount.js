import { useState, useEffect, useContext } from 'react';
import { WebSocketContext } from '../context/Websocket';
import { UserContext } from '../context/UserContext';

const useFriendRequestCount = (user) => {
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [step, setStep] = useState(0);
  const { onMessage } = useContext(WebSocketContext);
  const { notification, setNotification } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      const unsubscribe = onMessage((message) => {
          console.log('Received message:', message);
          if(message.type == 'FRIEND_REQUEST'){
            setNotification(prevCount => prevCount + 1);
          }
          if(message.type == 'REVOKE_INVITATION'){
            if(notification > 0){
                setNotification(prevCount => prevCount - 1);
            }
          }
      });
      return () => {
        unsubscribe();
      };
    }
  }, [user, onMessage]);

  useEffect(() => {
      setFriendRequestsCount(notification);
  }, [notification]);

  return friendRequestsCount;
};

export default useFriendRequestCount;
