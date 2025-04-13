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
import { formatDate } from '../../../../utils/formatDate';
import MessageService from '../../../../services/MessageService';
import ForwardMessageModal from '../ForwardMessageModal';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

function MyMessageItem({ messageId, userId, receiverId, time, message, showForwardRecall = true }) {
  const [messIndex, setMessIndex] = useState(message);
  const [emojiIndex, setEmojiIndex] = useState(null);
  const [isRecalled, setIsRecalled] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [sound, setSound] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Kiểm tra xem tin nhắn có phải là URL của ảnh hay không
  const isImageMessage = (url) => url?.match(/\.(jjpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$/) != null;
  
  // Kiểm tra xem tin nhắn có phải là URL của video hay không
  const isVideoMessage = (url) => url?.match(/\.(mp4|wmv|webm|mov)$/i) != null;
  
  // Kiểm tra xem tin nhắn có phải là URL của audio hay không
  const isAudioMessage = (url) => url?.match(/\.(mp3|wav|ogg)$/i) != null;
  
  // Kiểm tra xem tin nhắn có phải là URL của document hay không
  const isDocumentFile = (url) => 
    url?.match(/\.(pdf|doc|docx|ppt|mpp|pptx|xls|xlsx|csv|txt|odt|ods|odp|json|xml|yaml|yml|ini|env|conf|cfg|toml|properties|java|js|ts|jsx|tsx|c|cpp|cs|py|rb|go|php|swift|rs|kt|scala|sh|bat|ipynb|h5|pkl|pb|ckpt|onnx|zip|rar|tar|gz|7z|jar|war|dll|so|deb|rpm|apk|ipa|whl|html|htm|css|scss|sass|vue|md|sql)$/i) != null;

  // Xác định loại tin nhắn
  const getMessageType = (msg) => {
    if (isImageMessage(msg)) return 'image';
    if (isVideoMessage(msg)) return 'video';
    if (isAudioMessage(msg)) return 'audio';
    if (isDocumentFile(msg)) return 'document';
    return 'text';
  };

  // Lưu trạng thái loại tin nhắn
  const [typeIndex, setTypeIndex] = useState(() => getMessageType(message));

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
  
      // Mở file bằng app mặc định
      await FileViewer.open(localFile);
    } catch (error) {
      console.error('Lỗi khi mở file:', error);
      Alert.alert('Lỗi', 'Không thể tải hoặc mở file.');
    }
  };

  // Hàm phản ứng emoji
  const reactMessage = (reaction) => {
    setEmojiIndex(reaction);
  };

  // Xác định loại tin nhắn hiện tại (cho modal chuyển tiếp)
  const type = isRecalled ? 'unsend' : typeIndex;

  // Hàm thu hồi tin nhắn
  const recallMessage = async () => {
    try {
      await MessageService.recallMessage(messageId, userId, receiverId);
      setMessIndex('Tin nhắn đã thu hồi');
      setTypeIndex('unsend');
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

  // Hiển thị menu tùy chọn khi nhấn giữ tin nhắn
  const handleLongPress = () => {
    // Nếu tin nhắn đã thu hồi, không hiển thị menu
    if (!showForwardRecall) return;

    const options = [
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

  // Hiển thị danh sách emoji
  const handlePressIcon = () => {
    // Nếu tin nhắn đã thu hồi, không hiển thị emoji
    if (isRecalled) return;

    Alert.alert('Chọn cảm xúc của bạn:', '', [
      { text: '❤', onPress: () => reactMessage('❤') },
      { text: '👍', onPress: () => reactMessage('👍') },
      { text: '😀', onPress: () => reactMessage('😀') },
      { text: '😭', onPress: () => reactMessage('😭') },
      { text: '😡', onPress: () => reactMessage('😡') },
      { text: 'Thoát', style: 'cancel' },
    ]);
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
    switch (typeIndex) {
      case 'image':
        return (
          <Image style={styles.image} source={{ uri: messIndex }} />
        );
      case 'video':
        return (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: messIndex }}
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
          <View style={styles.audioPlayer}>
            <Text style={styles.audioIcon}>{isAudioPlaying ? '⏸️' : '▶️'}</Text>
            <Text style={styles.audioText}>{getFileNameFromUrl(messIndex)}</Text>
          </View>
        );
      case 'document':
        return (
          <View style={styles.fileContainer}>
            <Text style={styles.fileIcon}>{getFileIcon(messIndex)}</Text>
            <Text style={styles.fileText}>{getFileNameFromUrl(messIndex)}</Text>
          </View>
        );
      case 'unsend':
        return null; // This is handled separately
      default:
        return <Text style={styles.messageText}>{messIndex}</Text>;
    }
  };

  // Xử lý khi nhấn vào tin nhắn
  const handleMessagePress = () => {
    switch (typeIndex) {
      case 'image':
        // Có thể thêm xử lý khi nhấn vào ảnh ở đây (xem ảnh full màn hình)
        handlePressIcon();
        break;
      case 'video':
        downloadAndOpenFile(messIndex);
        break;
      case 'audio':
        playAudio(messIndex);
        break;
      case 'document':
        downloadAndOpenFile(messIndex);
        break;
      default:
        handlePressIcon();
        break;
    }
  };

  return (
    <>
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
                (typeIndex === 'image' || typeIndex === 'video') && styles.mediaMessage,
                typeIndex === 'audio' && styles.audioMessage,
                typeIndex === 'document' && styles.documentMessage
              ]}
              onLongPress={handleLongPress}
              onPress={handleMessagePress}
            >
              {renderMessageContent()}
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

          {/* Trạng thái đọc - đã comment trong code gốc */}
          {/* {isRead !== undefined && !isRecalled ? (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {isRead ? "Đã xem" : "✔✔ Đã gửi"}
              </Text>
            </View>
          ) : null} */}
        </View>
      </View>

      {/* Modal chuyển tiếp tin nhắn */}
      <ForwardMessageModal
        visible={forwardModalVisible}
        onClose={() => setForwardModalVisible(false)}
        originalMessageId={messageId}
        senderID={userId}
        message={messIndex}
        type={type}
      />
    </>
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
  audioMessage: {
    padding: 8,
  },
  documentMessage: {
    padding: 8,
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
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  audioText: {
    fontSize: 14,
    color: '#333',
    maxWidth: 150,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  fileText: {
    fontSize: 14,
    color: '#0066cc',
    textDecorationLine: 'underline',
    maxWidth: 150,
  },
  emojiContainer: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 20,
  },
  statusContainer: {
    marginTop: 5,
  },
  statusText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
  },
});

export default MyMessageItem;