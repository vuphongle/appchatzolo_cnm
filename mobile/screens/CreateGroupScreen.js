import React, { useState, useContext, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, Text, Alert, FlatList, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { AVATAR_URL_DEFAULT } from '@env';
import { UserContext } from '../context/UserContext';
// import ImageCropPicker from 'react-native-image-crop-picker';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { IPV4 } from '@env';
import { useNavigation } from '@react-navigation/native';

const CreateGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [friendsListOther, setFriendsListOther] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

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
        if (!friendsListOther.some(friend => friend.id === userData.id)) {
          setFriendsListOther(prev => [...prev, userData]);
        }
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
    let normalized = phoneNumber.replace(/\D/g, '');
    if (normalized.startsWith('84')) {
      normalized = '0' + normalized.slice(2);
    }
    return normalized;
  };

  const normalizeString = (str) => {
    return str.replace(/\s+/g, '').trim();
  };

  useEffect(() => {
    const searchByPhoneNumber = async () => {
      if (searchText.length === 10 && !friendsList.some(friend => normalizePhoneNumber(friend.phoneNumber) === normalizePhoneNumber(searchText))) {
        const userProfile = await fetchUserProfile(normalizePhoneNumber(searchText));
        setSearchResult(userProfile);
      } else {
        setSearchResult(null);
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

  const handleCreateGroup = async() => {
    if (groupName.trim() === '') {
      Alert.alert('Thông báo', 'Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedFriends.length < 2) {
      Alert.alert('Thông báo', 'Để tạo nhóm, bạn cần chọn ít nhất 2 thành viên');
      return;
    }
    setIsLoading(true)

    // nếu người dùng chọn ảnh mới thì upload lên S3
    let groupAvatarUrl = groupAvatar;
    if (groupAvatar && groupAvatar.startsWith('file://')) {
        try {
          const formData = new FormData();
          const file = {
            uri: groupAvatar,
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
            setIsLoading(false);
            Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện nhóm');
            return;
          }
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện nhóm');
            return;
        }
    }

    const groupData = {
        groupName: groupName,
        image: groupAvatarUrl || AVATAR_URL_DEFAULT,
        creatorId: user?.id,
        memberIds: selectedFriends,
    }

    try{
        const response = await axios.post(`${IPV4}/groups/create`, groupData);
        setIsLoading(false);
        if (response.data.success) {
              Alert.alert('Tạo nhóm thành công', `Tên nhóm: ${response.data.data.groupName}`);
              navigation.navigate('ChatGroup', {
                receiverid: response.data.data.id,
                name: response.data.data.groupName,
                avatar: response.data.data.image,
              });
              setGroupName('');
        } else {
            Alert.alert('Lỗi', 'Không thể tạo nhóm. Vui lòng thử lại.');
        }
    } catch (error) {
      setIsLoading(false);
      console.error('Error creating group:', error);
      Alert.alert('Lỗi', 'Không thể tạo nhóm');
      return;
    }
  };

  // const handleAvatarChange = async() => {
  //  try {
  //      const image = await ImageCropPicker.openPicker({
  //        width: 300,
  //        height: 300,
  //        cropping: true,
  //        compressImageQuality: 0.7,
  //      });
  //      if (image) {
  //        setGroupAvatar(image.path);
  //      }
  //    } catch (error) {
  //      if (error.code !== 'E_PICKER_CANCELLED') {
  //        Alert.alert('Lỗi', 'Không thể chọn ảnh');
  //        console.error(error);
  //      }
  //    }
  // };

  return (
    <View style={styles.container}>
      <View style={styles.groupNameContainer}>
      {/* onPress={handleAvatarChange} */}
        <TouchableOpacity style={styles.avatarContainer} >
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

      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm bạn bè theo tên hoặc số điện thoại"
          value={searchText}
          onChangeText={setSearchText}
        />

        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchText('')}  // Xóa dữ liệu nhập
          >
            <Icon name="cancel" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>


      <FlatList
        data={[...filteredFriends, searchResult].filter(Boolean)}
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

      {selectedFriends.length > 0 && (
        <View style={styles.selectedFriendsContainer}>
          {selectedFriends.map((friendId) => {
            let friend = friendsList.find((f) => f.id === friendId);

            // Nếu không tìm thấy bạn bè trong danh sách, tìm trong friendsListOther
            if (!friend) {
              const otherFriend = friendsListOther.find((f) => f.id === friendId);
              if (otherFriend) {
                // Sao chép đối tượng `otherFriend` nếu tìm thấy
                friend = { ...otherFriend };
              }
            }

            return (
              friend && (
                <View key={friend.id} style={styles.selectedFriendItem}>
                  <Image source={{ uri: friend.avatar }} style={styles.selectedAvatar} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFriend(friend.id)}
                  >
                    <Text style={styles.removeText}>X</Text>
                  </TouchableOpacity>
                </View>
              )
            );
          })}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
          <Text style={styles.createButtonText}>Tạo nhóm</Text>
        </TouchableOpacity>
      )}
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
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    flex: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 8,
    padding: 5,
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
  selectedFriendsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  selectedFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  selectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 5,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e6e6e6',
    borderRadius: 10,
    padding: 3,
    paddingRight: 6,
    paddingLeft: 6,
  },
  removeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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