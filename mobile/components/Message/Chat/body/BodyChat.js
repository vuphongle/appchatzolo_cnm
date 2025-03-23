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
  PermissionsAndroid
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
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import MessageService from '../../../../services/MessageService';
import S3Service from '../../../../services/S3Service';
import moment from 'moment';
const ChatScreen = ({ receiverID, name, avatar }) => {
  const { user } = useContext(UserContext);
  const userId = user?.id;
  const { height: windowHeight } = Dimensions.get('window');
  const [selectedImages, setSelectedImages] = useState([]); // Lưu trữ các ảnh đã chọn
  const [selectedFiles, setSelectedFiles] = useState([]); // Lưu trữ các file đã chọn
  
  const { messages, sendMessage } = useWebSocket(userId, receiverID);
  const scrollViewRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wantToShowEmojiPicker, setWantToShowEmojiPicker] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  useEffect(() => {
    if (!userId || !receiverID) return;

    // Lấy tất cả tin nhắn giữa người gửi và người nhận
    MessageService.get(`/messages/messages?senderID=${userId}&receiverID=${receiverID}`)
        .then((data) => {
            // Sắp xếp tin nhắn theo thời gian từ cũ đến mới
            const sortedMessages = data.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));

            // Cộng 7 giờ vào sendDate của mỗi tin nhắn
            const updatedMessages = sortedMessages.map((msg) => ({
                ...msg,
                sendDate: moment(msg.sendDate).add(7, 'hours').format("YYYY-MM-DDTHH:mm:ssZ") // Cộng 7 giờ vào sendDate
            }));

            // Lọc các tin nhắn chưa đọc
            const unreadMessages = updatedMessages.filter((msg) => msg.isRead === false);

            // Nếu có tin nhắn chưa đọc, gọi API để đánh dấu là đã đọc
            if (unreadMessages.length > 0) {
                // Gửi yêu cầu PUT để đánh dấu tin nhắn là đã đọc
                MessageService.savereadMessages(userId, receiverID)
                    .catch((error) => {
                        console.error("Lỗi khi đánh dấu tin nhắn là đã đọc", error);
                    });
            } else {
                console.log("Không có tin nhắn chưa đọc");
            }
        })
        .catch((err) => {
            console.error("Error fetching messages:", err);
        });
}, [receiverID,userId]);

  useEffect(() => {
    if (scrollViewRef.current) {
      // Add a small delay to ensure the message is rendered before scrolling
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  const handleImageUpload = async () => {
    // Kiểm tra quyền trước khi mở thư viện ảnh
    if (isMounted) {
   
    const options = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    };
    
    try {
      const response = await launchImageLibrary(options);
      
      if (response.didCancel) {
        console.log('Người dùng đã hủy chọn ảnh');
      } else if (response.errorCode) {
        console.log('Lỗi chọn ảnh: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedAsset = response.assets[0];
        const fileName = selectedAsset.fileName || selectedAsset.uri.split('/').pop();
        
        setMessageText(messageText + " " + fileName);
        setSelectedImages((prevFiles) => [...prevFiles, selectedAsset]);
      }
    } catch (error) {
      console.log('Lỗi xử lý chọn ảnh:', error);
    }
  }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      
      // DocumentPicker.pick có thể trả về một mảng trong các phiên bản mới
      const file = Array.isArray(result) ? result[0] : result;
      
      setMessageText(messageText + " " + file.name);
      setSelectedFiles((prevFiles) => [...prevFiles, file]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // Người dùng đã hủy việc chọn file
        console.log('User cancelled file picker');
      } else {
        console.log('Error picking document:', err);
      }
    }
  };
  // Handle keyboard hide to show emoji picker
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

  const handleSendMessage = async () => {
    if (messageText.trim() === "" && selectedFiles.length === 0 && selectedImages.length === 0) return; // Don't send if no content and no files
    
    // Handle selected images
    if (selectedImages.length > 0) {
      try {
        const uploadedImages = [];
        // Upload all images
        for (let file of selectedImages) {
          const fileUrl = await S3Service.uploadImage(file); // Upload image to S3
          uploadedImages.push(fileUrl);
        }
        
        // Send message for each image
        for (let url of uploadedImages) {
          const message = {
            id: new Date().getTime().toString(),
            senderID: userId,
            receiverID: receiverID,
            content: url, // Content is the URL of the uploaded image
            sendDate: new Date().toISOString(),
            isRead: false,
          };
          
          // Send message through WebSocket or your API
          sendMessage(message.content, receiverID);
     
          setChatMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
        }
        setSelectedImages([]); // Reset images
      } catch (error) {
        console.error("Upload image failed", error);
        return;
      }
    }
    
    // Handle selected files
    if (selectedFiles.length > 0) {
      try {
        const uploadedFiles = [];
        // Upload all files
        for (let file of selectedFiles) {
          const fileUrl = await S3Service.uploadFile(file); // Upload file to S3
          uploadedFiles.push(fileUrl);
        }
        
        // Send message for each file
        for (let url of uploadedFiles) {
          const message = {
            id: new Date().getTime().toString(),
            senderID: userId,
            receiverID: receiverID,
            content: url, // Content is the URL of the uploaded file
            sendDate: new Date().toISOString(),
            isRead: false,
          };
          
          // Send message through WebSocket or your API
          sendMessage(url, receiverID);
          
          // Update message in chat list if needed
          setChatMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
        }
        setSelectedFiles([]); // Reset files
      } catch (error) {
        console.error("Upload file failed", error);
        return;
      }
    }
    
    // Handle text message if exists
    if (messageText.trim()) {
      // Remove file names if any in the message (optional)
      const textMessage = messageText.replace(/(?:https?|ftp):\/\/[\n\S]+|(\S+\.\w{3,4})/g, "").trim();
      
      if (textMessage !== "") {
        const message = {
          id: new Date().getTime().toString(),
          senderID: userId,
          receiverID: receiverID,
          content: textMessage, // Message content is text
          sendDate: new Date().toISOString(),
          isRead: false,
        };
        
        // Send message through WebSocket or your API
        sendMessage(message.content, receiverID);
        
        // Update message in chat list if needed
        setChatMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
      }
    }
    
    // Reset input field and selected files/images
    setMessageText('');
    setSelectedFiles([]);
    setSelectedImages([]);
    
    // Ensure the emoji picker is closed when sending a message
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
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
      setWantToShowEmojiPicker(true);
    }
  };


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
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >
      {(() => {
    let lastDate = null;

    // Tìm tin nhắn cuối cùng của bạn
    const lastMyMessageIndex = messages
        .map((msg, idx) => (msg.senderID === userId ? idx : -1))
        .filter(idx => idx !== -1)
        .pop(); // Lấy index cuối cùng của tin nhắn bạn gửi

    return messages.map((message, index) => {
        const isMyMessage = message.senderID === userId;
        const messageDate = new Date(message.sendDate);

const formatMessageDate = (messageDate) => {

  if (!messageDate) return null;
  
  try {
    
    const date = new Date(messageDate);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Use the function in your component
const formattedDate = formatMessageDate(message.sendDate);
const todayFormatted = formatMessageDate(new Date());

let showDateHeader = false;
if (formattedDate && lastDate !== formattedDate) {
  showDateHeader = true;
  lastDate = formattedDate;
}

const headerText = formattedDate === todayFormatted 
  ? "Hôm nay" 
  : formattedDate || "Không xác định";

return (
  <View key={message.id || `msg-${index}-${message.sendDate}`}>
    {showDateHeader && formattedDate && (
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{headerText}</Text>
      </View>
    )}
    {/* Rest of your component */}
                {isMyMessage ? (
                    <MyMessageItem 
                        time={formatDate(message.sendDate)} 
                        message={message.content} 
                        receiverID={receiverID} 
                        isRead={index === lastMyMessageIndex ? message.isRead : undefined} // Chỉ thêm isRead nếu là tin nhắn cuối cùng của bạn
                    />
                ) : (
                    <MessageItem 
                        avatar={avatar} 
                        name={name} 
                        time={formatDate(message.sendDate)} 
                        message={message.content} 
                    />
                )}
            </View>
        );
    });
})()}

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
        <TouchableOpacity onPress={handleFileUpload}>
        <MaterialIcons name="description" size={24} color="#0091ff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleImageUpload}>
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