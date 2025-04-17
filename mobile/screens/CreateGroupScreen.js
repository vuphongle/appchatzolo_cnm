import React, { useState, useContext, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, Text, Alert, FlatList, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { AVATAR_URL_DEFAULT } from '@env';
import { UserContext } from '../context/UserContext';
import ImageCropPicker from 'react-native-image-crop-picker';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { IPV4 } from '@env';

const CreateGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [searchResult, setSearchResult] = useState(null); // Lưu người dùng tìm được qua API

  const { user } = useContext(UserContext);

  useEffect(() => {
    const fetchFriendsList = async () => {
      try {
        const response = await axios.get(`${IPV4}/user/${user.id}/friends`);
        setFriendsList(response.data);
      } catch (error) {
        console.error('Có lỗi xảy ra', error);
      }
    };

    fetchFriendsList();
  }, [user.id]);

  const fetchUserProfile = async (phoneNumber) => {
    phoneNumber = formatPhoneNumber(phoneNumber);
    try {
      console.log('Fetching user profile for phone number:', phoneNumber);
      const response = await fetch(IPV4 + '/user/findByPhoneNumber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User data:', userData);
        return userData;
      } else {
        const error = await response.text();
        return null;
      }
    } catch (error) {
      console.error('Error during API call:', error);
      Alert.alert('Lỗi', 'Không thể kết nối tới server.');
      return null;
    }
  };

  const normalizePhoneNumber = (phoneNumber) => {
    let normalized = phoneNumber.replace(/\D/g, ''); // Loại bỏ tất cả ký tự không phải là chữ số
    if (normalized.startsWith('84')) {
      normalized = '0' + normalized.slice(2); // Thay "84" bằng "0"
    }
    return normalized;
  };

  const normalizeString = (str) => {
    return str.replace(/\s+/g, '').trim();
  }

  useEffect(() => {
    const searchByPhoneNumber = async () => {
      if (searchText.length === 10 && !friendsList.some(friend => normalizePhoneNumber(friend.phoneNumber) === normalizePhoneNumber(searchText))) {
        // Gọi API tìm người dùng không có trong danh bạ
        const userProfile = await fetchUserProfile(normalizePhoneNumber(searchText));
        setSearchResult(userProfile); // Lưu người dùng tìm thấy
      } else {
        setSearchResult(null); // Nếu đã có trong danh bạ thì không tìm
      }
    };

    if (searchText) {
      searchByPhoneNumber();
    } else {
      setSearchResult(null);
    }
  }, [searchText, friendsList]);

  const filteredFriends = friendsList.filter((friend) => {
    const normalizedSearchText = normalizePhoneNumber(searchText);
    const normalizedFriendPhone = normalizePhoneNumber(friend.phoneNumber);

    // Kiểm tra tìm kiếm theo tên hoặc số điện thoại
    if (normalizedSearchText === normalizeString(searchText)) {
      return normalizedFriendPhone.includes(normalizedSearchText);
    } else {
      return friend.name.toLowerCase().includes(searchText.toLowerCase());
    }
  });

  const handleFriendSelect = (friend) => {
    if (normalizePhoneNumber(friend.phoneNumber) === normalizePhoneNumber(user.phoneNumber)) {
      Alert.alert('Thông báo', 'Bạn không thể thêm chính mình vào nhóm');
      return;
    }
    const updatedFriends = [...selectedFriends];
    if (updatedFriends.includes(friend.id)) {
      updatedFriends.splice(updatedFriends.indexOf(friend.id), 1);
    } else {
      updatedFriends.push(friend.id);
    }
    setSelectedFriends(updatedFriends);
  };

  const handleCreateGroup = () => {
    if (groupName.trim() === '') {
      Alert.alert('Thông báo', 'Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedFriends.length < 2) {
        Alert.alert('Thông báo', 'Để tạo nhóm, bạn cần chọn ít nhất 2 thành viên');
        return;
      }

    Alert.alert('Tạo nhóm thành công', `Tên nhóm: ${groupName}`);
  };

  const handleAvatarChange = () => {
    ImageCropPicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,  // Cho phép crop ảnh
    }).then((image) => {
      setGroupAvatar(image.path); // Lưu ảnh vào state
    }).catch((error) => {
      console.log('Error picking image: ', error);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.groupNameContainer}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarChange}>
          {groupAvatar ? (
            <Image source={{ uri: groupAvatar }} style={styles.avatarImageLarge} />
          ) : (
            <Icon name="camera-alt" size={30} color="#000" />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.groupNameInput}
          placeholder="Đặt tên nhóm"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm bạn bè theo tên hoặc số điện thoại"
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={[...filteredFriends, searchResult].filter(Boolean)} // Hiển thị kết quả từ API nếu có
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onPress={() => handleFriendSelect(item)}
          >
            <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
            <Text style={styles.friendName}>{item.name}</Text>
            {selectedFriends.includes(item.id) && <Icon name="check-circle" size={20} color="blue" />}
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
        <Text style={styles.createButtonText}>Tạo nhóm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatarImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  groupNameInput: {
    flex: 1,
    height: 60,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingLeft: 10,
    fontSize: 20,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default CreateGroupScreen;