import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import Video from 'react-native-video';
import Sound from 'react-native-sound';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import MessageService from '../../../../services/MessageService';
import { formatDate } from '../../../../utils/formatDate';
import ForwardMessageModal from '../ForwardMessageModal';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

function MessageItem({ avatar, time, message, messageId, userId, receiverId, showForwardRecall = true }) {
  const navigation = useNavigation();
  const [emojiIndex, setEmojiIndex] = useState(null);
  const [StatusRead, setStatusRead] = useState(false);
  const [isRecalled, setIsRecalled] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [sound, setSound] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const messageTime = moment(time);
  const displayTime = messageTime.isValid()
    ? messageTime.format("HH:mm")
    : moment().format("HH:mm");

  // Kiểm tra xem tin nhắn có phải là URL của ảnh hay không
  const isImageMessage = (url) => url?.match(/\.(jjpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$/) != null;
  
  // Kiểm tra xem tin nhắn có phải là URL của video hay không
  const isVideoMessage = (url) => url?.match(/\.(mp4|wmv|webm|mov)$/i) != null;
  
  // Kiểm tra xem tin nhắn có phải là URL của audio hay không
  const isAudioMessage = (url) => url?.match(/\.(mp3|wav|ogg)$/i) != null;
  
  // Kiểm tra xem tin nhắn có phải là URL của document hay không
  const isDocumentFile = (url) => 
    url?.match(/\.(pdf|doc|docx|ppt|mpp|pptx|xls|xlsx|csv|txt|odt|ods|odp|json|xml|yaml|yml|ini|env|conf|cfg|toml|properties|java|js|ts|jsx|tsx|c|cpp|cs|py|rb|go|php|swift|rs|kt|scala|sh|bat|ipynb|h5|pkl|pb|ckpt|onnx|zip|rar|tar|gz|7z|jar|war|dll|so|deb|rpm|apk|ipa|whl|html|htm|css|scss|sass|vue|md|sql)$/i) != null;

  // Kiểm tra xem tin nhắn có phải là URL của file bất kỳ hay không
  const isFileMessage = (url) => {
    if (!url || typeof url !== 'string') return false;
    return isDocumentFile(url) || isVideoMessage(url) || isAudioMessage(url) || isImageMessage(url);
  };

  // Tải và mở file
  const downloadAndOpenFile = async (fileUrl) => {
    try {
      const fileName = fileUrl.split('/').pop();
      const localFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  
      const options = {
        fromUrl: fileUrl,
        toFile: localFile,
      };
  
      // Tải file về
      await RNFS.downloadFile(options).promise;
      console.log('File downloaded to:', localFile);
  
      // // Mở file bằng app mặc định
      // await FileViewer.open(localFile);
    } catch (error) {
      console.error('Lỗi khi mở file:', error);
      Alert.alert('Lỗi', 'Không thể tải hoặc mở file.');
    }
  };
  
  // Phát/dừng audio với react-native-sound
  const playAudio = async (audioUrl) => {
    try {
      if (sound && isAudioPlaying) {
        sound.pause();
        setIsAudioPlaying(false);
      } else if (sound) {
        sound.play((success) => {
          if (success) {
            console.log('Phát audio thành công');
            setIsAudioPlaying(false);
          } else {
            console.log('Phát audio thất bại');
          }
        });
        setIsAudioPlaying(true);
      } else {
        // Nếu sound chưa được tạo, tải và tạo mới
        Sound.setCategory('Playback');
        
        // Kiểm tra xem file đã được tải về chưa
        const fileName = audioUrl.split('/').pop();
        const localFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        
        // Kiểm tra xem file đã tồn tại chưa
        const fileExists = await RNFS.exists(localFile);
        
        if (!fileExists) {
          // Tải file về nếu chưa tồn tại
          const options = {
            fromUrl: audioUrl,
            toFile: localFile,
          };
          
          await RNFS.downloadFile(options).promise;
          console.log('Audio downloaded to:', localFile);
        }
        
        // Tạo đối tượng Sound từ file đã tải
        const newSound = new Sound(localFile, '', (error) => {
          if (error) {
            console.error('Lỗi khi tải audio:', error);
            Alert.alert('Lỗi', 'Không thể tải audio này.');
            return;
          }
          
          // Phát audio
          newSound.play((success) => {
            if (success) {
              console.log('Phát audio thành công');
              setIsAudioPlaying(false);
            } else {
              console.log('Phát audio thất bại');
            }
          });
          
          setSound(newSound);
          setIsAudioPlaying(true);
        });
      }
    } catch (error) {
      console.error('Lỗi khi phát audio:', error);
      Alert.alert('Lỗi', 'Không thể phát audio này.');
    }
  };

  // Giải phóng tài nguyên audio khi component unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, [sound]);

  // Xác định loại tin nhắn
  const getMessageType = () => {
    if (isRecalled) return 'unsend';
    if (isImageMessage(message)) return 'image';
    if (isVideoMessage(message)) return 'video';
    if (isAudioMessage(message)) return 'audio';
    if (isDocumentFile(message)) return 'document';
    return 'text';
  };

  const type = getMessageType();

  // Hàm xử lý nhấn vào ảnh
  const handlePressImage = () => {
    navigation.navigate('ImageChat', {
      avatar,
      image: message,
    });
  };

  // Hàm thu hồi tin nhắn
  const recallMessage = async () => {
    try {
      await MessageService.recallMessage(messageId, userId, receiverId);
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

  // Hàm phản ứng emoji
  const reactMessage = (reaction) => {
    setEmojiIndex(reaction);
  };

  // Hiển thị menu tùy chọn khi nhấn giữ
  const handleLongPress = () => {
    if (!showForwardRecall) return;
    
    const options = [
      // { text: '❤', onPress: () => reactMessage('❤') },
      // { text: '👍', onPress: () => reactMessage('👍') },
      // { text: '😀', onPress: () => reactMessage('😀') },
      // { text: '😭', onPress: () => reactMessage('😭') },
      // { text: '😡', onPress: () => reactMessage('😡') },
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
      }},
      {
        text: 'Hủy',
        onPress: () => {},
        style: 'cancel'
      }
    ];

    // Hiển thị Alert với các tùy chọn
    Alert.alert('Tùy chọn tin nhắn', '', options.map(option => ({
      text: option.text,
      onPress: option.onPress,
      style: option.style
    })));
  };

  // Lấy tên file từ URL
  const getFileNameFromUrl = (url) => {
    if (!url) return 'File';
    return url.split('/').pop();
  };

  // Lấy icon phù hợp cho loại file
  const getFileIcon = (url) => {
    if (isImageMessage(url)) return '🖼️';
    if (isVideoMessage(url)) return '🎬';
    if (isAudioMessage(url)) return '🎵';
    
    // Icons cho các loại document khác nhau
    if (url?.match(/\.(pdf)$/i)) return '📄';
    if (url?.match(/\.(doc|docx|odt|txt)$/i)) return '📝';
    if (url?.match(/\.(xls|xlsx|csv|ods)$/i)) return '📊';
    if (url?.match(/\.(ppt|pptx|odp)$/i)) return '📑';
    if (url?.match(/\.(zip|rar|tar|gz|7z)$/i)) return '🗜️';
    
    return '📎';
  };

  // Render nội dung tin nhắn dựa trên loại
  const renderMessageContent = () => {
    switch (type) {
      case 'image':
        return (
          <TouchableOpacity onPress={handlePressImage}>
            <Image style={styles.image} source={{ uri: message }} />
          </TouchableOpacity>
        );
      case 'video':
        return (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: message }}
              style={styles.video}
              controls={true}
              resizeMode="contain"
              repeat={false}
              paused={true} // Video bị tạm dừng ban đầu
            />
          </View>
        );
      case 'audio':
        return (
          <TouchableOpacity onPress={() => playAudio(message)} style={styles.audioContainer}>
            <View style={styles.audioPlayer}>
              <Text style={styles.audioIcon}>{isAudioPlaying ? '⏸️' : '▶️'}</Text>
              <Text style={styles.audioText}>{getFileNameFromUrl(message)}</Text>
            </View>
          </TouchableOpacity>
        );
      case 'document':
        return (
          <View style={styles.fileContainer}>
            <Text style={styles.fileIcon}>{getFileIcon(message)}</Text>
            <Text style={styles.fileText}>{getFileNameFromUrl(message)}</Text>
          </View>
        );
      case 'unsend':
        return <Text style={styles.unsendText}>Tin nhắn đã thu hồi</Text>;
      default:
        return <Text style={styles.messageText}>{message}</Text>;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <Image style={styles.avatar} source={{ uri: avatar }} />
        </View>
        <View style={styles.messageContainer}>
          <TouchableOpacity
            onLongPress={handleLongPress}
            onPress={() => {
              if (type === 'image') handlePressImage();
              else if (type === 'document') downloadAndOpenFile(message);
              else if (type === 'audio') playAudio(message);
              else if (type === 'video') {
                // Mở video trong trình xem mặc định
                downloadAndOpenFile(message);
              }
            }}
            style={[
              styles.messageBox, 
              type === 'image' && styles.imageMessage,
              type === 'video' && styles.videoMessage,
              type === 'audio' && styles.audioMessage,
              type === 'document' && styles.documentMessage
            ]}
          >
            {renderMessageContent()}
          </TouchableOpacity>

          {/* Thời gian tin nhắn */}
          <Text style={styles.time}>{displayTime}</Text>

          {/* Emoji phản ứng */}
          {emojiIndex && (
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{emojiIndex}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Modal chuyển tiếp tin nhắn */}
      <ForwardMessageModal
        visible={forwardModalVisible}
        onClose={() => setForwardModalVisible(false)}
        originalMessageId={messageId}
        senderID={userId}
        message={message}
        type={type}
      />
    </>
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
    maxWidth: '65%',
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
    padding: 5,
    borderRadius: 15,
    marginBottom: 5,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 10,
  },
  imageMessage: {
    padding: 0,
    overflow: 'hidden',
  },
  videoContainer: {
    width: 160,
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoMessage: {
    padding: 0,
    overflow: 'hidden',
  },
  audioContainer: {
    minWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  audioText: {
    fontSize: 14,
    color: '#333',
    maxWidth: 130,
  },
  audioMessage: {
    padding: 0,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fileIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  fileText: {
    fontSize: 14,
    color: '#0066cc',
    textDecorationLine: 'underline',
    maxWidth: 130,
  },
  documentMessage: {
    padding: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  unsendText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    marginBottom: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  time: {
    fontSize: 10,
    color: '#C9D5D5',
    textAlign: 'left',
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