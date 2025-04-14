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
import { Button } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
function MyMessageItem({ messageId,avatar, userId, receiverId, time, message, showForwardRecall = true }) {
  const [messIndex, setMessIndex] = useState(message);
  const [emojiIndex, setEmojiIndex] = useState(null);
  const [isRecalled, setIsRecalled] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [sound, setSound] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
   const navigation = useNavigation();
  // Kiểm tra xem tin nhắn có phải là URL của ảnh hay không
  const isImageMessage = (url) => url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$/) != null;
  
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

  // Tải và mở file
  const downloadAndOpenFile = async (fileUrl, openAfterDownload = false) => {
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
      if (openAfterDownload) {
        await FileViewer.open(localFile);
      }
      
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
  // xóa tin nhắn ở phía tôi
  const deleteMessageForMe = async () => {
    try {
      await MessageService.deleteSingleMessageForUser(messageId, userId);
      setIsDeleted(true); // Mark message as deleted locally
    } catch (error) {
      console.error('Lỗi khi xóa tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
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
  const handleDeleteOrRecall = () => {
    Alert.alert(
      'Hành động với tin nhắn',
      'Bạn muốn thực hiện hành động nào?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ở phía tôi',
          onPress: () => {
            Alert.alert(
              'Xóa tin nhắn',
              'Tin nhắn sẽ bị xóa ở phía bạn. Bạn có chắc chắn muốn xóa?',
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', onPress: deleteMessageForMe, style: 'destructive' }
              ]
            );
          },
          style: 'default',
        },
        {
          text: 'Thu hồi',
          onPress: () => {
            Alert.alert(
              'Thu hồi tin nhắn',
              'Bạn có chắc chắn muốn thu hồi tin nhắn này?',
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Thu hồi', onPress: recallMessage, style: 'destructive' }
              ]
            );
          },
          style: 'default',
        },
       
      ]
    );
  };

  // Hiển thị menu tùy chọn khi nhấn giữ tin nhắn
  const handleLongPress = () => {
    // Nếu tin nhắn đã thu hồi, không hiển thị menu
    if (!showForwardRecall) return;

    const options = [
      {
        text: 'Hủy',
        onPress: () => {},
        style: 'cancel'
      },
      // { text: 'Tải xuống', onPress: () => downloadAndOpenFile(messIndex) },
      { text: 'Chuyển tiếp', onPress: forwardMessage },
      { text: 'Xóa hoặc Thu hồi', onPress: handleDeleteOrRecall },
     
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
    const fileName = url.split('/').pop();
    // Giới hạn độ dài tên file hiển thị
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
    if (url?.match(/\.(zip|rar|tar|gz|7z)$/i)) return '🗜️';
    
    return '📎';
  };
  const handlePressImage = () => {
    navigation.navigate('ImageChat', {
      avatar,
      image: message,
    });
  };

  // Render nội dung tin nhắn dựa trên loại
  const renderMessageContent = () => {
    switch (typeIndex) {
      case 'image':
        return (
                    <View style={styles.boxMessagemedia}>
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
                    <View style={styles.mediaContainer}>
                      <TouchableOpacity onPress={handlePressImage} style={styles.mediaContent}>
                        <Image style={styles.image} source={{ uri: message }} resizeMode="cover" />
                      </TouchableOpacity>
            
                    </View>
                    
                    
                  </View>
        );
      case 'video':
        return (
          
           <View style={styles.boxMessagemedia}>
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

         <View style={styles.mediaContainer}>
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: messIndex }}
                style={styles.video}
                controls={true}
                resizeMode="contain"
                repeat={false}
                paused={true}
              />
            </View>
            
          </View>
 
   
         
         
       </View>
          
        );
      case 'audio':
        return (
         
            <View style={styles.boxMessagemedia}>
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
          <View style={styles.mediaContainer}>
            <TouchableOpacity onPress={() => playAudio(messIndex)} style={styles.audioContainer}>
              <View style={styles.audioPlayer}>
                <Text style={styles.audioIcon}>{isAudioPlaying ? '⏸️' : '▶️'}</Text>
                <View style={styles.audioInfoContainer}>
                  <Text style={styles.audioText}>{getFileNameFromUrl(messIndex)}</Text>
                  <View style={styles.audioProgressBar}>
                    <View style={[styles.audioProgress, { width: isAudioPlaying ? '60%' : '0%' }]} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            
          </View>
          
          
        </View>
        );
      case 'document':
        return (
          
            <View style={styles.boxMessagemedia}>
            <View style={styles.iconHandlemedia}>
          <TouchableOpacity 
              // onPress={() => downloadAndOpenFile(message)} 
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
          <View style={styles.mediaContainer}>
            <View style={styles.fileContainer}>
              <Text style={styles.fileIcon}>{getFileIcon(messIndex)}</Text>
              <Text style={styles.fileText}>{getFileNameFromUrl(messIndex)}</Text> 
            </View>
         
          </View>
  
      
          
          
        </View>
        );
      case 'unsend':
        return null; // Xử lý riêng bên ngoài
      default:
        return <View style={{backgroundColor:'#e0f7fa' , borderRadius:15}}><Text style={styles.messageText}>{messIndex}</Text></View>
    }
  };

  // Xử lý khi nhấn vào tin nhắn
  const handleMessagePress = () => {
    switch (typeIndex) {
      case 'image':
        // Có thể thêm xử lý khi nhấn vào ảnh ở đây (xem ảnh full màn hình)
        break;
      case 'audio':
        playAudio(messIndex);
        break;
      default:
        break;
    }
  };
  if (isDeleted) {
    return null;
  }
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
                (typeIndex === 'image' || typeIndex === 'video' || typeIndex === 'audio' || typeIndex === 'document') && styles.mediaMessage
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
    flexDirection: 'column',
    maxWidth: '80%', // Tăng kích thước để hiển thị nội dung to hơn
    marginRight: 10,
    position: 'relative',
  },
  messageBox: {
    // backgroundColor: '#dcf8c6', // Màu xanh lá mềm của tin nhắn của mình
    borderRadius: 15,
    marginBottom: 5,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  mediaMessage: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  mediaContainer: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  image: {
    width: 240, // Tăng kích thước ảnh
    height: 200,
    borderRadius:15
  },
  videoContainer: {
    width: 240, // Tăng kích thước video
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
   borderRadius: 15,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  audioContainer: {
    width: '100%',
    
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#e3f2d3', // Màu nền cho audio phù hợp với tin nhắn của mình
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  audioIcon: {
    fontSize: 30,
    marginRight: 12,
    color: '#4caf50', // Màu xanh lá phù hợp với tin nhắn của mình
  },
  audioInfoContainer: {
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  audioProgressBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#c5e1a5',
    borderRadius: 2,
  },
  audioProgress: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
   
    backgroundColor: '#e3f2d3',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileText: {
    fontSize: 14,
    color: '#0b5502',
    fontWeight: 'bold',
  },
  downloadButtonContainer: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#4caf50', // Màu xanh lá phù hợp với tin nhắn của mình
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 0,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    padding: 10,
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
    marginTop: 2,
    marginRight: 5,
    textAlign: 'right',
  },
  emojiContainer: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 20,
  },
  boxMessagemedia:
  { flexDirection: 'row', gap:5,alignItems:'center',width:'100%' },
  mediaContent: {
    width: '100%',
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
  iconHandlemedia:
  { flexDirection: 'row', gap:4,alignItems:'center',width:'20%' },


});

export default MyMessageItem;