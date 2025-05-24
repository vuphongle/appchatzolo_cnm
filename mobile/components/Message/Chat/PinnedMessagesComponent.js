import React, { useState, useMemo, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { formatDate } from '../../../utils/formatDate';
import MessageService from '../../../services/MessageService';
import { UserContext } from '../../../context/UserContext';
import { WebSocketContext } from '../../../context/Websocket';
import UserService from '../../../services/UserService';


const PinnedMessagesComponent = ({
  userId,
  receiverId,
  messageshistory,
  receiverName,
  
}) => {
    
  const [isExpanded, setIsExpanded] = useState(false);
  const [localMessagesHistory, setLocalMessagesHistory] = useState(messageshistory || []);
  const {isChange,setIsChange} = useContext(UserContext);
  const { sendMessage, onMessage } = useContext(WebSocketContext);

  // Cập nhật localMessagesHistory khi messageshistory thay đổi từ props
  useEffect(() => {
    fetchMessages();
  }, [messageshistory]);
useEffect(() => {
 if (typeof isChange === 'string') {
         if(isChange.startsWith('PIN_MESSAGE')|| isChange.startsWith('UNPIN_MESSAGE')) {
         
             fetchMessages();
         }
       }
}, [isChange]);
  // Lắng nghe WebSocket để cập nhật tin nhắn được ghim mới
 
  const fetchMessages = async () => {
      if (!userId || !receiverId) return;
      
      try {
        const response = await MessageService.get(
          `/messages/messages?senderID=${userId}&receiverID=${receiverId}`
        );
        
        if (response && Array.isArray(response)) {
        
          const sortedMessages = response.filter(message => message.pinned === true);
          
          setLocalMessagesHistory(sortedMessages);
        } else {
         
          setLocalMessagesHistory([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
       
      }
    };
  // Lọc chỉ những tin nhắn có pinned: true từ localMessagesHistory
  // const actualPinnedMessages = useMemo(() => {
  //   if (!localMessagesHistory || !Array.isArray(localMessagesHistory)) {
  //     return [];
  //   }
  //   return localMessagesHistory.filter(message => message.pinned === true);
  // }, [localMessagesHistory]);

  // Trả về null nếu không có tin nhắn nào được ghim thực sự
  if (!localMessagesHistory || localMessagesHistory.length === 0) {
    return null;
  }
  
  const handleNotifiMessageGroup = (mess) => {
    const ContentMessage = {
      id: `file_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      senderID: userId,
      receiverID: receiverId,
      content: mess,
      sendDate: new Date().toISOString(),
      isRead: false,
      type: 'PRIVATE_CHAT',
      status: 'Notification',
    };
    sendMessage(ContentMessage);
    console.log('sendMessage', ContentMessage);
  }

  // Hàm xử lý bỏ ghim tin nhắn
  const handleUnpinMessage = async (messageId, content, userId) => {
    try {
    
      
      const response = await MessageService.UnpinMessageByUserId(messageId, userId);
      const user = await UserService.getUserById(userId);
      setIsChange("UNPIN_MESSAGE");
      
      if (response.success) {
        Alert.alert(
          'Thành công',
          'Tin nhắn đã được bỏ ghim thành công.',
        );
        
        // Gửi thông báo về việc bỏ ghim
        handleNotifiMessageGroup(`${user.name} đã bỏ ghim tin nhắn "${content}"`);
        
        // Cập nhật local state
        setLocalMessagesHistory(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === messageId) {
              return { ...msg, pinned: false };
            }
            return msg;
          });
        });
        
      
        
      } else {
        Alert.alert(
          'Lỗi',
          `Không thể bỏ ghim tin nhắn. Vui lòng thử lại sau.`,
        );
      }

    } catch (error) {
      console.error('Error unpinning message:', error);
      Alert.alert(
        'Lỗi',
        'Đã xảy ra lỗi khi bỏ ghim tin nhắn.',
      );
    }
  };
    
  const renderMessageContent = (message) => {
    const messageType = message.type || 'text';
    
    switch (messageType) {
      case 'image':
        return (
          <View style={styles.mediaContent}>
            <MaterialIcons name="image" size={16} color="#666" />
            <Text style={styles.mediaText}>Hình ảnh</Text>
          </View>
        );
      case 'audio':
        return (
          <View style={styles.mediaContent}>
            <MaterialIcons name="mic" size={16} color="#666" />
            <Text style={styles.mediaText}>Tin nhắn thoại</Text>
          </View>
        );
      case 'file':
        return (
          <View style={styles.mediaContent}>
            <MaterialIcons name="description" size={16} color="#666" />
            <Text style={styles.mediaText}>Tệp đính kèm</Text>
          </View>
        );
      default:
        return (
          <Text style={styles.messageText} numberOfLines={2}>
            {message.content || 'Tin nhắn'}
          </Text>
        );
    }
  };

  const renderPinnedMessage = ({ item, index }) => {
    const isMyMessage = item.senderID === userId;
    
    return (
      <TouchableOpacity
        style={[
          styles.pinnedMessageItem,
          index === localMessagesHistory.length - 1 && styles.lastPinnedMessage
        ]}
        onPress={() => onMessagePress?.(item)}
      >
        <View style={styles.pinnedMessageContent}>
          <View style={styles.messageHeader}>
            <MaterialIcons name="push-pin" size={12} color="#0091ff" />
            <Text style={styles.senderName}>
              {isMyMessage ? 'Bạn' : receiverName || 'Người khác'}
            </Text>
            <Text style={styles.messageTime}>
              {formatDate(item.sendDate)}
            </Text>
          </View>
          <View style={styles.messageBody}>
            {renderMessageContent(item)}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.unpinButton}
          onPress={() => handleUnpinMessage(item.id, item.content, userId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={16} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.pinIconContainer}>
            <MaterialIcons name="push-pin" size={18} color="#0091ff" />
          </View>
          <Text style={styles.headerTitle}>
            Tin nhắn đã ghim
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{localMessagesHistory.length}</Text>
          </View>
        </View>
        <MaterialIcons 
          name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.messagesContainer}>
          <FlatList
            data={localMessagesHistory}
            renderItem={renderPinnedMessage}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={localMessagesHistory.length > 3}
            maxHeight={240}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafbfc',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 145, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#0091ff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  messagesContainer: {
    backgroundColor: '#ffffff',
  },
  pinnedMessageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  lastPinnedMessage: {
    borderBottomWidth: 0,
  },
  pinnedMessageContent: {
    flex: 1,
    marginRight: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0091ff',
    marginLeft: 6,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  messageBody: {
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  mediaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  unpinButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default PinnedMessagesComponent;