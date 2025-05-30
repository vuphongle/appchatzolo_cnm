import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import Sound from 'react-native-sound';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import MessageService from '../../../../services/MessageService';
import { requestStoragePermissionWithFeedback,checkStoragePermission ,requestManageStoragePermission } from './permissions';

import { formatDate } from '../../../../utils/formatDate';
import ForwardMessageModal from '../ForwardMessageModal';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import MessageOptionsModal from './MessageOptionsModal';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { IPV4 } from '@env';
import { UserContext } from '../../../../context/UserContext';
// Import thêm CameraRoll để lưu vào thư viện ảnh
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

import { WebSocketContext } from '../../../../context/Websocket';
import UserService from '../../../../services/UserService';


function MessageItem({ avatar, time, message, messageId, userId, receiverId, messageInfo: initialMessageInfo, showForwardRecall = true ,typechat}) {
  const { user, setIsChange } = React.useContext(UserContext);
  const navigation = useNavigation();
  const [emojiIndex, setEmojiIndex] = useState([]);
  const [StatusRead, setStatusRead] = useState(false);
  const [isRecalled, setIsRecalled] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [sound, setSound] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [messageInfo, setMessageInfo] = useState(initialMessageInfo);
  const [reactCount, setReactCount] = useState(messageInfo.reactions?.length);
  const [avatarUser, setAvatarUser] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const messageTime = moment(time);
  const {sendMessage} = React.useContext(WebSocketContext);
  const displayTime = messageTime.isValid()
    ? messageTime.add(7, 'hour').format("HH:mm")
    : moment().format("HH:mm");

  const [messageOptionsVisible, setMessageOptionsVisible] = useState(false);

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

  // Hàm yêu cầu quyền truy cập bộ nhớ
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        
        return (
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS không cần xin quyền này
  };
const handleRequestAllPermissions = async () => {
  // Bước 1: Xin quyền storage cơ bản
  const hasBasicPermission = await requestStoragePermissionWithFeedback();

  // Bước 2: Xin quyền MANAGE_EXTERNAL_STORAGE nếu cần (Android 11+)
  const hasManagePermission = await requestManageStoragePermission();
  
  if (hasBasicPermission && hasManagePermission) {
    console.log('Đã có đầy đủ quyền truy cập bộ nhớ');
    // Tiếp tục logic của ứng dụng
  } else {
    console.log('Chưa có đủ quyền truy cập');
  }
};
  // Tải và lưu ảnh/video vào thư viện ảnh
  const saveMediaToGallery = async (fileUrl) => {
    try {
      setIsDownloading(true);
      
      // Kiểm tra quyền truy cập
      const hasPermission = await handleRequestAllPermissions();
      if (!hasPermission) {
        Alert.alert('Thông báo', 'Cần cấp quyền truy cập bộ nhớ để lưu file.');
        setIsDownloading(false);
        return;
      }

      const fileName = fileUrl.split('/').pop();
      const tempPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;

      // Tải file về thư mục tạm
      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: tempPath,
        background: true,
        progressDivider: 10,
        begin: (res) => {
          console.log('Bắt đầu tải file:', res);
        },
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Đang tải: ${progress.toFixed(2)}%`);
        }
      }).promise;

      if (downloadResult.statusCode === 200) {
        // Lưu vào thư viện ảnh
        const result = await CameraRoll.save(tempPath, {
          type: isImageMessage(fileUrl) ? 'photo' : 'video'
        });
        
        // Xóa file tạm
        await RNFS.unlink(tempPath);
        
        setIsDownloading(false);
        Alert.alert(
          'Thành công', 
          `${isImageMessage(fileUrl) ? 'Ảnh' : 'Video'} đã được lưu vào thư viện.`
        );
        return result;
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      setIsDownloading(false);
      console.error('Lỗi khi lưu vào thư viện:', error);
      Alert.alert('Lỗi', 'Không thể lưu file vào thư viện.');
      return null;
    }
  };

  // Tải và lưu file khác vào thư mục Downloads
  const saveFileToDownloads = async (fileUrl) => {
    try {
      setIsDownloading(true);
      
      // Kiểm tra quyền truy cập
      const hasPermission = await handleRequestAllPermissions();
      if (!hasPermission) {
        Alert.alert('Thông báo', 'Cần cấp quyền truy cập bộ nhớ để lưu file.');
        setIsDownloading(false);
        return;
      }

      const fileName = fileUrl.split('/').pop();
      // Sử dụng thư mục Downloads trên Android, Documents trên iOS
      const downloadPath = Platform.OS === 'android' 
        ? `${RNFS.DownloadDirectoryPath}/${fileName}`
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: downloadPath,
        background: true,
        progressDivider: 10,
        begin: (res) => {
          console.log('Bắt đầu tải file:', res);
        },
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Đang tải: ${progress.toFixed(2)}%`);
        }
      }).promise;

      setIsDownloading(false);

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          'Thành công', 
          `File "${fileName}" đã được lưu vào ${Platform.OS === 'android' ? 'thư mục Downloads' : 'thư mục Documents'}.`,
          [
            {
              text: 'Đóng',
              style: 'cancel'
            },
            {
              text: 'Mở file',
              onPress: () => openFile(downloadPath)
            }
          ]
        );
        return downloadPath;
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      setIsDownloading(false);
      console.error('Lỗi khi tải file:', error);
      Alert.alert('Lỗi', 'Không thể tải file.');
      return null;
    }
  };

  // Mở file bằng ứng dụng mặc định
  const openFile = async (filePath) => {
    try {
      await FileViewer.open(filePath);
    } catch (error) {
      console.error('Lỗi khi mở file:', error);
      Alert.alert('Lỗi', 'Không thể mở file này.');
    }
  };

  // Hàm tải file chính - quyết định lưu ở đâu dựa trên loại file
  const downloadAndOpenFile = async (fileUrl, openAfterDownload = false) => {
    console.log('downloadAndOpenFile is called with:', fileUrl);
    
    if (isImageMessage(fileUrl) || isVideoMessage(fileUrl)) {
      // Lưu ảnh/video vào thư viện ảnh
      return await saveMediaToGallery(fileUrl);
    } else {
      // Lưu file khác vào thư mục Downloads/Documents
      return await saveFileToDownloads(fileUrl);
    }
  };

  const handlePinMessage = async () => {
    try {
      const response = await MessageService.PinMessageByUserId(messageId, userId);
      console.log('Ghim tin nhắn:', response);
      const user = await UserService.getUserById(userId);
      
      setIsChange("PIN_MESSAGE" + new Date());

      if (response.success) {
        setMessageInfo(response.data);
        setMessageOptionsVisible(false);
        Alert.alert('Thành công', 'Tin nhắn đã được ghim thành công.');
        handleNotifiMessageGroup(`${user.name} đã ghim tin nhắn "${message}"`);
      } else {
        Alert.alert('Thất bại', 'Không thể ghim tin nhắn này.');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.error);
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
          // Tải file về nếu chưa tồn tại (cho audio vẫn dùng cách cũ để phát)
          setIsDownloading(true);
          const downloadResult = await RNFS.downloadFile({
            fromUrl: audioUrl,
            toFile: localFile,
            background: true,
          }).promise;
          setIsDownloading(false);
          
          if (downloadResult.statusCode !== 200) return;
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
    if (message==='Tin nhắn đã được thu hồi') return 'unsend';
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

  const hadlegetAvatar = async(userId)=>{
    try {
      if(typechat === 'GROUP') {
        const userInfo = await UserService.getUserById(userId);
        setAvatarUser(userInfo.avatar);
        setUserInfo(userInfo);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      return null; // Trả về null nếu có lỗi
    }
  }

  // useEffect(() => {
  //   // Tự động xin quyền khi component mount
  //   requestStoragePermissionWithFeedback();
  // }, []);

    
  // Kiểm tra xem tin nhắn đã được thu hồi hay chưa
  const handleNotifiMessageGroup = (mess) => {
    const ContentMessage = {
      id: `file_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      senderID: userId,
      receiverID: receiverId,
      content: mess,
      sendDate: new Date().toISOString(),
      isRead: false,
      type: 'PRIVATE_CHAT',
      status:'Notification',
    };
    sendMessage(ContentMessage);
    console.log('sendMessage', ContentMessage);
  }

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

  const forwardMessage = (info) => {
    if(info === 'forward') {
        setForwardModalVisible(true);
    }
    else {
        Alert.alert('Thông báo', 'Chức năng này chưa khả dụng.');
    }
  };

  // Hàm phản ứng emoji
  const reactMessage = async (reaction) => {
      const reactionMap = {
          "LIKE": "👍",
          "LOVE": "❤️",
          "HAHA": "😂",
          "WOW": "😲",
          "SAD": "😢",
          "ANGRY": "😡"
      };

      try {
        const response = await axios.post(`${IPV4}/messages/${messageInfo.id}/react`, {
          userId: user.id,
          reactType: reaction,
        });
        setReactCount(response.data.reactions.length);
        setMessageInfo(response.data);
        setMessageOptionsVisible(false);
      } catch (error) {
        console.error("Error reacting to message:", error);
      }
  };

  useEffect(() => {
    if((messageInfo.type==='group' || messageInfo.type === 'GROUP_CHAT') && typechat === 'GROUP'&& messageInfo.status === 'sent')
      {
        hadlegetAvatar(messageInfo.senderID);
        
      } 
    if (!messageInfo.reactions || messageInfo.reactions.length === 0) {
      setEmojiIndex([]);  // mảng rỗng khi không có reactions
    } else {
      const reactionToEmoji = {
        "LIKE": "👍",
        "LOVE": "❤️",
        "HAHA": "😂",
        "WOW": "😲",
        "SAD": "😢",
        "ANGRY": "😡"
      };

      const allEmojis = messageInfo.reactions
        .map(r => reactionToEmoji[r.reactionType])
        .filter(e => e !== undefined);

      // Loại bỏ emoji trùng lặp bằng cách dùng Set
      const uniqueEmojis = [...new Set(allEmojis)];

      setEmojiIndex(uniqueEmojis.slice(0, 3));
    }
  }, [messageInfo]);

  // Xóa reaction
  const deleteReaction = async () => {
    try {
      const response = await axios.delete(`${IPV4}/messages/${messageInfo.id}/react/${user.id}`);
      setReactCount(response.data.reactions.length);
      setMessageInfo(response.data);
      setMessageOptionsVisible(false);
    } catch (error) {
      console.error("Error deleting reaction:", error);
    }
  }

  // Hiển thị menu tùy chọn khi nhấn giữ
  const handleLongPress = () => {
    if (message === 'Tin nhắn đã được thu hồi') return;
    if (!showForwardRecall) return;
        setMessageOptionsVisible(true);
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
              onPress={()=>forwardMessage('forward')} 
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
               onPress={()=>forwardMessage('forward')} 

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
                onPress={()=>forwardMessage('forward')} 
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
               onPress={() => downloadAndOpenFile(message)}
               style={styles.smallDownloadButtonContainer}
               disabled={isDownloading}
             >
               <Ionicons name="download-outline" size={20} color="#4a86e8" loading={isDownloading}/>
             </TouchableOpacity>
             <TouchableOpacity 
                onPress={()=>forwardMessage('forward')} 
               style={styles.smallDownloadButtonContainer}           
             >
               <Ionicons name="share-outline" size={20} color="#4a86e8"/>
               
             </TouchableOpacity>
           </View>
           
         </View>
          
        );
      case 'unsend':
        return <View style={styles.unsendMessage}>
                      <Text style={styles.unsendText}>{message}</Text>
                    </View>;
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
          <Image style={styles.avatar} source={{ uri: avatarUser|| avatar }} />
        </View>
        <View style={styles.messageContainer}>
       {typechat === 'GROUP' && userInfo && (
  <Text style={styles.senderName}>{userInfo.name}</Text>
)}
          <TouchableOpacity
            onLongPress={handleLongPress}
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
          {emojiIndex && emojiIndex.length > 0 && type!='unsend'&& (
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{emojiIndex}</Text>
              <Text style={styles.count}>{reactCount}</Text>
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

      {/* Modal tùy chọn tin nhắn */}
      <MessageOptionsModal
        visible={messageOptionsVisible}
        onClose={() => setMessageOptionsVisible(false)}
        onForward={forwardMessage}
        onDelete={deleteMessageForMe}
        message={messageInfo}
        userId={userId}
        onReact={reactMessage}
        onUnReact={deleteReaction}
        type={type}
           onPin={handlePinMessage}
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
  senderName: {
  fontSize: 12,
  color: '#666',
  marginBottom: 5,
  marginLeft: 5,
  fontWeight: '500',
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
    fontSize: 10,
    color: '#999',
    textAlign: 'left',
    marginTop: 2,
    marginRight: 5,
  },
  emojiContainer: {
    marginTop: 5,
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  emoji: {
    fontSize: 20,
    color: '#ff6347',
  },
  count: {
    fontSize: 16,
    marginLeft: 10,
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