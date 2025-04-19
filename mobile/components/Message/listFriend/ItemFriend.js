import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MessageService from '../../../services/MessageService'; // Import API service
import { UserContext } from '../../../context/UserContext'; // Import UserContext
import UserService from '../../../services/UserService';
import axios from 'axios';
import { formatDate } from '../../../utils/formatDate';
import { IPV4 } from '@env';
import TruncatedText from '../../../utils/TruncatedText';
import GroupService from '../../../services/GroupService'; // Import GroupService
const ItemFriend = ({ receiverID, name, avatar ,type, lastMessage,sendDate,isDeleted}) => {
  const navigation = useNavigation();
  const { user } = useContext(UserContext); // Lấy user hiện tại
  const senderID = user?.id; // ID của người dùng hiện tại
  const [lastMessages, setLastMessages] = useState('');
  const [time, setTime] = useState('');
  

  // Functions to determine message type
  const isImageMessage = (url) => url.match(/\.(jpeg|jpg|gif|png)$/) != null;
  const isFileMessage = (url) =>
    url.match(
      /\.(pdf|docx|xlsx|txt|zip|rar|mp3|mp4|pptx|csv|json|html|xml)$/,
    ) != null;

  useEffect(() => {
    const fetchLatestMessage = async () => {
      try {
       
        
        if (lastMessage.trim() !== '') {
          // Determine message type and display appropriate text
          if (isImageMessage(lastMessage)) {
            setLastMessages('Bạn đã được gửi một bức ảnh');
          } else if (isFileMessage(lastMessage)) {
            setLastMessages('Bạn đã được gửi một file');
          } else {
            setLastMessages(lastMessage);
          }

          setTime(formatDate(sendDate));
          
        } else {
          setLastMessages('Chưa có tin nhắn');
          setTime('');
        }
      } catch (error) {
        console.error('Lỗi khi lấy tin nhắn mới nhất:', error);
      }
    };

    if (senderID && receiverID) {
      fetchLatestMessage();
    }
  }, [senderID, receiverID]);

  const handleNavigateChat = async () => {
    try {


  if(type==='group'){ 

    navigation.navigate('ChatGroup', {
      receiverid: receiverID,
      name: name,
      avatar: avatar,
    });
  }
  else{
        
    navigation.navigate('Chat', {
      receiverid: receiverID,
      name: name,
      avatar: avatar,
    });
    } 
  }catch (error) {
      console.error("Lỗi khi kiểm tra  nhóm và bạn bè:", error);
      // Nếu lỗi xảy ra, vẫn cho phép điều hướng về Chat cá nhân như fallback
      navigation.navigate('Chat', {
        receiverid: receiverID,
        name: name,
        avatar: avatar,
      });
 
    }
  };
  
if (isDeleted) {
  return (
  <TouchableOpacity style={styles.itemContainer} onPress={handleNavigateChat}>
  <View style={styles.avatarContainer}>
    <Image source={{ uri: avatar }} style={styles.avatar} />
  </View>
  <View style={styles.infoContainer}>
    <Text style={styles.name}>{name}</Text>
    <TruncatedText text={"Tin nhắn đã bị xóa"} maxLength={30} />
  </View>
  <Text style={styles.time}>{time}</Text>
</TouchableOpacity>
  );
  }
  
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={handleNavigateChat}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name}</Text>
        <TruncatedText text={lastMessages} maxLength={30} />
      </View>
      <Text style={styles.time}>{time}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#888',
  },
  time: {
    fontSize: 12,
    color: '#aaa',
  },
});

export default ItemFriend;
