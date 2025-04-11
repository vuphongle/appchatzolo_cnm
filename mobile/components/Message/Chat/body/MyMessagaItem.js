import React, { useState } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { formatDate } from '../../../../utils/formatDate';
import MessageService from '../../../../services/MessageService';
import ForwardMessageModal from '../ForwardMessageModal';

function MyMessageItem({ messageId, userId, receiverId, time, message,showForwardRecall = true }) {
  const [messIndex, setMessIndex] = useState(message);
  const [emojiIndex, setEmojiIndex] = useState(null);
  const [isRecalled, setIsRecalled] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);

  // Kiểm tra xem tin nhắn có phải là ảnh hay không
  const isImageMessage = (url) =>
    url && url.match(/\.(jpeg|jpg|gif|png)$/) != null;

  // Kiểm tra xem tin nhắn có phải là URL của file hay không
  const isFileMessage = (url) => {
    const extRegex = /\.(pdf|docx|xlsx|txt|zip|rar|mp3|mp4|pptx|csv|json|html|xml)$/i;
    const s3FileRegex = /^https:\/\/nhom3-cmn-chatappzolo-s3\.s3\.amazonaws\.com\/file/;
    return url && (extRegex.test(url) || s3FileRegex.test(url));
  };
  

  // Xác định loại tin nhắn
  const [typeIndex, setTypeIndex] = useState(() => {
    if (isImageMessage(message)) return 'image';
    if (isFileMessage(message)) return 'file';
    return 'text';
  });

  // Hàm phản ứng emoji
  const reactMessage = (reaction) => {
    setEmojiIndex(reaction);
  };

  // Xác định loại tin nhắn hiện tại (cho modal chuyển tiếp)
  const type = isRecalled ? 'unsend' : 
               isImageMessage(messIndex) ? 'image' :
               isFileMessage(messIndex) ? 'file' : 'text';

  // Hàm thu hồi tin nhắn
  const recallMessage = async () => {
    try {
      await MessageService.recallMessage(messageId, userId, receiverId);
      setMessIndex('Tin nhắn đã thu hồi');
      setTypeIndex('unsend');
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

  // Hiển thị menu tùy chọn khi nhấn giữ tin nhắn
  const handleLongPress = () => {
    // Nếu tin nhắn đã thu hồi, không hiển thị menu
    if (!showForwardRecall) return;

    const options = [
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

  // Hiển thị danh sách emoji
  const handlePressIcon = () => {
    // Nếu tin nhắn đã thu hồi, không hiển thị emoji
    if (isRecalled) return;

    Alert.alert('Chọn cảm xúc của bạn:', '', [
      { text: '❤', onPress: () => reactMessage('❤') },
      { text: '👍', onPress: () => reactMessage('👍') },
      { text: '😀', onPress: () => reactMessage('😀') },
      { text: '😭', onPress: () => reactMessage('😭') },
      { text: '😡', onPress: () => reactMessage('😡') },
      { text: 'Thoát', style: 'cancel' },
    ]);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          {/* Tin nhắn */}
          {typeIndex === 'unsend' ? (
            <View style={styles.unsendMessage}>
              <Text style={styles.unsendText}>{messIndex}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.messageBox,
                (typeIndex === 'image' || typeIndex === 'file') &&
                  styles.mediaMessage,
              ]}
              onLongPress={handleLongPress}
              // onPress={handlePressIcon}
            >
              {typeIndex === 'image' ? (
                <Image style={styles.image} source={{ uri: messIndex }} />
              ) : typeIndex === 'file' ? (
                <View style={styles.fileContainer}>
                  <Text style={styles.fileIcon}>📎</Text>
                  <Text style={styles.fileText}>
                    {messIndex.split('/').pop()}
                  </Text>
                </View>
              ) : (
                <Text style={styles.messageText}>{messIndex}</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Thời gian */}
          <Text style={styles.time}>{time}</Text>

          {/* Emoji */}
          {emojiIndex && (
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{emojiIndex}</Text>
            </View>
          )}

          {/* Trạng thái đọc */}
          {/* {isRead !== undefined && !isRecalled ? (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {isRead ? "Đã xem" : "✔✔ Đã gửi"}
              </Text>
            </View>
          ) : null} */}
        </View>
      </View>

      {/* Modal chuyển tiếp tin nhắn */}
      <ForwardMessageModal
        visible={forwardModalVisible}
        onClose={() => setForwardModalVisible(false)}
        originalMessageId={messageId}
        senderID={userId}
        message={messIndex}
        type={type}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 10,
    marginRight: 10,
  },
  messageContainer: {
    alignItems: 'flex-end',
    maxWidth: '75%',
  },
  messageBox: {
    backgroundColor: '#e0f7fa',
    padding: 10,
    borderRadius: 15,
    marginBottom: 5,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  mediaMessage: {
    padding: 0,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  unsendMessage: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 15,
    marginBottom: 5,
  },
  unsendText: {
    fontSize: 15,
    color: '#aaa',
    fontStyle: 'italic',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  fileIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  fileText: {
    fontSize: 14,
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  emojiContainer: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 20,
  },
  statusContainer: {
    marginTop: 5,
  },
  statusText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
  },
});

export default MyMessageItem;