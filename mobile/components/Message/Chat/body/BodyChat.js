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
  PermissionsAndroid,
  Image,
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
import AudioRecord from 'react-native-audio-record';

const ChatScreen = ({ receiverID, name, avatar }) => {
  const { user } = useContext(UserContext);
  const userId = user?.id;
  const { height: windowHeight } = Dimensions.get('window');
  const [selectedImages, setSelectedImages] = useState([]); // Lưu trữ các ảnh đã chọn
  const [selectedFiles, setSelectedFiles] = useState([]); // Lưu trữ các file đã chọn
  const [localMessages, setLocalMessages] = useState([]);
  const [refreshMessages, setRefreshMessages] = useState(false);

  const { messages, sendMessage } = useWebSocket(userId, receiverID);
  const scrollViewRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wantToShowEmojiPicker, setWantToShowEmojiPicker] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      format: 'wav',
      encoder: 'pcm',
      rawData: false,
    };

    AudioRecord.init(options);
    console.log('AudioRecord initialized');
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Quyền ghi âm',
            message: 'Ứng dụng cần quyền ghi âm để gửi tin nhắn âm thanh',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
          console.log('Quyền ghi âm đã được cấp');
        } else {
          console.log('Quyền ghi âm bị từ chối');
        }
      } catch (err) {
        console.warn(err);
      }
    };
    requestPermissions();
  }, []);

  const startRecording = async () => {
    try {
      await AudioRecord.start();
      setIsRecording(true);
      console.log('Đang ghi âm...');
    } catch (error) {
      console.error('Lỗi khi bắt đầu ghi âm:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const audioPath = await AudioRecord.stop(); // Dừng ghi âm và lấy đường dẫn tệp âm thanh
      setAudioFile(audioPath); // Lưu đường dẫn tệp âm thanh
      setIsRecording(false); // Cập nhật trạng thái dừng ghi âm
      console.log('Tệp âm thanh được lưu tại:', audioPath);  // Log đường dẫn tệp âm thanh

      const file = {
        uri: audioPath,   // Đường dẫn tệp
        name: 'audio.wav', // Tên tệp
        type: 'audio/wav', // Loại tệp
      };

      console.log('Đối tượng file sẽ được truyền:', file); // Log đối tượng file để kiểm tra
      handleSendAudioMessage(file); // Gửi tệp âm thanh lên S3
    } catch (error) {
      console.error('Lỗi khi dừng ghi âm:', error);
    }
  };

  const handleSendAudioMessage = async (file) => {
    if (!file) {
      console.error('Không có tệp âm thanh để gửi.');
      return;
    }

    console.log('Đang tải lên âm thanh:', file); // Log file trước khi gửi

    try {
      const audioUrl = await S3Service.uploadAudio(file); // Gửi tệp âm thanh lên S3

      if (!audioUrl) {
        console.error('Tải lên tệp âm thanh thất bại.');
        return;
      }

      console.log('URL tệp âm thanh sau khi tải lên:', audioUrl); // Log URL sau khi tải lên thành công

      const message = {
        id: new Date().getTime().toString(),
        senderID: userId,
        receiverID: receiverID,
        content: audioUrl,
        sendDate: new Date().toISOString(),
        isRead: false,
      };

      console.log('Gửi tin nhắn âm thanh:', message); // Log thông tin tin nhắn
      sendMessage(message.content, receiverID); // Gửi tin nhắn
      setAudioFile(null);
    } catch (error) {
      console.error('Lỗi khi tải lên tệp âm thanh:', error);
      Alert.alert('Lỗi', 'Có lỗi khi tải lên tệp âm thanh, vui lòng thử lại.');
    }
  };

  // Effect để cập nhật localMessages khi messages thay đổi
  useEffect(() => {
    if (messages && messages.length > 0) {
      setLocalMessages(messages);
    }
  }, [messages]);

  // Effect để load lại tin nhắn khi có tin nhắn bị xóa
  useEffect(() => {
    if (refreshMessages && userId && receiverID) {
      // Tải lại tin nhắn từ server
      fetchMessages();
      setRefreshMessages(false);
    }
  }, [refreshMessages, userId, receiverID]);

  // Hàm để tải lại tin nhắn từ server
  const fetchMessages = async () => {
    try {
      const data = await MessageService.get(
        `/messages/messages?senderID=${userId}&receiverID=${receiverID}`
      );
      
      // Sắp xếp tin nhắn theo thời gian từ cũ đến mới
      const sortedMessages = data.sort(
        (a, b) => new Date(a.sendDate) - new Date(b.sendDate)
      );

      // Cập nhật localMessages
      setLocalMessages(sortedMessages);
      
      // Đánh dấu tin nhắn là đã đọc
      const unreadMessages = sortedMessages.filter(
        (msg) => msg.isRead === false && msg.senderID === receiverID
      );
      
      if (unreadMessages.length > 0) {
        await MessageService.savereadMessages(userId, receiverID);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Triển khai hàm xử lý khi tin nhắn bị xóa
  const handleMessageDeleted = (messageId) => {
    // Lọc ra tin nhắn bị xóa khỏi localMessages
    setLocalMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== messageId)
    );
    
    // Đánh dấu cần tải lại tin nhắn
    setRefreshMessages(true);
  };

  useEffect(() => {
    if (!userId || !receiverID) return;

    // Tải tin nhắn ban đầu
    fetchMessages();
    
    // Thiết lập interval để tải lại tin nhắn định kỳ (ví dụ: mỗi 30 giây)
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchMessages();
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [receiverID, userId]);

  useEffect(() => {
    if (scrollViewRef.current) {
      // Add a small delay to ensure the message is rendered before scrolling
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });

      }, 100);
    }
  }, [localMessages]);

  const handleImageUpload = async () => {
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
          setSelectedImages((prevFiles) => [...prevFiles, selectedAsset]);
          console.log('Đã chọn ảnh:', selectedAsset);
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
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        if (wantToShowEmojiPicker) {
          setShowEmojiPicker(true);
          setWantToShowEmojiPicker(false);
        }
      },
    );
    return () => {
      keyboardDidHideListener.remove();
    };
  }, [wantToShowEmojiPicker]);

  const handleSendMessage = async () => {
    if (
      messageText.trim() === '' &&
      selectedFiles.length === 0 &&
      selectedImages.length === 0
    )
      return; // Don't send if no content and no files

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
        }
        setSelectedImages([]); // Reset images
      } catch (error) {
        console.error('Upload image failed', error);
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
          console.log('url of file :', fileUrl);
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
          sendMessage(message.content, receiverID);
        }
        setSelectedFiles([]); // Reset files
      } catch (error) {
        console.error('Upload file failed', error);
        return;
      }
    }

    // Handle text message if exists
    if (messageText.trim()) {
      const message = {
        id: new Date().getTime().toString(),
        senderID: userId,
        receiverID: receiverID,
        content: messageText.trim(), // Message content is text
        sendDate: new Date().toISOString(),
        isRead: false,
      };

      // Send message through WebSocket or your API
      sendMessage(message.content, receiverID);
    }

    // Reset input field and selected files/images
    setMessageText('');
    setSelectedFiles([]);
    setSelectedImages([]);

    // Ensure the emoji picker is closed when sending a message
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
    
    // Đánh dấu cần tải lại tin nhắn sau khi gửi
    setTimeout(() => {
      setRefreshMessages(true);
    }, 500);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
          const lastMyMessageIndex = localMessages
            .map((msg, idx) => (msg.senderID === userId ? idx : -1))
            .filter((idx) => idx !== -1)
            .pop(); // Lấy index cuối cùng của tin nhắn bạn gửi

          return localMessages.map((message, index) => {
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

            const headerText =
              formattedDate === todayFormatted
                ? 'Hôm nay'
                : formattedDate || 'Hôm nay';

            return (
              <View key={message.id || `msg-${index}-${message.sendDate}`}>
                {showDateHeader && formattedDate && (
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{headerText}</Text>
                  </View>
                )}
                {isMyMessage ? (
                  <MyMessageItem
                    time={formatDate(message.sendDate)}
                    message={message.content}
                    messageId={message.id}
                    userId={userId}
                    receiverId={receiverID}
                    // onDeleteMessage={handleMessageDeleted}
                    // isRead={
                    //   index === lastMyMessageIndex ? message.isRead : undefined
                    // } 
                  />
                ) : (
                  <MessageItem
                    avatar={avatar}
                    name={name}
                    time={formatDate(message.sendDate)}
                    message={message.content}
                    messageId={message.id}
                    userId={userId}
                    receiverId={receiverID}
                    // onDeleteMessage={handleMessageDeleted}
                  />
                )}
              </View>
            );
          });
        })()}
      </ScrollView>

      {/* Media Preview Section */}
      {(selectedImages.length > 0 || selectedFiles.length > 0) && (
        <View style={styles.mediaPreviewContainer}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            {selectedImages.map((image, index) => (
              <View key={`img-${index}`} style={styles.mediaPreviewItem}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedFiles.map((file, index) => (
              <View key={`file-${index}`} style={styles.mediaPreviewItem}>
                <View style={styles.filePreview}>
                  <MaterialIcons name="description" size={24} color="#0091ff" />
                  <Text style={styles.fileNameText} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => removeFile(index)}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.footerContainer}>
        <View style={styles.inputContainer}>
        {/* onPress={toggleEmojiPicker} */}
          <TouchableOpacity >
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

          <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
            <FontAwesome name={isRecording ? 'stop' : 'microphone'} size={24} color="#0091ff" />
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
  // New styles for media preview
  mediaPreviewContainer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    backgroundColor: '#fff',
  },
  mediaPreviewItem: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filePreview: {
    width: 100,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileNameText: {
    fontSize: 10,
    color: '#333',
    marginTop: 5,
    maxWidth: 90,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4d4d',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});