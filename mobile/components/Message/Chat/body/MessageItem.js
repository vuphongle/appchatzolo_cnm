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

import Ionicons from 'react-native-vector-icons/Ionicons';

function MessageItem({ avatar, time, message, messageId, userId, receiverId, showForwardRecall = true }) {
  const navigation = useNavigation();
  const [emojiIndex, setEmojiIndex] = useState(null);
  const [StatusRead, setStatusRead] = useState(false);
  const [isRecalled, setIsRecalled] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [sound, setSound] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const messageTime = moment(time);
  const displayTime = messageTime.isValid()
    ? messageTime.add(7, 'hour').format("HH:mm")
    : moment().format("HH:mm");

  // Kiểm tra xem tin nhắn có phải là URL của ảnh hay không
  const isImageMessage = (url) => url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$/) != null;
  
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
  const downloadAndOpenFile = async (fileUrl, openAfterDownload = false) => {
    console.log('downloadAndOpenFile is called with:')
    try {
      setIsDownloading(true);
      const fileName = fileUrl.split('/').pop();
      const localFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  
      const options = {
        fromUrl: fileUrl,
        toFile: localFile,
        background: true,
        progressDivider: 10,
        begin: (res) => {
          console.log('Bắt đầu tải file:', res);
        },
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Đang tải: ${progress.toFixed(2)}%`);
        }
      };
  
      // Tải file về
      const download = await RNFS.downloadFile(options).promise;
      console.log('File downloaded to:', localFile);
      
      setIsDownloading(false);
  
      // Hiển thị thông báo khi tải xong
      Alert.alert('Thành công', `File "${fileName}" đã được tải về.`);
  
      // Mở file bằng app mặc định nếu được yêu cầu
      // if (openAfterDownload) {
      //   await FileViewer.open(localFile);
      // }
      
      return localFile;
    } catch (error) {
      setIsDownloading(false);
      console.error('Lỗi khi tải file:', error);
      Alert.alert('Lỗi', 'Không thể tải hoặc mở file.');
      return null;
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
        
        let audioFilePath = localFile;
        
        if (!fileExists) {
          // Tải file về nếu chưa tồn tại
          setIsDownloading(true);
          audioFilePath = await downloadAndOpenFile(audioUrl, false);
          setIsDownloading(false);
          
          if (!audioFilePath) return;
        }
        
        // Tạo đối tượng Sound từ file đã tải
        const newSound = new Sound(audioFilePath, '', (error) => {
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
  // hàm xóa tin nhắn ở phía tôi
  const deleteMessageForMe = async () => {
    try {
      await MessageService.deleteSingleMessageForUser(messageId, userId);
      setIsDeleted(true); // Mark message as deleted locally
    } catch (error) {
      console.error('Lỗi khi xóa tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    }
  };

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
      {
        text: 'Hủy',
        onPress: () => {},
        style: 'cancel'
      },
      // { text: 'Tải xuống', onPress: () => downloadAndOpenFile(message) },
      { text: 'Chuyển tiếp', onPress: forwardMessage },
     { text: 'Xóa ở phía tôi', onPress: () => {
        Alert.alert(
          'Xóa tin nhắn',
          'Tin nhắn sẽ bị xóa ở phía bạn. Bạn có chắc chắn muốn xóa?',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xóa', onPress: deleteMessageForMe, style: 'destructive' }
          ]
        );
      }},
     
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
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1]; 
    const fileName = lastPart.includes('_') ? lastPart.split('_').pop() : lastPart; 

    return fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
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
    if (url?.match(/\.(zip|rar|tar|gz|7z)$/i)) return '📁';
    
    return '📎';
  };

  // Render nội dung tin nhắn dựa trên loại
  const renderMessageContent = () => {
    switch (type) {
      case 'image':
        return (
          <View style={styles.boxMessagemedia}>
          <View style={styles.mediaContainer}>
            <TouchableOpacity  style={styles.mediaContent} onLongPress={handleLongPress}>
              <Image style={styles.image} source={{ uri: message }} resizeMode="cover" />
            </TouchableOpacity>
  
          </View>
          <View style={styles.iconHandlemedia}>
          <TouchableOpacity 
             onPress={() => downloadAndOpenFile(message)}
              style={styles.smallDownloadButtonContainer}
              disabled={isDownloading}
            >
              <Ionicons name="download-outline" size={20} color="#4a86e8" loading={isDownloading}/>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={forwardMessage} 
              style={styles.smallDownloadButtonContainer}

            >
              <Ionicons name="share-outline" size={20} color="#4a86e8"/>
              
            </TouchableOpacity>
          </View>
          
        </View>
        
          
        );
      case 'video':
        return (
          
           <View style={styles.boxMessagemedia}>
           <View style={styles.mediaContainer}>
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: message }}
                style={styles.video}
                controls={true}
                resizeMode="contain"
                repeat={false}
                paused={true}
              />
            </View>
          </View>
           <View style={styles.iconHandlemedia}>
           <TouchableOpacity 
              onPress={() => downloadAndOpenFile(message)}
onLongPress={handleLongPress}
               style={styles.smallDownloadButtonContainer}
               disabled={isDownloading}
             >
               <Ionicons name="download-outline" size={20} color="#4a86e8" loading={isDownloading}/>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={forwardMessage}

               style={styles.smallDownloadButtonContainer}           
             >
               <Ionicons name="share-outline" size={20} color="#4a86e8"/>
               
             </TouchableOpacity>
           </View>
           
         </View>
        );
      case 'audio':
        return (
          
           <View style={styles.boxMessagemedia}>
         <View style={styles.mediaContainer}>
            <TouchableOpacity onLongPress={handleLongPress} onPress={() => playAudio(message)} style={styles.audioContainer}>
              <View style={styles.audioPlayer}>
                <Text style={styles.audioIcon}>{isAudioPlaying ? '⏸️' : '▶️'}</Text>
                <View style={styles.audioInfoContainer}>
                  <Text style={styles.audioText}>{getFileNameFromUrl(message)}</Text>
                  <View style={styles.audioProgressBar}>
                    <View style={[styles.audioProgress, { width: isAudioPlaying ? '60%' : '0%' }]} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            
          </View>
           <View style={styles.iconHandlemedia}>
           <TouchableOpacity 
               onPress={() => downloadAndOpenFile(message)} 
               style={styles.smallDownloadButtonContainer}
               disabled={isDownloading}
             >
               <Ionicons name="download-outline" size={20} color="#4a86e8" loading={isDownloading}/>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={forwardMessage} 
               style={styles.smallDownloadButtonContainer}           
             >
               <Ionicons name="share-outline" size={20} color="#4a86e8"/>
               
             </TouchableOpacity>
           </View>
           
         </View>
        );
      case 'document':
        return (
        
           <View style={styles.boxMessagemedia}>
            <View style={styles.mediaContainer}>
            <View style={styles.fileContainer}>
              <Text style={styles.fileIcon}>{getFileIcon(message)}</Text>
              <Text style={styles.fileText}>{getFileNameFromUrl(message)}</Text> 
            </View>
            
          </View>
           <View style={styles.iconHandlemedia}>
           <TouchableOpacity 
               onPress={handleLongPress}
               style={styles.smallDownloadButtonContainer}
               disabled={isDownloading}
             >
               <Ionicons name="download-outline" size={20} color="#4a86e8" loading={isDownloading}/>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={forwardMessage} 
               style={styles.smallDownloadButtonContainer}           
             >
               <Ionicons name="share-outline" size={20} color="#4a86e8"/>
               
             </TouchableOpacity>
           </View>
           
         </View>
          
        );
      case 'unsend':
        return <Text style={styles.unsendText}>Tin nhắn đã thu hồi</Text>;
      default:
        return <View style={{backgroundColor:'#e0f7fa', borderRadius:15}}><Text style={styles.messageText}>{message}</Text></View>
    }
  };
  if (isDeleted) {
    return null;
  }
  return (
    <>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <Image style={styles.avatar} source={{ uri: avatar }} />
        </View>
        <View style={styles.messageContainer}>
          <TouchableOpacity
            onLongPress={handleLongPress}
//            onPress={() => {
//              if (type === 'image') handlePressImage();
//              else if (type === 'audio') playAudio(message);
//            }}
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
    maxWidth: '80%', // Tăng kích thước để hiển thị nội dung to hơn
    marginRight: 10,
    position: 'relative',
    // backgroundColor:''
  },
  avatarContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
   margin:5
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageBox: {
    // backgroundColor: '#e0f7fa',
    borderRadius: 15,
    marginBottom: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  mediaContainer: {
    width: '70%',
  },
  boxMessagemedia:
  { flexDirection: 'row', gap:5,alignItems:'center',width:'100%' },
  mediaContent: {
    width: '100%',
  },
  image: {
    width: 200, // Tăng kích thước ảnh
    height: 200,
   borderRadius:15
  },
  imageMessage: {
    padding: 0,
    overflow: 'hidden',
    // backgroundColor: '#fff'
  },
  videoContainer: {
    width: 200, // Tăng kích thước video
    height: 160,
   borderRadius:15,
    overflow: 'hidden',
    backgroundColor: '#000',
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
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#e8f1ff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconHandlemedia:
  { flexDirection: 'row', gap:4,alignItems:'center',width:'20%' },
  audioIcon: {
    fontSize: 30,
    marginRight: 12,
    color: '#4a86e8',
  },
  audioInfoContainer: {
    flex: 1,
    width: '100%',
    // justifyContent: 'center',
  },
  audioText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  audioProgressBar: {
    height: 4,
    width: '80%',
    backgroundColor: '#d0d0d0',

    borderRadius: 2,
  },
  audioProgress: {
    height: '100%',
    backgroundColor: '#4a86e8',
    width: '80%',
    borderRadius: 2,
  },
  audioMessage: {
    padding: 0,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#f0f8ff',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  documentMessage: {
    padding: 0,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  unsendText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  time: {
    fontSize: 10,
    color: '#999',
    textAlign: 'left',
    marginTop: 2,
    marginRight: 5,
  },
  emojiContainer: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 20,
    color: '#ff6347',
  },
  downloadButtonContainer: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#4a86e8',
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 0,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },

  smallDownloadButtonContainer: {
   borderColor: 'blue',
    borderRadius: 50,
    backgroundColor: '#ffffffcc', // nền trắng mờ để nổi bật nút
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  smallDownloadButton: {
    height: 32,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    minWidth: 0, // tránh nút bị to ra khi dùng compact
    elevation: 2, // tạo bóng nhẹ
  },
});

export default MessageItem;