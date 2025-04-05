import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AVATAR_URL_DEFAULT } from '@env';

const UserDetailModal = ({
  visible,
  onClose,
  friend, // Dữ liệu của người bạn muốn hiển thị
  onDeleteFriend, // Hàm xóa bạn được truyền từ DanhBaScreen
  onSendMessage, // Hàm nhắn tin (nếu cần)
}) => {
  if (!friend) return null;

  // Hàm xử lý xóa và đóng modal khi thành công
  const handleDelete = async () => {
    if (onDeleteFriend) {
      const success = await onDeleteFriend(friend);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} />

        <View style={styles.bottomSheetContainer}>
          <View style={styles.headerContainer}>
            <Image
              source={{ uri: friend.avatar || AVATAR_URL_DEFAULT }}
              style={styles.avatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.userName}>{friend.name}</Text>
              <Ionicons
                name="pencil-outline"
                size={16}
                color="#000"
                style={{ marginLeft: 6 }}
              />
            </View>
          </View>

          <ScrollView style={styles.bodyContainer}>
            <TouchableOpacity style={styles.optionRow}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#000"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Xem trang cá nhân</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#000"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Quản lý chặn</Text>
            </TouchableOpacity>

            <View style={styles.optionRow}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#000"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Đã kết bạn 1 năm trước</Text>
            </View>

            <TouchableOpacity style={styles.optionRow}>
              <Ionicons
                name="people-outline"
                size={20}
                color="#000"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Xem nhóm chung (9)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <Ionicons
                name="book-outline"
                size={20}
                color="#000"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Xem nhật ký chung</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <Ionicons
                name="star-outline"
                size={20}
                color="#000"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Đánh dấu bạn thân</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: '#f2f2f2' }]}
              onPress={handleDelete}
            >
              <Text style={[styles.footerButtonText, { color: 'red' }]}>
                Xóa bạn
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: '#1e90ff' }]}
              onPress={onSendMessage}
            >
              <Text style={[styles.footerButtonText, { color: '#fff' }]}>
                Nhắn tin
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserDetailModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    paddingBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  bodyContainer: {
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  icon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  footerContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderColor: '#ccc',
    paddingTop: 12,
    justifyContent: 'space-between',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
