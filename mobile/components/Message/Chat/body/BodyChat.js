import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  View,Text
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MyMessageItem from './MyMessagaItem';
import MessageItem from './MessageItem';
import { useWebSocket } from '../../../../context/WebSocketService';
import { UserContext } from '../../../../context/UserContext';

const ChatScreen = ({ receiverID, name, avatar }) => {

  const { user } = useContext(UserContext);
  const userId = user?.id;

  const { messages, sendMessage } = useWebSocket(userId, receiverID);
  const scrollViewRef = useRef(null);
  const [messageText, setMessageText] = useState("");

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(messageText, receiverID);
      setMessageText("");
    }
  };
  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  let lastDate = null;
  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
          <ScrollView
        style={styles.messageContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {(Array.isArray(messages) ? messages : []).map((e, index) => {
          const isMyMessage = e.senderID === userId;
          const messageDate = new Date(e.sendDate);
          const formattedDate = messageDate.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Ho_Chi_Minh',
          });

          // Xác định tiêu đề ngày
          let showDateHeader = false;
          let headerText = formattedDate;
          if (lastDate !== formattedDate) {
            showDateHeader = true;
            headerText = formattedDate === todayFormatted ? "Hôm nay" : formattedDate;
            lastDate = formattedDate;
          }

          return (
            <View key={e.id || index}>
              {showDateHeader && (
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{headerText}</Text>
                </View>
              )}
              {isMyMessage ? (
                <MyMessageItem time={e.sendDate} message={e.content} />
              ) : (
                <MessageItem avatar={avatar} name={name} time={e.sendDate} message={e.content} />
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footerContainer}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="insert-emoticon" size={24} color="#0091ff" />
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
    width:'100%'
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
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap:10
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
});