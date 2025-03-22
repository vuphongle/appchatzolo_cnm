import React, {useContext} from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../context/UserContext';
import { formatDOB } from '../utils/dateDobUtils';


const PersonalInfoScreen = ({ navigation }) => {
  const { user, setUser } = useContext(UserContext);

  const handleEditPress = () => {
    navigation.navigate('EditPersonalInfoScreen');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        {/* Ảnh đại diện */}
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user.avatar || 'https://placehold.co/100x100' }} style={styles.avatar} />
        </View>

        {/* Thông tin Tên Zolo */}
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={24} style={styles.infoIcon} />
          <Text style={styles.label}>Tên Zolo</Text>
          <Text style={styles.value}>{user.name || 'Người dùng vô danh'}</Text>
        </View>

        {/* Thông tin Ngày sinh */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={24} style={styles.infoIcon} />
          <Text style={styles.label}>Ngày sinh</Text>
          <Text style={styles.value}>{formatDOB(user.dob) || 'Chưa cập nhật'}</Text>
        </View>

        {/* Thông tin Giới tính */}
        <View style={styles.infoRow}>
          <Ionicons name="male-female-outline" size={24} style={styles.infoIcon} />
          <Text style={styles.label}>Giới tính</Text>
          <Text style={styles.value}>{user.gender || 'Chưa cập nhật'}</Text>
        </View>

        {/* Nút Chỉnh sửa */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
          <Ionicons name="pencil-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default PersonalInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // Nền sáng
  },
  header: {
    // Nếu không dùng LinearGradient, cho header màu xanh:
    backgroundColor: '#0084FF',
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  body: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,

    // Hiệu ứng đổ bóng (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    // Hiệu ứng đổ bóng (Android)
    elevation: 2,
  },
  infoIcon: {
    marginRight: 8,
    color: '#0056B3',
  },
  label: {
    flex: 1,
    color: '#333',
    fontWeight: '600',
  },
  value: {
    color: '#333',
    fontWeight: '400',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#0084FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 20,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
