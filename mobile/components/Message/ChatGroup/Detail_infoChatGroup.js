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

const Detail_infoChatGroup = ({ route, navigation }) => {
  const [nameChange, setNameChange] = useState(infoGroup?.name);
  const [isBFF, setIsBFF] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const { user, setUser, infoGroup, infoMemberGroup } = useContext(UserContext);
  const [isLeader, setIsLeader] = useState(infoGroup?.creatorId === user?.id); // Assuming leader is the creator of the group

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

  const updateName = () => {
    Alert.alert('Thông báo', 'Đổi tên thành công!');
    setIsDialogVisible(false);
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
      <Image source={{ uri: infoGroup?.image }} style={styles.profileImage} />
      <Text style={styles.profileName}>{infoGroup?.groupName}</Text>
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
            onPress={() => setIsDialogVisible(true)}
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
            onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
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
                  {user?.id === infoGroup?.creatorId && (
                    <Text style={[styles.settingsItemText, { color: '#FF0000' }]}>
                    Giải tán nhóm
                  </Text>
                  )}
                </View>
            </TouchableOpacity>
          )}

        </ScrollView>

        <Portal>
          <Dialog
            visible={isDialogVisible}
            onDismiss={() => setIsDialogVisible(false)}
          >
            <Dialog.Title>Đổi tên gợi nhớ</Dialog.Title>
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
});
