import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, Text, Alert, FlatList, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AVATAR_URL_DEFAULT } from '@env';
import ImageCropPicker from 'react-native-image-crop-picker';  // Import thư viện mới

const CreateGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendsList, setFriendsList] = useState([
    { id: '1', name: 'Lê Văn A', avatar: AVATAR_URL_DEFAULT },
    { id: '2', name: 'Lê Văn B', avatar: AVATAR_URL_DEFAULT },
    { id: '3', name: 'Lê Văn C', avatar: AVATAR_URL_DEFAULT },
    { id: '4', name: 'Lê Văn D', avatar: AVATAR_URL_DEFAULT },
    { id: '5', name: 'Lê Văn E', avatar: AVATAR_URL_DEFAULT },
    { id: '6', name: 'Lê Văn F', avatar: AVATAR_URL_DEFAULT },
    { id: '7', name: 'Lê Văn G', avatar: AVATAR_URL_DEFAULT },
    { id: '8', name: 'Lê Văn H', avatar: AVATAR_URL_DEFAULT },
    { id: '9', name: 'Lê Văn I', avatar: AVATAR_URL_DEFAULT },
    { id: '10', name: 'Lê Văn J', avatar: AVATAR_URL_DEFAULT },
  ]);
  const [groupAvatar, setGroupAvatar] = useState(null);

  const handleFriendSelect = (friend) => {
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
      Alert.alert('Vui lòng nhập tên nhóm');
      return;
    }
    Alert.alert('Group Created', `Tên nhóm: ${groupName}`);
  };

  // Sử dụng ImageCropPicker để chọn ảnh
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

  const filteredFriends = friendsList.filter((friend) =>
    friend.name.toLowerCase().includes(searchText.toLowerCase())
  );

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
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onPress={() => handleFriendSelect(item)}
          >
            <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
            <Text style={styles.friendName}>{item.name}</Text>
            {selectedFriends.includes(item.id) && <Icon name="check-circle" size={20} color="green" />}
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