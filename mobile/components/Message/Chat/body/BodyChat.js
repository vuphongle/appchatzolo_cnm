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
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MyMessageItem from './MyMessagaItem';
import MessageItem from './MessageItem';
import TruncatedText from '../../../../utils/TruncatedText';
import PinnedMessagesComponent from '../PinnedMessagesComponent';
import { UserContext } from '../../../../context/UserContext';
import EmojiSelector from '../../../../utils/EmojiSelector';
import { formatDate } from '../../../../utils/formatDate';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import MessageService from '../../../../services/MessageService';
import S3Service from '../../../../services/S3Service';
import AudioRecord from 'react-native-audio-record';

import Sound from 'react-native-sound';
import { WebSocketContext } from '../../../../context/Websocket';


Sound.setCategory('Playback');

const ChatScreen = ({ receiverID, name, avatar }) => {
  const { user } = useContext(UserContext);
  const userId = user?.id;
  const { sendMessage, onMessage, isConnected } = useContext(WebSocketContext);
  
  const [localMessages, setLocalMessages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wantToShowEmojiPicker, setWantToShowEmojiPicker] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSound, setAudioSound] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { isChange } = useContext(UserContext);
  
  const recordingTimerRef = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
     
      if (audioSound) {
        audioSound.release();
      }
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
       if (typeof isChange === 'string') {
         if(isChange.startsWith('REACT') || isChange.startsWith('REMOVE_REACT')||isChange.startsWith('PIN_MESSAGE')|| isChange.startsWith('UNPIN_MESSAGE')){
             fetchMessages();
         }
       }
  }, [isChange]);

  const fetchMessages = async () => {
    if (!userId || !receiverID) return;
    
    try {
      const response = await MessageService.get(
        `/messages/messages?senderID=${userId}&receiverID=${receiverID}`
      );
      
      if (response && Array.isArray(response)) {
      
        const sortedMessages = response.sort(
          (a, b) => new Date(a.sendDate) - new Date(b.sendDate)
        );
      
        setLocalMessages(sortedMessages);
      } else {
       
        setLocalMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
     
    }
  };

  useEffect(() => {
    if (!userId || !receiverID) return;
    
    fetchMessages();
    return () => {};
  }, [userId, receiverID]);

  // Initialize WebSocket message listener
  useEffect(() => {
    if (!userId || !receiverID) return;
    
    // Function to handle incoming WebSocket messages
    const handleWebSocketMessage = (message) => {
   
      if(message.type==='RECALL_MESSAGE'&&message.senderId!=userId&&message.senderId===receiverID){
        const duplicateMessages = localMessages.some(msg => msg.id=== message.messageId)
        
        if(duplicateMessages){
         
          fetchMessages();
          return;
        }
      }
      // Check if message belongs to current conversation
      if ((message.senderID === userId && message.receiverID === receiverID) || 
          (message.senderID === receiverID && message.receiverID === userId)) {
            
        setLocalMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) 
          {
            
           return  prev;
          }
          
          // Add new message and sort by date
          const newMessages = [...prev, message].sort(
            (a, b) => new Date(a.sendDate) - new Date(b.sendDate)
          );
          
          return newMessages;
        });
      }
    };
    
    
    const unsubscribe = onMessage(handleWebSocketMessage);
    
    return () => {
      
      if (unsubscribe) unsubscribe();
    };
  }, [onMessage]);

 
  useEffect(() => {
    if (scrollViewRef.current && localMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [localMessages]);
// const handleMessagePress = (message) => {
//     const index = localMessages.findIndex(m => m.id === message.id);

//     if (index !== -1 && scrollViewRef.current) {
//       scrollViewRef.current.scrollTo({ y: 100, animated: true });
//     } else {
//       Alert.alert('Không tìm thấy tin nhắn này trong danh sách.');
//     }
//   };
 
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
    
    
    const requestPermissions = async () => {
      try {
        // Kiểm tra quyền hiện tại trước
         const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    

    if (hasPermission) {
      setHasPermission(true);
      return true;
    }
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Quyền ghi âm',
            message: 'Ứng dụng cần quyền ghi âm để gửi tin nhắn âm thanh',
            buttonNeutral: 'Hỏi lại sau',
        buttonNegative: 'Từ chối',
        buttonPositive: 'Đồng ý',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        return true;
    } else {
     
      Alert.alert('Lỗi', 'Cần cấp quyền ghi âm để sử dụng tính năng này');
      return false;
    }
      } catch (err) {
        console.warn('Error requesting audio permission:', err);
      }
    };
    
    requestPermissions();
  }, []);

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

  // Format recording duration to mm:ss
  const formatDuration = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start audio recording
  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is needed to record audio');
      return;
    }
    
    try {
      // Clean up previous recording if exists
      if (audioSound) {
        audioSound.release();
        setAudioSound(null);
      }
      setAudioFile(null);
      
      await AudioRecord.start();
      setIsRecording(true);
      
      // Start recording timer
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      
      // Update duration every second
      recordingTimerRef.current = setInterval(() => {
        const current = Date.now();
        setRecordingDuration(current - startTime);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  // Stop audio recording
  const stopRecording = async () => {
    try {
      // Stop recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      const audioPath = await AudioRecord.stop();
      

      setIsRecording(false);
      
      const file = {
        uri: audioPath,
        name: `audio_${new Date().getTime()}.wav`,
        type: 'audio/wav',
      };
      
      setAudioFile(file);
      
      // Load the recorded audio for playback
      loadAudioForPlayback(audioPath);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    }
  };
  
  // Load audio for playback
  const loadAudioForPlayback = (audioPath) => {
    // const sound = new Sound(audioPath, '', (error) => {
      const sound = new Sound(`file://${audioPath}`, null, (error) => {
      if (error) {
        console.error('Failed to load sound', error);
        Alert.alert('Error', 'Failed to load audio for playback');
        return;
      }
      
      setAudioSound(sound);
      setAudioDuration(sound.getDuration());
    });
  };
  
  // Play recorded audio
  const playRecordedAudio = () => {
    if (!audioSound) return;
    
    if (isPlaying) {
      audioSound.pause();
      setIsPlaying(false);
      return;
    }
    
    // Reset position before playing
    audioSound.setCurrentTime(0);
    
    audioSound.play((success) => {
      if (success) {
        setIsPlaying(false);
      } else {
        console.error('Playback failed');
      }
    });
    
    setIsPlaying(true);
  };
  
  // Cancel recording (delete current audio file)
  const cancelRecording = () => {
    if (audioSound) {
      audioSound.release();
    }
    setAudioSound(null);
    setAudioFile(null);
    setIsPlaying(false);
  };

  // Upload and send audio message
  const handleSendAudioMessage = async () => {
    if (!audioFile) return;

    try {
      const audioUrl = await S3Service.uploadAudio(audioFile);
      
      if (!audioUrl) {
        throw new Error('Audio upload failed');
      }

      const message = {
        id: `audio_${new Date().getTime()}`,
        senderID: userId,
        receiverID: receiverID,
        content: audioUrl,
        sendDate: new Date().toISOString(),
        isRead: false,
        type: 'PRIVATE_CHAT',
        status: 'sent',
      };

      sendMessage(message);
      setLocalMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message].sort(
          (a, b) => new Date(a.sendDate) - new Date(b.sendDate)
        );
        return updatedMessages;
      });
      
      // Clean up audio resources
      if (audioSound) {
        audioSound.release();
      }
      setAudioSound(null);
      setAudioFile(null);
      setIsPlaying(false);
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      Alert.alert('Error', 'Failed to send audio message');
    }
  };

  // Handle image selection
  const handleImageUpload = async () => {
    if (!isMounted) return;
    
    const options = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    };

    try {
      const response = await launchImageLibrary(options);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('Image picker error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedAsset = response.assets[0];
        setSelectedImages((prevFiles) => [...prevFiles, selectedAsset]);
      }
    } catch (error) {
      console.log('Error processing image selection:', error);
    }
  };

  // Handle file selection
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const file = Array.isArray(result) ? result[0] : result;
      setSelectedFiles((prevFiles) => [...prevFiles, file]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('Error picking document:', err);
      }
    }
  };
  function truncateTextlimit(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '..."' : text;
}


  // Handle sending messages (text, images, files)
  const handleSendMessage = async () => {
    if (messageText.trim() === '' && selectedFiles.length === 0 && selectedImages.length === 0) {
      return;
    }

    // Handle selected images
    if (selectedImages.length > 0) {
      try {
        for (let file of selectedImages) {
          const imageUrl = await S3Service.uploadImage(file);
          
          if (imageUrl) {
            const imageMessage = {
              id: `image_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
              senderID: userId,
              receiverID: receiverID,
              content: imageUrl,
              sendDate: new Date().toISOString(),
              isRead: false,
              type: 'PRIVATE_CHAT',
              status: 'sent',
            };
            
            sendMessage(imageMessage);
            setLocalMessages((prevMessages) => {
              const updatedMessages = [...prevMessages, imageMessage].sort(
                (a, b) => new Date(a.sendDate) - new Date(b.sendDate)
              );
              return updatedMessages;
            });
          }
        }
        setSelectedImages([]);
      } catch (error) {
        console.error('Error uploading images:', error);
        Alert.alert('Error', 'Failed to send one or more images');
      }
    }

   
    if (selectedFiles.length > 0) {
      try {
        for (let file of selectedFiles) {
          console.log(" file upload s3:", file);
          const fileUrl = await S3Service.uploadFile(file);
          
          if (fileUrl) {
            const fileMessage = {
              id: `file_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
              senderID: userId,
              receiverID: receiverID,
              content: fileUrl,
              sendDate: new Date().toISOString(),
              isRead: false,
              type: 'PRIVATE_CHAT',
              status:'sent'
            };
            
            sendMessage(fileMessage);
            setLocalMessages((prevMessages) => {
              const updatedMessages = [...prevMessages, fileMessage].sort(
                (a, b) => new Date(a.sendDate) - new Date(b.sendDate)
              );
              return updatedMessages;
            });
          }
        }
        setSelectedFiles([]);
      } catch (error) {
        console.error('Error uploading files:', error);
        Alert.alert('Error', 'Failed to send one or more files');
      }
    }


   
    if (messageText.trim()) {
      const textMessage = {
        id: `text_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
        senderID: userId,
        receiverID: receiverID,
        content: messageText.trim(),
        sendDate: new Date().toISOString(),
        isRead: false,
        type: 'PRIVATE_CHAT',
        status: 'sent'
      };
      
      sendMessage(textMessage);
      setLocalMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, textMessage].sort(
          (a, b) => new Date(a.sendDate) - new Date(b.sendDate)
        );
        return updatedMessages;
      });
      setMessageText('');
    }

    
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

  const todayFormatted = formatMessageDate(new Date());

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      < PinnedMessagesComponent  userId={userId}
  receiverId={receiverID}
  messageshistory={localMessages}
  receiverName={name}
  // onMessagePress={handleMessagePress}
            />
        <ScrollView
          style={styles.messageContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {(() => {
            let lastDate = null;

           
            const lastMyMessageIndex = localMessages
              .map((msg, idx) => (msg.senderID === userId ? idx : -1))
              .filter((idx) => idx !== -1)
              .pop();

            return localMessages.map((message, index) => {
              const isMyMessage = message.senderID === userId;
              const formattedDate = formatMessageDate(message.sendDate);
              
              let showDateHeader = false;
              if (formattedDate && lastDate !== formattedDate) {
                showDateHeader = true;
                lastDate = formattedDate;
              }

              const headerText =
                formattedDate === todayFormatted
                  ? 'Hôm nay'
                  : formattedDate || 'Hôm nay';

              
              if ((isMyMessage && message.deletedBySender) || 
                  (!isMyMessage && message.deletedByReceiver)) {
                return null;
              }

              return (
                <View key={`${message.id}${
                               message.reactions?.length != null ? `-${message.reactions.length}` : ''
                             }` || `msg-${index}-${message.sendDate}`}>
                  {showDateHeader && formattedDate && (
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateText}>{headerText}</Text>
                    </View>
                  )}
                   {message.status==="Notification" && (
                    <View>
                       <View style={styles.NotiHeader}>
                      <Text style={styles.NotiText}>{truncateTextlimit(message.content,40)||''}</Text>
                    </View>
                    </View>
                  ) }
                 
                  
                  {message.status === "Notification" ? null : (
  isMyMessage ? (
    <MyMessageItem
      time={formatDate(message.sendDate)}
      message={message.content}
      messageInfo={message}
      messageId={message.id}
      userId={userId}
      receiverId={receiverID}
      avatar={user?.avatar}
      messageType={message.type || 'text'}
      fileName={message.fileName}
      isRead={index === lastMyMessageIndex ? message.isRead : undefined}
      audioDuration={message.audioDuration}
      onDeleteMessage={() => {
        // TODO: handle delete
      }}
    />
  ) : (
    <MessageItem
      avatar={avatar}
      name={name}
      time={message.sendDate}
      message={message.content}
      messageId={message.id}
      userId={userId}
      receiverId={receiverID}
      messageType={message.type || 'text'}
      messageInfo={message}
      fileName={message.fileName}
      audioDuration={message.audioDuration}
      onDeleteMessage={() => {
        // TODO: handle delete
      }}
    />
  )
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

      
      {audioFile && (
        <View style={styles.audioPreviewContainer}>
          <View style={styles.audioPreviewContent}>
            <MaterialIcons name="mic" size={24} color="#0091ff" />
            <Text style={styles.audioPreviewText}>
              Ghi âm {formatDuration(audioDuration * 1000)}
            </Text>
            <TouchableOpacity
              style={[styles.audioButton, isPlaying ? styles.audioButtonActive : null]}
              onPress={playRecordedAudio}
            >
              <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.audioActionButtons}>
            <TouchableOpacity
              style={[styles.audioActionButton, styles.cancelButton]}
              onPress={cancelRecording}
            >
              <MaterialIcons name="delete" size={18} color="#fff" />
              <Text style={styles.audioActionButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.audioActionButton, styles.sendButton]}
              onPress={handleSendAudioMessage}
            >
              <MaterialIcons name="send" size={18} color="#fff" />
              <Text style={styles.audioActionButtonText}>Gửi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

     
      {isRecording && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingContent}>
            <View style={styles.recordingIndicatorPulse}>
              <View style={styles.recordingIndicatorDot} />
            </View>
            <Text style={styles.recordingText}>
              Đang ghi âm... {formatDuration(recordingDuration)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.stopRecordingButton}
            onPress={stopRecording}
          >
            <MaterialIcons name="stop" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

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

          <TouchableOpacity 
            onPress={() => {
              if (!isRecording && !audioFile) {
                Alert.alert(
                  "Xác nhận",
                  "Bạn có muốn bắt đầu ghi âm không?",
                  [
                    {
                      text: "Hủy",
                      style: "cancel"
                    },
                    { 
                      text: "Đồng ý", 
                      onPress: startRecording 
                    }
                  ]
                );
              }
            }}
          >
            <FontAwesome
              name="microphone"
              size={24}
              color="#0091ff"
            />
            {isRecording && (
              <View style={styles.recordingIndicator} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSendMessage}
            disabled={messageText.trim() === '' && selectedFiles.length === 0 && selectedImages.length === 0}
          >
            <Ionicons 
              name="send-outline" 
              size={24} 
              color={messageText.trim() === '' && selectedFiles.length === 0 && selectedImages.length === 0 ? '#ccc' : '#0091ff'} 
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputMessage: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    padding: 8,
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
   NotiHeader: {
    alignSelf: 'center',
   
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
    NotiText: {
    fontSize: 12,
    color: '#555',
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
  connectionAlert: {
    backgroundColor: '#ffcc00',
    padding: 5,
    alignItems: 'center',
  },
  connectionAlertText: {
    color: '#333',
    fontSize: 12,
  },
  recordingIndicator: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4d4d',
  },
  audioPreviewContainer: {
  backgroundColor: '#f2f8ff',
  borderRadius: 12,
  padding: 15,
  marginHorizontal: 10,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
audioPreviewContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},
audioPreviewText: {
  flex: 1,
  fontSize: 14,
  color: '#333',
  marginLeft: 10,
},
audioButton: {
  backgroundColor: '#0091ff',
  borderRadius: 20,
  width: 36,
  height: 36,
  justifyContent: 'center',
  alignItems: 'center',
},
audioButtonActive: {
  backgroundColor: '#ff4d4d',
},
audioActionButtons: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 10,
},
audioActionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 16,
  justifyContent: 'center',
},
audioActionButtonText: {
  color: '#fff',
  fontSize: 14,
  marginLeft: 6,
},
cancelButton: {
  backgroundColor: '#ff4d4d',
},
sendButton: {
  backgroundColor: '#0091ff',
},
recordingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff6f6',
  borderRadius: 12,
  padding: 12,
  marginHorizontal: 10,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#ffdddd',
},
recordingContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
recordingText: {
  fontSize: 14,
  color: '#ff4d4d',
  marginLeft: 10,
},
recordingIndicatorPulse: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: 'rgba(255, 77, 77, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  animation: 'pulse 1.5s infinite',
},
recordingIndicatorDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: '#ff4d4d',
},
stopRecordingButton: {
  backgroundColor: '#ff4d4d',
  borderRadius: 20,
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
},
});