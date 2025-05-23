import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../../context/UserContext';
import axios from 'axios';
import { IPV4 } from '@env';
import GroupService from '../../../services/GroupService';
import { formatPhoneNumber } from '../../../utils/formatPhoneNumber';
import { WebSocketContext } from '../../../context/Websocket';
const AddMemberGroupScreen = ({ route }) => {
  const { user, infoGroup, infoMemberGroup, updateInfoMemberGroup } = React.useContext(UserContext);
  const navigation = useNavigation();

  const [newMember, setNewMember] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
   const { sendMessage, onMessage } = React.useContext(WebSocketContext);
  const [searchResult, setSearchResult] = useState(null);

  const clearSearch = () => {
    setNewMember('');
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

  useEffect(() => {
    const fetchFriendsList = async () => {
      try {
        const response = await axios.get(`${IPV4}/user/${user.id}/friends`);
        setFriendsList(response.data);
        setFilteredFriends(response.data);
      } catch (error) {
        console.error('Có lỗi xảy ra', error);
      }
    };

    fetchFriendsList();
  }, [user?.id]);

  const normalizePhoneNumber = (phoneNumber) => {
    let normalized = phoneNumber.replace(/\D/g, '');
    if (normalized.startsWith('84')) {
      normalized = '0' + normalized.slice(2);
    }
    return normalized;
  };

  const fetchUserByPhoneNumber = async (phoneNumber) => {
    try {
      phoneNumber = formatPhoneNumber(phoneNumber);
      const response = await axios.post(`${IPV4}/user/findByPhoneNumber`, { phoneNumber });
      return response.data || null;
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      return null;
    }
  };

  useEffect(() => {
    if (newMember === '') {
      setFilteredFriends(friendsList);
      setSearchResult(null);
    } else {
      const filtered = friendsList.filter((user) =>
        user.name.toLowerCase().includes(newMember.toLowerCase()) ||
        normalizePhoneNumber(user.phoneNumber).includes(normalizePhoneNumber(newMember))
      );

      if (filtered.length === 0 && newMember.length === 10) {
        const userProfile = fetchUserByPhoneNumber(newMember);
        userProfile.then((data) => {
          if (data && !friendsList.some(friend => friend.id === data.id)) {
            setSearchResult(data);
          }
        });
      } else {
        setSearchResult(null);
      }
      setFilteredFriends(filtered);
    }
  }, [newMember, friendsList]);

  const handleSelectMember = (userId) => {
    const updatedSelectedMembers = [...selectedMembers];
    if (updatedSelectedMembers.includes(userId)) {
      updatedSelectedMembers.splice(updatedSelectedMembers.indexOf(userId), 1);
    } else {
      updatedSelectedMembers.push(userId);
    }
    setSelectedMembers(updatedSelectedMembers);
  };

  const handleAddMembersToGroup = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một thành viên');
      return;
    }

    const data = {
      id: infoGroup.id,
      memberIds: selectedMembers,
    };

    setIsAdding(true);

    try {
      const response = await GroupService.addMember(data);
      if (response.success) {
        Alert.alert('Thông báo', 'Thêm thành viên vào nhóm thành công');
        await updateInfoMemberGroup(infoGroup.id);
        console.log('selectedmembers', searchResult);
        handleNotifiMessageGroup(`Thêm thành viên ${searchResult.name} vào nhóm.`);  
        navigation.goBack();
      } else {
        Alert.alert('Thông báo', 'Có lỗi xảy ra khi thêm thành viên vào nhóm');
      }
    } catch (error) {
      console.error('Lỗi khi thêm thành viên vào nhóm', error);
      Alert.alert('Thông báo', 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsAdding(false);
    }
  };

  const renderItem = ({ item }) => {
    const isAlreadyInGroup = infoMemberGroup.some((member) => member.userId === item.id);
    const isSelected = selectedMembers.includes(item.id);
    const isDisabled = isAlreadyInGroup;

    return (
      <TouchableOpacity
        style={[styles.memberItem, isDisabled && styles.disabledItem]}
        onPress={() => !isDisabled && handleSelectMember(item.id)}
        disabled={isDisabled}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <Text style={styles.memberName}>{item.name}</Text>
        {(isSelected || isAlreadyInGroup) && (
          <Ionicons name="checkmark-circle" size={24} color="green" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close-outline" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Thêm vào nhóm</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm người dùng"
          value={newMember}
          onChangeText={setNewMember} // Cập nhật từ khóa tìm kiếm
        />
        {newMember.length > 0 && (
          <TouchableOpacity style={styles.clearIcon} onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>

      {filteredFriends.length === 0 && newMember && !searchResult && (
        <Text style={styles.noResultsText}>Không có kết quả tìm kiếm!</Text>
      )}

      {searchResult && (
        <FlatList
          data={[searchResult]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />

      {selectedMembers.length > 0 && (
        <View style={styles.selectedMembersContainer}>
          {selectedMembers.map((memberId) => {
            const member = friendsList.find((f) => f.id === memberId);
            return (
              member && (
                <View key={member.id} style={styles.selectedMemberItem}>
                  <Image source={{ uri: member.avatar }} style={styles.selectedAvatar} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleSelectMember(member.id)} // Xóa thành viên khỏi danh sách đã chọn
                  >
                    <Text style={styles.removeText}>X</Text>
                  </TouchableOpacity>
                </View>
              )
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMembersToGroup}
        disabled={isAdding}
      >
        <Text style={styles.addButtonText}>
          {isAdding ? 'Đang thêm thành viên...' : 'Thêm vào nhóm'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    flex: 1,
  },
  clearIcon: {
    right: 5,
    position: 'absolute',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  disabledItem: {
    opacity: 0.5, // Làm mờ các mục đã có trong nhóm
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
  },
  selectedMembersContainer: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedMemberItem: {
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
  addButton: {
    backgroundColor: '#0b9cf9',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
});

export default AddMemberGroupScreen;
