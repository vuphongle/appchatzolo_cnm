import React, { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

function MessageItem({ avatar, name, time, message, type, emoji }) {
  const navigation = useNavigation();
  const [emojiIndex, setEmojiIndex] = useState(emoji);
const [typeIndex, setTypeIndex] = useState(type);
  // Hàm xử lý nhấn vào ảnh
  const handlePressImage = () => {
    navigation.navigate('ImageChat', {
      avatar,
      name,
      image: message,
    });
  };

  // Hàm phản ứng emoji
  const reactMessage = (reaction) => {
    setEmojiIndex(reaction);
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
     <View style={styles.avatarContainer}>
        <Image style={styles.avatar} source={{ uri: avatar }} />
      </View>
      <View style={styles.messageContainer}>
  
        
       

        {/* Nội dung tin nhắn */}
        <TouchableOpacity onLongPress={handlePressIcon}    style={[
              styles.messageBox,
              typeIndex === 'image' && styles.imageMessage,
            ]}>
          {type === 'image' ? (
            <TouchableOpacity onPress={handlePressImage}>
              <Image style={styles.image} source={{ uri: message }} />
            </TouchableOpacity>
          ) : type === 'unsend' ? (
            <Text style={styles.unsendText}>Tin nhắn đã thu hồi</Text>
          ) : (
            <Text style={styles.messageText}>{message}</Text>
          )}
        </TouchableOpacity>

        {/* Thời gian tin nhắn */}
        <Text style={styles.time}>{time}</Text>

        {/* Emoji phản ứng */}
        {emojiIndex && (
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emojiIndex}</Text>
          </View>
        )}
      </View>
     
    </View>
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
    maxWidth: '75%',
    // backgroundColor: '#f0f8ff',
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
    padding: 10,
    borderRadius: 15,
    marginBottom: 5,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  name: {
    fontSize: 16,
    color: '#1f65b0',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 10,
  },
  imageMessage: {
    padding: 0,
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
    textAlign: 'right',
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
