import React, { useState } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

function MyMessageItem({ time, message, type, emoji }) {
  const [messIndex, setMessIndex] = useState(message);
  const [typeIndex, setTypeIndex] = useState(type);
  const [emojiIndex, setEmojiIndex] = useState(emoji);

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
              typeIndex === 'image' && styles.imageMessage,
            ]}
            onLongPress={handleLongPress}
            onPress={handlePressIcon}>
            {typeIndex === 'image' ? (
              <Image
                style={styles.image}
                source={{
                  uri: 'https://i.pinimg.com/236x/85/40/33/854033242929cb15cd206e07b3981d58.jpg',
                }}
              />
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
      </View>
    </View>
  );
}

export default MyMessageItem;

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
  imageMessage: {
    padding: 0,
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
  emojiContainer: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 20,
  },
});
