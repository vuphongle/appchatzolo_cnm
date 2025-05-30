import { useState, useEffect, useContext } from 'react';
import { WebSocketContext } from '../context/Websocket';
import { UserContext } from '../context/UserContext';

const useFriendRequestCount = (user) => {
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const { onMessage } = useContext(WebSocketContext);
  const { notification, setNotification, isChange, setIsChange,  updateInfoGroup, updateInfoMemberGroup, infoGroup } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      const unsubscribe = onMessage((message) => {
          console.log('Received message:', message);
          // kiểm tra message.type có null hay không
          if(message.type != null){
              if(message.type == 'FRIEND_REQUEST'){
                setNotification(prevCount => prevCount + 1);
              }
              if(message.type == 'REVOKE_INVITATION'){
                if(notification > 0){
                    setNotification(prevCount => prevCount - 1);
                }
              }
              if (infoGroup !== undefined) {
                if(message.type == 'GROUP_UPDATE' && message.groupId == infoGroup?.id){
                    updateInfoGroup(message.groupId);
                    updateInfoMemberGroup(message.groupId);
                }
                if(message.type == 'GROUP_UPDATE_INFO' && message.groupId == infoGroup?.id){
                    updateInfoGroup(message.groupId);
                    updateInfoMemberGroup(message.groupId);
                }
              }
              setIsChange(message.type + new Date());
          }
      });
      return () => {
        unsubscribe();
      };
    }
  }, [onMessage]);

  useEffect(() => {
      setFriendRequestsCount(notification);
  }, [notification]);

  return friendRequestsCount;
};

export default useFriendRequestCount;