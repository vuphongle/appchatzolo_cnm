import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { formatDate } from '../../../../utils/formatDate';

function MyMessageItem({ time, message, receiverID, isRead }) {
  const [messIndex, setMessIndex] = useState(message);
  const [emojiIndex, setEmojiIndex] = useState(null);
  const [StatusRead, setStatusRead] = useState(false);

  // Kiểm tra xem tin nhắn có phải là ảnh hay không
  const isImageMessage = (url) =>
    url && url.match(/\.(jpeg|jpg|gif|png)$/) != null;

  // Kiểm tra xem tin nhắn có phải là URL của file hay không
  const isFileMessage = (url) =>
    url &&
    url.match(
      /\.(pdf|docx|xlsx|txt|zip|rar|mp3|mp4|pptx|csv|json|html|xml)$/,
    ) != null;

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

  // Hàm gỡ tin nhắn
  const handleUnsendMessage = () => {
    setMessIndex('Tin nhắn đã được gỡ');
    setTypeIndex('unsend');
  };

  // Hiển thị thông báo khi nhấn giữ tin nhắn
  const handleLongPress = () => {
    Alert.alert('Thông báo', 'Bạn muốn xóa tin nhắn này?', [
      { text: 'Thoát', style: 'cancel' },
      { text: 'Xóa', onPress: handleUnsendMessage },
    ]);
  };

  // Hiển thị danh sách emoji
  const handlePressIcon = () => {
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
            onPress={handlePressIcon}
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
        {/* {isRead !== undefined ? (
          isRead ? (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Đã xem</Text>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>✔✔ Đã gửi</Text>
            </View>
          )
        ) : null} */}
      </View>
    </View>
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
    borderRadius: 10,
    backgroundColor: 'lightgray',
    padding: 5,
    marginTop: 5,
    width: 80,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MyMessageItem;
