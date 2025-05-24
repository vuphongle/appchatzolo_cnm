import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Dialog,
  Portal,
  Provider,
  Button,
  TextInput,
} from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { IPV4 } from '@env';
import { UserContext } from '../../../context/UserContext';
import GroupService from '../../../services/GroupService';
import SelectNewLeaderModal from './SelectNewLeaderModal';
import { WebSocketContext } from '../../../context/Websocket';
import ImageCropPicker from 'react-native-image-crop-picker';
import axios from 'axios';

const Detail_infoChatGroup = ({ route, navigation }) => {
  const [nameChange, setNameChange] = useState(infoGroup?.name);
  const [isBFF, setIsBFF] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const { user, setUser, infoGroup, infoMemberGroup, updateInfoGroup } = useContext(UserContext);
  const [isLeader, setIsLeader] = useState(
    infoMemberGroup.some(member => member.userId === user?.id && member.role === 'LEADER')
  );
   const { sendMessage } = useContext(WebSocketContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState(infoGroup?.image || '');

  const pickImage = async () => {
      try {
        const image = await ImageCropPicker.openPicker({
          width: 300,
          height: 300,
          cropping: true,
          compressImageQuality: 0.7,
        });
        if (image) {
          setAvatarUri(image.path);
        }

        let groupAvatarUrl = infoGroup?.image || '';
        // Upload image to S3
        try {
          const formData = new FormData();
          const file = {
            uri: image.path,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          };
          formData.append('file', file);

          const response = await axios.post(`${IPV4}/s3/image`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          if (response.data.url) {
            groupAvatarUrl = response.data.url;
          } else {
            Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện nhóm');
            return;
          }

          // Update group information
          const updateResponse = await GroupService.updateGroup({
                id: infoGroup?.id,
                groupName: infoGroup?.groupName,
                image: groupAvatarUrl
          })
          if (updateResponse.success) {
                await updateInfoGroup(infoGroup?.id);
                Alert.alert('Thành công', 'Cập nhật ảnh đại diện nhóm thành công');
          } else {
                Alert.alert('Lỗi', updateResponse.message || 'Không thể cập nhật ảnh đại diện nhóm');
          }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện nhóm');
            console.log(error);
          return;
        }
      } catch (error) {
        if (error.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Lỗi', 'Không thể chọn ảnh');
          console.error(error);
        }
      }
  };

  const handleDeleteGroupByleader = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa cuộc trò chuyện này?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        onPress: async () => {
          try {
            const groupId = infoGroup?.id;
            const userId = user?.id;
            const response = await GroupService.deleteGroup(userId, groupId);
            if (response.success) {
              Alert.alert('Thành công', 'Đã xóa cuộc nhóm thành công');
              navigation.navigate('MainTabs');
            } else {
              Alert.alert('Lỗi', response.message || 'Không thể xóa cuộc trò chuyện');
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa cuộc trò chuyện: ' + error.message);
          }
        },
      },
    ]);
  };
  const handleNotifiMessageGroup = (mess) => {
      
       const ContentMessage = {
                id: `file_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
                senderID: infoGroup.id,
                receiverID: infoGroup.id,
                content: mess,
                sendDate: new Date().toISOString(),
                isRead: false,
                type: 'GROUP_CHAT',
                
                status:'Notification',
              };
      sendMessage(ContentMessage);
      console.log('sendMessage', ContentMessage);
    }

  const handleSelectNewLeader = async (newLeader) => {
    try {
        const response = await GroupService.leaveGroup(infoGroup.id, user?.id, newLeader.userId);
        if (response.success) {
            navigation.navigate('MainTabs');
        } else {
            Alert.alert('Lỗi', response.message || 'Không thể rời nhóm');
        }
    } catch (error) {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi rời nhóm: ' + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleOutGroup = async () => {
    if (isLeader) {
      setIsModalVisible(true);
    } else {
      // Cảnh báo xác nhận
      Alert.alert('Xác nhận', 'Bạn có chắc muốn rời nhóm?', [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Rời nhóm',
          onPress: async () => {
            setIsLoading(true); // Bật loading khi bắt đầu xử lý
            try {
              const response = await GroupService.leaveGroup(infoGroup.id, user?.id, null);
              if (response.success) {
                handleNotifiMessageGroup(`${user?.name} đã rời nhóm`);
                navigation.navigate('MainTabs');
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể rời nhóm');
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi rời nhóm: ' + error.message);
            } finally {
              setIsLoading(false); // Tắt loading khi hoàn thành xử lý
            }
          },
        },
      ]);
    }
  };

  const updateName = async () => {
    try {
      const response = await GroupService.updateGroup({
        id: infoGroup?.id,
        groupName: nameChange,
        image: infoGroup?.image,
      });

      if (response.success) {
        updateInfoGroup(infoGroup?.id);

        Alert.alert('Thành công', 'Đổi tên thành công!');
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể đổi tên');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật tên');
      console.error(error);
    } finally {
      setIsDialogVisible(false);
    }
  };

  const handleImagePicker = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
      quality: 1,
    });

    if (!result.didCancel && result.assets) {
      Alert.alert('Thành công', 'Cập nhật ảnh thành công');
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert('Thông báo', 'Tính năng đang phát triển');
  };

  const Header = ({ onBack }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back-outline" size={30} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Tùy chọn</Text>
    </View>
  );

  const ProfileSection = () => (
    <View style={styles.profileSection}>

      <TouchableOpacity style={styles.avatarContainer}    onPress={pickImage}     >
        <Image source={{ uri: infoGroup?.image }} style={styles.profileImage} />
        <View style={styles.editIconContainer}>
            <Ionicons name="camera-outline" size={20} color="#FFF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.editNameContainer} onPress={() => setIsDialogVisible(true)}>
        <Text style={styles.profileName}>{infoGroup?.groupName}</Text>
        <Ionicons name="pencil" size={20} color="blue" />
      </TouchableOpacity>
      <View style={styles.quickActions}>
        <QuickActionButton
          icon="search"
          label="Tìm tin nhắn"
          onPress={() => Alert.alert('Tìm kiếm', 'Chức năng đang phát triển')}
        />
        <QuickActionButton
            icon="user-plus"
            label="Thêm thành viên"
            onPress={() => navigation.navigate('AddMemberGroupScreen', { infoGroup: infoGroup, infoMemberGroup: infoMemberGroup })}
        />
        <QuickActionButton
          icon="image"
          label="Đổi hình nền"
          onPress={handleImagePicker}
        />
        <QuickActionButton
          icon="bell"
          label="Tắt thông báo"
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        />
      </View>
    </View>
  );

  const QuickActionButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Feather name={icon} size={20} color="#4F4F4F" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Header onBack={() => navigation.goBack()} />

        <ScrollView>
          <ProfileSection />

          <TouchableOpacity
            style={styles.settingsItem}
          >
            <View style={styles.leftContainer}>
                <Ionicons name="pencil" size={24}/>
                <Text style={styles.settingsItemText}>Đổi tên gợi nhớ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setIsBFF(!isBFF)}
          >
            <View style={styles.leftContainer}>
                <MaterialCommunityIcons
                  name="star-outline"
                  size={24}
                />

                <Text style={styles.settingsItemText}>Đánh dấu bạn thân</Text>
            </View>
            <Switch
              value={isBFF}
              onValueChange={setIsBFF}
              style={{ marginLeft: 150 }}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.leftContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                />
                <Text style={styles.settingsItemText}>Nhật ký chung</Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={24}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress ={() => navigation.navigate('MemberGroupScreen', { infoMemberGroup: infoMemberGroup, infoGroup: infoGroup })}>
            <View style={styles.leftContainer}>
                <AntDesign name="team" size={24}/>
                <Text style={[styles.settingsItemText]}>
                  Xem thành viên ({infoMemberGroup.length})
                </Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={24}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={handleDeleteGroup}
          >
            <View style={styles.leftContainer}>
                <Ionicons name="trash" size={24} />
                <Text style={[styles.settingsItemText]}>
                  Xóa cuộc trò chuyện
                </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={handleOutGroup}
          >
            <View style={styles.leftContainer}>
                <MaterialCommunityIcons name="account-remove" size={24} />
                <Text style={styles.settingsItemText}>Rời nhóm</Text>
            </View>
          </TouchableOpacity>

          {isLeader && (
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={handleDeleteGroupByleader}
            >
                <View style={styles.leftContainer}>
                  <Ionicons name="close-circle-outline" size={24} color="#FF0000" />
                    <Text style={[styles.settingsItemText, { color: '#FF0000' }]}>
                    Giải tán nhóm
                  </Text>
                </View>
            </TouchableOpacity>
          )}

        </ScrollView>

        {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text>Đang xử lý...</Text>
            </View>
        )}

        <Portal>
          <Dialog
            visible={isDialogVisible}
            onDismiss={() => setIsDialogVisible(false)}
          >
            <Dialog.Title>Nhập tên cần đổi</Dialog.Title>
            <Dialog.Content>
              <TextInput
                value={nameChange}
                onChangeText={setNameChange}
                style={{ fontSize: 18 }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsDialogVisible(false)}>Hủy</Button>
              <Button onPress={updateName}>Xác nhận</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <SelectNewLeaderModal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          members={infoMemberGroup}
          onSelectNewLeader={handleSelectNewLeader}
        />
      </View>
    </Provider>
  );
};

export default Detail_infoChatGroup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    height: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 16,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  quickAction: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#0084FF',
      borderRadius: 15,
      padding: 5,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  }
});
