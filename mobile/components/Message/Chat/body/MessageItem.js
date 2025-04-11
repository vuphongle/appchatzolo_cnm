import React, { useState } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import MessageService from '../../../../services/MessageService';
import { formatDate } from '../../../../utils/formatDate';
import ForwardMessageModal from '../ForwardMessageModal'; // Import the modal component

function MessageItem({ avatar, time, message, messageId, userId, receiverId, showForwardRecall = true }) {
  const navigation = useNavigation();
  const [emojiIndex, setEmojiIndex] = useState(null);
  const [StatusRead, setStatusRead] = useState(false);
  const [isRecalled, setIsRecalled] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  
  const messageTime = moment(time);
  const displayTime = messageTime.isValid()
    ? messageTime.format("HH:mm")
    : moment().format("HH:mm");

  // Kiểm tra xem tin nhắn có phải là ảnh hay không
  const isImageMessage = (url) => {
    if (typeof url !== 'string') return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
  };

  // Kiểm tra xem tin nhắn có phải là URL của file hay không (bao gồm nhiều đuôi file)
  const isFileMessage = (url) => {
    const extRegex = /\.(pdf|docx|xlsx|txt|zip|rar|mp3|mp4|pptx|csv|json|html|xml)$/i;
    const s3FileRegex = /^https:\/\/nhom3-cmn-chatappzolo-s3\.s3\.amazonaws\.com\/file/;
    return url && (extRegex.test(url) || s3FileRegex.test(url));
  };
  

  // Xác định loại tin nhắn
  const type = isRecalled ? 'unsend' : 
               isImageMessage(message) ? 'image' :
               isFileMessage(message) ? 'file' : 'text';

  // Hàm xử lý nhấn vào ảnh
  const handlePressImage = () => {
    navigation.navigate('ImageChat', {
      avatar,
      image: message,
    });
  };

  // Hàm thu hồi tin nhắn
  const recallMessage = async () => {
    try {
      await MessageService.recallMessage(messageId, userId, receiverId);
      setIsRecalled(true);
    } catch (error) {
      console.error('Lỗi khi thu hồi tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn. Vui lòng thử lại sau.');
    }
  };

  // Hàm hiển thị modal chuyển tiếp tin nhắn
  const forwardMessage = () => {
    setForwardModalVisible(true);
  };

  // Hàm phản ứng emoji
  const reactMessage = (reaction) => {
    setEmojiIndex(reaction);
  };

  // Hiển thị menu tùy chọn khi nhấn giữ
  const handleLongPress = () => {
    if (!showForwardRecall) return;
    
    const options = [
      // { text: '❤', onPress: () => reactMessage('❤') },
      // { text: '👍', onPress: () => reactMessage('👍') },
      // { text: '😀', onPress: () => reactMessage('😀') },
      // { text: '😭', onPress: () => reactMessage('😭') },
      // { text: '😡', onPress: () => reactMessage('😡') },
      { text: 'Chuyển tiếp', onPress: forwardMessage },
      { text: 'Thu hồi', onPress: () => {
        Alert.alert(
          'Thu hồi tin nhắn',
          'Bạn có chắc chắn muốn thu hồi tin nhắn này?',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Thu hồi', onPress: recallMessage, style: 'destructive' }
          ]
        );
      }}
    ];

    // Hiển thị Alert với các tùy chọn
    Alert.alert('Tùy chọn tin nhắn', '', options.map(option => ({
      text: option.text,
      onPress: option.onPress,
      style: option.style
    })));
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <Image style={styles.avatar} source={{ uri: avatar }} />
        </View>
        <View style={styles.messageContainer}>
          {/* Nội dung tin nhắn */}
          <TouchableOpacity
            onLongPress={handleLongPress}
            style={[styles.messageBox, type === 'image' && styles.imageMessage]}
          >
            {type === 'image' ? (
              <TouchableOpacity onPress={handlePressImage}>
                <Image style={styles.image} source={{ uri: message }} />
              </TouchableOpacity>
            ) : type === 'file' ? (
              <View style={styles.fileContainer}>
                <Text style={styles.fileText}>📎 {message.split('/').pop()}</Text>
              </View>
            ) : type === 'unsend' ? (
              <Text style={styles.unsendText}>Tin nhắn đã thu hồi</Text>
            ) : (
              <Text style={styles.messageText}>{message}</Text>
            )}
          </TouchableOpacity>

          {/* Thời gian tin nhắn */}
          <Text style={styles.time}>{displayTime}</Text>

          {/* Emoji phản ứng */}
          {emojiIndex && (
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{emojiIndex}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Modal chuyển tiếp tin nhắn */}
      <ForwardMessageModal
        visible={forwardModalVisible}
        onClose={() => setForwardModalVisible(false)}
        originalMessageId={messageId}
        senderID={userId}
        message={message}
        type={type}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  messageContainer: {
    flexDirection: 'column',
    maxWidth: '65%',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    position: 'relative',
  },
  avatarContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: 5,
    marginTop: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageBox: {
    backgroundColor: '#e0f7fa',
    padding: 5,
    borderRadius: 15,
    marginBottom: 5,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 10,
  },
  imageMessage: {
    padding: 0,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileText: {
    fontSize: 14,
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  unsendText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  time: {
    fontSize: 10,
    color: '#C9D5D5',
    textAlign: 'left',
  },
  emojiContainer: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 20,
    color: '#ff6347',
  },
});

export default MessageItem;