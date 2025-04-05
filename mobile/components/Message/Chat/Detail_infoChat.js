import React, { useState } from 'react';
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
// Mock Data
const MOCK_USER = {
  _id: '123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
};

const MOCK_CHAT_DATA = {
  id: '456',
  name: 'NguyenVan B',
  image: 'https://randomuser.me/api/portraits/women/43.jpg',
  owner: '123',
  members: [
    { id: '123', name: 'John Doe', avatar: 'https://example.com/john.jpg' },
    { id: '456', name: 'Jane Smith', avatar: 'https://example.com/jane.jpg' },
  ],
  files: [
    { id: '1', url: 'https://example.com/image1.jpg', type: 'image' },
    { id: '2', url: 'https://example.com/image2.jpg', type: 'image' },
  ],
};

const Detail_infoChat = ({ navigation }) => {
  // State
  const [chatData, setChatData] = useState(MOCK_CHAT_DATA);
  const [nameChange, setNameChange] = useState(chatData.name);
  const [isBFF, setIsBFF] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);

  // Handlers
  const updateName = () => {
    setChatData((prev) => ({ ...prev, name: nameChange }));
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
      setChatData((prev) => ({ ...prev, image: result.assets[0].uri }));
      Alert.alert('Thành công', 'Cập nhật ảnh thành công');
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa cuộc trò chuyện này?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        onPress: () => {
          navigation.goBack();
          Alert.alert('Thành công', 'Đã xóa cuộc trò chuyện');
        },
      },
    ]);
  };

  // Components
  const Header = ({ onBack }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={30} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Tùy chọn</Text>
    </View>
  );

  const ProfileSection = () => (
    <View style={styles.profileSection}>
      <Image source={{ uri: chatData.image }} style={styles.profileImage} />
      <Text style={styles.profileName}>{nameChange}</Text>
      <View style={styles.quickActions}>
        <QuickActionButton
          icon="search"
          label="Tìm tin nhắn"
          onPress={() => Alert.alert('Tìm kiếm', 'Chức năng đang phát triển')}
        />
        <QuickActionButton
          icon="user"
          label="Xem trang cá nhân"
          onPress={() =>
            Alert.alert('Thành viên', `${chatData.members.length} thành viên`)
          }
        />
        {MOCK_USER._id === chatData.owner && (
          <QuickActionButton
            icon="image"
            label="Đổi hình nền"
            onPress={handleImagePicker}
          />
        )}
        <QuickActionButton
          icon="bell"
          label="Tắt thông báo"
          onPress={() => Alert.alert('Thông báo', `Tắt thành công`)}
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

          {/* Settings Items */}
          {MOCK_USER._id === chatData.owner && (
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setIsDialogVisible(true)}
            >
              <Ionicons name="pencil" size={24} color="#828282" />
              <Text style={styles.settingsItemText}>Đổi tên gợi nhớ</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setIsBFF(!isBFF)}
          >
            <MaterialCommunityIcons
              name="star-outline"
              size={24}
              color="#828282"
            />
            <Text style={styles.settingsItemText}>Đánh dấu bạn thân</Text>
            <Switch
              value={isBFF}
              onValueChange={setIsBFF}
              style={{ marginLeft: 150 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setIsBFF(!isBFF)}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color="#828282"
            />
            <Text style={styles.settingsItemText}>Nhật ký chung</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={24}
              color="#828282"
              style={{ marginLeft: 200 }}
            />
          </TouchableOpacity>
          {MOCK_USER._id === chatData.owner && (
            <TouchableOpacity
              style={[styles.settingsItem, { marginTop: 20 }]}
              onPress={handleDeleteGroup}
            >
              <Ionicons name="trash" size={24} color="#FF0000" />
              <Text style={[styles.settingsItemText, { color: '#FF0000' }]}>
                Xóa cuộc trò chuyện
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Name Change Dialog */}
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

export default Detail_infoChat;

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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
});
