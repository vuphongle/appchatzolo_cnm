import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../context/UserContext';
import { AVATAR_URL_DEFAULT } from '@env';

const AccountSecurityScreen = ({ navigation }) => {
  const { user, setUser } = useContext(UserContext);
  return (
    <ScrollView style={styles.container}>
      {/* Phần Tài khoản */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>

        {/* Thông tin cá nhân */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('PersonalInfoScreen')}
        >
          <View style={styles.itemLeft}>
            {/* Ảnh đại diện và thông tin */}
            <Image
              source={{ uri: user?.avatar || AVATAR_URL_DEFAULT }}
              style={styles.avatar}
            />
            <View style={styles.infoContainer}>
              <Text style={styles.itemTitle}>Thông tin cá nhân</Text>
              <Text style={styles.name}>
                {user?.name || 'Người dùng vô danh'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Số điện thoại */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="call-outline" size={24} style={styles.icon} />
            <Text style={styles.itemText}>Số điện thoại</Text>
          </View>
          <Text style={styles.rightText}>(+84) 345 734 978</Text>
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="mail-outline" size={24} style={styles.icon} />
            <Text style={styles.itemText}>Email</Text>
          </View>
          <Text style={styles.rightText}>Chưa liên kết</Text>
        </TouchableOpacity>

        {/* Định danh tài khoản */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="person-outline" size={24} style={styles.icon} />
            <Text style={styles.itemText}>Định danh tài khoản</Text>
          </View>
          <Text style={styles.rightText}>Chưa định danh</Text>
        </TouchableOpacity>

        {/* Mã QR của tôi */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="qr-code-outline" size={24} style={styles.icon} />
            <Text style={styles.itemText}>Mã QR của tôi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Phần Bảo mật */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bảo mật</Text>

        {/* Kiểm tra bảo mật */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              style={styles.icon}
            />
            <Text style={styles.itemText}>Kiểm tra bảo mật</Text>
          </View>
          <Text style={styles.warningText}>Cần xử lý</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Khóa Zolo */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons
              name="lock-closed-outline"
              size={24}
              style={styles.icon}
            />
            <Text style={styles.itemText}>Khóa Zolo</Text>
          </View>
          <Text style={styles.rightText}>Đang tắt</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Phần Đăng nhập */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đăng nhập</Text>

        {/* Bảo mật 2 lớp */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="key-outline" size={24} style={styles.icon} />
            <Text style={styles.itemText}>Bảo mật 2 lớp</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Thiết bị đăng nhập hiện tại */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons
              name="phone-portrait-outline"
              size={24}
              style={styles.icon}
            />
            <Text style={styles.itemText}>Thiết bị đăng nhập hiện tại</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('ChangePasswordScreen')}
        >
          <View style={styles.itemLeft}>
            <Ionicons
              name="lock-closed-outline"
              size={24}
              style={styles.icon}
            />
            <Text style={styles.itemText}>Mật khẩu</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemText}>Xóa tài khoản</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AccountSecurityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    padding: 10,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    paddingRight: 20,
    paddingLeft: 20,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    color: '#0056B3',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
    color: '#0056B3',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  infoContainer: {
    flexDirection: 'column',
  },
  itemTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    color: '#777',
    fontSize: 14,
  },
  itemText: {
    color: '#333',
    fontSize: 16,
  },
  warningText: {
    color: '#FF0000',
    fontSize: 14,
    marginRight: 8,
  },
  rightText: {
    color: '#666',
    fontSize: 14,
    marginRight: 8,
  },
});
