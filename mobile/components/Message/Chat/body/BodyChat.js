import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Platform,
  Dimensions,
  Keyboard, 
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MyMessageItem from './MyMessagaItem';
import MessageItem from './MessageItem';
import { useWebSocket } from '../../../../context/WebSocketService';
import { UserContext } from '../../../../context/UserContext';
import EmojiSelector from '../../../../utils/EmojiSelector';
import { formatDate } from '../../../../utils/formatDate';

const ChatScreen = ({ receiverID, name, avatar }) => {
  const { user } = useContext(UserContext);
  const userId = user?.id;
  const { height: windowHeight } = Dimensions.get('window');

  const { messages, sendMessage } = useWebSocket(userId, receiverID);
  const scrollViewRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wantToShowEmojiPicker, setWantToShowEmojiPicker] = useState(false); // Thêm state mới
  
  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Xử lý sự kiện bàn phím ẩn để hiển thị emoji picker
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (wantToShowEmojiPicker) {
        setShowEmojiPicker(true);
        setWantToShowEmojiPicker(false);
      }
    });
    return () => {
      keyboardDidHideListener.remove();
    };
  }, [wantToShowEmojiPicker]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(messageText, receiverID);
      setMessageText('');
    }
  };

  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const handleEmojiSelect = (emoji) => {
    setMessageText((prevText) => prevText + emoji);
  };
  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    } else {
      Keyboard.dismiss();
      setTimeout(() => setShowEmojiPicker(true), 100); 
    }
  };
 
  const validMessages = Array.isArray(messages) ? messages.filter(msg => {

    return msg && msg.sendDate && !isNaN(new Date(msg.sendDate).getTime());
  }) : [];


  const sortedMessages = [...validMessages].sort((a, b) => 
    new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime()
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.messageContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }}
      >
      {(() => {
            let lastDate = null;
            return sortedMessages.map((message, index) => {
              const isMyMessage = message.senderID === userId;
              const messageDate = new Date(message.sendDate);
              const formattedDate = messageDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'Asia/Ho_Chi_Minh',
              });

              let showDateHeader = false;
              if (lastDate !== formattedDate) {
                showDateHeader = true;
                lastDate = formattedDate;
              }
        
              const headerText = formattedDate === todayFormatted ? "Hôm nay" : formattedDate;
              
              return (
                <View key={message.id || `msg-${index}`}>
              {showDateHeader && (
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{headerText}</Text>
                </View>
              )}
              {isMyMessage ? (
              <MyMessageItem time={formatDate(message.sendDate)} message={message.content} />
              ) : (
                <MessageItem avatar={avatar} name={name} time={formattedDate ? formatDate(message.sendDate) : ""} message={message.content} />
              )}
            </View>
              );
            });
        })}
      </ScrollView>
      <View style={styles.footerContainer}>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={toggleEmojiPicker}>
            <MaterialIcons name="insert-emoticon" size={24} color="#0091ff" />
          </TouchableOpacity>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            style={styles.inputMessage}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#999"
            onSubmitEditing={handleSendMessage}
          />
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity>
            <MaterialIcons name="keyboard-voice" size={24} color="#0091ff" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SimpleLineIcons name="picture" size={24} color="#0091ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSendMessage}>
            <Ionicons name="send-outline" size={24} color="#0091ff" />
          </TouchableOpacity>
        </View>
      </View>
      {showEmojiPicker && ( 
        <View style={{ height: 350, overflow: 'hidden' }}>
          <EmojiSelector
            onEmojiSelected={handleEmojiSelect}
            showSearchBar={false}
            columns={8}
            showTabs={true}
            showHistory={true}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  messageContainer: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  inputMessage: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 10,
  },
  dateHeader: {
    alignSelf: 'center',
    backgroundColor: '#e0e0e0',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#555',
  },
  emojiPickerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
});