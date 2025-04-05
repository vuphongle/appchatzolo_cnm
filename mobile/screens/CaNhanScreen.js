// screens/CaNhanScreen.js
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SearchBar from '../components/SearchBar';
import { AVATAR_URL_DEFAULT } from '@env';

const CaNhanScreen = () => {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const [searchText, setSearchText] = useState('');

  const handleLogout = async () => {
    try {
      setUser(null);
      navigation.replace('AuthScreen');
      Alert.alert('Thành công', 'Đăng xuất thành công.');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất.');
    }
  };

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen', { handleLogout });
  };

  const options = [
    {
      icon: 'brush',
      title: 'zStyle – Nổi bật trên Zolo',
      subtitle: 'Hình nền và nhạc cho cuộc gọi Zolo',
      onPress: () => {},
    },
    {
      icon: 'qr-code',
      title: 'Ví QR',
      subtitle: 'Lưu trữ và xuất trình các mã QR quan trọng',
      onPress: () => {},
    },
    {
      icon: 'cloud',
      title: 'zCloud',
      subtitle: 'Không gian lưu trữ dữ liệu trên đám mây',
      onPress: () => {},
    },
    {
      icon: 'folder',
      title: 'Cloud của tôi',
      subtitle: 'Lưu trữ các tin nhắn quan trọng',
      onPress: () => {},
    },
    {
      icon: 'devices',
      title: 'Dữ liệu trên máy',
      subtitle: 'Quản lý dữ liệu Zolo của bạn',
      onPress: () => {},
    },
    {
      icon: 'security',
      title: 'Tài khoản và bảo mật',
      subtitle: '',
      onPress: () => {},
    },
    {
      icon: 'privacy-tip',
      title: 'Quyền riêng tư',
      subtitle: '',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        placeholder="Tìm kiếm"
        leftIcon="search"
        rightIcon="settings"
        onRightIconPress={navigateToSettings}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={{ uri: user?.avatar || AVATAR_URL_DEFAULT }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name}>{user?.name || 'Người dùng vô danh'}</Text>
          <Text style={styles.phone}>
            {user?.phoneNumber || 'Chưa có số điện thoại'}
          </Text>
        </View>
      </View>

      {/* Option List Section */}
      <ScrollView style={styles.scrollContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionItem}
            onPress={option.onPress}
          >
            <Icon
              name={option.icon}
              size={24}
              color="#0056B3"
              style={styles.icon}
            />
            <View>
              <Text style={styles.optionText}>{option.title}</Text>
              {option.subtitle ? (
                <Text style={styles.optionSubText}>{option.subtitle}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingsIcon: {
    marginLeft: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2FF',
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056B3',
  },
  phone: {
    fontSize: 14,
    color: '#333333',
  },
  scrollContainer: {
    flex: 1,
    padding: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  icon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0056B3',
  },
  optionSubText: {
    fontSize: 14,
    color: '#555555',
  },
});

export default CaNhanScreen;
